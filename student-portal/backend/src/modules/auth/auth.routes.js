// modules/auth/auth.routes.js — /api/auth
import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware.js';
import { changePassword, getMe, reportFailedLogin } from './auth.controller.js';
import { authLimiter } from '../../config/security.js';

const router = Router();

// Any authenticated CampusCore user (the frontend uses the roles to allow or redirect).
router.get('/me', authenticate, getMe);
// Change your own password (current password, or a fresh reset-email session).
router.post('/password', authLimiter, authenticate, changePassword);
// Client-reported failed sign-in (no session required; rate-limited).
router.post('/login-failed', authLimiter, reportFailedLogin);

export default router;
