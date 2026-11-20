// api/teaching.api.js — assignments, submissions, grading and announcements of the teacher's
// sections. (Shared between the lecturer and lab-teacher portals — paths from config/teaching.js.)
import { apiRequest, saveBlob } from './client.js';
import { TEACHING } from '../config/teaching.js';

const id = (v) => encodeURIComponent(v);
const section = (sectionId) => `/${TEACHING.sectionPath}/${id(sectionId)}`;

// Assignments
export const fetchSectionAssignments = async (sectionId) => (await apiRequest(`${section(sectionId)}/assignments`)).assignments;
export const createAssignment = async (sectionId, body) =>
  (await apiRequest(`${section(sectionId)}/assignments`, { method: 'POST', body })).assignment;
export const fetchAssignment = async (assignmentId) => (await apiRequest(`/assignments/${id(assignmentId)}`)).assignment;
export const updateAssignment = async (assignmentId, body) =>
  (await apiRequest(`/assignments/${id(assignmentId)}`, { method: 'PUT', body })).assignment;
export const deleteAssignment = async (assignmentId) => apiRequest(`/assignments/${id(assignmentId)}`, { method: 'DELETE' });

// Submissions & grading
export const fetchSubmissions = async (assignmentId) => (await apiRequest(`/assignments/${id(assignmentId)}/submissions`)).submissions;
export async function downloadSubmission(submissionId) {
  const { blob, filename } = await apiRequest(`/submissions/${id(submissionId)}/download`, { responseType: 'blob' });
  saveBlob(blob, filename);
}
export const gradeSubmission = async (submissionId, body) =>
  (await apiRequest(`/submissions/${id(submissionId)}/grade`, { method: 'PUT', body })).submission;
export const fetchGradebook = async (sectionId) => (await apiRequest(`${section(sectionId)}/gradebook`)).gradebook;

// Announcements
export const fetchSectionAnnouncements = async (sectionId) => (await apiRequest(`${section(sectionId)}/announcements`)).announcements;
export const createAnnouncement = async (sectionId, body) =>
  (await apiRequest(`${section(sectionId)}/announcements`, { method: 'POST', body })).announcement;
export const updateAnnouncement = async (announcementId, body) =>
  (await apiRequest(`/announcements/${id(announcementId)}`, { method: 'PUT', body })).announcement;
export const deleteAnnouncement = async (announcementId) => apiRequest(`/announcements/${id(announcementId)}`, { method: 'DELETE' });
