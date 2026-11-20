// modules/grading/grading.controller.js — HTTP handlers for grading and the gradebook.
// (Shared between the lecturer and lab-teacher portals — see config/teaching.js.)
import * as gradingService from './grading.service.js';

// PUT /api/submissions/:submissionId/grade   { grade, feedback }
export async function gradeSubmission(req, res) {
  const submission = await gradingService.gradeSubmission(req.user, req.params.submissionId, req.body);
  res.status(200).json({ success: true, submission });
}

// GET /api/{lecture|lab}-sections/:sectionId/gradebook
export async function getGradebook(req, res) {
  res.status(200).json({ success: true, gradebook: await gradingService.getGradebook(req.user, req.params.sectionId) });
}
