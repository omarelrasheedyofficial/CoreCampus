// modules/courses/courses.repository.js
import { query } from '../../config/db.js';

const COURSE_SUMMARY = `
  SELECT c.course_id, c.semester_id, c.course_code, c.title, c.description, c.is_archived,
         sem.name AS semester_name,
         (SELECT count(*)::int FROM lecture_sections ls WHERE ls.course_id = c.course_id) AS lecture_section_count,
         (SELECT count(*)::int FROM lab_sections lab WHERE lab.course_id = c.course_id) AS lab_section_count,
         (SELECT count(*)::int FROM enrollments e WHERE e.course_id = c.course_id AND e.status = 'active') AS active_enrollments,
         (SELECT coalesce(array_agg(DISTINCT u.full_name ORDER BY u.full_name), '{}')
            FROM lecture_sections ls
            JOIN staff st ON st.staff_id = ls.lecturer_staff_id
            JOIN users u  ON u.user_id = st.user_id
           WHERE ls.course_id = c.course_id) AS lecturer_names,
         (SELECT coalesce(array_agg(DISTINCT u.full_name ORDER BY u.full_name), '{}')
            FROM lab_sections lab
            JOIN staff st ON st.staff_id = lab.lab_teacher_staff_id
            JOIN users u  ON u.user_id = st.user_id
           WHERE lab.course_id = c.course_id) AS lab_teacher_names
    FROM courses c
    JOIN semesters sem ON sem.semester_id = c.semester_id`;

export async function list({ semesterId, includeArchived }) {
  const { rows } = await query(
    `${COURSE_SUMMARY}
      WHERE ($1::int IS NULL OR c.semester_id = $1)
        AND ($2::boolean OR c.is_archived = FALSE)
      ORDER BY sem.start_date DESC, c.course_code`,
    [semesterId, includeArchived],
  );
  return rows;
}

export async function findById(courseId) {
  const { rows } = await query(`${COURSE_SUMMARY} WHERE c.course_id = $1`, [courseId]);
  return rows[0] ?? null;
}

/** `db` may be a transaction client (withTransaction); defaults to the pool. */
export async function insert({ semesterId, code, title, description }, db = { query }) {
  const { rows } = await db.query(
    `INSERT INTO courses (semester_id, course_code, title, description)
     VALUES ($1, $2, $3, $4) RETURNING course_id`,
    [semesterId, code, title, description],
  );
  return rows[0].course_id;
}

export async function update(courseId, { code, title, description, isArchived }) {
  await query(
    `UPDATE courses SET course_code = $2, title = $3, description = $4, is_archived = $5
      WHERE course_id = $1`,
    [courseId, code, title, description, isArchived],
  );
}
