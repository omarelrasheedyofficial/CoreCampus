// modules/lab-sections/lab-sections.routes.js — /api/lab-sections (lab teacher portal)
import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware.js';
import { requireRole, ROLES } from '../../middleware/role.middleware.js';
import { getMySections, getSection, getSectionStudents } from './lab-sections.controller.js';

const router = Router();

router.use(authenticate, requireRole(ROLES.LAB_TEACHER));

router.get('/mine', getMySections);
router.get('/:sectionId', getSection);
router.get('/:sectionId/students', getSectionStudents);

export default router;
