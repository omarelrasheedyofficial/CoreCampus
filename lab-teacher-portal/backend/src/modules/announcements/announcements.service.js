import { AppError } from '../../middleware/error.middleware.js';
import { getOwnedSection, TEACHING } from '../../config/teaching.js';
import { oneOf, requiredId, requiredString } from '../../utils/validation.js';
import * as announcementsRepository from './announcements.repository.js';

function toDto(row, user) {
  const courseWide = row.lecture_section_id === null && row.lab_section_id === null;
  return {
    announcementId: row.announcement_id,
    title: row.title,
    message: row.message,
    scope: courseWide ? 'course' : 'section',
    postedBy: row.posted_by_name,
    createdAt: row.created_at,
    canEdit: row.posted_by === user.staffId,
  };
}

function parseFields(body = {}) {
  return {
    title: requiredString(body.title, 'Title', { max: 200 }),
    message: requiredString(body.message, 'Message', { max: 5000 }),
  };
}

async function getOwnAnnouncement(user, rawId) {
  const row = await announcementsRepository.findById(requiredId(rawId, 'announcement id'));
  if (!row) throw new AppError('Announcement not found.', 404);
  if (!user.staffId || row.posted_by !== user.staffId) {
    throw new AppError('You can only change announcements you published.', 403);
  }
  return row;
}

export async function listSectionAnnouncements(user, rawSectionId) {
  const section = await getOwnedSection(user, rawSectionId);
  const rows = await announcementsRepository.listForSection(section[TEACHING.sectionColumn], section.course_id);
  return rows.map((row) => toDto(row, user));
}

export async function createAnnouncement(user, rawSectionId, body = {}) {
  const section = await getOwnedSection(user, rawSectionId);
  const scope = body.scope === undefined ? 'section' : oneOf(body.scope, 'Audience', ['section', 'course']);
  if (scope === 'course' && !TEACHING.allowCourseWideAnnouncements) {
    throw new AppError('You can publish announcements to your own sections only.', 403);
  }
  const id = await announcementsRepository.insert({
    courseId: section.course_id,
    sectionId: scope === 'course' ? null : section[TEACHING.sectionColumn],
    postedBy: user.staffId,
    ...parseFields(body),
  });
  return toDto(await announcementsRepository.findById(id), user);
}

export async function updateAnnouncement(user, rawId, body) {
  const row = await getOwnAnnouncement(user, rawId);
  await announcementsRepository.update(row.announcement_id, parseFields(body));
  return toDto(await announcementsRepository.findById(row.announcement_id), user);
}

export async function deleteAnnouncement(user, rawId) {
  const row = await getOwnAnnouncement(user, rawId);
  await announcementsRepository.remove(row.announcement_id);
}
