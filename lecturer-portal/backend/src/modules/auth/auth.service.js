// modules/auth/auth.service.js — business logic for the authenticated session.
// Login/logout and password handling happen in Supabase Auth (doc §6.6.1–6.6.2);
// this service describes the signed-in user to the frontend.
// (Shared file: keep identical in every portal's backend.)

/** Public view of the current user. Internal ids needed only by the backend are not exposed. */
export function getCurrentUser(user) {
  return {
    fullName: user.fullName,
    email: user.email,
    roles: user.roles,
    studentProfile: user.studentProfile,
    staffProfile: user.staffProfile,
  };
}
