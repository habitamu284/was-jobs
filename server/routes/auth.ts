import { Router } from 'express';
import type { Response } from 'express';
import { db, hashPassword, verifyPassword } from '../db.ts';
import { generateToken, revokeToken, requireAuth } from '../auth.ts';
import type { AuthenticatedRequest } from '../auth.ts';
import type { User, Company } from '../../src/types/index.ts';
import {
  loginRateLimiter,
  recordFailedLogin,
  resetFailedLogin,
  registerRateLimiter,
  resetPasswordRateLimiter,
} from '../middleware/rateLimit.ts';

const router = Router();

// Register new user (protected by registration rate limiter against bot spam)
router.post('/register', registerRateLimiter, (req, res) => {
  const { fullName, email, password, role, phone, companyName, industry, location } = req.body;

  if (!fullName || !email || !password || !role) {
    return res.status(400).json({ error: 'Please fill all required fields. እባክዎ ሁሉንም አስፈላጊ መረጃዎች ይሙሉ::' });
  }

  // Strict role enforcement: Only seeker or employer allowed at registration
  if (role !== 'seeker' && role !== 'employer') {
    return res.status(400).json({ error: 'Invalid role. Role must be job seeker or employer.' });
  }

  const normalizedEmail = email.toLowerCase().trim();
  const existing = db.get().users.find((u) => u.email.toLowerCase() === normalizedEmail);
  if (existing) {
    return res.status(400).json({ error: 'Email already registered. ይህ ኢሜል ቀደም ሲል ተመዝግቧል።' });
  }

  const userId = `usr_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
  const newUser: User = {
    id: userId,
    email: normalizedEmail,
    passwordHash: hashPassword(password),
    fullName: fullName.trim(),
    role: role,
    phone: phone?.trim() || '',
    location: location?.trim() || 'Addis Ababa',
    skills: [],
    tokenVersion: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  let newCompany: Company | undefined;
  if (role === 'employer') {
    newCompany = {
      id: `cmp_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      userId: userId,
      companyName: companyName?.trim() || fullName.trim(),
      industry: industry || 'Technology',
      phone: phone?.trim() || '',
      email: normalizedEmail,
      location: location?.trim() || 'Addis Ababa',
      description: 'New verified business on WAS Jobs Ethiopia.',
      verified: false,
      createdAt: new Date().toISOString(),
    };
  }

  db.update((database) => {
    database.users.push(newUser);
    if (newCompany) {
      database.companies.push(newCompany);
    }
    // Welcome notification
    database.notifications.push({
      id: `notif_${Date.now()}`,
      userId: newUser.id,
      titleEn: `Welcome to WAS Jobs, ${newUser.fullName.split(' ')[0]}!`,
      titleAm: `እንኳን ወደ ዋስ ስራ በደህና መጡ፣ ${newUser.fullName.split(' ')[0]}!`,
      messageEn: role === 'seeker' ? 'Complete your profile and upload your CV to start applying.' : 'Complete your company profile and post your first job vacancy.',
      messageAm: role === 'seeker' ? 'ስራዎችን ለማመልከት መገለጫዎን ያጠናቅቁ እና ሲቪዎን (CV) ይጫኑ።' : 'የመጀመሪያውን ክፍት የስራ ማስታወቂያ ለመለጠፍ የድርጅትዎን መረጃ ያሟሉ።',
      type: 'system',
      read: false,
      link: role === 'seeker' ? '/profile' : '/employer',
      createdAt: new Date().toISOString(),
    });
  });

  const token = generateToken(newUser);
  const { passwordHash: _, ...safeUser } = newUser;

  res.status(201).json({
    message: 'Registered successfully. ምዝገባዎ በተሳካ ሁኔታ ተጠናቋል።',
    token,
    user: safeUser,
    company: newCompany,
  });
});

// Login (protected by brute-force rate limiter)
router.post('/login', loginRateLimiter, (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Please enter both email and password. እባክዎ ኢሜል እና የይለፍ ቃል ያስገቡ።' });
  }

  const normalizedEmail = email.toLowerCase().trim();
  const user = db.get().users.find((u) => u.email.toLowerCase() === normalizedEmail);

  if (!user || !verifyPassword(password, user.passwordHash)) {
    recordFailedLogin(req);
    return res.status(401).json({ error: 'Invalid email or password. ትክክለኛ ያልሆነ ኢሜይል ወይም የይለፍ ቃል።' });
  }

  // Clear failed attempts upon successful login
  resetFailedLogin(req);

  // Automatic hash upgrade: if user had legacy SHA-256 hash, upgrade to bcrypt
  if (!user.passwordHash.startsWith('$2a$') && !user.passwordHash.startsWith('$2b$')) {
    db.update((database) => {
      const target = database.users.find((u) => u.id === user.id);
      if (target) {
        target.passwordHash = hashPassword(password);
        target.updatedAt = new Date().toISOString();
      }
    });
  }

  const token = generateToken(user);
  const company = db.get().companies.find((c) => c.userId === user.id);
  const { passwordHash: _, cvBase64: __, ...safeUser } = user;

  res.json({
    message: 'Logged in successfully. በተሳካ ሁኔታ ገብተዋል።',
    token,
    user: safeUser,
    company,
  });
});

