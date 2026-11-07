import { Router, Response } from 'express';
import { db } from '../db.ts';
import { AuthenticatedRequest, requireRole, requireAuth } from '../auth.ts';
import { JobApplication, ApplicationStatus } from '../../src/types/index.ts';

const router = Router();

// Apply for a job (Job Seeker only)
router.post('/', requireRole('seeker', 'admin'), (req: AuthenticatedRequest, res: Response) => {
  const { jobId, coverLetter, phone, cvUrl, cvOriginalName } = req.body;

  if (!jobId) {
    return res.status(400).json({ error: 'Job ID is required.' });
  }

  const job = db.get().jobs.find((j) => j.id === jobId);
  if (!job) {
    return res.status(404).json({ error: 'Job not found.' });
  }

  if (job.status !== 'active') {
    return res.status(400).json({ error: 'This job posting is no longer accepting applications. ይህ የስራ ማስታወቂያ ዝግ ነው።' });
  }

  // Check if deadline passed
  if (job.applicationDeadline && new Date(job.applicationDeadline).getTime() < new Date().setHours(0, 0, 0, 0)) {
    return res.status(400).json({ error: 'Application deadline has expired. የማመልከቻው ጊዜ አልፏል።' });
  }

  // Check if already applied
  const existingApp = db.get().applications.find(
    (a) => a.jobId === jobId && a.seekerId === req.user!.id
  );
  if (existingApp) {
    return res.status(400).json({
      error: 'You have already applied for this position. ለዚህ የስራ መደብ ቀደም ሲል አመልክተዋል።',
    });
  }

  const user = req.user!;
  const finalCvUrl = cvUrl || user.cvUrl;
  const finalCvName = cvOriginalName || user.cvOriginalName || 'Uploaded_CV.pdf';

  if (!finalCvUrl) {
    return res.status(400).json({
      error: 'Please upload or attach your CV before submitting. እባክዎ ከማመልከትዎ በፊት ሲቪዎን (CV) ያያይዙ።',
    });
  }

  const newApp: JobApplication = {
    id: `app_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
    jobId: job.id,
    seekerId: user.id,
    seekerName: user.fullName,
    seekerEmail: user.email,
    seekerPhone: phone?.trim() || user.phone || '',
    coverLetter: coverLetter?.trim() || '',
    cvUrl: finalCvUrl,
    cvOriginalName: finalCvName,
    status: 'pending',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    jobTitle: job.title,
    companyName: job.companyName,
    jobLocation: job.location,
  };

  db.update((database) => {
    database.applications.unshift(newApp);

    // Increment application count on the job
    const targetJob = database.jobs.find((j) => j.id === jobId);
    if (targetJob) {
      targetJob.applicationsCount = (targetJob.applicationsCount || 0) + 1;
    }

    // Find the company and its owner to send notification
    const company = database.companies.find((c) => c.id === job.employerId);
    if (company) {
      database.notifications.push({
        id: `notif_${Date.now()}`,
        userId: company.userId,
        titleEn: `New Application for ${job.title}`,
        titleAm: `ለ"${job.title}" አዲስ የስራ ማመልከቻ ደርሶዎታል`,
        messageEn: `${user.fullName} applied for "${job.title}". Review their CV in your employer dashboard.`,
        messageAm: `${user.fullName} ለ"${job.title}" ስራ አመልክተዋል። ሲቪያቸውን በአሰሪዎች ዳሽቦርድ ይመልከቱ።`,
        type: 'application',
        read: false,
        link: '/employer',
        createdAt: new Date().toISOString(),
      });
    }

    // Confirmation notification to seeker
    database.notifications.push({
      id: `notif_${Date.now() + 1}`,
      userId: user.id,
      titleEn: `Application Submitted: ${job.title}`,
      titleAm: `ማመልከቻዎ ተልኳል፡ ${job.title}`,
      messageEn: `Your application to ${job.companyName} was submitted successfully. You can track progress in your dashboard.`,
      messageAm: `ወደ ${job.companyName} ያቀረቡት ማመልከቻ በተሳካ ሁኔታ ደርሷል። ሂደቱን በዳሽቦርድዎ መከታተል ይችላሉ።`,
      type: 'application',
      read: false,
      link: '/applications',
      createdAt: new Date().toISOString(),
    });
  });

  res.status(201).json({
    message: 'Application submitted successfully! ማመልከቻዎ በተሳካ ሁኔታ ተልኳል!',
    application: newApp,
  });
});

// Get current seeker's application history
router.get('/my', requireRole('seeker', 'admin'), (req: AuthenticatedRequest, res: Response) => {
  const applications = db.get().applications.filter((a) => a.seekerId === req.user!.id);
  const jobs = db.get().jobs;

  // Enrich with latest job information
  const enriched = applications.map((app) => {
    const job = jobs.find((j) => j.id === app.jobId);
    return {
      ...app,
      jobTitle: job ? job.title : app.jobTitle,
      companyName: job ? job.companyName : app.companyName,
      jobLocation: job ? job.location : app.jobLocation,
      jobStatus: job?.status,
    };
  });

  res.json({ applications: enriched });
});

// Get applications for a specific job (Employer or Admin)
router.get('/job/:jobId', requireRole('employer', 'admin'), (req: AuthenticatedRequest, res: Response) => {
  const jobId = req.params.jobId;
  const job = db.get().jobs.find((j) => j.id === jobId);

  if (!job) {
    return res.status(404).json({ error: 'Job not found.' });
  }

  // Security check: Employer can only view applicants for their own jobs
  if (req.user!.role !== 'admin') {
    const company = db.get().companies.find((c) => c.userId === req.user!.id);
    if (!company || job.employerId !== company.id) {
      return res.status(403).json({ error: 'Unauthorized to view applicants for this job.' });
    }
  }

  const applications = db.get().applications.filter((a) => a.jobId === jobId);
  res.json({ applications, jobTitle: job.title });
});

// Update application status and notes (Employer or Admin)
router.patch('/:id/status', requireRole('employer', 'admin'), (req: AuthenticatedRequest, res: Response) => {
  const applicationId = req.params.id;
  const status = req.body.status as ApplicationStatus;
  const { employerNotes } = req.body;

  const validStatuses: ApplicationStatus[] = [
    'pending',
    'under_review',
    'shortlisted',
    'interviewing',
    'rejected',
    'hired',
  ];

  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: 'Invalid application status.' });
  }

  const app = db.get().applications.find((a) => a.id === applicationId);
  if (!app) {
    return res.status(404).json({ error: 'Application not found.' });
  }

  const job = db.get().jobs.find((j) => j.id === app.jobId);

  // Security check: Verify employer owns the job
  if (req.user!.role !== 'admin' && job) {
    const company = db.get().companies.find((c) => c.userId === req.user!.id);
    if (!company || job.employerId !== company.id) {
      return res.status(403).json({ error: 'Unauthorized to update this application.' });
    }
  }

  const statusTranslationsAm: Record<ApplicationStatus, string> = {
    pending: 'በመጠባበቅ ላይ',
    under_review: 'በግምገማ ላይ',
    shortlisted: 'በእጩነት ተመርጧል',
    interviewing: 'ለቃለ-መጠይቅ ተጠርቷል',
    rejected: 'አልተመረጠም',
    hired: 'ስራው ተሰጥቷል / ተቀጥረዋል',
  };

  const statusTranslationsEn: Record<ApplicationStatus, string> = {
    pending: 'Pending',
    under_review: 'Under Review',
    shortlisted: 'Shortlisted',
    interviewing: 'Interview Scheduled',
    rejected: 'Not Selected',
    hired: 'Hired / Offer Extended',
  };

  db.update((database) => {
    const target = database.applications.find((a) => a.id === applicationId);
    if (target) {
      target.status = status;
      if (employerNotes !== undefined) {
        target.employerNotes = employerNotes;
      }
      target.updatedAt = new Date().toISOString();

      // Notify the job seeker about status change
      database.notifications.push({
        id: `notif_${Date.now()}`,
        userId: target.seekerId,
        titleEn: `Status Update: ${job?.title || 'Your Application'}`,
        titleAm: `የማመልከቻ ሁኔታ ተቀይሯል፡ ${job?.title || 'የስራ ማመልከቻዎ'}`,
        messageEn: `Your application status at ${job?.companyName || 'the employer'} has been updated to "${statusTranslationsEn[status]}".`,
        messageAm: `በ${job?.companyName || 'አሰሪው'} ያቀረቡት ማመልከቻ ሁኔታ ወደ "${statusTranslationsAm[status]}" ተቀይሯል።`,
        type: 'status_change',
        read: false,
        link: '/applications',
        createdAt: new Date().toISOString(),
      });
    }
  });

  res.json({
    message: 'Application status updated successfully. የማመልከቻው ሁኔታ ተዘምኗል።',
    application: db.get().applications.find((a) => a.id === applicationId),
  });
});

export default router;
