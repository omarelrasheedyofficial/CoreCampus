// config/teaching.js — what "my section" means in this portal.
// The assignments, submissions, grading and announcements modules are identical in the lecturer
// and lab-teacher portals; only this file differs. Identifiers here are fixed constants, never
// user input, so they are safe to place in SQL text.
export { getOwnedSection } from '../modules/lab-sections/lab-sections.service.js';

export const TEACHING = Object.freeze({
  kind: 'lab', // assignments.assignment_type
  role: 'lab_teacher',
  label: 'lab',
  sectionPath: 'lab-sections', // URL segment
  sectionTable: 'lab_sections',
  sectionColumn: 'lab_section_id',
  staffColumn: 'lab_teacher_staff_id',
  allowCourseWideAnnouncements: false, // lab teachers publish lab-section announcements only
  includeLabResults: false,
});
