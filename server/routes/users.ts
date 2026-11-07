import { Router, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { db, CVS_DIR } from '../db.ts';
import { AuthenticatedRequest, requireAuth, requireRole } from '../auth.ts';
import { User } from '../../src/types/index.ts';

const router = Router();

// Multer setup for secure CV upload
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, CVS_DIR);
  },
  filename: (req: AuthenticatedRequest, file, cb) => {
    const ext = path.extname(file.originalname);
    const safeName = `cv_${req.user?.id || 'anon'}_${Date.now()}${ext}`;
    cb(null, safeName);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (_req, file, cb) => {
    const allowed = ['.pdf', '.doc', '.docx', '.txt', '.png', '.jpg', '.jpeg'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF, Word, or text files are supported for CV.'));
    }
  },
});

// Get own profile
router.get('/profile', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const user = db.get().users.find((u) => u.id === req.user!.id);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  const { passwordHash: _, ...safeUser } = user;
  const company = db.get().companies.find((c) => c.userId === user.id);
  res.json({ user: safeUser, company });
});

// Update profile (STRICT: prevents role escalation!)
router.put('/profile', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const {
    fullName,
    phone,
    location,
    title,
    bio,
    education,
    experience,
    skills,
    avatar,
  } = req.body;

  let skillsArray: string[] = [];
  if (Array.isArray(skills)) {
    skillsArray = skills;
  } else if (typeof skills === 'string') {
    skillsArray = skills
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
  }

  db.update((database) => {
    const user = database.users.find((u) => u.id === req.user!.id);
    if (user) {
      if (fullName) user.fullName = fullName.trim();
      if (phone !== undefined) user.phone = phone.trim();
      if (location !== undefined) user.location = location.trim();
      if (title !== undefined) user.title = title.trim();
      if (bio !== undefined) user.bio = bio.trim();
      if (education !== undefined) user.education = education.trim();
      if (experience !== undefined) user.experience = experience.trim();
      if (skillsArray.length > 0) user.skills = skillsArray;
      if (avatar !== undefined) user.avatar = avatar;
      // Note: Role is intentionally NEVER updated here!
      user.updatedAt = new Date().toISOString();
    }
  });

  const updatedUser = db.get().users.find((u) => u.id === req.user!.id);
  const { passwordHash: _, ...safeUser } = updatedUser!;
  res.json({ message: 'Profile updated successfully. መገለጫዎ ተዘምኗል።', user: safeUser });
});

// Upload CV
router.post('/upload-cv', requireAuth, upload.single('cv'), (req: AuthenticatedRequest, res: Response) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No CV file uploaded.' });
  }

  const fileUrl = `/api/uploads/cvs/${req.file.filename}`;
  const originalName = req.file.originalname;

  db.update((database) => {
    const user = database.users.find((u) => u.id === req.user!.id);
    if (user) {
      user.cvFileName = req.file!.filename;
      user.cvOriginalName = originalName;
      user.cvUrl = fileUrl;
      user.updatedAt = new Date().toISOString();
    }
  });

  res.json({
    message: 'CV uploaded successfully! ሲቪዎ በተሳካ ሁኔታ ተጭኗል!',
    cvUrl: fileUrl,
    cvOriginalName: originalName,
    cvFileName: req.file.filename,
  });
});

// Protected CV file download endpoint
router.get('/cvs/:filename', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const filename = path.basename(req.params.filename);
  const filePath = path.resolve(CVS_DIR, filename);

  if (!fs.existsSync(filePath)) {
    return res.status(404).send('CV file not found.');
  }

  const currentUser = req.user!;
  // Check authorization:
  // 1. Is Admin?
  if (currentUser.role === 'admin') {
    return res.sendFile(filePath);
  }

  // 2. Is this the seeker's own CV?
  if (currentUser.cvFileName === filename) {
    return res.sendFile(filePath);
  }

  // 3. Is the user an employer who received an application containing this CV?
  const company = db.get().companies.find((c) => c.userId === currentUser.id);
  if (company) {
    const employerJobs = db.get().jobs.filter((j) => j.employerId === company.id).map((j) => j.id);
    const applicantWithCv = db.get().applications.find(
      (a) => employerJobs.includes(a.jobId) && a.cvUrl && a.cvUrl.includes(filename)
    );
    if (applicantWithCv) {
      return res.sendFile(filePath);
    }
  }

  return res.status(403).json({
    error: 'Access denied. You do not have permission to view this CV. ይህን ሲቪ (CV) ለመመልከት ፈቃድ የለዎትም።',
  });
});

// Admin: Get all users
router.get('/admin-list', requireRole('admin'), (_req: AuthenticatedRequest, res: Response) => {
  const users = db.get().users.map((u) => {
    const { passwordHash: _, ...safe } = u;
    const company = db.get().companies.find((c) => c.userId === u.id);
    const applicationsCount = db.get().applications.filter((a) => a.seekerId === u.id).length;
    return {
      ...safe,
      companyName: company?.companyName,
      companyVerified: company?.verified,
      applicationsCount,
    };
  });
  res.json({ users });
});

// Admin: Change user role (Protected only for admin)
router.patch('/:id/role', requireRole('admin'), (req: AuthenticatedRequest, res: Response) => {
  const userId = req.params.id;
  const { role } = req.body;

  if (role !== 'seeker' && role !== 'employer' && role !== 'admin') {
    return res.status(400).json({ error: 'Invalid role.' });
  }

  db.update((database) => {
    const user = database.users.find((u) => u.id === userId);
    if (user) {
      user.role = role;
      user.updatedAt = new Date().toISOString();
    }
  });

  res.json({ message: `User role updated to ${role}.` });
});

export default router;
