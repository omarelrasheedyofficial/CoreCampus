import * as authService from './auth.service.js';
import * as passwordService from './password.service.js';

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

// POST /api/auth/login-failed   { email }  — no session: the sign-in has just failed.
// Same 204 whether or not the email belongs to an account (no account enumeration).
export async function reportFailedLogin(req, res) {
  await authService.recordFailedLogin(req.body, req.ip);
  res.status(204).end();
}
