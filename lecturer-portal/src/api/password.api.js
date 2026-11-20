// api/password.api.js — change your own password (shared by every portal).
import { apiRequest } from './client.js';
import { supabase } from './supabaseClient.js';

/** { currentPassword, newPassword }; currentPassword is not needed right after a reset-email link. */
export const changePassword = (body) => apiRequest('/auth/password', { method: 'POST', body });

/**
 * Emails a "choose a new password" link that opens this portal's reset page. Supabase sends it
 * only when an account exists, but the caller always shows the same message, so nobody can use
 * this form to find out which emails are registered.
 */
export async function requestPasswordResetEmail(email) {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`,
  });
  if (error?.status === 429) throw new Error('Too many requests. Please wait a few minutes and try again.');
  if (error && (error.name === 'AuthRetryableFetchError' || error.status === 0)) {
    throw new Error('Cannot reach the sign-in service. Please try again.');
  }
  // Any other error is ignored on purpose (same message whether or not the email exists).
}

/** Password rules — the backend enforces the same ones. Returns a message, or '' when valid. */
export function passwordProblem(pw) {
  if (pw.length < 10 || pw.length > 72) return 'The new password must be 10–72 characters long.';
  if (!/[a-z]/.test(pw) || !/[A-Z]/.test(pw) || !/\d/.test(pw)) {
    return 'The new password must include an upper-case letter, a lower-case letter and a digit.';
  }
  return '';
}
