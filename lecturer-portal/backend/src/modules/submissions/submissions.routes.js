// modules/submissions/submissions.routes.js — submissions of the teacher's assignments. Mounted at /api.
// (Shared between the lecturer and lab-teacher portals — see config/teaching.js.)
import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware.js';
import { requireRole } from '../../middleware/role.middleware.js';
import { TEACHING } from '../../config/teaching.js';
import * as c from './submissions.controller.js';

const router = Router();
const teacherOnly = [authenticate, requireRole(TEACHING.role)];

router.get('/assignments/:assignmentId/submissions', teacherOnly, c.listAssignmentSubmissions);
router.get('/submissions/:submissionId/download', teacherOnly, c.downloadSubmission);

export default router;
