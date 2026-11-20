// modules/assignments/assignments.controller.js — HTTP handlers for /api/assignments (student)
import * as assignmentsService from './assignments.service.js';

// GET /api/assignments?courseId=
export async function listMyAssignments(req, res) {
  const assignments = await assignmentsService.listMyAssignments(req.user, req.query.courseId);
  res.status(200).json({ success: true, assignments });
}
