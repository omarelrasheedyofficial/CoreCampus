// modules/dashboard/dashboard.repository.js — counts for the administrator dashboard.
import { query } from '../../config/db.js';

export async function getCounts() {
  const { rows } = await query(
    `SELECT
       (SELECT count(*)::int FROM users WHERE is_active) AS active_users,
       (SELECT count(*)::int FROM users WHERE NOT is_active) AS inactive_users,
       (SELECT count(*)::int FROM user_roles ur JOIN roles r USING (role_id) WHERE r.role_name = 'student') AS students,
       (SELECT count(*)::int FROM user_roles ur JOIN roles r USING (role_id) WHERE r.role_name = 'lecturer') AS lecturers,
       (SELECT count(*)::int FROM user_roles ur JOIN roles r USING (role_id) WHERE r.role_name = 'lab_teacher') AS lab_teachers,
       (SELECT count(*)::int FROM semesters) AS semesters,
       (SELECT count(*)::int FROM courses WHERE NOT is_archived) AS courses,
       (SELECT count(*)::int FROM enrollments WHERE status = 'active') AS active_enrollments,
       (SELECT count(*)::int FROM lecture_sections WHERE lecturer_staff_id IS NULL) AS unassigned_lecture_sections,
       (SELECT count(*)::int FROM lab_sections WHERE lab_teacher_staff_id IS NULL) AS unassigned_lab_sections`,
  );
  return rows[0];
}
