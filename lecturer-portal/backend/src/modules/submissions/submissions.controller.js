// modules/submissions/submissions.controller.js — HTTP handlers for submissions (teacher view).
// (Shared between the lecturer and lab-teacher portals — see config/teaching.js.)
import * as submissionsService from './submissions.service.js';

// GET /api/assignments/:assignmentId/submissions
export async function listAssignmentSubmissions(req, res) {
  const submissions = await submissionsService.listAssignmentSubmissions(req.user, req.params.assignmentId);
  res.status(200).json({ success: true, submissions });
}

// GET /api/submissions/:submissionId/download
export async function downloadSubmission(req, res) {
  const { buffer, filename, mimeType } = await submissionsService.downloadSubmission(req.user, req.params.submissionId);
  res.attachment(filename);
  res.set({ 'Content-Type': mimeType, 'X-Content-Type-Options': 'nosniff', 'Cache-Control': 'no-store' });
  res.send(buffer);
}
