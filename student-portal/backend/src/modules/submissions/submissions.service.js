// modules/submissions/submissions.service.js — students upload (and re-upload) their own PDF
// before the deadline, and download what they submitted (doc §2.2.1).
// Files go to the private submissions bucket; nobody else's submission is ever reachable here.
import crypto from 'node:crypto';
import { env } from '../../config/env.js';
import { downloadObject, removeObject, uploadObject } from '../../config/storage.js';
import { AppError } from '../../middleware/error.middleware.js';
import { getVisibleAssignment, toDto } from '../assignments/assignments.service.js';
import * as assignmentsRepository from '../assignments/assignments.repository.js';
import * as submissionsRepository from './submissions.repository.js';

export async function submitAssignment(user, rawAssignmentId, pdf) {
  const assignment = await getVisibleAssignment(user, rawAssignmentId);
  if (assignment.enrollment_status !== 'active') {
    throw new AppError('You can no longer submit work for this course.', 403);
  }
  if (new Date(assignment.due_at).getTime() <= Date.now()) {
    throw new AppError('The deadline for this assignment has passed.', 400);
  }
  if (assignment.grade !== null) {
    throw new AppError('This submission has already been graded and cannot be changed.', 409);
  }

  const storageKey = `assignment-${assignment.assignment_id}/student-${user.studentId}/${crypto.randomUUID()}.pdf`;
  await uploadObject(env.submissionsBucket, storageKey, pdf.buffer, pdf.mimeType);

  try {
    if (assignment.submission_id) {
      const replaced = await submissionsRepository.replaceFile(assignment.submission_id, {
        storageKey,
        originalFilename: pdf.originalFilename,
      });
      if (!replaced) throw new AppError('This submission has already been graded and cannot be changed.', 409);
      // The new file is recorded; the previous one is no longer referenced.
      await removeObject(env.submissionsBucket, assignment.storage_key).catch((err) =>
        console.error('Could not remove replaced submission file:', err.message),
      );
    } else {
      await submissionsRepository.insert({
        assignmentId: assignment.assignment_id,
        studentId: user.studentId,
        storageKey,
        originalFilename: pdf.originalFilename,
      });
    }
  } catch (err) {
    await removeObject(env.submissionsBucket, storageKey).catch(() => {});
    throw err;
  }

  return toDto(await assignmentsRepository.findVisible(user.studentId, assignment.assignment_id));
}

export async function downloadMySubmission(user, rawAssignmentId) {
  const assignment = await getVisibleAssignment(user, rawAssignmentId);
  if (!assignment.submission_id) throw new AppError('You have not submitted this assignment.', 404);
  const buffer = await downloadObject(env.submissionsBucket, assignment.storage_key);
  return { buffer, filename: assignment.original_filename, mimeType: 'application/pdf' };
}
