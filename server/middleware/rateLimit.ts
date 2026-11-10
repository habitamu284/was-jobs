import type { Request, Response, NextFunction } from 'express';
import fs from 'fs';
import path from 'path';

interface FailedAttemptRecord {
  count: number;
  lockedUntil: number;
  lastAttempt: number;
}

interface WindowRecord {
  count: number;
  windowStart: number;
}

interface RateLimitStoreSchema {
  failedLogins: Record<string, FailedAttemptRecord>;
  registrations: Record<string, WindowRecord>;
  passwordResets: Record<string, WindowRecord>;
}

const DATA_DIR = process.env.DATA_DIR || path.resolve(process.cwd(), 'data');
const RATE_LIMIT_FILE = path.resolve(DATA_DIR, 'rate_limits.json');

const MAX_ACCOUNT_LOGIN_ATTEMPTS = 5;
const MAX_IP_TOTAL_FAILURES = 25; // Protect against credential-stuffing spray attacks across many accounts
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes lockout
const REGISTRATION_LIMIT = 5;
const REGISTRATION_WINDOW_MS = 60 * 60 * 1000; // 1 hour
const RESET_LIMIT = 5;
const RESET_WINDOW_MS = 60 * 60 * 1000; // 1 hour

let store: RateLimitStoreSchema = {
  failedLogins: {},
  registrations: {},
  passwordResets: {},
};

function ensureDataDir(): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

