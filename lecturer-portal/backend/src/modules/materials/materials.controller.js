// modules/materials/materials.controller.js — HTTP handlers for lecture materials.
import { requirePdf } from '../../middleware/upload.middleware.js';
import * as materialsService from './materials.service.js';

// GET /api/lecture-sections/:sectionId/materials
export async function listSectionMaterials(req, res) {
  const materials = await materialsService.listSectionMaterials(req.user, req.params.sectionId);
  res.status(200).json({ success: true, materials });
}

// POST /api/lecture-sections/:sectionId/materials   (multipart: title, file)
export async function uploadSectionMaterial(req, res) {
  const pdf = requirePdf(req.file);
  const material = await materialsService.uploadSectionMaterial(req.user, req.params.sectionId, req.body?.title, pdf);
  res.status(201).json({ success: true, material });
}

// PATCH /api/materials/:materialId   { title }
export async function renameMaterial(req, res) {
  const material = await materialsService.renameMaterial(req.user, req.params.materialId, req.body?.title);
  res.status(200).json({ success: true, material });
}

// DELETE /api/materials/:materialId
export async function deleteMaterial(req, res) {
  await materialsService.deleteMaterial(req.user, req.params.materialId);
  res.status(200).json({ success: true });
}

// GET /api/materials/:materialId/download
export async function downloadMaterial(req, res) {
  const { buffer, filename, mimeType } = await materialsService.downloadMaterial(req.user, req.params.materialId);
  res.attachment(filename); // Content-Disposition: attachment; filename="…" (safely encoded)
  res.set({ 'Content-Type': mimeType, 'X-Content-Type-Options': 'nosniff', 'Cache-Control': 'no-store' });
  res.send(buffer);
}
