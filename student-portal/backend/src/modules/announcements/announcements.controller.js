// modules/announcements/announcements.controller.js — HTTP handlers for /api/announcements (student)
import * as announcementsService from './announcements.service.js';

// GET /api/announcements?courseId=
export async function listMyAnnouncements(req, res) {
  const announcements = await announcementsService.listMyAnnouncements(req.user, req.query.courseId);
  res.status(200).json({ success: true, announcements });
}
