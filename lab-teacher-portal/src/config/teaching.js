// config/teaching.js — what "my section" means in this portal (mirrors backend/src/config/teaching.js).
// The section tab pages are identical in the lecturer and lab-teacher portals; only this file differs.
export const TEACHING = Object.freeze({
  kind: 'lab',
  sectionPath: 'lab-sections',
  sectionLabel: 'Lab',
  backLabel: 'My Lab Sections',
  allowCourseWideAnnouncements: false,
  includeLabResults: false,
});
