// modules/roles/roles.repository.js
import { query } from '../../config/db.js';

/** All roles with the number of users holding each. */
export async function listWithCounts() {
  const { rows } = await query(
    `SELECT r.role_id, r.role_name, count(ur.user_id)::int AS user_count
       FROM roles r
       LEFT JOIN user_roles ur ON ur.role_id = r.role_id
      GROUP BY r.role_id
      ORDER BY r.role_id`,
  );
  return rows;
}
