import * as gradingService from './grading.service.js';

export async function gradeSubmission(req, res) {
  const submission = await gradingService.gradeSubmission(req.user, req.params.submissionId, req.body);
  res.status(200).json({ success: true, submission });
}

export async function getGradebook(req, res) {
  res.status(200).json({ success: true, gradebook: await gradingService.getGradebook(req.user, req.params.sectionId) });
}
