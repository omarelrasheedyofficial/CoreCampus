// modules/profile/profile.routes.js — /api/profile (any signed-in user, own data only)
// (Shared module: keep identical in every portal's backend.)
import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware.js';
import { getProfile, updateProfile } from './profile.controller.js';

const router = Router();

router.use(authenticate);
router.get('/', getProfile);
router.patch('/', updateProfile);

export default router;
