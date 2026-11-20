// modules/semesters/semesters.repository.js
import { query } from '../../config/db.js';

export async function list() {
  const { rows } = await query(
    `SELECT sem.semester_id, sem.name, sem.start_date, sem.end_date,
            (SELECT count(*)::int FROM courses c WHERE c.semester_id = sem.semester_id) AS course_count
       FROM semesters sem
      ORDER BY sem.start_date DESC`,
  );
  return rows;
}

export async function findById(semesterId) {
  const { rows } = await query(
    `SELECT semester_id, name, start_date, end_date,
            (SELECT count(*)::int FROM courses c WHERE c.semester_id = $1) AS course_count
       FROM semesters WHERE semester_id = $1`,
    [semesterId],
  );
  return rows[0] ?? null;
}

export async function insert({ name, startDate, endDate }) {
  const { rows } = await query(
    'INSERT INTO semesters (name, start_date, end_date) VALUES ($1, $2, $3) RETURNING semester_id',
    [name, startDate, endDate],
  );
  return rows[0].semester_id;
}

export async function update(semesterId, { name, startDate, endDate }) {
  await query('UPDATE semesters SET name = $2, start_date = $3, end_date = $4 WHERE semester_id = $1', [
    semesterId,
    name,
    startDate,
    endDate,
  ]);
}

export async function remove(semesterId) {
  await query('DELETE FROM semesters WHERE semester_id = $1', [semesterId]);
}
