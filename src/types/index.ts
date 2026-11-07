export type UserRole = 'seeker' | 'employer' | 'admin';

export interface User {
  id: string;
  email: string;
  passwordHash: string;
  fullName: string;
  role: UserRole;
  phone?: string;
  avatar?: string;
  location?: string;
  title?: string;
  bio?: string;
  education?: string;
  experience?: string;
  skills?: string[];
  cvFileName?: string;
  cvOriginalName?: string;
  cvUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Company {
  id: string;
  userId: string;
  companyName: string;
  logo?: string;
  industry: string;
  website?: string;
  phone: string;
  email: string;
  location: string;
  description: string;
  verified: boolean;
  tinNumber?: string;
  createdAt: string;
}

export type JobStatus = 'active' | 'pending_approval' | 'paused' | 'closed' | 'rejected';
export type EmploymentType = 'full_time' | 'part_time' | 'contract' | 'remote' | 'internship';

export interface Job {
  id: string;
  employerId: string;
  companyName: string;
  companyLogo?: string;
  title: string;
  description: string;
  location: string;
  category: string;
  salaryMin?: number;
  salaryMax?: number;
  salaryCurrency: string; // 'ETB'
  salaryPeriod: 'monthly' | 'negotiable' | 'hourly';
  isNegotiableSalary?: boolean;
  employmentType: EmploymentType;
  requiredQualifications: string[];
  applicationDeadline: string;
  contactEmail: string;
  contactPhone: string;
  status: JobStatus;
  isFeatured: boolean;
  viewsCount: number;
  applicationsCount: number;
  createdAt: string;
  updatedAt: string;
}

export type ApplicationStatus = 'pending' | 'under_review' | 'shortlisted' | 'interviewing' | 'rejected' | 'hired';

export interface JobApplication {
  id: string;
  jobId: string;
  seekerId: string;
  seekerName: string;
  seekerEmail: string;
  seekerPhone: string;
  coverLetter?: string;
  cvUrl?: string;
  cvOriginalName?: string;
  status: ApplicationStatus;
  employerNotes?: string;
  createdAt: string;
  updatedAt: string;
  jobTitle?: string;
  companyName?: string;
  jobLocation?: string;
}

export interface SavedJob {
  id: string;
  userId: string;
  jobId: string;
  createdAt: string;
}

export interface AppNotification {
  id: string;
  userId: string;
  titleEn: string;
  titleAm: string;
  messageEn: string;
  messageAm: string;
  type: 'application' | 'status_change' | 'job_approval' | 'system';
  read: boolean;
  link?: string;
  createdAt: string;
}

export interface JobReport {
  id: string;
  reportedByUserId: string;
  jobId: string;
  jobTitle?: string;
  reason: string;
  details: string;
  status: 'pending' | 'reviewed' | 'resolved' | 'dismissed';
  createdAt: string;
}

export interface PaymentTransaction {
  id: string;
  userId: string;
  payerName?: string;
  amount: number;
  currency: 'ETB';
  provider: 'telebirr' | 'cbe_birr' | 'chapa';
  purpose: 'commission' | 'featured_job' | 'company_verification';
  targetId?: string;
  status: 'completed' | 'pending_verification' | 'pending_configuration' | 'verified' | 'rejected';
  phone?: string;
  accountNumber?: string;
  transactionRef?: string;
  notes?: string;
  verifiedAt?: string;
  verifiedBy?: string;
  createdAt: string;
}
