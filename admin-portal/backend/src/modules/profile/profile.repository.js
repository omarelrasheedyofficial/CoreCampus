// modules/profile/profile.repository.js — the signed-in user's own profile.
// (Shared module: keep identical in every portal's backend.)
import { query } from '../../config/db.js';

export async function findByUserId(userId) {
  const { rows } = await query(
    `SELECT u.full_name, u.email,
            s.university_id, s.major, s.academic_year, s.phone_number AS student_phone,
            st.employee_number, st.department, st.academic_title, st.phone_number AS staff_phone
       FROM users u
       LEFT JOIN students s ON s.user_id = u.user_id
       LEFT JOIN staff st   ON st.user_id = u.user_id
      WHERE u.user_id = $1`,
    [userId],
  );
  return rows[0] ?? null;
}

/** Updates the phone number on whichever profiles (student / staff) the user has. */
export async function updatePhone(userId, phoneNumber) {
  await query('UPDATE students SET phone_number = $2 WHERE user_id = $1', [userId, phoneNumber]);
  await query('UPDATE staff SET phone_number = $2 WHERE user_id = $1', [userId, phoneNumber]);
}
