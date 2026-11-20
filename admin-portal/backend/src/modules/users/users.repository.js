// modules/users/users.repository.js — data access for users, their roles and profiles.
// findByAuthUserId is the shared function used by authentication in every portal; the
// management queries below exist only in the administrator portal.
import { query } from '../../config/db.js';
import { AppError } from '../../middleware/error.middleware.js';

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

// ── Administration ─────────────────────────────────────────────────────

const USER_DETAILS = `
  SELECT u.user_id, u.auth_user_id, u.full_name, u.email, u.is_active, u.created_at,
         COALESCE(array_agg(r.role_name ORDER BY r.role_name)
                  FILTER (WHERE r.role_name IS NOT NULL), '{}') AS roles,
         s.student_id, s.university_id, s.major, s.academic_year, s.phone_number AS student_phone,
         st.staff_id, st.employee_number, st.department, st.academic_title, st.phone_number AS staff_phone
    FROM users u
    LEFT JOIN user_roles ur ON ur.user_id = u.user_id
    LEFT JOIN roles r       ON r.role_id  = ur.role_id
    LEFT JOIN students s    ON s.user_id  = u.user_id
    LEFT JOIN staff st      ON st.user_id = u.user_id`;
const USER_GROUP = 'GROUP BY u.user_id, s.student_id, st.staff_id';

/** Users filtered by optional search text (name, email, university ID, employee number) and role. */
export async function list({ search, role }) {
  const { rows } = await query(
    `${USER_DETAILS}
      WHERE ($1::text IS NULL OR u.full_name ILIKE '%' || $1 || '%' OR u.email ILIKE '%' || $1 || '%'
             OR s.university_id ILIKE '%' || $1 || '%' OR st.employee_number ILIKE '%' || $1 || '%')
        AND ($2::text IS NULL OR EXISTS (
              SELECT 1 FROM user_roles ur2 JOIN roles r2 ON r2.role_id = ur2.role_id
               WHERE ur2.user_id = u.user_id AND r2.role_name = $2))
      ${USER_GROUP}
      ORDER BY u.full_name
      LIMIT 500`,
    [search, role],
  );
  return rows;
}

export async function findById(userId) {
  const { rows } = await query(`${USER_DETAILS} WHERE u.user_id = $1 ${USER_GROUP}`, [userId]);
  return rows[0] ?? null;
}

export async function existsByEmail(email) {
  const { rowCount } = await query('SELECT 1 FROM users WHERE lower(email) = lower($1)', [email]);
  return rowCount > 0;
}

export async function insert(client, { authUserId, fullName, email }) {
  const { rows } = await client.query(
    'INSERT INTO users (auth_user_id, full_name, email) VALUES ($1, $2, $3) RETURNING user_id',
    [authUserId, fullName, email],
  );
  return rows[0].user_id;
}

export async function updateName(userId, fullName) {
  await query('UPDATE users SET full_name = $2 WHERE user_id = $1', [userId, fullName]);
}

export async function setActive(client, userId, isActive) {
  await client.query('UPDATE users SET is_active = $2 WHERE user_id = $1', [userId, isActive]);
}

/** Replaces the user's roles with exactly `roleNames`. */
export async function replaceRoles(client, userId, roleNames) {
  const { rows } = await client.query(
    'SELECT role_id FROM roles WHERE role_name = ANY($1::text[]) FOR KEY SHARE',
    [roleNames],
  );
  if (rows.length !== roleNames.length) {
    throw new AppError('Role setup is incomplete. Run database migrations before assigning roles.', 503);
  }
  await client.query('DELETE FROM user_roles WHERE user_id = $1', [userId]);
  await client.query(
    `INSERT INTO user_roles (user_id, role_id)
     SELECT $1, role_id FROM roles WHERE role_name = ANY($2::text[])`,
    [userId, roleNames],
  );
}

export async function upsertStudentProfile(client, userId, p) {
  await client.query(
    `INSERT INTO students (user_id, university_id, major, academic_year, phone_number)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (user_id) DO UPDATE
       SET university_id = EXCLUDED.university_id, major = EXCLUDED.major,
           academic_year = EXCLUDED.academic_year, phone_number = EXCLUDED.phone_number`,
    [userId, p.universityId, p.major, p.academicYear, p.phoneNumber],
  );
}

export async function upsertStaffProfile(client, userId, p) {
  await client.query(
    `INSERT INTO staff (user_id, employee_number, department, academic_title, phone_number)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (user_id) DO UPDATE
       SET employee_number = EXCLUDED.employee_number, department = EXCLUDED.department,
           academic_title = EXCLUDED.academic_title, phone_number = EXCLUDED.phone_number`,
    [userId, p.employeeNumber, p.department, p.academicTitle, p.phoneNumber],
  );
}

/** Number of lecture / lab sections a staff member is currently assigned to. */
export async function countTeachingAssignments(staffId) {
  const { rows } = await query(
    `SELECT (SELECT count(*)::int FROM lecture_sections WHERE lecturer_staff_id = $1) AS lectures,
            (SELECT count(*)::int FROM lab_sections WHERE lab_teacher_staff_id = $1) AS labs`,
    [staffId],
  );
  return rows[0];
}

/** Active enrollments of a student. */
export async function countActiveEnrollments(studentId) {
  const { rows } = await query(
    `SELECT count(*)::int AS n FROM enrollments WHERE student_id = $1 AND status = 'active'`,
    [studentId],
  );
  return rows[0].n;
}

/** Active staff holding a role (for assigning lecturers / lab teachers to sections). */
export async function listStaffWithRole(role) {
  const { rows } = await query(
    `SELECT st.staff_id, u.full_name, u.email, st.employee_number, st.academic_title
       FROM staff st
       JOIN users u ON u.user_id = st.user_id
      WHERE u.is_active
        AND EXISTS (SELECT 1 FROM user_roles ur JOIN roles r ON r.role_id = ur.role_id
                     WHERE ur.user_id = u.user_id AND r.role_name = $1)
      ORDER BY u.full_name`,
    [role],
  );
  return rows;
}

/** Active students matching search text (for enrollment). */
export async function searchStudents(search) {
  const { rows } = await query(
    `SELECT s.student_id, s.university_id, s.major, u.full_name, u.email
       FROM students s
       JOIN users u ON u.user_id = s.user_id
      WHERE u.is_active
        AND EXISTS (SELECT 1 FROM user_roles ur JOIN roles r ON r.role_id = ur.role_id
                     WHERE ur.user_id = u.user_id AND r.role_name = 'student')
        AND ($1::text IS NULL OR u.full_name ILIKE '%' || $1 || '%' OR s.university_id ILIKE '%' || $1 || '%'
             OR u.email ILIKE '%' || $1 || '%')
      ORDER BY u.full_name
      LIMIT 50`,
    [search],
  );
  return rows;
}
