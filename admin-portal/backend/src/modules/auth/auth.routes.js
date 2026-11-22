import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware.js';
import { changePassword, getMe, reportFailedLogin } from './auth.controller.js';
import { authLimiter } from '../../config/security.js';
const router = Router();

// Any authenticated CampusCore user. Not rate-limited by authLimiter: it runs on every page load.
router.get('/me', authenticate, getMe);
// Change your own password (current password, or a fresh reset-email session). Rate-limited.
router.post('/password', authLimiter, authenticate, changePassword);
// Client-reported failed sign-in (no session required; rate-limited).
router.post('/login-failed', authLimiter, reportFailedLogin);

export default router;
