// modules/enrollments/enrollments.repository.js — data access for enrollments.
import { query } from '../../config/db.js';

/** Current (non-dropped) enrollments of one student in non-archived courses, with section staff. */
export async function findActiveByStudentId(studentId) {
  const { rows } = await query(
    `SELECT e.enrollment_id, e.status, e.enrolled_at,
            c.course_id, c.course_code, c.title, c.description,
            sem.semester_id, sem.name AS semester_name, sem.start_date, sem.end_date,
            ls.lecture_section_id, ls.section_name AS lecture_section_name,
            lu.full_name AS lecturer_name,
            lab.lab_section_id, lab.section_name AS lab_section_name,
            labu.full_name AS lab_teacher_name
       FROM enrollments e
       JOIN courses c            ON c.course_id = e.course_id
       JOIN semesters sem        ON sem.semester_id = c.semester_id
       JOIN lecture_sections ls  ON ls.lecture_section_id = e.lecture_section_id
       LEFT JOIN staff lst       ON lst.staff_id = ls.lecturer_staff_id
       LEFT JOIN users lu        ON lu.user_id = lst.user_id
       LEFT JOIN lab_sections lab ON lab.lab_section_id = e.lab_section_id
       LEFT JOIN staff labst     ON labst.staff_id = lab.lab_teacher_staff_id
       LEFT JOIN users labu      ON labu.user_id = labst.user_id
      WHERE e.student_id = $1
        AND e.status <> 'dropped'
        AND c.is_archived = FALSE
      ORDER BY sem.start_date DESC, c.course_code`,
    [studentId],
  );
  return rows;
}
