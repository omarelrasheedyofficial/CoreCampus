// modules/lab-sections/lab-sections.repository.js — data access for laboratory sections.
import { query } from '../../config/db.js';

/** Lab sections assigned to a lab teacher (non-archived courses), with enrolled-student counts. */
export async function findByLabTeacher(staffId) {
  const { rows } = await query(
    `SELECT lab.lab_section_id, lab.section_name,
            c.course_id, c.course_code, c.title, c.description,
            sem.semester_id, sem.name AS semester_name, sem.start_date, sem.end_date,
            (SELECT count(*)::int FROM enrollments e
              WHERE e.lab_section_id = lab.lab_section_id AND e.status <> 'dropped') AS student_count
       FROM lab_sections lab
       JOIN courses c     ON c.course_id = lab.course_id
       JOIN semesters sem ON sem.semester_id = c.semester_id
      WHERE lab.lab_teacher_staff_id = $1
        AND c.is_archived = FALSE
      ORDER BY sem.start_date DESC, c.course_code, lab.section_name`,
    [staffId],
  );
  return rows;
}

/** One lab section with its course and semester, or null. */
export async function findById(labSectionId) {
  const { rows } = await query(
    `SELECT lab.lab_section_id, lab.section_name, lab.lab_teacher_staff_id,
            c.course_id, c.course_code, c.title, c.description, c.is_archived,
            sem.semester_id, sem.name AS semester_name, sem.start_date, sem.end_date
       FROM lab_sections lab
       JOIN courses c     ON c.course_id = lab.course_id
       JOIN semesters sem ON sem.semester_id = c.semester_id
      WHERE lab.lab_section_id = $1`,
    [labSectionId],
  );
  return rows[0] ?? null;
}

/** Students assigned (not dropped) to a lab section, with their lecture section. */
export async function findStudents(labSectionId) {
  const { rows } = await query(
    `SELECT e.enrollment_id, e.status, e.enrolled_at,
            s.university_id, s.major, s.academic_year,
            u.full_name, u.email,
            ls.section_name AS lecture_section_name
       FROM enrollments e
       JOIN students s ON s.student_id = e.student_id
       JOIN users u    ON u.user_id = s.user_id
       JOIN lecture_sections ls ON ls.lecture_section_id = e.lecture_section_id
      WHERE e.lab_section_id = $1
        AND e.status <> 'dropped'
      ORDER BY u.full_name`,
    [labSectionId],
  );
  return rows;
}
