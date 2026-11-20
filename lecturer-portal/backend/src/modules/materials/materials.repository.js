// modules/materials/materials.repository.js — data access for course materials (metadata only;
// file contents live in Supabase Storage under `storage_key`).
import { query } from '../../config/db.js';

const SELECT_MATERIAL = `
  SELECT m.material_id, m.course_id, m.lecture_section_id, m.lab_section_id,
         m.title, m.storage_key, m.original_filename, m.mime_type, m.file_size, m.created_at,
         u.full_name AS uploaded_by_name
    FROM course_materials m
    JOIN staff st ON st.staff_id = m.uploaded_by
    JOIN users u  ON u.user_id = st.user_id`;

export async function findByLectureSection(lectureSectionId) {
  const { rows } = await query(
    `${SELECT_MATERIAL}
      WHERE m.lecture_section_id = $1
      ORDER BY m.created_at DESC, m.material_id DESC`,
    [lectureSectionId],
  );
  return rows;
}

/** One material with the lecturer of its lecture section (null for lab/course-wide materials). */
export async function findById(materialId) {
  const { rows } = await query(
    `SELECT m.material_id, m.lecture_section_id, m.lab_section_id, m.title, m.storage_key,
            m.original_filename, m.mime_type, m.file_size,
            ls.lecturer_staff_id, c.is_archived
       FROM course_materials m
       JOIN courses c ON c.course_id = m.course_id
       LEFT JOIN lecture_sections ls ON ls.lecture_section_id = m.lecture_section_id
      WHERE m.material_id = $1`,
    [materialId],
  );
  return rows[0] ?? null;
}

export async function insert({ courseId, lectureSectionId, uploadedBy, title, storageKey, originalFilename, mimeType, fileSize }) {
  const { rows } = await query(
    `INSERT INTO course_materials
       (course_id, lecture_section_id, uploaded_by, title, storage_key, original_filename, mime_type, file_size)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING material_id`,
    [courseId, lectureSectionId, uploadedBy, title, storageKey, originalFilename, mimeType, fileSize],
  );
  return rows[0].material_id;
}

export async function findOne(materialId) {
  const { rows } = await query(`${SELECT_MATERIAL} WHERE m.material_id = $1`, [materialId]);
  return rows[0] ?? null;
}

export async function updateTitle(materialId, title) {
  await query('UPDATE course_materials SET title = $2 WHERE material_id = $1', [materialId, title]);
}

/** Deletes inside a caller-provided transaction client. */
export async function deleteById(client, materialId) {
  await client.query('DELETE FROM course_materials WHERE material_id = $1', [materialId]);
}
