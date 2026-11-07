import { Router, Response } from 'express';
import { db } from '../db.ts';
import { AuthenticatedRequest, requireAuth, requireRole } from '../auth.ts';
import { JobReport } from '../../src/types/index.ts';

const router = Router();

// Submit a report regarding a job
router.post('/', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const { jobId, reason, details } = req.body;

  if (!jobId || !reason) {
    return res.status(400).json({ error: 'Job ID and reason are required.' });
  }

  const job = db.get().jobs.find((j) => j.id === jobId);

  const newReport: JobReport = {
    id: `rep_${Date.now()}`,
    reportedByUserId: req.user!.id,
    jobId,
    jobTitle: job ? job.title : 'Unknown Job',
    reason: reason.trim(),
    details: details?.trim() || '',
    status: 'pending',
    createdAt: new Date().toISOString(),
  };

  db.update((database) => {
    database.reports.unshift(newReport);
  });

  res.status(201).json({
    message: 'Report submitted for administrator review. ሪፖርትዎ ለአስተዳዳሪው ደርሷል።',
    report: newReport,
  });
});

// Admin: Get all reports
router.get('/', requireRole('admin'), (_req: AuthenticatedRequest, res: Response) => {
  const reports = db.get().reports.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  res.json({ reports });
});

// Admin: Update report status
router.patch('/:id/status', requireRole('admin'), (req: AuthenticatedRequest, res: Response) => {
  const reportId = req.params.id;
  const { status } = req.body;

  const validStatuses = ['pending', 'reviewed', 'resolved', 'dismissed'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: 'Invalid report status.' });
  }

  db.update((database) => {
    const report = database.reports.find((r) => r.id === reportId);
    if (report) {
      report.status = status;
    }
  });

  res.json({ message: 'Report status updated.', report: db.get().reports.find((r) => r.id === reportId) });
});

export default router;
