// modules/roles/roles.controller.js
import * as rolesService from './roles.service.js';

// GET /api/roles
export async function listRoles(req, res) {
  res.status(200).json({ success: true, roles: await rolesService.listRoles() });
}
