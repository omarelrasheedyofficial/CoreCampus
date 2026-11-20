// app.js — Express application for the Lecturer Portal (routes + middleware, no listening).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import cors from 'cors';
import { env } from './config/env.js';
import { testConnection } from './config/db.js';
import { apiLimiter, securityHeaders } from './config/security.js';
import { errorHandler, notFound } from './middleware/error.middleware.js';
import authRoutes from './modules/auth/auth.routes.js';
import profileRoutes from './modules/profile/profile.routes.js';
import lectureSectionsRoutes from './modules/lecture-sections/lecture-sections.routes.js';
import materialsRoutes from './modules/materials/materials.routes.js';
import assignmentsRoutes from './modules/assignments/assignments.routes.js';
import submissionsRoutes from './modules/submissions/submissions.routes.js';
import gradingRoutes from './modules/grading/grading.routes.js';
import announcementsRoutes from './modules/announcements/announcements.routes.js';

const app = express();

app.disable('x-powered-by');
if (env.isProduction) app.set('trust proxy', 1); // behind Render's proxy: rate-limit by real client IP
app.use(securityHeaders());
app.use(cors({ origin: env.clientUrl || false }));
app.use(express.json({ limit: '100kb' }));
app.use('/api', apiLimiter);

app.get('/api/health', async (req, res) => {
  await testConnection();
  res.json({ success: true, message: 'CampusCore Lecturer Portal API is running.' });
});

app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
// Teaching modules (shared with the lab-teacher portal; paths come from config/teaching.js)
app.use('/api', materialsRoutes); // /api/lecture-sections/:id/materials, /api/materials/:id
app.use('/api', assignmentsRoutes); // /api/lecture-sections/:id/assignments, /api/assignments/:id
app.use('/api', submissionsRoutes); // /api/assignments/:id/submissions, /api/submissions/:id/download
app.use('/api', gradingRoutes); // /api/submissions/:id/grade, /api/lecture-sections/:id/gradebook
app.use('/api', announcementsRoutes); // /api/lecture-sections/:id/announcements, /api/announcements/:id
app.use('/api/lecture-sections', lectureSectionsRoutes);

app.use('/api', notFound);

// Production: serve the built React app (lecturer-portal/dist) from the same server (doc §5.6).
const distDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../dist');
if (fs.existsSync(distDir)) {
  app.use(express.static(distDir));
  app.get('/{*path}', (req, res) => res.sendFile(path.join(distDir, 'index.html')));
}

app.use(errorHandler);

export default app;
