import express from 'express';
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

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
  const isProd = process.env.NODE_ENV === 'production';

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
