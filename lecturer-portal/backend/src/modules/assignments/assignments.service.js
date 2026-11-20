// modules/assignments/assignments.service.js — create, edit and delete assignments and their
// deadlines for the signed-in teacher's own sections. Lecturers manage lecture assignments only,
// lab teachers lab assignments only (doc §2.2.2–2.2.3).
// (Shared between the lecturer and lab-teacher portals — see config/teaching.js.)
import { AppError } from '../../middleware/error.middleware.js';
import { getOwnedSection, TEACHING } from '../../config/teaching.js';
import { optionalString, requiredDateTime, requiredId, requiredString } from '../../utils/validation.js';
import * as assignmentsRepository from './assignments.repository.js';

export function toDto(row) {
  return {
    assignmentId: row.assignment_id,
    courseId: row.course_id,
    sectionId: row[TEACHING.sectionColumn],
    type: row.assignment_type,
    title: row.title,
    instructions: row.instructions ?? '',
    dueAt: row.due_at,
    createdAt: row.created_at,
    createdBy: row.created_by_name,
    submissionCount: row.submission_count,
    gradedCount: row.graded_count,
  };
}

function parseFields(body = {}, { requireFutureDue }) {
  const dueAt = requiredDateTime(body.dueAt, 'Due date');
  if (requireFutureDue && dueAt.getTime() <= Date.now()) {
    throw new AppError('The due date must be in the future.', 400);
  }
  return {
    title: requiredString(body.title, 'Title', { max: 200 }),
    instructions: optionalString(body.instructions, 'Instructions', { max: 5000 }),
    dueAt: dueAt.toISOString(),
  };
}

/**
 * Loads an assignment and verifies it is this portal's kind (lecture/lab) and belongs to a
 * section currently assigned to the signed-in teacher. Used by submissions and grading too.
 */
export async function getOwnedAssignment(user, rawAssignmentId) {
  const assignment = await assignmentsRepository.findWithOwner(requiredId(rawAssignmentId, 'assignment id'));
  if (!assignment || assignment.is_archived) throw new AppError('Assignment not found.', 404);
  if (assignment.assignment_type !== TEACHING.kind || !user.staffId || assignment.owner_staff_id !== user.staffId) {
    throw new AppError(`You can only manage ${TEACHING.label} assignments of your own sections.`, 403);
  }
  return assignment;
}

export async function listSectionAssignments(user, rawSectionId) {
  const section = await getOwnedSection(user, rawSectionId);
  return (await assignmentsRepository.findBySection(section[TEACHING.sectionColumn])).map(toDto);
}

export async function getAssignment(user, rawAssignmentId) {
  const assignment = await getOwnedAssignment(user, rawAssignmentId);
  return toDto(await assignmentsRepository.findOne(assignment.assignment_id));
}

export async function createAssignment(user, rawSectionId, body) {
  const section = await getOwnedSection(user, rawSectionId);
  const fields = parseFields(body, { requireFutureDue: true });
  const id = await assignmentsRepository.insert({
    courseId: section.course_id,
    sectionId: section[TEACHING.sectionColumn],
    createdBy: user.staffId,
    ...fields,
  });
  return toDto(await assignmentsRepository.findOne(id));
}

/** A changed deadline must be in the future; an unchanged one may already have passed. */
export async function updateAssignment(user, rawAssignmentId, body = {}) {
  const assignment = await getOwnedAssignment(user, rawAssignmentId);
  const dueChanged = new Date(body.dueAt).getTime() !== new Date(assignment.due_at).getTime();
  const fields = parseFields(body, { requireFutureDue: dueChanged });
  await assignmentsRepository.update(assignment.assignment_id, fields);
  return toDto(await assignmentsRepository.findOne(assignment.assignment_id));
}

/** Assignments that already have submissions are kept, so student work is never lost. */
export async function deleteAssignment(user, rawAssignmentId) {
  const assignment = await getOwnedAssignment(user, rawAssignmentId);
  const { submission_count: submissions } = await assignmentsRepository.findOne(assignment.assignment_id);
  if (submissions > 0) {
    throw new AppError(`This assignment has ${submissions} submission(s), so it cannot be deleted.`, 409);
  }
  await assignmentsRepository.remove(assignment.assignment_id);
}
