// modules/assignments/assignments.repository.js — data access for this portal's assignments
// (lecture assignments in the lecturer portal, lab assignments in the lab-teacher portal).
// (Shared between the lecturer and lab-teacher portals — see config/teaching.js.)
import { query } from '../../config/db.js';
import { TEACHING } from '../../config/teaching.js';

const T = TEACHING;

const SELECT_ASSIGNMENT = `
  SELECT a.assignment_id, a.course_id, a.lecture_section_id, a.lab_section_id,
         a.title, a.instructions, a.assignment_type, a.due_at, a.created_at,
         u.full_name AS created_by_name,
         (SELECT count(*)::int FROM submissions s WHERE s.assignment_id = a.assignment_id) AS submission_count,
         (SELECT count(*)::int FROM submissions s WHERE s.assignment_id = a.assignment_id AND s.grade IS NOT NULL) AS graded_count
    FROM assignments a
    JOIN staff st ON st.staff_id = a.created_by
    JOIN users u  ON u.user_id = st.user_id`;

export async function findBySection(sectionId) {
  const { rows } = await query(
    `${SELECT_ASSIGNMENT}
      WHERE a.${T.sectionColumn} = $1 AND a.assignment_type = $2
      ORDER BY a.due_at, a.assignment_id`,
    [sectionId, T.kind],
  );
  return rows;
}

export async function findOne(assignmentId) {
  const { rows } = await query(`${SELECT_ASSIGNMENT} WHERE a.assignment_id = $1`, [assignmentId]);
  return rows[0] ?? null;
}

/** Assignment with the staff member currently assigned to its section (for ownership checks). */
export async function findWithOwner(assignmentId) {
  const { rows } = await query(
    `SELECT a.assignment_id, a.course_id, a.${T.sectionColumn} AS section_id, a.assignment_type,
            a.title, a.instructions, a.due_at,
            sec.${T.staffColumn} AS owner_staff_id, c.is_archived
       FROM assignments a
       JOIN courses c ON c.course_id = a.course_id
       LEFT JOIN ${T.sectionTable} sec ON sec.${T.sectionColumn} = a.${T.sectionColumn}
      WHERE a.assignment_id = $1`,
    [assignmentId],
  );
  return rows[0] ?? null;
}

export async function insert({ courseId, sectionId, createdBy, title, instructions, dueAt }) {
  const { rows } = await query(
    `INSERT INTO assignments (course_id, ${T.sectionColumn}, created_by, title, instructions, assignment_type, due_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING assignment_id`,
    [courseId, sectionId, createdBy, title, instructions, T.kind, dueAt],
  );
  return rows[0].assignment_id;
}

export async function update(assignmentId, { title, instructions, dueAt }) {
  await query('UPDATE assignments SET title = $2, instructions = $3, due_at = $4 WHERE assignment_id = $1', [
    assignmentId,
    title,
    instructions,
    dueAt,
  ]);
}

export async function remove(assignmentId) {
  await query('DELETE FROM assignments WHERE assignment_id = $1', [assignmentId]);
}
