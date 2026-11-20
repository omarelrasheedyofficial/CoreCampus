// modules/lecture-sections/lecture-sections.routes.js — /api/lecture-sections (lecturer portal)
import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware.js';
import { requireRole, ROLES } from '../../middleware/role.middleware.js';
import { getMySections, getSection, getSectionStudents } from './lecture-sections.controller.js';

const router = Router();

router.use(authenticate, requireRole(ROLES.LECTURER));

router.get('/mine', getMySections);
router.get('/:sectionId', getSection);
router.get('/:sectionId/students', getSectionStudents);

export default router;
