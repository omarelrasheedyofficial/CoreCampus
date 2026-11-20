import * as assignmentsService from './assignments.service.js';

export async function listSectionAssignments(req, res) {
  const assignments = await assignmentsService.listSectionAssignments(req.user, req.params.sectionId);
  res.status(200).json({ success: true, assignments });
}

export async function createAssignment(req, res) {
  const assignment = await assignmentsService.createAssignment(req.user, req.params.sectionId, req.body);
  res.status(201).json({ success: true, assignment });
}

export async function getAssignment(req, res) {
  res.status(200).json({ success: true, assignment: await assignmentsService.getAssignment(req.user, req.params.assignmentId) });
}

export async function updateAssignment(req, res) {
  const assignment = await assignmentsService.updateAssignment(req.user, req.params.assignmentId, req.body);
  res.status(200).json({ success: true, assignment });
}

export async function deleteAssignment(req, res) {
  await assignmentsService.deleteAssignment(req.user, req.params.assignmentId);
  res.status(200).json({ success: true });
}
