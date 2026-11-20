// modules/grading/grading.routes.js — grading and gradebook. Mounted at /api.
// (Shared between the lecturer and lab-teacher portals — see config/teaching.js.)
import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware.js';
import { requireRole } from '../../middleware/role.middleware.js';
import { TEACHING } from '../../config/teaching.js';
import * as c from './grading.controller.js';

const router = Router();
const teacherOnly = [authenticate, requireRole(TEACHING.role)];

router.put('/submissions/:submissionId/grade', teacherOnly, c.gradeSubmission);
router.get(`/${TEACHING.sectionPath}/:sectionId/gradebook`, teacherOnly, c.getGradebook);

export default router;
