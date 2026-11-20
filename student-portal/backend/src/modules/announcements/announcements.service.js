// modules/announcements/announcements.service.js — course and lab announcements for a student
// (doc §2.2.1). Messages are plain text; the frontend renders them as text (no HTML).
import { optionalId } from '../../utils/validation.js';
import { requireStudent } from '../assignments/assignments.service.js';
import * as announcementsRepository from './announcements.repository.js';

export async function listMyAnnouncements(user, rawCourseId) {
  requireStudent(user);
  const rows = await announcementsRepository.listForStudent(user.studentId, optionalId(rawCourseId, 'course id'));
  return rows.map((r) => ({
    announcementId: r.announcement_id,
    course: { courseId: r.course_id, code: r.course_code, title: r.course_title },
    scope: r.lab_section_id ? 'lab' : r.lecture_section_id ? 'lecture' : 'course',
    title: r.title,
    message: r.message,
    postedBy: r.posted_by_name,
    createdAt: r.created_at,
  }));
}
