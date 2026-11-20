// modules/assignments/assignments.service.js — a student's lecture and lab assignments, deadlines,
// and their own grades and feedback (doc §2.2.1).
import { AppError } from '../../middleware/error.middleware.js';
import { optionalId, requiredId } from '../../utils/validation.js';
import * as assignmentsRepository from './assignments.repository.js';

export function requireStudent(user) {
  if (!user.studentId) throw new AppError('No student profile is linked to this account.', 403);
}

/** not_submitted → (deadline passes) missing; submitted → graded. */
function statusOf(row) {
  if (row.submission_id) return row.grade !== null ? 'graded' : 'submitted';
  return new Date(row.due_at).getTime() < Date.now() ? 'missing' : 'not_submitted';
}

export function toDto(row) {
  const deadlinePassed = new Date(row.due_at).getTime() <= Date.now();
  return {
    assignmentId: row.assignment_id,
    course: { courseId: row.course_id, code: row.course_code, title: row.course_title },
    type: row.assignment_type,
    title: row.title,
    instructions: row.instructions ?? '',
    dueAt: row.due_at,
    createdBy: row.created_by_name,
    status: statusOf(row),
    // Submitting is possible before the deadline, while enrolled, and until the work is graded.
    canSubmit: !deadlinePassed && row.enrollment_status === 'active' && row.grade === null,
    submission: row.submission_id
      ? {
          originalFilename: row.original_filename,
          submittedAt: row.submitted_at,
          grade: row.grade === null ? null : Number(row.grade),
          feedback: row.feedback,
          gradedAt: row.graded_at,
        }
      : null,
  };
}

export async function listMyAssignments(user, rawCourseId) {
  requireStudent(user);
  const rows = await assignmentsRepository.listForStudent(user.studentId, optionalId(rawCourseId, 'course id'));
  return rows.map(toDto);
}

/** Loads an assignment visible to the student, or throws 404. */
export async function getVisibleAssignment(user, rawAssignmentId) {
  requireStudent(user);
  const row = await assignmentsRepository.findVisible(user.studentId, requiredId(rawAssignmentId, 'assignment id'));
  if (!row) throw new AppError('Assignment not found.', 404);
  return row;
}
