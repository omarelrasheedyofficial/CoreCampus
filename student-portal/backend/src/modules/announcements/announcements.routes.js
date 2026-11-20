// modules/announcements/announcements.routes.js — /api/announcements (student portal)
import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware.js';
import { requireRole, ROLES } from '../../middleware/role.middleware.js';
import { listMyAnnouncements } from './announcements.controller.js';

const router = Router();

router.use(authenticate, requireRole(ROLES.STUDENT));
router.get('/', listMyAnnouncements);

export default router;
