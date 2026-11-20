// modules/materials/materials.routes.js — lecture materials (lecturer portal). Mounted at /api.
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
const lecturerOnly = [authenticate, requireRole(ROLES.LECTURER)];

// Authentication runs before multer, so unauthenticated uploads are rejected without reading the file.
router.get('/lecture-sections/:sectionId/materials', lecturerOnly, listSectionMaterials);
router.post('/lecture-sections/:sectionId/materials', lecturerOnly, uploadLimiter, uploadSinglePdf, uploadSectionMaterial);

router.patch('/materials/:materialId', lecturerOnly, renameMaterial);
router.delete('/materials/:materialId', lecturerOnly, deleteMaterial);
router.get('/materials/:materialId/download', lecturerOnly, downloadMaterial);

export default router;
