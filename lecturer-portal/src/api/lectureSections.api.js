// api/lectureSections.api.js
import { apiRequest } from './client.js';

/** Lecture sections assigned to the signed-in lecturer, with student counts. */
export async function fetchMySections() {
  const { sections } = await apiRequest('/lecture-sections/mine');
  return sections;
}

export async function fetchSection(sectionId) {
  const { section } = await apiRequest(`/lecture-sections/${encodeURIComponent(sectionId)}`);
  return section;
}

export async function fetchSectionStudents(sectionId) {
  const { students } = await apiRequest(`/lecture-sections/${encodeURIComponent(sectionId)}/students`);
  return students;
}
