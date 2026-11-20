import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware.js';
import { requireRole } from '../../middleware/role.middleware.js';
import { TEACHING } from '../../config/teaching.js';
import * as c from './assignments.controller.js';

const router = Router();
const teacherOnly = [authenticate, requireRole(TEACHING.role)];

router.get(`/${TEACHING.sectionPath}/:sectionId/assignments`, teacherOnly, c.listSectionAssignments);
router.post(`/${TEACHING.sectionPath}/:sectionId/assignments`, teacherOnly, c.createAssignment);
router.get('/assignments/:assignmentId', teacherOnly, c.getAssignment);
router.put('/assignments/:assignmentId', teacherOnly, c.updateAssignment);
router.delete('/assignments/:assignmentId', teacherOnly, c.deleteAssignment);

export default router;
