import { query } from '../../config/db.js';
import { TEACHING } from '../../config/teaching.js';

const T = TEACHING;

export async function saveGrade(submissionId, { grade, feedback, gradedBy }) {
  await query(
    `UPDATE submissions
        SET grade = $2, feedback = $3, graded_by_staff_id = $4, graded_at = now()
      WHERE submission_id = $1`,
    [submissionId, grade, feedback, gradedBy],
  );
}

export async function sectionStudents(sectionId) {
  const { rows } = await query(
    `SELECT e.enrollment_id, e.student_id, e.lecture_section_id, e.lab_section_id,
            u.full_name, st.university_id, lab.section_name AS lab_section_name
       FROM enrollments e
       JOIN students st ON st.student_id = e.student_id
       JOIN users u     ON u.user_id = st.user_id
       LEFT JOIN lab_sections lab ON lab.lab_section_id = e.lab_section_id
      WHERE e.${T.sectionColumn} = $1 AND e.status <> 'dropped'
      ORDER BY u.full_name`,
    [sectionId],
  );
  return rows;
}

export async function sectionAssignments(sectionId) {
  const { rows } = await query(
    `SELECT assignment_id, title, due_at, lab_section_id
       FROM assignments
      WHERE ${T.sectionColumn} = $1 AND assignment_type = $2
      ORDER BY due_at, assignment_id`,
    [sectionId, T.kind],
  );
  return rows;
}

export async function courseLabAssignments(courseId) {
  const { rows } = await query(
    `SELECT a.assignment_id, a.title, a.due_at, a.lab_section_id, lab.section_name AS lab_section_name
       FROM assignments a
       JOIN lab_sections lab ON lab.lab_section_id = a.lab_section_id
      WHERE a.course_id = $1 AND a.assignment_type = 'lab'
      ORDER BY a.due_at, a.assignment_id`,
    [courseId],
  );
  return rows;
}

export async function submissionsFor(assignmentIds, studentIds) {
  if (assignmentIds.length === 0 || studentIds.length === 0) return [];
  const { rows } = await query(
    `SELECT assignment_id, student_id, grade, submitted_at
       FROM submissions
      WHERE assignment_id = ANY($1::int[]) AND student_id = ANY($2::int[])`,
    [assignmentIds, studentIds],
  );
  return rows;
}
