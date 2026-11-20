// modules/assignments/assignments.repository.js — assignments visible to a student, with the
// student's own submission (never other students').
import { query } from '../../config/db.js';
import { READABLE_STATUSES, VISIBLE_TO_ENROLLMENT } from '../courses/courses.repository.js';

const SELECT_ASSIGNMENT = `
  SELECT item.assignment_id, item.course_id, item.title, item.instructions, item.assignment_type,
         item.due_at, item.created_at,
         c.course_code, c.title AS course_title, e.status AS enrollment_status, e.student_id,
         u.full_name AS created_by_name,
         sub.submission_id, sub.original_filename, sub.submitted_at, sub.storage_key,
         sub.grade, sub.feedback, sub.graded_at
    FROM assignments item
    JOIN enrollments e ON ${VISIBLE_TO_ENROLLMENT}
    JOIN courses c     ON c.course_id = item.course_id AND c.is_archived = FALSE
    JOIN staff st      ON st.staff_id = item.created_by
    JOIN users u       ON u.user_id = st.user_id
    LEFT JOIN submissions sub ON sub.assignment_id = item.assignment_id AND sub.student_id = e.student_id`;

/** All visible assignments (optionally for one course), soonest deadline first. */
export async function listForStudent(studentId, courseId) {
  const { rows } = await query(
    `${SELECT_ASSIGNMENT}
      WHERE e.student_id = $1 AND e.status IN ${READABLE_STATUSES}
        AND ($2::int IS NULL OR item.course_id = $2)
      ORDER BY item.due_at, item.assignment_id`,
    [studentId, courseId],
  );
  return rows;
}

/** One assignment if visible to this student, with their submission; otherwise null. */
export async function findVisible(studentId, assignmentId) {
  const { rows } = await query(
    `${SELECT_ASSIGNMENT}
      WHERE e.student_id = $1 AND item.assignment_id = $2 AND e.status IN ${READABLE_STATUSES}`,
    [studentId, assignmentId],
  );
  return rows[0] ?? null;
}
