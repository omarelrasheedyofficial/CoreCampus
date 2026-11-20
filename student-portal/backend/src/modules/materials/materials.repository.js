// modules/materials/materials.repository.js — learning materials visible to a student.
import { query } from '../../config/db.js';
import { READABLE_STATUSES, VISIBLE_TO_ENROLLMENT } from '../courses/courses.repository.js';

const SELECT_MATERIAL = `
  SELECT item.material_id, item.title, item.original_filename, item.mime_type, item.file_size,
         item.created_at, item.storage_key, item.lecture_section_id, item.lab_section_id,
         u.full_name AS uploaded_by_name
    FROM course_materials item
    JOIN enrollments e ON ${VISIBLE_TO_ENROLLMENT}
    JOIN courses c     ON c.course_id = item.course_id AND c.is_archived = FALSE
    JOIN staff st      ON st.staff_id = item.uploaded_by
    JOIN users u       ON u.user_id = st.user_id`;

export async function listForCourse(studentId, courseId) {
  const { rows } = await query(
    `${SELECT_MATERIAL}
      WHERE e.student_id = $1 AND e.course_id = $2 AND e.status IN ${READABLE_STATUSES}
      ORDER BY item.created_at DESC, item.material_id DESC`,
    [studentId, courseId],
  );
  return rows;
}

/** The material if this student may access it, otherwise null. */
export async function findVisible(studentId, materialId) {
  const { rows } = await query(
    `${SELECT_MATERIAL}
      WHERE e.student_id = $1 AND item.material_id = $2 AND e.status IN ${READABLE_STATUSES}`,
    [studentId, materialId],
  );
  return rows[0] ?? null;
}
