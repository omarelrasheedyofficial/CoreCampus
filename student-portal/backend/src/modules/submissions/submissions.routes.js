// modules/submissions/submissions.routes.js — the student's own submissions. Mounted at /api.
import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware.js';
import { requireRole, ROLES } from '../../middleware/role.middleware.js';
import { uploadSinglePdf } from '../../middleware/upload.middleware.js';
import { uploadLimiter } from '../../config/security.js';
import { downloadMySubmission, submitAssignment } from './submissions.controller.js';

const router = Router();
const studentOnly = [authenticate, requireRole(ROLES.STUDENT)];

// Authentication runs before multer, so unauthenticated uploads are rejected without reading the file.
router.put('/assignments/:assignmentId/submission', studentOnly, uploadLimiter, uploadSinglePdf, submitAssignment);
router.get('/assignments/:assignmentId/submission/download', studentOnly, downloadMySubmission);

export default router;
