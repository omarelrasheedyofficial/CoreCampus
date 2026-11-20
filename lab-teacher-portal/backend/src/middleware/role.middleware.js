import { AppError } from './error.middleware.js';

export const ROLES = Object.freeze({
  STUDENT: 'student',
  LECTURER: 'lecturer',
  LAB_TEACHER: 'lab_teacher',
  ADMIN: 'admin',
});

export function requireRole(...allowedRoles) {
  return (req, res, next) => {
    const roles = req.user?.roles ?? [];
    if (!allowedRoles.some((role) => roles.includes(role))) {
      throw new AppError('You do not have permission to perform this action.', 403);
    }
    next();
  };
}
