// modules/sections/sections.repository.js — lecture and lab sections of a course.
// Both section kinds have the same shape; KINDS maps each to its table and columns.
// (Identifiers come only from this fixed map — never from user input.)
import { query } from '../../config/db.js';

export const KINDS = {
  lecture: { table: 'lecture_sections', id: 'lecture_section_id', staff: 'lecturer_staff_id', role: 'lecturer' },
  lab: { table: 'lab_sections', id: 'lab_section_id', staff: 'lab_teacher_staff_id', role: 'lab_teacher' },
};

function selectSections(k) {
  return `
    SELECT s.${k.id} AS section_id, s.course_id, s.section_name, s.${k.staff} AS staff_id,
           u.full_name AS staff_name,
           (SELECT count(*)::int FROM enrollments e WHERE e.${k.id} = s.${k.id} AND e.status = 'active') AS student_count
      FROM ${k.table} s
      LEFT JOIN staff st ON st.staff_id = s.${k.staff}
      LEFT JOIN users u  ON u.user_id = st.user_id`;
}

export async function listByCourse(kind, courseId) {
  const k = KINDS[kind];
  const { rows } = await query(`${selectSections(k)} WHERE s.course_id = $1 ORDER BY s.section_name`, [courseId]);
  return rows;
}

export async function findById(kind, sectionId) {
  const k = KINDS[kind];
  const { rows } = await query(`${selectSections(k)} WHERE s.${k.id} = $1`, [sectionId]);
  return rows[0] ?? null;
}

/** `db` may be a transaction client (withTransaction); defaults to the pool. */
export async function insert(kind, { courseId, sectionName, staffId }, db = { query }) {
  const k = KINDS[kind];
  const { rows } = await db.query(
    `INSERT INTO ${k.table} (course_id, section_name, ${k.staff}) VALUES ($1, $2, $3) RETURNING ${k.id} AS id`,
    [courseId, sectionName, staffId],
  );
  return rows[0].id;
}

export async function update(kind, sectionId, { sectionName, staffId }, db = { query }) {
  const k = KINDS[kind];
  await db.query(`UPDATE ${k.table} SET section_name = $2, ${k.staff} = $3 WHERE ${k.id} = $1`, [
    sectionId,
    sectionName,
    staffId,
  ]);
}

export async function remove(kind, sectionId, db = { query }) {
  const k = KINDS[kind];
  await db.query(`DELETE FROM ${k.table} WHERE ${k.id} = $1`, [sectionId]);
}
/** Enrollments of any status that reference the section (they block deletion). */
export async function countEnrollments(kind, sectionId) {
  const k = KINDS[kind];
  const { rows } = await query(`SELECT count(*)::int AS n FROM enrollments WHERE ${k.id} = $1`, [sectionId]);
  return rows[0].n;
}

/** True when this staff member already teaches a group of this kind in the course. */
export async function staffTeachesCourse(kind, courseId, staffId) {
  const k = KINDS[kind];
  const { rowCount } = await query(`SELECT 1 FROM ${k.table} WHERE course_id = $1 AND ${k.staff} = $2`, [courseId, staffId]);
  return rowCount > 0;
}

/** Full name of an active staff member holding `role`, or null. */
export async function activeStaffName(staffId, role) {
  const { rows } = await query(
    `SELECT u.full_name
       FROM staff st
       JOIN users u ON u.user_id = st.user_id
       JOIN user_roles ur ON ur.user_id = u.user_id
       JOIN roles r ON r.role_id = ur.role_id
      WHERE st.staff_id = $1 AND u.is_active AND r.role_name = $2`,
    [staffId, role],
  );
  return rows[0]?.full_name ?? null;
}

/** True when the staff member is active and holds the role required for this section kind. */
export async function staffHasRole(staffId, role) {
  const { rowCount } = await query(
    `SELECT 1
       FROM staff st
       JOIN users u ON u.user_id = st.user_id
       JOIN user_roles ur ON ur.user_id = u.user_id
       JOIN roles r ON r.role_id = ur.role_id
      WHERE st.staff_id = $1 AND u.is_active AND r.role_name = $2`,
    [staffId, role],
  );
  return rowCount > 0;
}
