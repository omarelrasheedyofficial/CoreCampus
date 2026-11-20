// app.js — Express application for the Administrator Portal (routes + middleware, no listening).
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
import dashboardRoutes from './modules/dashboard/dashboard.routes.js';
import usersRoutes from './modules/users/users.routes.js';
import rolesRoutes from './modules/roles/roles.routes.js';
import semestersRoutes from './modules/semesters/semesters.routes.js';
import coursesRoutes from './modules/courses/courses.routes.js';
import sectionsRoutes from './modules/sections/sections.routes.js';
import enrollmentsRoutes from './modules/enrollments/enrollments.routes.js';

const app = express();

app.disable('x-powered-by');
if (env.isProduction) app.set('trust proxy', 1); // behind Render's proxy: rate-limit by real client IP
app.use(securityHeaders());
app.use(cors({ origin: env.clientUrl || false }));
app.use(express.json({ limit: '100kb' }));
app.use('/api', apiLimiter);

app.get('/api/health', async (req, res) => {
  await testConnection();
  res.json({ success: true, message: 'CampusCore Administrator Portal API is running.' });
});

app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/roles', rolesRoutes);
app.use('/api/semesters', semestersRoutes);
app.use('/api', sectionsRoutes); // /api/courses/:id/sections…, /api/sections/:kind/:id
app.use('/api', enrollmentsRoutes); // /api/courses/:id/enrollments, /api/enrollments/:id
app.use('/api/courses', coursesRoutes);

app.use('/api', notFound);

// Production: serve the built React app (admin-portal/dist) from the same server (doc §5.6).
const distDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../dist');
if (fs.existsSync(distDir)) {
  app.use(express.static(distDir));
  app.get('/{*path}', (req, res) => res.sendFile(path.join(distDir, 'index.html')));
}

app.use(errorHandler);

export default app;
