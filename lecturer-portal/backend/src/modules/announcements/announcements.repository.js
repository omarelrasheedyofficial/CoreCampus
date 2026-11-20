// modules/announcements/announcements.repository.js — announcements of the teacher's sections.
// (Shared between the lecturer and lab-teacher portals — see config/teaching.js.)
import { query } from '../../config/db.js';
import { TEACHING } from '../../config/teaching.js';

const T = TEACHING;

const SELECT_ANNOUNCEMENT = `
  SELECT an.announcement_id, an.course_id, an.lecture_section_id, an.lab_section_id,
         an.title, an.message, an.created_at, an.posted_by, u.full_name AS posted_by_name
    FROM announcements an
    JOIN staff st ON st.staff_id = an.posted_by
    JOIN users u  ON u.user_id = st.user_id`;

/** Announcements targeted at the section, plus course-wide announcements of its course. */
export async function listForSection(sectionId, courseId) {
  const { rows } = await query(
    `${SELECT_ANNOUNCEMENT}
      WHERE an.${T.sectionColumn} = $1
         OR (an.course_id = $2 AND an.lecture_section_id IS NULL AND an.lab_section_id IS NULL)
      ORDER BY an.created_at DESC, an.announcement_id DESC`,
    [sectionId, courseId],
  );
  return rows;
}

export async function findById(announcementId) {
  const { rows } = await query(`${SELECT_ANNOUNCEMENT} WHERE an.announcement_id = $1`, [announcementId]);
  return rows[0] ?? null;
}

/** sectionId null → course-wide announcement. */
export async function insert({ courseId, sectionId, postedBy, title, message }) {
  const { rows } = await query(
    `INSERT INTO announcements (course_id, ${T.sectionColumn}, posted_by, title, message)
     VALUES ($1, $2, $3, $4, $5) RETURNING announcement_id`,
    [courseId, sectionId, postedBy, title, message],
  );
  return rows[0].announcement_id;
}

export async function update(announcementId, { title, message }) {
  await query('UPDATE announcements SET title = $2, message = $3 WHERE announcement_id = $1', [announcementId, title, message]);
}

export async function remove(announcementId) {
  await query('DELETE FROM announcements WHERE announcement_id = $1', [announcementId]);
}
