import { AUDIT_EVENTS, logAuditEvent } from '../../config/audit.js';
import { getOwnedSection, TEACHING } from '../../config/teaching.js';
import { optionalString, requiredGrade } from '../../utils/validation.js';
import { getOwnedSubmission, listAssignmentSubmissions } from '../submissions/submissions.service.js';
import * as gradingRepository from './grading.repository.js';

export async function gradeSubmission(user, rawSubmissionId, body = {}) {
  const submission = await getOwnedSubmission(user, rawSubmissionId);
  const grade = requiredGrade(body.grade);
  const feedback = optionalString(body.feedback, 'Feedback', { max: 5000 });

  await gradingRepository.saveGrade(submission.submission_id, { grade, feedback, gradedBy: user.staffId });
  await logAuditEvent({
    userId: user.userId,
    eventType: AUDIT_EVENTS.GRADE_CHANGED,
    entityType: 'submission',
    entityId: submission.submission_id,
    details: { previousGrade: submission.grade === null ? null : Number(submission.grade), newGrade: grade },
  });

  const rows = await listAssignmentSubmissions(user, submission.assignment_id);
  return rows.find((r) => r.submission?.submissionId === submission.submission_id);
}

function cell(sub, dueAt) {
  if (!sub) return { status: new Date(dueAt).getTime() < Date.now() ? 'missing' : 'pending', grade: null };
  return sub.grade === null ? { status: 'submitted', grade: null } : { status: 'graded', grade: Number(sub.grade) };
}

function average(cells) {
  const grades = cells.filter((c) => c && c.grade !== null).map((c) => c.grade);
  return grades.length ? Math.round((grades.reduce((a, b) => a + b, 0) / grades.length) * 100) / 100 : null;
}

export async function getGradebook(user, rawSectionId) {
  const section = await getOwnedSection(user, rawSectionId);
  const sectionId = section[TEACHING.sectionColumn];

  const [students, assignments, labAssignments] = await Promise.all([
    gradingRepository.sectionStudents(sectionId),
    gradingRepository.sectionAssignments(sectionId),
    TEACHING.includeLabResults ? gradingRepository.courseLabAssignments(section.course_id) : [],
  ]);
  const allIds = [...assignments, ...labAssignments].map((a) => a.assignment_id);
  const subs = await gradingRepository.submissionsFor(allIds, students.map((s) => s.student_id));
  const lookup = new Map(subs.map((s) => [`${s.assignment_id}:${s.student_id}`, s]));

  return {
    assignments: assignments.map((a) => ({ assignmentId: a.assignment_id, title: a.title, dueAt: a.due_at })),
    labAssignments: labAssignments.map((a) => ({
      assignmentId: a.assignment_id,
      title: a.title,
      dueAt: a.due_at,
      labSectionName: a.lab_section_name,
    })),
    students: students.map((s) => {
      const results = assignments.map((a) => cell(lookup.get(`${a.assignment_id}:${s.student_id}`), a.due_at));
      const labResults = labAssignments.map((a) =>
        a.lab_section_id === s.lab_section_id ? cell(lookup.get(`${a.assignment_id}:${s.student_id}`), a.due_at) : null,
      );
      return {
        enrollmentId: s.enrollment_id,
        fullName: s.full_name,
        universityId: s.university_id,
        labSectionName: s.lab_section_name,
        results,
        average: average(results),
        submittedCount: results.filter((r) => r.status === 'submitted' || r.status === 'graded').length,
        labResults,
        labAverage: average(labResults),
      };
    }),
  };
}
