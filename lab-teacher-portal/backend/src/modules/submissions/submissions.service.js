import { env } from '../../config/env.js';
import { downloadObject } from '../../config/storage.js';
import { AppError } from '../../middleware/error.middleware.js';
import { requiredId } from '../../utils/validation.js';
import { getOwnedAssignment } from '../assignments/assignments.service.js';
import * as submissionsRepository from './submissions.repository.js';

function statusOf(row, dueAt) {
  if (!row.submission_id) return new Date(dueAt).getTime() < Date.now() ? 'missing' : 'not_submitted';
  return row.grade !== null ? 'graded' : 'submitted';
}

export async function listAssignmentSubmissions(user, rawAssignmentId) {
  const assignment = await getOwnedAssignment(user, rawAssignmentId);
  const rows = await submissionsRepository.listForAssignment(assignment.assignment_id);
  return rows.map((row) => ({
    enrollmentId: row.enrollment_id,
    student: { fullName: row.full_name, email: row.email, universityId: row.university_id },
    status: statusOf(row, assignment.due_at),
    submission: row.submission_id
      ? {
          submissionId: row.submission_id,
          originalFilename: row.original_filename,
          submittedAt: row.submitted_at,
          isLate: new Date(row.submitted_at) > new Date(assignment.due_at),
          grade: row.grade === null ? null : Number(row.grade),
          feedback: row.feedback,
          gradedAt: row.graded_at,
          gradedBy: row.graded_by_name,
        }
      : null,
  }));
}

export async function getOwnedSubmission(user, rawSubmissionId) {
  const submission = await submissionsRepository.findById(requiredId(rawSubmissionId, 'submission id'));
  if (!submission) throw new AppError('Submission not found.', 404);
  await getOwnedAssignment(user, submission.assignment_id);
  return submission;
}

export async function downloadSubmission(user, rawSubmissionId) {
  const submission = await getOwnedSubmission(user, rawSubmissionId);
  const buffer = await downloadObject(env.submissionsBucket, submission.storage_key);
  return { buffer, filename: submission.original_filename, mimeType: 'application/pdf' };
}
