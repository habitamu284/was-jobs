import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import pg from 'pg';
import type { User, Company, Job, JobApplication, SavedJob, AppNotification, JobReport, PaymentTransaction } from '../src/types/index.ts';

let pgPool: pg.Pool | null = null;
if (process.env.DATABASE_URL) {
  try {
    const isLocal = process.env.DATABASE_URL.includes('localhost') || process.env.DATABASE_URL.includes('127.0.0.1');
    pgPool = new pg.Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: isLocal ? false : { rejectUnauthorized: false },
    });
    console.info('🔌 [DB] PostgreSQL remote database persistence adapter initialized.');
  } catch (err) {
    console.error('⚠️ [DB] Failed to initialize PostgreSQL pool:', err);
  }
}

const DATA_DIR = process.env.DATA_DIR || path.resolve(process.cwd(), 'data');
const DB_FILE = path.resolve(DATA_DIR, 'db.json');
const UPLOADS_DIR = process.env.UPLOADS_DIR || path.resolve(process.cwd(), 'uploads');
const CVS_DIR = path.resolve(UPLOADS_DIR, 'cvs');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
if (!fs.existsSync(CVS_DIR)) {
  fs.mkdirSync(CVS_DIR, { recursive: true });
}

export interface DatabaseSchema {
  users: User[];
  companies: Company[];
  jobs: Job[];
  applications: JobApplication[];
  savedJobs: SavedJob[];
  notifications: AppNotification[];
  reports: JobReport[];
  payments: PaymentTransaction[];
}

const BCRYPT_ROUNDS = 10;

/**
 * Modern secure password hashing using bcrypt.
 * Incorporates a computational work factor (salt rounds) and unique per-password salt to prevent GPU/rainbow-table attacks.
 */
export function hashPassword(password: string): string {
  return bcrypt.hashSync(password, BCRYPT_ROUNDS);
}

/**
 * Verifies password against stored hash.
 * Supports modern bcrypt hashes ($2a$, $2b$) as well as legacy SHA-256 hashes for seamless migration.
 */
export function verifyPassword(password: string, storedHash: string): boolean {
  if (!password || !storedHash) return false;
  try {
    if (storedHash.startsWith('$2a$') || storedHash.startsWith('$2b$')) {
      return bcrypt.compareSync(password, storedHash);
    }
  } catch {
    // If bcrypt compare fails unexpectedly, fall through to legacy check
  }
  // Backward compatibility with previous SHA-256 hash
  const legacyHash = crypto.createHash('sha256').update(password + '_was_salt_2025').digest('hex');
  return legacyHash === storedHash;
}

export function getFounderEmail(): string {
  return (process.env.ADMIN_EMAIL || 'habitegechewe@gmail.com').toLowerCase().trim();
}

export function getInitialAdminPassword(): string {
  if (process.env.ADMIN_INITIAL_PASSWORD) {
    return process.env.ADMIN_INITIAL_PASSWORD;
  }
  return 'Admin12345!';
}

// Clean production initial database containing only the real owner and administrator
function getInitialDatabase(): DatabaseSchema {
  return {
    users: [
      {
        id: 'usr_admin_1',
        email: getFounderEmail(),
        passwordHash: hashPassword(getInitialAdminPassword()),
        fullName: 'ሀብታሙ ጌታቸው (Habitamu Getachew)',
        role: 'admin',
        phone: '0966087039',
        location: 'Addis Ababa',
        title: 'Platform Administrator & Founder',
        bio: 'Owner and platform administrator of WAS Jobs Ethiopia.',
        skills: ['Platform Administration', 'HR Operations', 'Marketplace Management'],
        createdAt: '2026-01-01T08:00:00.000Z',
        updatedAt: '2026-01-01T08:00:00.000Z',
      }
    ],
    companies: [
      {
        id: 'cmp_was_official',
        userId: 'usr_admin_1',
        companyName: 'WAS Jobs Official (ዋስ ስራ)',
        industry: 'Technology & Human Resources',
        phone: '0966087039',
        email: 'habitegechewe@gmail.com',
        location: 'Addis Ababa',
        description: 'Official WAS Jobs verified recruitment and placement desk.',
        verified: true,
        createdAt: '2026-01-01T08:00:00.000Z',
      }
    ],
    jobs: [],
    applications: [],
    savedJobs: [],
    notifications: [
      {
        id: 'notif_admin_welcome',
        userId: 'usr_admin_1',
        titleEn: 'Welcome to WAS Jobs Ethiopia Admin',
        titleAm: 'እንኳን ወደ ዋስ ስራ አስተዳዳሪ ክፍል በደህና መጡ',
        messageEn: 'You are signed in as the platform administrator (habitegechewe@gmail.com). You have full control over jobs, users, and content.',
        messageAm: 'እንደ ዋስ ስራ ዋና አስተዳዳሪ (habitegechewe@gmail.com) ሆነው ገብተዋል። በስራዎች፣ ተጠቃሚዎች እና ይዘቶች ላይ ሙሉ ቁጥጥር አለዎት።',
        type: 'system',
        read: false,
        link: '/admin',
        createdAt: '2026-01-01T08:00:00.000Z',
      }
    ],
    reports: [],
    payments: []
  };
}

