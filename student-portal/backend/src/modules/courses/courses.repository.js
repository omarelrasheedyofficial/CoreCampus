// modules/courses/courses.repository.js — course data visible to an enrolled student.
import { query } from '../../config/db.js';

/**
 * SQL condition: the item (alias `item`) is visible to the student's enrollment (alias `e`):
 * course-wide items, or items for the student's own lecture or lab section.
 * Shared by the materials, assignments and announcements repositories.
 */
export const VISIBLE_TO_ENROLLMENT = `
  item.course_id = e.course_id AND (
    (item.lecture_section_id IS NULL AND item.lab_section_id IS NULL)
    OR item.lecture_section_id = e.lecture_section_id
    OR item.lab_section_id = e.lab_section_id)`;

/** Enrollment statuses that still give read access to a course. */
export const READABLE_STATUSES = `('active', 'completed')`;

/** The student's enrollment in a (non-archived) course with sections and teachers, or null. */
export async function findEnrolledCourse(studentId, courseId) {
  const { rows } = await query(
    `SELECT e.enrollment_id, e.status, e.enrolled_at, e.lecture_section_id, e.lab_section_id,
            c.course_id, c.course_code, c.title, c.description,
            sem.name AS semester_name, sem.start_date, sem.end_date,
            ls.section_name AS lecture_section_name, lu.full_name AS lecturer_name, lu.email AS lecturer_email,
            lab.section_name AS lab_section_name, labu.full_name AS lab_teacher_name, labu.email AS lab_teacher_email
       FROM enrollments e
       JOIN courses c     ON c.course_id = e.course_id AND c.is_archived = FALSE
       JOIN semesters sem ON sem.semester_id = c.semester_id
       JOIN lecture_sections ls ON ls.lecture_section_id = e.lecture_section_id
       LEFT JOIN staff lst ON lst.staff_id = ls.lecturer_staff_id
       LEFT JOIN users lu  ON lu.user_id = lst.user_id
       LEFT JOIN lab_sections lab ON lab.lab_section_id = e.lab_section_id
       LEFT JOIN staff labst ON labst.staff_id = lab.lab_teacher_staff_id
       LEFT JOIN users labu  ON labu.user_id = labst.user_id
      WHERE e.student_id = $1 AND e.course_id = $2 AND e.status IN ${READABLE_STATUSES}`,
    [studentId, courseId],
  );
  return rows[0] ?? null;
}
