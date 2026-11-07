import { Router, Response } from 'express';
import { db } from '../db.ts';
import { AuthenticatedRequest, requireRole } from '../auth.ts';

const router = Router();

// Admin platform statistics
router.get('/admin/stats', requireRole('admin'), (_req: AuthenticatedRequest, res: Response) => {
  const database = db.get();

  const totalJobs = database.jobs.length;
  const activeJobs = database.jobs.filter((j) => j.status === 'active').length;
  const pendingJobs = database.jobs.filter((j) => j.status === 'pending_approval').length;
  const closedJobs = database.jobs.filter((j) => j.status === 'closed' || j.status === 'paused').length;

  const totalUsers = database.users.length;
  const totalSeekers = database.users.filter((u) => u.role === 'seeker').length;
  const totalEmployers = database.users.filter((u) => u.role === 'employer').length;

  const totalApplications = database.applications.length;
  const shortlistedApps = database.applications.filter((a) => a.status === 'shortlisted' || a.status === 'interviewing').length;
  const hiredApps = database.applications.filter((a) => a.status === 'hired').length;

  const totalReports = database.reports.length;
  const pendingReports = database.reports.filter((r) => r.status === 'pending').length;

  // Category counts
  const categoryMap: Record<string, number> = {};
  database.jobs.forEach((j) => {
    categoryMap[j.category] = (categoryMap[j.category] || 0) + 1;
  });

  // Location counts
  const locationMap: Record<string, number> = {};
  database.jobs.forEach((j) => {
    const loc = j.location.split(',')[0].trim();
    locationMap[loc] = (locationMap[loc] || 0) + 1;
  });

  res.json({
    metrics: {
      totalJobs,
      activeJobs,
      pendingJobs,
      closedJobs,
      totalUsers,
      totalSeekers,
      totalEmployers,
      totalApplications,
      shortlistedApps,
      hiredApps,
      totalReports,
      pendingReports,
    },
    categoryStats: categoryMap,
    locationStats: locationMap,
    recentApplications: database.applications.slice(0, 5),
    recentJobs: database.jobs.slice(0, 5),
  });
});

export default router;
