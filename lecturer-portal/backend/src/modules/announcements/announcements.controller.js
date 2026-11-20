// modules/announcements/announcements.controller.js — HTTP handlers for announcements (teacher).
// (Shared between the lecturer and lab-teacher portals — see config/teaching.js.)
import * as announcementsService from './announcements.service.js';

// GET /api/{lecture|lab}-sections/:sectionId/announcements
export async function listSectionAnnouncements(req, res) {
  const announcements = await announcementsService.listSectionAnnouncements(req.user, req.params.sectionId);
  res.status(200).json({ success: true, announcements });
}

// POST /api/{lecture|lab}-sections/:sectionId/announcements   { title, message, scope }
export async function createAnnouncement(req, res) {
  const announcement = await announcementsService.createAnnouncement(req.user, req.params.sectionId, req.body);
  res.status(201).json({ success: true, announcement });
}

// PUT /api/announcements/:announcementId   { title, message }
export async function updateAnnouncement(req, res) {
  const announcement = await announcementsService.updateAnnouncement(req.user, req.params.announcementId, req.body);
  res.status(200).json({ success: true, announcement });
}

// DELETE /api/announcements/:announcementId
export async function deleteAnnouncement(req, res) {
  await announcementsService.deleteAnnouncement(req.user, req.params.announcementId);
  res.status(200).json({ success: true });
}
