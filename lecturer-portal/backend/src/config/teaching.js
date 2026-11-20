// config/teaching.js — what "my section" means in this portal.
// The assignments, submissions, grading and announcements modules are identical in the lecturer
// and lab-teacher portals; only this file differs. Identifiers here are fixed constants, never
// user input, so they are safe to place in SQL text.
export { getOwnedSection } from '../modules/lecture-sections/lecture-sections.service.js';

export const TEACHING = Object.freeze({
  kind: 'lecture', // assignments.assignment_type
  role: 'lecturer',
  label: 'lecture',
  sectionPath: 'lecture-sections', // URL segment
  sectionTable: 'lecture_sections',
  sectionColumn: 'lecture_section_id',
  staffColumn: 'lecturer_staff_id',
  allowCourseWideAnnouncements: true, // "publish course announcements" (doc §2.2.2)
  includeLabResults: true, // "review lab assessment results for courses they coordinate"
});
