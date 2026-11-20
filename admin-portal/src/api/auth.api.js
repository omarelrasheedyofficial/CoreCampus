import { apiRequest } from './client.js';

export async function fetchCurrentUser() {
  const { user } = await apiRequest('/auth/me');
  return user;
}
