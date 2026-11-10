import { Router } from 'express';
import type { Response } from 'express';
import { db } from '../db.ts';
import { requireRole, requireAuth } from '../auth.ts';
import type { AuthenticatedRequest } from '../auth.ts';
import type { Job, JobStatus, EmploymentType } from '../../src/types/index.ts';

const router = Router();

// Get list of jobs with filters
router.get('/', (req: AuthenticatedRequest, res: Response) => {
  const {
    q,
    category,
    location,
    type,
    minSalary,
    status,
    employerOnly,
  } = req.query;

  const allJobs = db.get().jobs;
  const companies = db.get().companies;

  let filtered = [...allJobs];

  // If employer requesting their own jobs
  if (employerOnly === 'true' && req.user) {
    const userCompany = companies.find((c) => c.userId === req.user!.id);
    if (userCompany) {
      filtered = filtered.filter((j) => j.employerId === userCompany.id);
    } else {
      filtered = [];
    }
  } else if (req.user?.role === 'admin' && status) {
    // Admin can filter by status
    if (status !== 'all') {
      filtered = filtered.filter((j) => j.status === status);
    }
  } else {
    // Public / seeker: only active jobs
    filtered = filtered.filter((j) => j.status === 'active');
  }

  // Category filter
  if (category && category !== 'All' && category !== 'ሁሉም') {
    filtered = filtered.filter(
      (j) => j.category.toLowerCase() === (category as string).toLowerCase()
    );
  }

  // Location filter
  if (location && location !== 'All' && location !== 'ሁሉም') {
    filtered = filtered.filter((j) =>
      j.location.toLowerCase().includes((location as string).toLowerCase())
    );
  }

  // Employment type filter
  if (type && type !== 'all') {
    filtered = filtered.filter((j) => j.employmentType === type);
  }

  // Salary filter
  if (minSalary && !isNaN(Number(minSalary))) {
    const minVal = Number(minSalary);
    filtered = filtered.filter((j) => (j.salaryMax || j.salaryMin || 0) >= minVal || j.isNegotiableSalary);
  }

  // Search keyword (Amharic & English query search)
  if (q && typeof q === 'string') {
    const term = q.toLowerCase().trim();
    filtered = filtered.filter(
      (j) =>
        j.title.toLowerCase().includes(term) ||
        j.companyName.toLowerCase().includes(term) ||
        j.description.toLowerCase().includes(term) ||
        j.location.toLowerCase().includes(term) ||
        j.requiredQualifications.some((reqQual) => reqQual.toLowerCase().includes(term))
    );
  }

  // Sort: Featured first, then newest
  filtered.sort((a, b) => {
    if (a.isFeatured && !b.isFeatured) return -1;
    if (!a.isFeatured && b.isFeatured) return 1;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  res.json({ jobs: filtered, count: filtered.length });
});

// Get single job details
router.get('/:id', (req: AuthenticatedRequest, res: Response) => {
  const jobId = req.params.id;
  const job = db.get().jobs.find((j) => j.id === jobId);

  if (!job) {
    return res.status(404).json({ error: 'Job not found. የስራ ማስታወቂያው አልተገኘም።' });
  }

  // Increment view count
  db.update((database) => {
    const target = database.jobs.find((j) => j.id === jobId);
    if (target) {
      target.viewsCount = (target.viewsCount || 0) + 1;
    }
  });

  const company = db.get().companies.find((c) => c.id === job.employerId);

  res.json({ job: { ...job, viewsCount: (job.viewsCount || 0) + 1 }, company });
});

// Post a new job (Employers & Admins)
router.post('/', requireRole('employer', 'admin'), (req: AuthenticatedRequest, res: Response) => {
  const {
    title,
    companyName,
    description,
    location,
    category,
    salaryMin,
    salaryMax,
    salaryPeriod,
    isNegotiableSalary,
    employmentType,
    requiredQualifications,
    applicationDeadline,
    contactEmail,
    contactPhone,
  } = req.body;

  if (!title || !description || !location || !category || !applicationDeadline) {
    return res.status(400).json({
      error: 'Please fill all required fields (title, description, location, category, deadline). እባክዎ ዋና ዋና መረጃዎችን ያሟሉ።',
    });
  }

  // Find employer's company
  let employerCompany = db.get().companies.find((c) => c.userId === req.user!.id);
  if (!employerCompany && req.user!.role === 'admin') {
    // Admin fallback company
    employerCompany = db.get().companies[0];
  }

  if (!employerCompany) {
    return res.status(400).json({ error: 'Please set up your company profile first before posting jobs.' });
  }

  // Parse qualifications
  let qualificationsArray: string[] = [];
  if (Array.isArray(requiredQualifications)) {
    qualificationsArray = requiredQualifications.filter((q) => q && q.trim().length > 0);
  } else if (typeof requiredQualifications === 'string') {
    qualificationsArray = requiredQualifications
      .split('\n')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
  }

  const newJob: Job = {
    id: `job_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
    employerId: employerCompany.id,
    companyName: companyName?.trim() || employerCompany.companyName,
    companyLogo: employerCompany.logo,
    title: title.trim(),
    description: description.trim(),
    location: location.trim(),
    category: category.trim(),
    salaryMin: salaryMin ? Number(salaryMin) : undefined,
    salaryMax: salaryMax ? Number(salaryMax) : undefined,
    salaryCurrency: 'ETB',
    salaryPeriod: salaryPeriod || 'monthly',
    isNegotiableSalary: !!isNegotiableSalary,
    employmentType: (employmentType as EmploymentType) || 'full_time',
    requiredQualifications: qualificationsArray.length > 0 ? qualificationsArray : ['Relevant experience in the field'],
    applicationDeadline: applicationDeadline,
    contactEmail: contactEmail?.trim() || employerCompany.email || req.user!.email,
    contactPhone: contactPhone?.trim() || employerCompany.phone || req.user!.phone || '',
    status: 'active',
    isFeatured: false,
    viewsCount: 0,
    applicationsCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  db.update((database) => {
    database.jobs.unshift(newJob);
    // Notify admin about new job
    const adminUser = database.users.find((u) => u.role === 'admin');
    if (adminUser) {
      database.notifications.push({
        id: `notif_${Date.now()}`,
        userId: adminUser.id,
        titleEn: 'New Job Posted',
        titleAm: 'አዲስ የስራ ማስታወቂያ ተለጥፏል',
        messageEn: `"${newJob.title}" posted by ${newJob.companyName} in ${newJob.location}.`,
        messageAm: `"${newJob.title}" በ ${newJob.companyName} (${newJob.location}) ተለጥፏል።`,
        type: 'job_approval',
        read: false,
        link: '/admin',
        createdAt: new Date().toISOString(),
      });
    }
  });

  res.status(201).json({
    message: 'Job posted successfully! የስራ ማስታወቂያው በተሳካ ሁኔታ ተለጥፏል!',
    job: newJob,
  });
});

// Update an existing job
router.put('/:id', requireRole('employer', 'admin'), (req: AuthenticatedRequest, res: Response) => {
  const jobId = req.params.id;
  const targetJob = db.get().jobs.find((j) => j.id === jobId);

  if (!targetJob) {
    return res.status(404).json({ error: 'Job not found.' });
  }

  // Authorization check: employer can only edit their own jobs
  if (req.user!.role !== 'admin') {
    const employerCompany = db.get().companies.find((c) => c.userId === req.user!.id);
    if (!employerCompany || targetJob.employerId !== employerCompany.id) {
      return res.status(403).json({ error: 'Unauthorized to edit this job. ይህን የስራ ማስታወቂያ የማስተካከል ፈቃድ የለዎትም።' });
    }
  }

  const {
    title,
    description,
    location,
    category,
    salaryMin,
    salaryMax,
    salaryPeriod,
    isNegotiableSalary,
    employmentType,
    requiredQualifications,
    applicationDeadline,
    contactEmail,
    contactPhone,
    status,
  } = req.body;

  let qualificationsArray = targetJob.requiredQualifications;
  if (Array.isArray(requiredQualifications)) {
    qualificationsArray = requiredQualifications.filter((q) => q && q.trim().length > 0);
  } else if (typeof requiredQualifications === 'string') {
    qualificationsArray = requiredQualifications
      .split('\n')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
  }

  db.update((database) => {
    const job = database.jobs.find((j) => j.id === jobId);
    if (job) {
      if (title) job.title = title.trim();
      if (description) job.description = description.trim();
      if (location) job.location = location.trim();
      if (category) job.category = category.trim();
      if (salaryMin !== undefined) job.salaryMin = Number(salaryMin) || undefined;
      if (salaryMax !== undefined) job.salaryMax = Number(salaryMax) || undefined;
      if (salaryPeriod) job.salaryPeriod = salaryPeriod;
      if (isNegotiableSalary !== undefined) job.isNegotiableSalary = !!isNegotiableSalary;
      if (employmentType) job.employmentType = employmentType;
      if (qualificationsArray) job.requiredQualifications = qualificationsArray;
      if (applicationDeadline) job.applicationDeadline = applicationDeadline;
      if (contactEmail) job.contactEmail = contactEmail.trim();
      if (contactPhone) job.contactPhone = contactPhone.trim();
      if (status) job.status = status as JobStatus;
      job.updatedAt = new Date().toISOString();
    }
  });

  res.json({ message: 'Job updated successfully. የስራ ማስታወቂያው ተዘምኗል።', job: db.get().jobs.find((j) => j.id === jobId) });
});

// Delete job post
router.delete('/:id', requireRole('employer', 'admin'), (req: AuthenticatedRequest, res: Response) => {
  const jobId = req.params.id;
  const targetJob = db.get().jobs.find((j) => j.id === jobId);

  if (!targetJob) {
    return res.status(404).json({ error: 'Job not found.' });
  }

  if (req.user!.role !== 'admin') {
    const employerCompany = db.get().companies.find((c) => c.userId === req.user!.id);
    if (!employerCompany || targetJob.employerId !== employerCompany.id) {
      return res.status(403).json({ error: 'Unauthorized to delete this job. ይህን የስራ ማስታወቂያ የመሰረዝ ፈቃድ የለዎትም።' });
    }
  }

  db.update((database) => {
    database.jobs = database.jobs.filter((j) => j.id !== jobId);
    database.applications = database.applications.filter((a) => a.jobId !== jobId);
    database.savedJobs = database.savedJobs.filter((s) => s.jobId !== jobId);
  });

  res.json({ message: 'Job deleted successfully. የስራ ማስታወቂያው ተሰርዟል።' });
});

// Change job status (Admin or Owner Employer)
router.patch('/:id/status', requireRole('admin', 'employer'), (req: AuthenticatedRequest, res: Response) => {
  const jobId = req.params.id;
  const { status } = req.body;
  const allowedStatuses: JobStatus[] = ['active', 'pending_approval', 'paused', 'closed', 'rejected'];

  if (!allowedStatuses.includes(status)) {
    return res.status(400).json({ error: 'Invalid status.' });
  }

  const targetJob = db.get().jobs.find((j) => j.id === jobId);
  if (!targetJob) {
    return res.status(404).json({ error: 'Job not found.' });
  }

  if (req.user!.role !== 'admin') {
    const employerCompany = db.get().companies.find((c) => c.userId === req.user!.id);
    if (!employerCompany || targetJob.employerId !== employerCompany.id) {
      return res.status(403).json({ error: 'Unauthorized.' });
    }
  }

  db.update((database) => {
    const job = database.jobs.find((j) => j.id === jobId);
    if (job) {
      job.status = status;
      job.updatedAt = new Date().toISOString();
    }
  });

  res.json({ message: `Job status updated to ${status}.`, job: db.get().jobs.find((j) => j.id === jobId) });
});

// Toggle featured job (Admin only)
router.patch('/:id/featured', requireRole('admin'), (req: AuthenticatedRequest, res: Response) => {
  const jobId = req.params.id;
  const { isFeatured } = req.body;

  db.update((database) => {
    const job = database.jobs.find((j) => j.id === jobId);
    if (job) {
      job.isFeatured = typeof isFeatured === 'boolean' ? isFeatured : !job.isFeatured;
      job.updatedAt = new Date().toISOString();
    }
  });

  res.json({ message: 'Featured status updated.', job: db.get().jobs.find((j) => j.id === jobId) });
});

export default router;
