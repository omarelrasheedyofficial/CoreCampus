// modules/semesters/semesters.routes.js — /api/semesters (administrator portal)
import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware.js';
import { requireRole, ROLES } from '../../middleware/role.middleware.js';
import * as c from './semesters.controller.js';

const router = Router();

router.use(authenticate, requireRole(ROLES.ADMIN));

router.get('/', c.listSemesters);
router.post('/', c.createSemester);
router.put('/:semesterId', c.updateSemester);
router.delete('/:semesterId', c.deleteSemester);

export default router;
