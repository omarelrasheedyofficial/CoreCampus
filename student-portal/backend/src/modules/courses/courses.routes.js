// modules/courses/courses.routes.js — /api/courses (student portal)
import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware.js';
import { requireRole, ROLES } from '../../middleware/role.middleware.js';
import { getCourse } from './courses.controller.js';

const router = Router();

router.use(authenticate, requireRole(ROLES.STUDENT));
router.get('/:courseId', getCourse);

export default router;
