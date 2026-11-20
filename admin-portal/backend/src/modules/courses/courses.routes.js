// modules/courses/courses.routes.js — /api/courses (administrator portal)
import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware.js';
import { requireRole, ROLES } from '../../middleware/role.middleware.js';
import * as c from './courses.controller.js';

const router = Router();

router.use(authenticate, requireRole(ROLES.ADMIN));

router.get('/', c.listCourses);
router.post('/', c.createCourse);
router.get('/:courseId', c.getCourse);
router.put('/:courseId', c.updateCourse);
export default router;
