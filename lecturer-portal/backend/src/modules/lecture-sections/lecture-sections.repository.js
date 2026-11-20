// modules/lecture-sections/lecture-sections.repository.js — data access for lecture sections.
import { query } from '../../config/db.js';

/** Lecture sections assigned to a lecturer (non-archived courses), with enrolled-student counts. */
export async function findByLecturer(staffId) {
  const { rows } = await query(
    `SELECT ls.lecture_section_id, ls.section_name,
            c.course_id, c.course_code, c.title, c.description,
            sem.semester_id, sem.name AS semester_name, sem.start_date, sem.end_date,
            (SELECT count(*)::int FROM enrollments e
              WHERE e.lecture_section_id = ls.lecture_section_id AND e.status <> 'dropped') AS student_count,
            (SELECT count(*)::int FROM lab_sections lab
              WHERE lab.course_id = c.course_id) AS lab_section_count
       FROM lecture_sections ls
       JOIN courses c     ON c.course_id = ls.course_id
       JOIN semesters sem ON sem.semester_id = c.semester_id
      WHERE ls.lecturer_staff_id = $1
        AND c.is_archived = FALSE
      ORDER BY sem.start_date DESC, c.course_code, ls.section_name`,
    [staffId],
  );
  return rows;
}

/** One lecture section with its course and semester, or null. */
export async function findById(lectureSectionId) {
  const { rows } = await query(
    `SELECT ls.lecture_section_id, ls.section_name, ls.lecturer_staff_id,
            c.course_id, c.course_code, c.title, c.description, c.is_archived,
            sem.semester_id, sem.name AS semester_name, sem.start_date, sem.end_date
       FROM lecture_sections ls
       JOIN courses c     ON c.course_id = ls.course_id
       JOIN semesters sem ON sem.semester_id = c.semester_id
      WHERE ls.lecture_section_id = $1`,
    [lectureSectionId],
  );
  return rows[0] ?? null;
}

/** Students enrolled (not dropped) in a lecture section, with their lab section. */
export async function findStudents(lectureSectionId) {
  const { rows } = await query(
    `SELECT e.enrollment_id, e.status, e.enrolled_at,
            s.university_id, s.major, s.academic_year,
            u.full_name, u.email,
            lab.section_name AS lab_section_name
       FROM enrollments e
       JOIN students s ON s.student_id = e.student_id
       JOIN users u    ON u.user_id = s.user_id
       LEFT JOIN lab_sections lab ON lab.lab_section_id = e.lab_section_id
      WHERE e.lecture_section_id = $1
        AND e.status <> 'dropped'
      ORDER BY u.full_name`,
    [lectureSectionId],
  );
  return rows;
}
