import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { User, Company, Job, JobApplication, SavedJob, AppNotification, JobReport, PaymentTransaction } from '../src/types/index.ts';

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.resolve(DATA_DIR, 'db.json');
const UPLOADS_DIR = path.resolve(process.cwd(), 'uploads');
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

export function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password + '_was_salt_2025').digest('hex');
}

// Clean production initial database containing only the real owner and administrator
const INITIAL_DB: DatabaseSchema = {
  users: [
    {
      id: 'usr_admin_1',
      email: 'habitegechewe@gmail.com',
      passwordHash: hashPassword('Admin12345!'),
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
  companies: [],
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

class Database {
  private data: DatabaseSchema;

  constructor() {
    this.data = this.load();
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
        const adminIndex = parsed.users.findIndex((u: User) => u.email === 'habitegechewe@gmail.com');
        if (adminIndex === -1) {
          parsed.users.unshift(INITIAL_DB.users[0]);
        } else {
          parsed.users[adminIndex].role = 'admin';
          parsed.users[adminIndex].fullName = 'ሀብታሙ ጌታቸው (Habitamu Getachew)';
          parsed.users[adminIndex].phone = '0966087039';
        }
        this.save(parsed);
        return parsed;
      }
    } catch (e) {
      console.error('Error reading DB_FILE, fallback to initial data', e);
    }
    this.save(INITIAL_DB);
    return INITIAL_DB;
  }

  public save(dataToSave: DatabaseSchema) {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(dataToSave, null, 2), 'utf-8');
    } catch (e) {
      console.error('Error saving DB_FILE', e);
    }
  }

  public get(): DatabaseSchema {
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
