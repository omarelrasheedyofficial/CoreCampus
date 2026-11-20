// modules/users/users.routes.js — /api/users (administrator portal)
import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware.js';
import { requireRole, ROLES } from '../../middleware/role.middleware.js';
import * as c from './users.controller.js';

const router = Router();

router.use(authenticate, requireRole(ROLES.ADMIN));

router.get('/lookup/staff', c.listStaff);
router.get('/lookup/students', c.searchStudents);

router.get('/', c.listUsers);
router.post('/', c.createUser);
router.get('/:userId', c.getUser);
router.patch('/:userId', c.updateUser);
router.patch('/:userId/status', c.setActive);
router.post('/:userId/password-reset', c.sendPasswordReset);
router.put('/:userId/roles', c.setRoles);
router.put('/:userId/student-profile', c.saveStudentProfile);
router.put('/:userId/staff-profile', c.saveStaffProfile);

export default router;