class Database {
  private data: DatabaseSchema;

  private lastMtime: number = 0;

  constructor() {
    this.data = this.load();
    try {
      if (fs.existsSync(DB_FILE)) {
        this.lastMtime = fs.statSync(DB_FILE).mtimeMs;
      }
    } catch {}
  }

  public reload(): DatabaseSchema {
    this.data = this.load();
    try {
      if (fs.existsSync(DB_FILE)) {
        this.lastMtime = fs.statSync(DB_FILE).mtimeMs;
      }
    } catch {}
    return this.data;
  }

  private load(): DatabaseSchema {
    try {
      if (fs.existsSync(DB_FILE)) {
        const content = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(content);
        // Clean and purge any legacy mock/sample accounts or entries
        parsed.users = (parsed.users || []).filter((u: User) =>
          !['usr_emp_telecom', 'usr_emp_cbe', 'usr_emp_safaricom', 'usr_seeker_1', 'usr_seeker_2'].includes(u.id) &&
          !u.email.includes('ethiotelecom.et') &&
          !u.email.includes('cbe.com.et') &&
          !u.email.includes('safaricom.et') &&
          !u.email.includes('selamawit.tadesse') &&
          !u.email.includes('yonas.kebede')
        );
        parsed.companies = (parsed.companies || []).filter((c: Company) =>
          !['cmp_telecom', 'cmp_cbe', 'cmp_safaricom'].includes(c.id) &&
          !['usr_emp_telecom', 'usr_emp_cbe', 'usr_emp_safaricom'].includes(c.userId)
        );
        parsed.jobs = (parsed.jobs || []).filter((j: Job) =>
          !['cmp_telecom', 'cmp_cbe', 'cmp_safaricom'].includes(j.employerId) &&
          !j.id.startsWith('job_eth_')
        );
        parsed.applications = (parsed.applications || []).filter((a: JobApplication) =>
          !['usr_seeker_1', 'usr_seeker_2'].includes(a.seekerId) &&
          !['app_1', 'app_2'].includes(a.id)
        );
        parsed.savedJobs = (parsed.savedJobs || []).filter((s: SavedJob) => s.id !== 'sv_1');
        parsed.notifications = (parsed.notifications || []).filter((n: AppNotification) =>
          !['notif_1', 'notif_2'].includes(n.id)
        );
        parsed.reports = (parsed.reports || []).filter((r: JobReport) => r.id !== 'rep_1');
        parsed.payments = (parsed.payments || []).filter((p: PaymentTransaction) => p.id !== 'pay_demo_1');

        // Ensure admin account always exists with verified official credentials
        const founderEmail = getFounderEmail();
        const adminIndex = parsed.users.findIndex((u: User) => u.email.toLowerCase() === founderEmail || u.id === 'usr_admin_1');
        if (adminIndex === -1) {
          parsed.users.unshift(getInitialDatabase().users[0]);
        } else {
          parsed.users[adminIndex].role = 'admin';
          parsed.users[adminIndex].email = founderEmail;
          parsed.users[adminIndex].fullName = 'ሀብታሙ ጌታቸው (Habitamu Getachew)';
          parsed.users[adminIndex].phone = '0966087039';
          // Never overwrite an existing bcrypt password hash on server restart!
          // Only initialize or upgrade if the password hash is completely missing.
          if (!parsed.users[adminIndex].passwordHash) {
            parsed.users[adminIndex].passwordHash = hashPassword(getInitialAdminPassword());
          }
        }

        const adminCompany = parsed.companies.find((c: Company) => c.userId === 'usr_admin_1');
        if (!adminCompany) {
          parsed.companies.unshift(getInitialDatabase().companies[0]);
        }

        // Auto-reconstitute any missing CV files in CVS_DIR from database backup
        try {
          if (!fs.existsSync(CVS_DIR)) {
            fs.mkdirSync(CVS_DIR, { recursive: true });
          }
          for (const u of parsed.users || []) {
            if (u.cvFileName && u.cvBase64) {
              const cvPath = path.resolve(CVS_DIR, u.cvFileName);
              if (!fs.existsSync(cvPath)) {
                fs.writeFileSync(cvPath, Buffer.from(u.cvBase64, 'base64'));
              }
            }
          }
        } catch (cvErr) {
          console.error('Failed to auto-reconstitute CV files from backup:', cvErr);
        }

        this.save(parsed);
        return parsed;
      }
    } catch (e) {
      console.error('Error reading DB_FILE, fallback to initial data', e);
    }
    const initial = getInitialDatabase();
    this.save(initial);
    return initial;
  }

