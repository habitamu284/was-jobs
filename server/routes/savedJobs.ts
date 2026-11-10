import { Router } from 'express';
import type { Response } from 'express';
import { db } from '../db.ts';
import { requireAuth } from '../auth.ts';
import type { AuthenticatedRequest } from '../auth.ts';
import type { SavedJob } from '../../src/types/index.ts';

const router = Router();

// Get current user's saved jobs
router.get('/', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const savedEntries = db.get().savedJobs.filter((s) => s.userId === req.user!.id);
  const jobs = db.get().jobs;

  const savedJobs = savedEntries
    .map((s) => jobs.find((j) => j.id === s.jobId))
    .filter(Boolean);

  const savedIds = savedEntries.map((s) => s.jobId);

  res.json({ savedJobs, savedIds });
});

// Toggle save job
router.post('/:jobId', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const jobId = req.params.jobId;
  const userId = req.user!.id;

  let isSaved = false;

  db.update((database) => {
    const existingIndex = database.savedJobs.findIndex(
      (s) => s.userId === userId && s.jobId === jobId
    );

    if (existingIndex !== -1) {
      // Remove
      database.savedJobs.splice(existingIndex, 1);
      isSaved = false;
    } else {
      // Add
      const newSaved: SavedJob = {
        id: `sv_${Date.now()}`,
        userId,
        jobId,
        createdAt: new Date().toISOString(),
      };
      database.savedJobs.push(newSaved);
      isSaved = true;
    }
  });

  res.json({
    isSaved,
    message: isSaved
      ? 'Job saved to favorites. ስራው በምርጫዎችዎ ውስጥ ተቀምጧል።'
      : 'Job removed from favorites. ስራው ከምርጫዎችዎ ተሰርዟል።',
  });
});

export default router;
