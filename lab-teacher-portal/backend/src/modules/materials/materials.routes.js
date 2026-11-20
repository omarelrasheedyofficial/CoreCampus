// modules/materials/materials.routes.js — lab materials (lab teacher portal). Mounted at /api.
import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware.js';
import { requireRole, ROLES } from '../../middleware/role.middleware.js';
import { uploadSinglePdf } from '../../middleware/upload.middleware.js';
import { uploadLimiter } from '../../config/security.js';
import {
  deleteMaterial,
  downloadMaterial,
  listSectionMaterials,
  renameMaterial,
  uploadSectionMaterial,
} from './materials.controller.js';

const router = Router();
const labTeacherOnly = [authenticate, requireRole(ROLES.LAB_TEACHER)];

// Authentication runs before multer, so unauthenticated uploads are rejected without reading the file.
router.get('/lab-sections/:sectionId/materials', labTeacherOnly, listSectionMaterials);
router.post('/lab-sections/:sectionId/materials', labTeacherOnly, uploadLimiter, uploadSinglePdf, uploadSectionMaterial);

router.patch('/materials/:materialId', labTeacherOnly, renameMaterial);
router.delete('/materials/:materialId', labTeacherOnly, deleteMaterial);
router.get('/materials/:materialId/download', labTeacherOnly, downloadMaterial);

export default router;
