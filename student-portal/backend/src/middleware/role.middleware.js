// middleware/role.middleware.js — role-based access control. Use after authenticate.
// Example: router.use(authenticate, requireRole('student'))
import { AppError } from './error.middleware.js';

export const ROLES = Object.freeze({
  STUDENT: 'student',
  LECTURER: 'lecturer',
  LAB_TEACHER: 'lab_teacher',
  ADMIN: 'admin',
});

/** Allows the request if the user holds at least one of the given roles. */
export function requireRole(...allowedRoles) {
  return (req, res, next) => {
    const roles = req.user?.roles ?? [];
    if (!allowedRoles.some((role) => roles.includes(role))) {
      throw new AppError('You do not have permission to perform this action.', 403);
    }
    next();
  };
}