// Demo login for testing seeker or employer accounts
// STRICT SECURITY POLICY: Admin access CANNOT be bypassed via demo-login!
router.post('/demo-login', (req, res) => {
  const { role } = req.body;

  if (role === 'admin') {
    return res.status(403).json({
      error: 'Admin access requires password authentication. የአስተዳዳሪ መግቢያ የሚስጥር ቃል ማረጋገጫ ይጠይቃል። እባክዎ በይለፍ ቃልዎ ይግቡ።',
    });
  }

  let targetUser: User | undefined;

  if (role === 'employer') {
    targetUser = db.get().users.find((u) => u.role === 'employer');
    if (!targetUser) {
      return res.status(404).json({
        error: 'No employer account registered yet. Please register using the Sign Up form. እስካሁን የተመዘገበ አሰሪ የለም። እባክዎ በመመዝገቢያ ቅጹ ድርጅትዎን ይመዝግቡ።',
      });
    }
  } else {
    targetUser = db.get().users.find((u) => u.role === 'seeker');
    if (!targetUser) {
      return res.status(404).json({
        error: 'No job seeker registered yet. Please register using the Sign Up form. እስካሁን የተመዘገበ ስራ ፈላጊ የለም። እባክዎ በመመዝገቢያ ቅጹ ይመዝግቡ።',
      });
    }
  }

  if (!targetUser) {
    return res.status(404).json({ error: 'User not found. ተጠቃሚው አልተገኘም።' });
  }

  const token = generateToken(targetUser);
  const company = db.get().companies.find((c) => c.userId === targetUser.id);
  const { passwordHash: _, ...safeUser } = targetUser;

  res.json({
    message: `Logged in as ${safeUser.fullName} (${safeUser.role}).`,
    token,
    user: safeUser,
    company,
  });
});

// Reset Password (protected by rate limiter and auto-revokes existing tokens across all sessions)
router.post('/reset-password', resetPasswordRateLimiter, (req, res) => {
  const { email, newPassword } = req.body;
  if (!email || !newPassword || newPassword.length < 6) {
    return res.status(400).json({
      error: 'Please provide valid email and new password (min 6 chars). እባክዎ ትክክለኛ ኢሜል እና ቢያንስ 6 ቁምፊዎች ያሉት የይለፍ ቃል ያስገቡ።',
    });
  }

  const normalizedEmail = email.toLowerCase().trim();
  const user = db.get().users.find((u) => u.email.toLowerCase() === normalizedEmail);

  if (!user) {
    return res.status(404).json({
      error: 'No account registered with this email address. በዚህ ኢሜይል የተመዘገበ መለያ አልተገኘም።',
    });
  }

  const now = Date.now();
  db.update((database) => {
    const target = database.users.find((u) => u.id === user.id);
    if (target) {
      target.passwordHash = hashPassword(newPassword);
      target.passwordChangedAt = now;
      target.tokenVersion = (target.tokenVersion || 1) + 1;
      target.updatedAt = new Date().toISOString();
    }
  });

  res.json({
    message: 'Password reset successfully. All active sessions have been invalidated. Please log in with your new password. የይለፍ ቃልዎ በተሳካ ሁኔታ ተቀይሯል። የቆዩ ክፍለ-ጊዜዎች በሙሉ ተሰርዘዋል፤ አሁን በአዲሱ የይለፍ ቃል መግባት ይችላሉ።',
  });
});

// Logout endpoint with server-side token revocation
router.post('/logout', (req: AuthenticatedRequest, res: Response) => {
  if (req.token) {
    revokeToken(req.token);
  }
  res.json({ message: 'Logged out successfully. በተሳካ ሁኔታ ወጥተዋል።' });
});

// Current user profile
router.get('/me', (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  const company = db.get().companies.find((c) => c.userId === req.user!.id);
  const { passwordHash: _, cvBase64: __, ...safeUser } = req.user;
  res.json({ user: safeUser, company });
});

export default router;
