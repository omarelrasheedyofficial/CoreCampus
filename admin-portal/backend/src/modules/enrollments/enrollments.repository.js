// modules/enrollments/enrollments.repository.js — enrollment records (admin view).
import { query } from '../../config/db.js';

const SELECT_ENROLLMENT = `
  SELECT e.enrollment_id, e.course_id, e.student_id, e.lecture_section_id, e.lab_section_id,
         e.status, e.enrolled_at,
         u.full_name, u.email, s.university_id,
         ls.section_name AS lecture_section_name, lab.section_name AS lab_section_name
    FROM enrollments e
    JOIN students s ON s.student_id = e.student_id
    JOIN users u    ON u.user_id = s.user_id
    JOIN lecture_sections ls   ON ls.lecture_section_id = e.lecture_section_id
    LEFT JOIN lab_sections lab ON lab.lab_section_id = e.lab_section_id`;

export async function listByCourse(courseId) {
  const { rows } = await query(
    `${SELECT_ENROLLMENT} WHERE e.course_id = $1 ORDER BY (e.status = 'dropped'), u.full_name`,
    [courseId],
  );
  return rows;
}

export async function findById(enrollmentId) {
  const { rows } = await query(`${SELECT_ENROLLMENT} WHERE e.enrollment_id = $1`, [enrollmentId]);
  return rows[0] ?? null;
}

export async function findByStudentAndCourse(studentId, courseId) {
  const { rows } = await query('SELECT enrollment_id, status FROM enrollments WHERE student_id = $1 AND course_id = $2', [
    studentId,
    courseId,
  ]);
  return rows[0] ?? null;
}

export async function insert({ studentId, courseId, lectureSectionId, labSectionId }) {
  const { rows } = await query(
    // Status is set explicitly: the live database's column default ('enrolled') is not a status
    // this app uses, and every portal only shows 'active' enrollments.
    `INSERT INTO enrollments (student_id, course_id, lecture_section_id, lab_section_id, status)
     VALUES ($1, $2, $3, $4, 'active') RETURNING enrollment_id`,
    [studentId, courseId, lectureSectionId, labSectionId],
  );
  return rows[0].enrollment_id;
}

export async function update(enrollmentId, { lectureSectionId, labSectionId, status }) {
  await query(
    `UPDATE enrollments SET lecture_section_id = $2, lab_section_id = $3, status = $4 WHERE enrollment_id = $1`,
    [enrollmentId, lectureSectionId, labSectionId, status],
  );
}

/** True when the section exists and belongs to the course. */
export async function sectionBelongsToCourse(kind, sectionId, courseId) {
  const table = kind === 'lab' ? 'lab_sections' : 'lecture_sections';
  const idColumn = kind === 'lab' ? 'lab_section_id' : 'lecture_section_id';
  const { rowCount } = await query(`SELECT 1 FROM ${table} WHERE ${idColumn} = $1 AND course_id = $2`, [
    sectionId,
    courseId,
  ]);
  return rowCount > 0;
}

/** True when the student profile exists, the user is active and holds the student role. */
export async function isEnrollableStudent(studentId) {
  const { rowCount } = await query(
    `SELECT 1 FROM students s
       JOIN users u ON u.user_id = s.user_id
       JOIN user_roles ur ON ur.user_id = u.user_id
       JOIN roles r ON r.role_id = ur.role_id
      WHERE s.student_id = $1 AND u.is_active AND r.role_name = 'student'`,
    [studentId],
  );
  return rowCount > 0;
}
