import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware.js';
import { requireRole } from '../../middleware/role.middleware.js';
import { TEACHING } from '../../config/teaching.js';
import * as c from './announcements.controller.js';

const router = Router();
const teacherOnly = [authenticate, requireRole(TEACHING.role)];

router.get(`/${TEACHING.sectionPath}/:sectionId/announcements`, teacherOnly, c.listSectionAnnouncements);
router.post(`/${TEACHING.sectionPath}/:sectionId/announcements`, teacherOnly, c.createAnnouncement);
router.put('/announcements/:announcementId', teacherOnly, c.updateAnnouncement);
router.delete('/announcements/:announcementId', teacherOnly, c.deleteAnnouncement);

export default router;
