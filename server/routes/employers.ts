import { Router } from 'express';
import type { Response } from 'express';
import { db } from '../db.ts';
import { requireRole, requireAuth } from '../auth.ts';
import type { AuthenticatedRequest } from '../auth.ts';
import type { Company } from '../../src/types/index.ts';

const router = Router();

// Get own company profile
router.get('/profile', requireRole('employer', 'admin'), (req: AuthenticatedRequest, res: Response) => {
  const company = db.get().companies.find((c) => c.userId === req.user!.id);
  if (!company) {
    return res.status(404).json({ error: 'Company profile not found.' });
  }
  res.json({ company });
});

// Update or create own company profile
router.put('/profile', requireRole('employer', 'admin'), (req: AuthenticatedRequest, res: Response) => {
  const {
    companyName,
    logo,
    industry,
    website,
    phone,
    email,
    location,
    description,
    tinNumber,
  } = req.body;

  let company = db.get().companies.find((c) => c.userId === req.user!.id);

  db.update((database) => {
    if (company) {
      const target = database.companies.find((c) => c.id === company!.id);
      if (target) {
        if (companyName) target.companyName = companyName.trim();
        if (logo !== undefined) target.logo = logo;
        if (industry) target.industry = industry.trim();
        if (website !== undefined) target.website = website.trim();
        if (phone) target.phone = phone.trim();
        if (email) target.email = email.trim();
        if (location) target.location = location.trim();
        if (description) target.description = description.trim();
        if (tinNumber !== undefined) target.tinNumber = tinNumber.trim();
      }
    } else {
      const newCompany: Company = {
        id: `cmp_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        userId: req.user!.id,
        companyName: companyName?.trim() || 'My Company',
        logo: logo || undefined,
        industry: industry || 'Technology',
        website: website || '',
        phone: phone || req.user!.phone || '',
        email: email || req.user!.email,
        location: location || 'Addis Ababa',
        description: description || '',
        verified: false,
        tinNumber: tinNumber || '',
        createdAt: new Date().toISOString(),
      };
      database.companies.push(newCompany);
    }
  });

  const savedCompany = db.get().companies.find((c) => c.userId === req.user!.id);
  res.json({ message: 'Company profile saved successfully! የድርጅቱ መረጃ ተቀምጧል!', company: savedCompany });
});

// Get company public details with active jobs
router.get('/:id', (req, res) => {
  const company = db.get().companies.find((c) => c.id === req.params.id);
  if (!company) {
    return res.status(404).json({ error: 'Company not found.' });
  }

  const jobs = db.get().jobs.filter((j) => j.employerId === company.id && j.status === 'active');
  res.json({ company, jobs });
});

// Admin: Toggle company verified badge
router.patch('/:id/verify', requireRole('admin'), (req: AuthenticatedRequest, res: Response) => {
  const companyId = req.params.id;
  const { verified } = req.body;

  db.update((database) => {
    const comp = database.companies.find((c) => c.id === companyId);
    if (comp) {
      comp.verified = typeof verified === 'boolean' ? verified : !comp.verified;
    }
  });

  res.json({ message: 'Company verification status updated.', company: db.get().companies.find((c) => c.id === companyId) });
});

export default router;
