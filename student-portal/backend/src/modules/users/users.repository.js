// modules/users/users.repository.js — data access for users, their roles and profiles.
// (Shared file: keep identical in every portal's backend.)
import { query } from '../../config/db.js';

/**
 * Finds the CampusCore user linked to a Supabase Auth user, with roles and profiles.
 * @returns {Promise<object|null>}
 */
export async function findByAuthUserId(authUserId) {
  const { rows } = await query(
    `SELECT u.user_id, u.full_name, u.email, u.is_active,
            COALESCE(array_agg(r.role_name ORDER BY r.role_name)
                     FILTER (WHERE r.role_name IS NOT NULL), '{}') AS roles,
            s.student_id, s.university_id, s.major, s.academic_year,
            st.staff_id, st.employee_number, st.department, st.academic_title
       FROM users u
       LEFT JOIN user_roles ur ON ur.user_id = u.user_id
       LEFT JOIN roles r       ON r.role_id  = ur.role_id
       LEFT JOIN students s    ON s.user_id  = u.user_id
       LEFT JOIN staff st      ON st.user_id = u.user_id
      WHERE u.auth_user_id = $1
      GROUP BY u.user_id, s.student_id, st.staff_id`,
    [authUserId],
  );

  const row = rows[0];
  if (!row) return null;

  return {
    userId: row.user_id,
    fullName: row.full_name,
    email: row.email,
    isActive: row.is_active,
    roles: row.roles,
    studentId: row.student_id,
    staffId: row.staff_id,
    studentProfile: row.student_id
      ? { universityId: row.university_id, major: row.major, academicYear: row.academic_year }
      : null,
    staffProfile: row.staff_id
      ? { employeeNumber: row.employee_number, department: row.department, academicTitle: row.academic_title }
      : null,
  };
}
