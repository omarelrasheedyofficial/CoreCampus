// api/student.api.js — course details, materials, assignments/submissions and announcements of the
// signed-in student. The backend returns only the student's own courses, sections and work.
import { apiRequest, saveBlob } from './client.js';

const id = (v) => encodeURIComponent(v);
const qs = (courseId) => (courseId ? `?courseId=${id(courseId)}` : '');

export const fetchCourse = async (courseId) => (await apiRequest(`/courses/${id(courseId)}`)).course;
export const fetchCourseMaterials = async (courseId) => (await apiRequest(`/courses/${id(courseId)}/materials`)).materials;
export async function downloadMaterial(materialId) {
  const { blob, filename } = await apiRequest(`/materials/${id(materialId)}/download`, { responseType: 'blob' });
  saveBlob(blob, filename);
}

export const fetchAssignments = async (courseId) => (await apiRequest(`/assignments${qs(courseId)}`)).assignments;
export async function submitAssignment(assignmentId, file) {
  const form = new FormData();
  form.append('file', file);
  return (await apiRequest(`/assignments/${id(assignmentId)}/submission`, { method: 'PUT', body: form })).assignment;
}
export async function downloadMySubmission(assignmentId) {
  const { blob, filename } = await apiRequest(`/assignments/${id(assignmentId)}/submission/download`, { responseType: 'blob' });
  saveBlob(blob, filename);
}

export const fetchAnnouncements = async (courseId) => (await apiRequest(`/announcements${qs(courseId)}`)).announcements;
