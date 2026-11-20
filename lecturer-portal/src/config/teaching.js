// config/teaching.js — what "my section" means in this portal (mirrors backend/src/config/teaching.js).
// The section tab pages are identical in the lecturer and lab-teacher portals; only this file differs.
export const TEACHING = Object.freeze({
  kind: 'lecture',
  sectionPath: 'lecture-sections',
  sectionLabel: 'Lecture',
  backLabel: 'My Courses',
  allowCourseWideAnnouncements: true,
  includeLabResults: true,
});
