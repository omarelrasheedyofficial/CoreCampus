// modules/lecture-sections/lecture-sections.service.js — business rules for a lecturer's sections.
// A lecturer may only see lecture sections assigned to them (doc §2.2.2, §6.6.3).
import { AppError } from '../../middleware/error.middleware.js';
import * as sectionsRepository from './lecture-sections.repository.js';

function requireStaff(user) {
  if (!user.staffId) {
    throw new AppError('No staff profile is linked to this account.', 403);
  }
}

const PG_INTEGER_MAX = 2_147_483_647;

function parseSectionId(value) {
  const id = Number(value);
  if (!/^\d+$/.test(String(value)) || id <= 0 || id > PG_INTEGER_MAX) {
    throw new AppError('Invalid section id.', 400);
  }
  return id;
}

function toSectionDto(row) {
  return {
    sectionId: row.lecture_section_id,
    name: row.section_name,
    course: {
      courseId: row.course_id,
      code: row.course_code,
      title: row.title,
      description: row.description,
    },
    semester: {
      semesterId: row.semester_id,
      name: row.semester_name,
      startDate: row.start_date,
      endDate: row.end_date,
    },
  };
}

/**
 * Loads a lecture section and verifies the signed-in lecturer is assigned to it.
 * Used by every lecturer operation scoped to a section (students, materials, …).
 */
export async function getOwnedSection(user, rawSectionId) {
  requireStaff(user);
  const section = await sectionsRepository.findById(parseSectionId(rawSectionId));
  if (!section || section.is_archived) {
    throw new AppError('Lecture section not found.', 404);
  }
  if (section.lecturer_staff_id !== user.staffId) {
    throw new AppError('You are not assigned to this lecture section.', 403);
  }
  return section;
}

export async function getMySections(user) {
  requireStaff(user);
  const rows = await sectionsRepository.findByLecturer(user.staffId);
  return rows.map((row) => ({
    ...toSectionDto(row),
    studentCount: row.student_count,
    labSectionCount: row.lab_section_count,
  }));
}

export async function getSection(user, rawSectionId) {
  return toSectionDto(await getOwnedSection(user, rawSectionId));
}

export async function getSectionStudents(user, rawSectionId) {
  const section = await getOwnedSection(user, rawSectionId);
  const rows = await sectionsRepository.findStudents(section.lecture_section_id);
  return rows.map((row) => ({
    enrollmentId: row.enrollment_id,
    status: row.status,
    enrolledAt: row.enrolled_at,
    fullName: row.full_name,
    email: row.email,
    universityId: row.university_id,
    major: row.major,
    academicYear: row.academic_year,
    labSectionName: row.lab_section_name, // null when the student has no lab section
  }));
}
