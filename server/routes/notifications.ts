import { Router, Response } from 'express';
import { db } from '../db.ts';
import { AuthenticatedRequest, requireAuth } from '../auth.ts';

const router = Router();

// Get current user's notifications
router.get('/', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const notifs = db.get().notifications
    .filter((n) => n.userId === req.user!.id)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const unreadCount = notifs.filter((n) => !n.read).length;

  res.json({ notifications: notifs, unreadCount });
});

// Mark single notification as read
router.patch('/:id/read', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const notifId = req.params.id;

  db.update((database) => {
    const target = database.notifications.find((n) => n.id === notifId && n.userId === req.user!.id);
    if (target) {
      target.read = true;
    }
  });

  res.json({ success: true });
});

// Mark all as read
router.post('/mark-all-read', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  db.update((database) => {
    database.notifications
      .filter((n) => n.userId === req.user!.id)
      .forEach((n) => {
        n.read = true;
      });
  });

  res.json({ success: true });
});

export default router;
