import * as profileService from './profile.service.js';

export async function getProfile(req, res) {
  res.status(200).json({ success: true, profile: await profileService.getProfile(req.user) });
}

export async function updateProfile(req, res) {
  res.status(200).json({ success: true, profile: await profileService.updateProfile(req.user, req.body) });
}
