import { query } from '../../config/db.js';
import { TEACHING } from '../../config/teaching.js';

const T = TEACHING;

export async function listForAssignment(assignmentId) {
  const { rows } = await query(
    `SELECT e.enrollment_id, u.full_name, u.email, st.university_id,
            sub.submission_id, sub.original_filename, sub.submitted_at, sub.grade, sub.feedback, sub.graded_at,
            gu.full_name AS graded_by_name
       FROM assignments a
       JOIN enrollments e ON e.${T.sectionColumn} = a.${T.sectionColumn} AND e.status <> 'dropped'
       JOIN students st   ON st.student_id = e.student_id
       JOIN users u       ON u.user_id = st.user_id
       LEFT JOIN submissions sub ON sub.assignment_id = a.assignment_id AND sub.student_id = e.student_id
       LEFT JOIN staff gs ON gs.staff_id = sub.graded_by_staff_id
       LEFT JOIN users gu ON gu.user_id = gs.user_id
      WHERE a.assignment_id = $1
      ORDER BY u.full_name`,
    [assignmentId],
  );
  return rows;
}

export async function findById(submissionId) {
  const { rows } = await query(
    `SELECT sub.submission_id, sub.assignment_id, sub.student_id, sub.storage_key, sub.original_filename,
            sub.grade, sub.feedback
       FROM submissions sub
      WHERE sub.submission_id = $1`,
    [submissionId],
  );
  return rows[0] ?? null;
}
