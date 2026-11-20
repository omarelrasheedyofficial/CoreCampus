import * as announcementsService from './announcements.service.js';

export async function listSectionAnnouncements(req, res) {
  const announcements = await announcementsService.listSectionAnnouncements(req.user, req.params.sectionId);
  res.status(200).json({ success: true, announcements });
}

export async function createAnnouncement(req, res) {
  const announcement = await announcementsService.createAnnouncement(req.user, req.params.sectionId, req.body);
  res.status(201).json({ success: true, announcement });
}

export async function updateAnnouncement(req, res) {
  const announcement = await announcementsService.updateAnnouncement(req.user, req.params.announcementId, req.body);
  res.status(200).json({ success: true, announcement });
}

export async function deleteAnnouncement(req, res) {
  await announcementsService.deleteAnnouncement(req.user, req.params.announcementId);
  res.status(200).json({ success: true });
}
