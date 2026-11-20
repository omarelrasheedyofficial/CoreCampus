// modules/assignments/assignments.controller.js — HTTP handlers for assignments.
// (Shared between the lecturer and lab-teacher portals — see config/teaching.js.)
import * as assignmentsService from './assignments.service.js';

// GET /api/{lecture|lab}-sections/:sectionId/assignments
export async function listSectionAssignments(req, res) {
  const assignments = await assignmentsService.listSectionAssignments(req.user, req.params.sectionId);
  res.status(200).json({ success: true, assignments });
}

// POST /api/{lecture|lab}-sections/:sectionId/assignments   { title, instructions, dueAt }
export async function createAssignment(req, res) {
  const assignment = await assignmentsService.createAssignment(req.user, req.params.sectionId, req.body);
  res.status(201).json({ success: true, assignment });
}

// GET /api/assignments/:assignmentId
export async function getAssignment(req, res) {
  res.status(200).json({ success: true, assignment: await assignmentsService.getAssignment(req.user, req.params.assignmentId) });
}

// PUT /api/assignments/:assignmentId   { title, instructions, dueAt }
export async function updateAssignment(req, res) {
  const assignment = await assignmentsService.updateAssignment(req.user, req.params.assignmentId, req.body);
  res.status(200).json({ success: true, assignment });
}

// DELETE /api/assignments/:assignmentId
export async function deleteAssignment(req, res) {
  await assignmentsService.deleteAssignment(req.user, req.params.assignmentId);
  res.status(200).json({ success: true });
}