  public async initPostgres(): Promise<void> {
    if (!pgPool) return;
    try {
      const client = await pgPool.connect();
      try {
        await client.query(`
          CREATE TABLE IF NOT EXISTS platform_store (
            id VARCHAR(50) PRIMARY KEY,
            data JSONB NOT NULL,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
          );
        `);
        const res = await client.query(`SELECT data FROM platform_store WHERE id = 'main'`);
        if (res.rows.length > 0 && res.rows[0].data) {
          const remoteData = res.rows[0].data as DatabaseSchema;
          this.data = remoteData;
          fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), 'utf-8');
          console.info('✅ [DB] Successfully hydrated application state from PostgreSQL cloud database.');
        } else {
          await client.query(
            `INSERT INTO platform_store (id, data, updated_at) VALUES ('main', $1, NOW()) ON CONFLICT (id) DO UPDATE SET data = $1, updated_at = NOW()`,
            [JSON.stringify(this.data)]
          );
          console.info('✅ [DB] Successfully seeded PostgreSQL cloud database with platform snapshot.');
        }
      } finally {
        client.release();
      }
    } catch (err) {
      console.warn('⚠️ [DB] PostgreSQL sync warning (continuing on local disk storage):', err);
    }
  }

  public save(dataToSave: DatabaseSchema) {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(dataToSave, null, 2), 'utf-8');
      if (fs.existsSync(DB_FILE)) {
        this.lastMtime = fs.statSync(DB_FILE).mtimeMs;
      }
    } catch (e) {
      console.error('Error saving DB_FILE', e);
    }

    // Replicate to PostgreSQL cloud database if configured
    if (pgPool) {
      pgPool.query(
        `INSERT INTO platform_store (id, data, updated_at) VALUES ('main', $1, NOW()) ON CONFLICT (id) DO UPDATE SET data = $1, updated_at = NOW()`,
        [JSON.stringify(dataToSave)]
      ).catch((err) => {
        console.warn('⚠️ [DB] Background PostgreSQL replication warning:', err.message);
      });
    }
  }

  public get(): DatabaseSchema {
    try {
      if (fs.existsSync(DB_FILE)) {
        const mtime = fs.statSync(DB_FILE).mtimeMs;
        if (mtime > this.lastMtime) {
          this.data = this.load();
          this.lastMtime = mtime;
        }
      }
    } catch {}
    return this.data;
  }

  public update(updater: (db: DatabaseSchema) => void): DatabaseSchema {
    updater(this.data);
    this.save(this.data);
    return this.data;
  }
}

export const db = new Database();
export { CVS_DIR };
