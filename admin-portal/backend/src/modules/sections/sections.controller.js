// modules/sections/sections.controller.js — HTTP handlers for course sections. `kind` is lecture|lab.
import * as sectionsService from './sections.service.js';

// GET /api/courses/:courseId/sections
export async function listCourseSections(req, res) {
  const sections = await sectionsService.listCourseSections(req.params.courseId);
  res.status(200).json({ success: true, ...sections });
}

// POST /api/courses/:courseId/sections/:kind   { sectionName, staffId|null }
export async function createSection(req, res) {
  const section = await sectionsService.createSection(req.params.courseId, req.params.kind, req.body);
  res.status(201).json({ success: true, section });
}

// PUT /api/sections/:kind/:sectionId   { sectionName, staffId|null }
export async function updateSection(req, res) {
  const section = await sectionsService.updateSection(req.params.kind, req.params.sectionId, req.body);
  res.status(200).json({ success: true, section });
}

// DELETE /api/sections/:kind/:sectionId
export async function deleteSection(req, res) {
  await sectionsService.deleteSection(req.params.kind, req.params.sectionId);
  res.status(200).json({ success: true });
}
