import type { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { db } from './db.ts';
import type { User, UserRole } from '../src/types/index.ts';

const DATA_DIR = process.env.DATA_DIR || path.resolve(process.cwd(), 'data');
const REVOKED_TOKENS_FILE = path.resolve(DATA_DIR, 'revoked_tokens.json');
const TOKEN_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days token expiration

let devSessionSecret: string | null = null;

/**
 * Returns the session signing secret.
 * In production: Strictly requires process.env.SESSION_SECRET.
 * In development: Generates an ephemeral cryptographic random 256-bit secret.
 * No hardcoded fallback secret is ever used!
 */
export function getSessionSecret(): string {
  if (process.env.SESSION_SECRET) {
    return process.env.SESSION_SECRET;
  }
  if (process.env.NODE_ENV === 'production') {
    throw new Error(
      '[FATAL SECURITY CONFIGURATION] SESSION_SECRET environment variable is missing in production. ' +
      'WAS Jobs cannot start without a secure SESSION_SECRET configured in environment variables.'
    );
  }
  if (!devSessionSecret) {
    devSessionSecret = crypto.randomBytes(32).toString('hex');
    console.info('ℹ️ [SECURITY] Generated ephemeral random SESSION_SECRET for local development.');
  }
  return devSessionSecret;
}

/**
 * Returns the platform founder admin email from environment variables.
 * Never trust a client-supplied email for admin elevation!
 */
export function getFounderAdminEmail(): string {
  return (process.env.ADMIN_EMAIL || 'habitegechewe@gmail.com').toLowerCase().trim();
}

interface RevokedTokenEntry {
  signature: string;
  expiresAt: number;
  revokedAt: string;
}

// In-memory set for O(1) checks, backed by persistent JSON storage
const revokedSignaturesSet = new Set<string>();

export function loadRevokedTokensFromDisk(): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (fs.existsSync(REVOKED_TOKENS_FILE)) {
      const raw = fs.readFileSync(REVOKED_TOKENS_FILE, 'utf-8');
      const entries: RevokedTokenEntry[] = JSON.parse(raw);
      const now = Date.now();
      const validEntries = entries.filter((e) => e.expiresAt > now);
      revokedSignaturesSet.clear();
      for (const e of validEntries) {
        revokedSignaturesSet.add(e.signature);
      }
      if (validEntries.length !== entries.length) {
        fs.writeFileSync(REVOKED_TOKENS_FILE, JSON.stringify(validEntries, null, 2), 'utf-8');
      }
      return;
    }
  } catch (err) {
    console.error('Failed to load revoked tokens file:', err);
  }
  revokedSignaturesSet.clear();
}

function persistRevocation(signature: string, expiresAt: number): void {
  try {
    revokedSignaturesSet.add(signature);
    let entries: RevokedTokenEntry[] = [];
    if (fs.existsSync(REVOKED_TOKENS_FILE)) {
      try {
        entries = JSON.parse(fs.readFileSync(REVOKED_TOKENS_FILE, 'utf-8'));
      } catch {}
    }
    const now = Date.now();
    entries = entries.filter((e) => e.expiresAt > now && e.signature !== signature);
    entries.push({
      signature,
      expiresAt,
      revokedAt: new Date().toISOString(),
    });
    fs.writeFileSync(REVOKED_TOKENS_FILE, JSON.stringify(entries, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to persist revoked token:', err);
  }
}

// Load persisted token blacklist on boot
loadRevokedTokensFromDisk();

export interface AuthenticatedRequest extends Request {
  user?: User;
  token?: string;
}

export function generateToken(user: User): string {
  const payload = {
    id: user.id,
    email: user.email,
    role: user.role,
    v: user.tokenVersion || 1,
    issuedAt: Date.now(),
  };
  const str = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto.createHmac('sha256', getSessionSecret()).update(str).digest('base64url');
  return `${str}.${signature}`;
}

export function revokeToken(token: string): void {
  try {
    const parts = token.split('.');
    if (parts.length === 2) {
      const [payloadStr, signature] = parts;
      let expiresAt = Date.now() + TOKEN_MAX_AGE_MS;
      try {
        const payload = JSON.parse(Buffer.from(payloadStr, 'base64url').toString('utf-8'));
        if (payload.issuedAt && typeof payload.issuedAt === 'number') {
          expiresAt = payload.issuedAt + TOKEN_MAX_AGE_MS;
        }
      } catch {}
      persistRevocation(signature, expiresAt);
    }
  } catch {
    // Ignore invalid formats
  }
}

export function isTokenRevoked(token: string): boolean {
  try {
    const parts = token.split('.');
    if (parts.length === 2) {
      return revokedSignaturesSet.has(parts[1]);
    }
    return true;
  } catch {
    return true;
  }
}

export function verifyToken(token: string): { id: string; email: string; role: UserRole; v: number; issuedAt: number } | null {
  if (!token || typeof token !== 'string') return null;

  try {
    const parts = token.split('.');
    if (parts.length !== 2) return null;
    const [payloadStr, signature] = parts;
    if (!payloadStr || !signature) return null;

    if (isTokenRevoked(token)) {
      return null;
    }

    const secret = getSessionSecret();
    const expectedSig = crypto.createHmac('sha256', secret).update(payloadStr).digest('base64url');

    // Timing-safe cryptographic comparison to prevent timing side-channel attacks
    const sigBuf = Buffer.from(signature);
    const expBuf = Buffer.from(expectedSig);
    if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
      return null;
    }

    const payloadJson = Buffer.from(payloadStr, 'base64url').toString('utf-8');
    const payload = JSON.parse(payloadJson);

    // Validate structural schema of payload
    if (
      !payload ||
      typeof payload !== 'object' ||
      typeof payload.id !== 'string' ||
      typeof payload.email !== 'string' ||
      typeof payload.role !== 'string' ||
      typeof payload.issuedAt !== 'number'
    ) {
      return null;
    }

    // Expiration check (7 days) and future timestamp anomaly prevention
    const now = Date.now();
    if (now - payload.issuedAt > TOKEN_MAX_AGE_MS || payload.issuedAt > now + 60000) {
      return null;
    }

    return {
      id: payload.id,
      email: payload.email,
      role: payload.role as UserRole,
      v: typeof payload.v === 'number' ? payload.v : 1,
      issuedAt: payload.issuedAt,
    };
  } catch {
    return null;
  }
}

export function authMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }

  const token = authHeader.split(' ')[1];
  const payload = verifyToken(token);
  if (!payload) {
    return next();
  }

  const user = db.get().users.find((u) => u.id === payload.id);
  if (!user) {
    return next();
  }

  // Token Invalidation Check: If user changed password or bumped tokenVersion, invalidate older tokens
  if (user.passwordChangedAt && payload.issuedAt < user.passwordChangedAt) {
    return next(); // Token issued prior to password change is revoked
  }

  const expectedTokenVersion = user.tokenVersion || 1;
  if (payload.v < expectedTokenVersion) {
    return next(); // Token version superseded
  }

  req.user = user;
  req.token = token;
  next();
}

export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required or session expired. እባክዎ መጀመሪያ ይግቡ።' });
  }
  next();
}

export function requireRole(...roles: UserRole[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required. እባክዎ መጀመሪያ ይግቡ።' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        error: `Access denied. Requires ${roles.join(' or ')} permission. ይቅርታ፣ ይህን ገፅ ለመጠቀም ፈቃድ የለዎትም።`,
      });
    }
    next();
  };
}
