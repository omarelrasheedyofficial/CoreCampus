// config/portals.js — the four CampusCore portals and the role each one serves.
// Each portal is a separate app with its own login session (separate origin).
export const THIS_PORTAL_ROLE = 'lecturer';
export const THIS_PORTAL_NAME = 'Lecturer Portal';

// Local .env files hold full URLs; on Render the other portals' addresses arrive as bare host
// names (render.yaml fromService), which are always served over HTTPS.
function toUrl(value) {
  if (!value) return value;
  return /^https?:\/\//.test(value) ? value : `https://${value}`;
}

export const PORTALS = [
  { role: 'student', label: 'Student Portal', url: toUrl(import.meta.env.VITE_STUDENT_PORTAL_URL) },
  { role: 'lecturer', label: 'Lecturer Portal', url: window.location.origin },
  { role: 'lab_teacher', label: 'Lab Teacher Portal', url: toUrl(import.meta.env.VITE_LAB_TEACHER_PORTAL_URL) },
  { role: 'admin', label: 'Administrator Portal', url: toUrl(import.meta.env.VITE_ADMIN_PORTAL_URL) },
];

export const ROLE_LABELS = {
  student: 'Student',
  lecturer: 'Lecturer',
  lab_teacher: 'Lab Teacher',
  admin: 'Administrator',
};

/** Portals (other than this one) that the user's roles give access to. */
export function otherPortalsFor(roles = []) {
  return PORTALS.filter((p) => p.role !== THIS_PORTAL_ROLE && p.url && roles.includes(p.role));
}
