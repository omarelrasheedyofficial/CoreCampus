// modules/enrollments/enrollments.routes.js — enrollments (administrator portal). Mounted at /api.
import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware.js';
import { requireRole, ROLES } from '../../middleware/role.middleware.js';
import * as c from './enrollments.controller.js';

const router = Router();
const adminOnly = [authenticate, requireRole(ROLES.ADMIN)];

router.get('/courses/:courseId/enrollments', adminOnly, c.listCourseEnrollments);
router.post('/courses/:courseId/enrollments', adminOnly, c.enrollStudent);
router.put('/enrollments/:enrollmentId', adminOnly, c.updateEnrollment);

export default router;
