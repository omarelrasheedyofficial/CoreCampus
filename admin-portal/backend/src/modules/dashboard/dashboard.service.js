// modules/dashboard/dashboard.service.js — administrative overview (no grades or submissions).
import * as dashboardRepository from './dashboard.repository.js';

export async function getSummary() {
  const c = await dashboardRepository.getCounts();
  return {
    activeUsers: c.active_users,
    inactiveUsers: c.inactive_users,
    students: c.students,
    lecturers: c.lecturers,
    labTeachers: c.lab_teachers,
    semesters: c.semesters,
    courses: c.courses,
    activeEnrollments: c.active_enrollments,
    unassignedLectureSections: c.unassigned_lecture_sections,
    unassignedLabSections: c.unassigned_lab_sections,
  };
}
