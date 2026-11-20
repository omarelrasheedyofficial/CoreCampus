// modules/auth/password.service.js — users change their own password (doc §6.6).
// (Shared file: keep identical in every portal's backend.)
//
// Two ways to prove who you are:
//   • the current password (My Profile, and the forced change after the first sign-in), or
//   • a password-reset email link opened in the last 15 minutes (Forgot password). Supabase marks
//     such sessions in the token's `amr` claim, which the browser cannot forge.
// The new password is checked against the CampusCore rules here, then stored by Supabase Auth
// (bcrypt). It is never logged or kept by CampusCore.
import { createClient } from '@supabase/supabase-js';
import { env } from '../../config/env.js';
import { AUDIT_EVENTS, logAuditEvent } from '../../config/audit.js';
import { createSupabaseAdmin } from '../../config/supabase.js';
import { AppError } from '../../middleware/error.middleware.js';
import { requiredPassword } from '../../utils/validation.js';

const EMAIL_LINK_WINDOW_SECONDS = 15 * 60;
const EMAIL_LINK_METHODS = new Set(['recovery', 'otp']);

/** True when this session was opened from a password-reset email in the last 15 minutes. */
function openedFromRecentEmailLink(amr = []) {
  const now = Date.now() / 1000;
  return amr.some((entry) => EMAIL_LINK_METHODS.has(entry?.method) && now - Number(entry.timestamp) <= EMAIL_LINK_WINDOW_SECONDS);
}

/** Checks a password by signing in on a throw-away client, then ends that extra session. */
async function passwordMatches(email, password) {
  const client = createClient(env.supabaseUrl, env.supabaseServiceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { error } = await client.auth.signInWithPassword({ email, password });
  if (error) {
    if (error.status === 429) throw new AppError('Too many attempts. Please wait a few minutes and try again.', 429);
    if (error.code === 'invalid_credentials' || error.status === 400) return false;
    throw new Error(`Supabase sign-in check failed: ${error.message}`);
  }
  await client.auth.signOut({ scope: 'local' }).catch(() => {});
  return true;
}

/**
 * Supabase ends every session of the account when the password changes (other devices included);
 * the browser that made the change signs in again with the new password.
 * @param user     req.user (CampusCore account)
 * @param identity req.auth (verified token: authUserId, email, amr)
 */
export async function changePassword(user, identity, body = {}) {
  const newPassword = requiredPassword(body.newPassword);
  const viaEmailLink = openedFromRecentEmailLink(identity.amr);

  if (!viaEmailLink) {
    const current = typeof body.currentPassword === 'string' ? body.currentPassword : '';
    if (!current) throw new AppError('Enter your current password.', 400);
    if (current === newPassword) throw new AppError('Choose a new password that is different from your current one.', 400);
    if (!(await passwordMatches(identity.email, current))) throw new AppError('Your current password is incorrect.', 400);
  }

  const { error } = await createSupabaseAdmin().auth.admin.updateUserById(identity.authUserId, {
    password: newPassword,
    app_metadata: { must_change_password: false },
  });
  if (error) {
    if (error.status === 422 || /password/i.test(error.message)) throw new AppError(error.message, 400);
    throw new Error(`Supabase password update failed: ${error.message}`);
  }

  logAuditEvent({
    userId: user.userId,
    eventType: AUDIT_EVENTS.PASSWORD_CHANGED,
    entityType: 'user',
    entityId: user.userId,
    details: { method: viaEmailLink ? 'email_link' : 'current_password' },
  });
}
