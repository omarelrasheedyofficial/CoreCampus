// modules/enrollments/enrollments.routes.js — /api/enrollments (student portal)
import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware.js';
import { requireRole, ROLES } from '../../middleware/role.middleware.js';
import { getMyEnrollments } from './enrollments.controller.js';

const router = Router();

router.use(authenticate, requireRole(ROLES.STUDENT));

router.get('/me', getMyEnrollments);

export default router;
