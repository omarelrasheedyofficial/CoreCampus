// modules/submissions/submissions.controller.js — HTTP handlers for the student's submissions
import { requirePdf } from '../../middleware/upload.middleware.js';
import * as submissionsService from './submissions.service.js';

// PUT /api/assignments/:assignmentId/submission   (multipart: file)
export async function submitAssignment(req, res) {
  const pdf = requirePdf(req.file);
  const assignment = await submissionsService.submitAssignment(req.user, req.params.assignmentId, pdf);
  res.status(200).json({ success: true, assignment });
}

// GET /api/assignments/:assignmentId/submission/download
export async function downloadMySubmission(req, res) {
  const { buffer, filename, mimeType } = await submissionsService.downloadMySubmission(req.user, req.params.assignmentId);
  res.attachment(filename);
  res.set({ 'Content-Type': mimeType, 'X-Content-Type-Options': 'nosniff', 'Cache-Control': 'no-store' });
  res.send(buffer);
}
