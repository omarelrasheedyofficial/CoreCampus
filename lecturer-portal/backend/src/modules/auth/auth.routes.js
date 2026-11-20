import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware.js';
import { changePassword, getMe } from './auth.controller.js';

const router = Router();

router.get('/me', authenticate, getMe);
// Change your own password (current password, or a fresh reset-email session).
router.post('/password', authenticate, changePassword);

export default router;
