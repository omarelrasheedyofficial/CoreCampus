// modules/roles/roles.service.js — the four fixed system roles (defined by migration 001).
import * as rolesRepository from './roles.repository.js';

export async function listRoles() {
  const rows = await rolesRepository.listWithCounts();
  return rows.map((r) => ({ roleId: r.role_id, name: r.role_name, userCount: r.user_count }));
}
