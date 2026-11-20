// modules/roles/roles.routes.js — /api/roles (administrator portal)
import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware.js';
import { requireRole, ROLES } from '../../middleware/role.middleware.js';
import { listRoles } from './roles.controller.js';

const router = Router();

router.use(authenticate, requireRole(ROLES.ADMIN));
router.get('/', listRoles);

export default router;
