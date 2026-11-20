// app.js — Express application for the Student Portal (routes + middleware, no listening).
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
import enrollmentsRoutes from './modules/enrollments/enrollments.routes.js';
import coursesRoutes from './modules/courses/courses.routes.js';
import materialsRoutes from './modules/materials/materials.routes.js';
import assignmentsRoutes from './modules/assignments/assignments.routes.js';
import submissionsRoutes from './modules/submissions/submissions.routes.js';
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
  res.json({ success: true, message: 'CampusCore Student Portal API is running.' });
});

app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/enrollments', enrollmentsRoutes);
app.use('/api', materialsRoutes); // /api/courses/:id/materials, /api/materials/:id/download
app.use('/api', submissionsRoutes); // /api/assignments/:id/submission[/download]
app.use('/api/courses', coursesRoutes);
app.use('/api/assignments', assignmentsRoutes);
app.use('/api/announcements', announcementsRoutes);

app.use('/api', notFound);

// Production: serve the built React app (student-portal/dist) from the same server (doc §5.6).
const distDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../dist');
if (fs.existsSync(distDir)) {
  app.use(express.static(distDir));
  app.get('/{*path}', (req, res) => res.sendFile(path.join(distDir, 'index.html')));
}

app.use(errorHandler);

export default app;
