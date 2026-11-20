// modules/profile/profile.controller.js — HTTP handlers for /api/profile
// (Shared module: keep identical in every portal's backend.)
import * as profileService from './profile.service.js';

// GET /api/profile
export async function getProfile(req, res) {
  res.status(200).json({ success: true, profile: await profileService.getProfile(req.user) });
}

// PATCH /api/profile   { phoneNumber }
export async function updateProfile(req, res) {
  res.status(200).json({ success: true, profile: await profileService.updateProfile(req.user, req.body) });
}
