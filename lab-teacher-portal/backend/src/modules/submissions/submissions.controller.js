import * as submissionsService from './submissions.service.js';

export async function listAssignmentSubmissions(req, res) {
  const submissions = await submissionsService.listAssignmentSubmissions(req.user, req.params.assignmentId);
  res.status(200).json({ success: true, submissions });
}

export async function downloadSubmission(req, res) {
  const { buffer, filename, mimeType } = await submissionsService.downloadSubmission(req.user, req.params.submissionId);
  res.attachment(filename);
  res.set({ 'Content-Type': mimeType, 'X-Content-Type-Options': 'nosniff', 'Cache-Control': 'no-store' });
  res.send(buffer);
}
