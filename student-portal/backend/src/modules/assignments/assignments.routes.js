// modules/assignments/assignments.routes.js — /api/assignments (student portal)
import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware.js';
import { requireRole, ROLES } from '../../middleware/role.middleware.js';
import { listMyAssignments } from './assignments.controller.js';

const router = Router();

router.use(authenticate, requireRole(ROLES.STUDENT));
router.get('/', listMyAssignments);

export default router;
