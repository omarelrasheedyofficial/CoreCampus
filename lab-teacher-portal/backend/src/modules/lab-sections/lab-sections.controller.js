// modules/lab-sections/lab-sections.controller.js — HTTP handlers for /api/lab-sections
import * as sectionsService from './lab-sections.service.js';

// GET /api/lab-sections/mine
export async function getMySections(req, res) {
  const sections = await sectionsService.getMySections(req.user);
  res.status(200).json({ success: true, sections });
}

// GET /api/lab-sections/:sectionId
export async function getSection(req, res) {
  const section = await sectionsService.getSection(req.user, req.params.sectionId);
  res.status(200).json({ success: true, section });
}

// GET /api/lab-sections/:sectionId/students
export async function getSectionStudents(req, res) {
  const students = await sectionsService.getSectionStudents(req.user, req.params.sectionId);
  res.status(200).json({ success: true, students });
}
