// modules/materials/materials.routes.js — materials (student portal). Mounted at /api.
import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware.js';
import { requireRole, ROLES } from '../../middleware/role.middleware.js';
import { downloadMaterial, listCourseMaterials } from './materials.controller.js';

const router = Router();
const studentOnly = [authenticate, requireRole(ROLES.STUDENT)];

router.get('/courses/:courseId/materials', studentOnly, listCourseMaterials);
router.get('/materials/:materialId/download', studentOnly, downloadMaterial);

export default router;
