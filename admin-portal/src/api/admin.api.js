// api/admin.api.js — administrator API calls (dashboard, users, semesters, courses,
// sections and enrollments). All authorization is enforced by the backend.
import { apiRequest } from './client.js';

const id = (value) => encodeURIComponent(value);
const qs = (params) => {
  const entries = Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '');
  return entries.length ? `?${new URLSearchParams(entries)}` : '';
};

// Dashboard
export const fetchSummary = async () => (await apiRequest('/dashboard/summary')).summary;

// Users & roles
export const fetchUsers = async (filters = {}) => (await apiRequest(`/users${qs(filters)}`)).users;
export const fetchUser = async (userId) => (await apiRequest(`/users/${id(userId)}`)).user;
export const createUser = async (body) => (await apiRequest('/users', { method: 'POST', body })).user;
export const updateUser = async (userId, body) => (await apiRequest(`/users/${id(userId)}`, { method: 'PATCH', body })).user;
export const sendPasswordReset = (userId, redirectTo) =>
  apiRequest(`/users/${id(userId)}/password-reset`, { method: 'POST', body: { redirectTo } });
export const setUserActive = async (userId, isActive) =>
  (await apiRequest(`/users/${id(userId)}/status`, { method: 'PATCH', body: { isActive } })).user;
export const setUserRoles = async (userId, roles) =>
  (await apiRequest(`/users/${id(userId)}/roles`, { method: 'PUT', body: { roles } })).user;
export const saveStudentProfile = async (userId, body) =>
  (await apiRequest(`/users/${id(userId)}/student-profile`, { method: 'PUT', body })).user;
export const saveStaffProfile = async (userId, body) =>
  (await apiRequest(`/users/${id(userId)}/staff-profile`, { method: 'PUT', body })).user;
export const fetchStaff = async (role) => (await apiRequest(`/users/lookup/staff${qs({ role })}`)).staff;
export const searchStudents = async (search) => (await apiRequest(`/users/lookup/students${qs({ search })}`)).students;
export const fetchRoles = async () => (await apiRequest('/roles')).roles;

// Semesters
export const fetchSemesters = async () => (await apiRequest('/semesters')).semesters;
export const createSemester = async (body) => (await apiRequest('/semesters', { method: 'POST', body })).semester;
export const updateSemester = async (semesterId, body) =>
  (await apiRequest(`/semesters/${id(semesterId)}`, { method: 'PUT', body })).semester;
export const deleteSemester = async (semesterId) => apiRequest(`/semesters/${id(semesterId)}`, { method: 'DELETE' });

// Courses
export const fetchCourses = async (filters = {}) => (await apiRequest(`/courses${qs(filters)}`)).courses;
export const fetchCourse = async (courseId) => (await apiRequest(`/courses/${id(courseId)}`)).course;
export const createCourse = async (body) => (await apiRequest('/courses', { method: 'POST', body })).course;export const updateCourse = async (courseId, body) =>
  (await apiRequest(`/courses/${id(courseId)}`, { method: 'PUT', body })).course;

// Sections (kind: 'lecture' | 'lab')
export const fetchCourseSections = async (courseId) => apiRequest(`/courses/${id(courseId)}/sections`);
export const createSection = async (courseId, kind, body) =>
  (await apiRequest(`/courses/${id(courseId)}/sections/${kind}`, { method: 'POST', body })).section;
export const updateSection = async (kind, sectionId, body) =>
  (await apiRequest(`/sections/${kind}/${id(sectionId)}`, { method: 'PUT', body })).section;
export const deleteSection = async (kind, sectionId) => apiRequest(`/sections/${kind}/${id(sectionId)}`, { method: 'DELETE' });

// Enrollments
export const fetchEnrollments = async (courseId) => (await apiRequest(`/courses/${id(courseId)}/enrollments`)).enrollments;
export const enrollStudent = async (courseId, body) =>
  (await apiRequest(`/courses/${id(courseId)}/enrollments`, { method: 'POST', body })).enrollment;
export const updateEnrollment = async (enrollmentId, body) =>
  (await apiRequest(`/enrollments/${id(enrollmentId)}`, { method: 'PUT', body })).enrollment;
