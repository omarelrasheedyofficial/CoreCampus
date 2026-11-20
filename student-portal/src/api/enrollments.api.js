// api/enrollments.api.js
import { apiRequest } from './client.js';

/** The signed-in student's current enrollments (courses, semester, sections, staff). */
export async function fetchMyEnrollments() {
  const { enrollments } = await apiRequest('/enrollments/me');
  return enrollments;
}
