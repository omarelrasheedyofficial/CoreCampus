import { createSupabaseAdmin } from './supabase.js';

/**
 * Creates a confirmed Supabase Auth account. The administrator chose its first password, so the
 * user must replace it at first sign-in (app_metadata can only be changed with the service role).
 * @returns {Promise<string>} the auth user id
 */
export async function createAuthUser(email, password) {
  const { data, error } = await createSupabaseAdmin().auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    app_metadata: { must_change_password: true },
  });
  if (error) {
    const err = new Error(error.message);
    err.authStatus = error.status;
    throw err;
  }
  return data.user.id;
}


export async function sendPasswordResetEmail(email, redirectTo) {
  const { error } = await createSupabaseAdmin().auth.resetPasswordForEmail(email, { redirectTo });
  if (error) {
    const err = new Error(error.message);
    err.authStatus = error.status;
    throw err;
  }
}

export async function deleteAuthUser(authUserId) {
  const { error } = await createSupabaseAdmin().auth.admin.deleteUser(authUserId);
  if (error) throw new Error(`Supabase deleteUser failed: ${error.message}`);
}


export async function setAuthUserBlocked(authUserId, blocked) {
  const { error } = await createSupabaseAdmin().auth.admin.updateUserById(authUserId, {
    ban_duration: blocked ? '876000h' : 'none',
  });
  if (error) throw new Error(`Supabase updateUser failed: ${error.message}`);
}
