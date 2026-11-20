// modules/auth/auth.controller.js — HTTP handlers for /api/auth
import * as authService from './auth.service.js';
import * as passwordService from './password.service.js';

// GET /api/auth/me
export function getMe(req, res) {
  res.status(200).json({
    success: true,
    user: { ...authService.getCurrentUser(req.user), mustChangePassword: req.auth.mustChangePassword },
  });
}

// POST /api/auth/password   { currentPassword?, newPassword }
export async function changePassword(req, res) {
  await passwordService.changePassword(req.user, req.auth, req.body);
  res.status(200).json({ success: true, message: 'Password changed.' });
}
