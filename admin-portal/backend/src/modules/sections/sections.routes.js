// modules/sections/sections.routes.js — lecture & lab sections (administrator portal). Mounted at /api.
import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware.js';
import { requireRole, ROLES } from '../../middleware/role.middleware.js';
import * as c from './sections.controller.js';

const router = Router();
const adminOnly = [authenticate, requireRole(ROLES.ADMIN)];

router.get('/courses/:courseId/sections', adminOnly, c.listCourseSections);
router.post('/courses/:courseId/sections/:kind', adminOnly, c.createSection);
router.put('/sections/:kind/:sectionId', adminOnly, c.updateSection);
router.delete('/sections/:kind/:sectionId', adminOnly, c.deleteSection);

export default router;
