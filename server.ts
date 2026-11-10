import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { authMiddleware } from './server/auth.ts';
import authRoutes from './server/routes/auth.ts';
import jobsRoutes from './server/routes/jobs.ts';
import applicationsRoutes from './server/routes/applications.ts';
import usersRoutes from './server/routes/users.ts';
import employersRoutes from './server/routes/employers.ts';
import savedJobsRoutes from './server/routes/savedJobs.ts';
import notificationsRoutes from './server/routes/notifications.ts';
import reportsRoutes from './server/routes/reports.ts';
import paymentsRoutes from './server/routes/payments.ts';
import statsRoutes from './server/routes/stats.ts';
import { db } from './server/db.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
  const isProd = process.env.NODE_ENV === 'production';

  // Initialize remote PostgreSQL cloud database if DATABASE_URL is configured
  await db.initPostgres();

  // Securely resolve client IP behind reverse proxy (Render, Cloud Run, Nginx)
  // This prevents untrusted client-injected X-Forwarded-For headers from spoofing rate limiting
  app.set('trust proxy', 1);

  // Body parsers
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // CORS and Cross-Origin Headers
  app.use((_req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    next();
  });

  // Global auth extractor
  app.use(authMiddleware);

  // API Routes
  app.use('/api/auth', authRoutes);
  app.use('/api/jobs', jobsRoutes);
  app.use('/api/applications', applicationsRoutes);
  app.use('/api/users', usersRoutes);
  app.use('/api/uploads', usersRoutes); // for protected CV downloads under /api/uploads/cvs/:filename
  app.use('/api/employers', employersRoutes);
  app.use('/api/saved-jobs', savedJobsRoutes);
  app.use('/api/notifications', notificationsRoutes);
  app.use('/api/reports', reportsRoutes);
  app.use('/api/payments', paymentsRoutes);
  app.use('/api', statsRoutes);

  // Health check
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', platform: 'WAS Jobs Ethiopia (ዋስ ስራ)', timestamp: new Date().toISOString() });
  });

  // Direct ZIP package download endpoint
  app.get('/download-zip', (_req, res) => {
    const publicZip = path.resolve(__dirname, 'public', 'was-jobs-ethiopia.zip');
    if (fs.existsSync(publicZip)) {
      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', 'attachment; filename="was-jobs-ethiopia.zip"');
      return res.sendFile(publicZip);
    }
    const rootZip = path.resolve(__dirname, 'was-jobs-ethiopia.zip');
    if (fs.existsSync(rootZip)) {
      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', 'attachment; filename="was-jobs-ethiopia.zip"');
      return res.sendFile(rootZip);
    }
    res.status(404).send('ZIP file not found');
  });

  // Dynamic sitemap.xml for Google & search engines
  app.get('/sitemap.xml', (_req, res) => {
    const jobs = db.get().jobs.filter((j) => j.status === 'active');
    const baseUrl = 'https://was-jobs.onrender.com';
    const urls = [
      `  <url>\n    <loc>${baseUrl}/</loc>\n    <changefreq>daily</changefreq>\n    <priority>1.0</priority>\n  </url>`,
      `  <url>\n    <loc>${baseUrl}/#jobs</loc>\n    <changefreq>hourly</changefreq>\n    <priority>0.9</priority>\n  </url>`,
    ];

    jobs.forEach((job) => {
      const lastMod = job.updatedAt ? job.updatedAt.split('T')[0] : new Date().toISOString().split('T')[0];
      urls.push(
        `  <url>\n    <loc>${baseUrl}/?job=${job.id}</loc>\n    <lastmod>${lastMod}</lastmod>\n    <changefreq>daily</changefreq>\n    <priority>0.8</priority>\n  </url>`
      );
    });

    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>`;
    res.header('Content-Type', 'application/xml');
    res.send(sitemap);
  });

  // Dynamic robots.txt
  app.get('/robots.txt', (_req, res) => {
    res.type('text/plain');
    res.send(`User-agent: *\nAllow: /\nAllow: /api/jobs\nDisallow: /api/admin\nDisallow: /api/uploads/cvs/\n\nSitemap: https://was-jobs.onrender.com/sitemap.xml\n`);
  });

  // Frontend integration (Vite dev server or static build)
  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`WAS Jobs Ethiopia server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Fatal server startup error:', err);
  process.exit(1);
});
