// modules/materials/materials.controller.js — HTTP handlers for materials (student)
import * as materialsService from './materials.service.js';

// GET /api/courses/:courseId/materials
export async function listCourseMaterials(req, res) {
  const materials = await materialsService.listCourseMaterials(req.user, req.params.courseId);
  res.status(200).json({ success: true, materials });
}

// GET /api/materials/:materialId/download
export async function downloadMaterial(req, res) {
  const { buffer, filename, mimeType } = await materialsService.downloadMaterial(req.user, req.params.materialId);
  res.attachment(filename);
  res.set({ 'Content-Type': mimeType, 'X-Content-Type-Options': 'nosniff', 'Cache-Control': 'no-store' });
  res.send(buffer);
}
