// modules/dashboard/dashboard.routes.js — /api/dashboard (administrator portal)
import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware.js';
import { requireRole, ROLES } from '../../middleware/role.middleware.js';
import { getSummary } from './dashboard.controller.js';

const router = Router();

router.use(authenticate, requireRole(ROLES.ADMIN));
router.get('/summary', getSummary);

export default router;
