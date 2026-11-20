import { apiRequest } from './client.js';

export const fetchProfile = async () => (await apiRequest('/profile')).profile;
export const updateProfile = async (body) => (await apiRequest('/profile', { method: 'PATCH', body })).profile;
