// api/auth.api.js
import { apiRequest } from './client.js';

/** The signed-in user's CampusCore profile and roles. */
export async function fetchCurrentUser() {
  const { user } = await apiRequest('/auth/me');
  return user;
}