export function loadRateLimitsFromDisk(): RateLimitStoreSchema {
  try {
    ensureDataDir();
    if (fs.existsSync(RATE_LIMIT_FILE)) {
      const raw = fs.readFileSync(RATE_LIMIT_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      store = {
        failedLogins: parsed.failedLogins || {},
        registrations: parsed.registrations || {},
        passwordResets: parsed.passwordResets || {},
      };
      const now = Date.now();
      let changed = false;
      for (const [key, rec] of Object.entries(store.failedLogins)) {
        if (rec.lockedUntil < now && now - rec.lastAttempt > LOCKOUT_DURATION_MS * 2) {
          delete store.failedLogins[key];
          changed = true;
        }
      }
      for (const [ip, rec] of Object.entries(store.registrations)) {
        if (now - rec.windowStart > REGISTRATION_WINDOW_MS) {
          delete store.registrations[ip];
          changed = true;
        }
      }
      for (const [key, rec] of Object.entries(store.passwordResets)) {
        if (now - rec.windowStart > RESET_WINDOW_MS) {
          delete store.passwordResets[key];
          changed = true;
        }
      }
      if (changed) {
        saveRateLimitsToDisk();
      }
      return store;
    }
  } catch (err) {
    console.error('Failed to load rate limits from disk:', err);
  }
  return store;
}

export function saveRateLimitsToDisk(): void {
  try {
    ensureDataDir();
    fs.writeFileSync(RATE_LIMIT_FILE, JSON.stringify(store, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to save rate limits to disk:', err);
  }
}

// Initial load on boot
loadRateLimitsFromDisk();

/**
 * Resolves the genuine client IP address.
 * CRITICAL ANTI-SPOOFING RULE:
 * In production behind trusted proxies (Render, Cloud Run): Express `req.ip` is used with `trust proxy: 1`.
 * In non-production or direct TCP socket connections: Strictly reads `req.socket.remoteAddress`
 * to ensure that fake client-supplied `X-Forwarded-For` headers are completely ignored.
 */
export function getClientIp(req: Request): string {
  if (process.env.NODE_ENV === 'production' && req.ip) {
    return req.ip;
  }
  return req.socket?.remoteAddress || req.ip || '127.0.0.1';
}

/**
 * Middleware: Rate limits login attempts and locks out repeated brute force failures.
 * Persists state to disk so server restarts cannot be exploited to reset failed attempts.
 * Enforces dual protection:
 * 1. Account-level lockout: Target account is locked out after 5 failures regardless of spoofed IP or headers.
 * 2. IP-level spray lockout: Rapid failures from a single network are blocked across multiple accounts.
 */
export function loginRateLimiter(req: Request, res: Response, next: NextFunction) {
  const ip = getClientIp(req);
  const email = (req.body?.email || '').toLowerCase().trim();
  const accountKey = `account:${email}`;
  const ipKey = `ip:${ip}`;
  const now = Date.now();

  loadRateLimitsFromDisk();

  // 1. Check account-level lockout (immune to any IP spoofing or rotating headers)
  if (email) {
    const accountRecord = store.failedLogins[accountKey];
    if (accountRecord && accountRecord.lockedUntil > now) {
      const minutesLeft = Math.ceil((accountRecord.lockedUntil - now) / 60000);
      return res.status(429).json({
        error: `Too many failed login attempts for this account. Account access is temporarily locked for security. Please try again in ${minutesLeft} minute(s). ተደጋጋሚ ያልተሳኩ የመግቢያ ሙከራዎች ተደርገዋል። እባክዎ ከ${minutesLeft} ደቂቃ በኋላ እንደገና ይሞክሩ።`,
        lockedUntil: accountRecord.lockedUntil,
        retryAfterMinutes: minutesLeft,
      });
    }
  }

  // 2. Check IP-wide credential spray lockout
  const ipRecord = store.failedLogins[ipKey];
  if (ipRecord && ipRecord.lockedUntil > now) {
    const minutesLeft = Math.ceil((ipRecord.lockedUntil - now) / 60000);
    return res.status(429).json({
      error: `Too many failed login attempts from this network. Please try again in ${minutesLeft} minute(s). ከዚህ አውታረ መረብ ተደጋጋሚ ያልተሳኩ የመግቢያ ሙከራዎች ተደርገዋል። እባክዎ ከ${minutesLeft} ደቂቃ በኋላ እንደገና ይሞክሩ።`,
      lockedUntil: ipRecord.lockedUntil,
      retryAfterMinutes: minutesLeft,
    });
  }

  next();
}

/**
 * Record a failed login attempt for both target account and originating IP.
 * Saves immediately to disk.
 */
export function recordFailedLogin(req: Request) {
  const ip = getClientIp(req);
  const email = (req.body?.email || '').toLowerCase().trim();
  const accountKey = `account:${email}`;
  const ipKey = `ip:${ip}`;
  const now = Date.now();

  loadRateLimitsFromDisk();

  // Account-level tracking
  if (email) {
    const current = store.failedLogins[accountKey] || { count: 0, lockedUntil: 0, lastAttempt: now };
    current.count += 1;
    current.lastAttempt = now;
    if (current.count >= MAX_ACCOUNT_LOGIN_ATTEMPTS) {
      current.lockedUntil = now + LOCKOUT_DURATION_MS;
    }
    store.failedLogins[accountKey] = current;
  }

  // IP spray tracking
  const ipCurrent = store.failedLogins[ipKey] || { count: 0, lockedUntil: 0, lastAttempt: now };
  ipCurrent.count += 1;
  ipCurrent.lastAttempt = now;
  if (ipCurrent.count >= MAX_IP_TOTAL_FAILURES) {
    ipCurrent.lockedUntil = now + LOCKOUT_DURATION_MS;
  }
  store.failedLogins[ipKey] = ipCurrent;

  saveRateLimitsToDisk();
}

/**
 * Reset failed login attempts on successful authentication.
 * Saves immediately to disk.
 */
export function resetFailedLogin(req: Request) {
  const email = (req.body?.email || '').toLowerCase().trim();
  const accountKey = `account:${email}`;
  if (email) {
    delete store.failedLogins[accountKey];
  }
  saveRateLimitsToDisk();
}

/**
 * Middleware: Rate limits user registration to prevent automated bot spam.
 * Persists to disk.
 */
export function registerRateLimiter(req: Request, res: Response, next: NextFunction) {
  const ip = getClientIp(req);
  const now = Date.now();

  loadRateLimitsFromDisk();
  const record = store.registrations[ip] || { count: 0, windowStart: now };

  if (now - record.windowStart > REGISTRATION_WINDOW_MS) {
    record.count = 0;
    record.windowStart = now;
  }

  if (record.count >= REGISTRATION_LIMIT) {
    return res.status(429).json({
      error: 'Too many accounts registered from this connection. Please try again later. ከዚህ አድራሻ በርካታ መለያዎች ተመዝግበዋል። እባክዎ ትንሽ ቆይተው ይሞክሩ።',
    });
  }

  record.count += 1;
  store.registrations[ip] = record;
  saveRateLimitsToDisk();
  next();
}

/**
 * Middleware: Rate limits password reset requests.
 * Persists to disk.
 */
export function resetPasswordRateLimiter(req: Request, res: Response, next: NextFunction) {
  const ip = getClientIp(req);
  const email = (req.body?.email || '').toLowerCase().trim();
  const key = `${ip}:${email}`;
  const now = Date.now();

  loadRateLimitsFromDisk();
  const record = store.passwordResets[key] || { count: 0, windowStart: now };

  if (now - record.windowStart > RESET_WINDOW_MS) {
    record.count = 0;
    record.windowStart = now;
  }

  if (record.count >= RESET_LIMIT) {
    return res.status(429).json({
      error: 'Too many password reset requests. Please check your records and try again later. በርካታ የይለፍ ቃል መቀየሪያ ሙከራዎች ተደርገዋል። እባክዎ ትንሽ ቆይተው ይሞክሩ።',
    });
  }

  record.count += 1;
  store.passwordResets[key] = record;
  saveRateLimitsToDisk();
  next();
}
