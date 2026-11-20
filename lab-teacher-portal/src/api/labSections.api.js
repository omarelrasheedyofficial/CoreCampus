// api/labSections.api.js
import { apiRequest } from './client.js';

/** Lab sections assigned to the signed-in lab teacher, with student counts. */
export async function fetchMySections() {
  const { sections } = await apiRequest('/lab-sections/mine');
  return sections;
}

export async function fetchSection(sectionId) {
  const { section } = await apiRequest(`/lab-sections/${encodeURIComponent(sectionId)}`);
  return section;
}

export async function fetchSectionStudents(sectionId) {
  const { students } = await apiRequest(`/lab-sections/${encodeURIComponent(sectionId)}/students`);
  return students;
}
