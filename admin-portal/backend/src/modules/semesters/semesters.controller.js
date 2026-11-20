// modules/semesters/semesters.controller.js — HTTP handlers for /api/semesters
import * as semestersService from './semesters.service.js';

// GET /api/semesters
export async function listSemesters(req, res) {
  res.status(200).json({ success: true, semesters: await semestersService.listSemesters() });
}

// POST /api/semesters   { name, startDate, endDate }
export async function createSemester(req, res) {
  res.status(201).json({ success: true, semester: await semestersService.createSemester(req.body) });
}

// PUT /api/semesters/:semesterId   { name, startDate, endDate }
export async function updateSemester(req, res) {
  res.status(200).json({ success: true, semester: await semestersService.updateSemester(req.params.semesterId, req.body) });
}

// DELETE /api/semesters/:semesterId
export async function deleteSemester(req, res) {
  await semestersService.deleteSemester(req.params.semesterId);
  res.status(200).json({ success: true });
}
