// modules/announcements/announcements.repository.js — announcements visible to a student.
import { query } from '../../config/db.js';
import { READABLE_STATUSES, VISIBLE_TO_ENROLLMENT } from '../courses/courses.repository.js';

export async function listForStudent(studentId, courseId) {
  const { rows } = await query(
    `SELECT item.announcement_id, item.course_id, item.title, item.message, item.created_at,
            item.lecture_section_id, item.lab_section_id,
            c.course_code, c.title AS course_title, u.full_name AS posted_by_name
       FROM announcements item
       JOIN enrollments e ON ${VISIBLE_TO_ENROLLMENT}
       JOIN courses c     ON c.course_id = item.course_id AND c.is_archived = FALSE
       JOIN staff st      ON st.staff_id = item.posted_by
       JOIN users u       ON u.user_id = st.user_id
      WHERE e.student_id = $1 AND e.status IN ${READABLE_STATUSES}
        AND ($2::int IS NULL OR item.course_id = $2)
      ORDER BY item.created_at DESC, item.announcement_id DESC
      LIMIT 200`,
    [studentId, courseId],
  );
  return rows;
}
