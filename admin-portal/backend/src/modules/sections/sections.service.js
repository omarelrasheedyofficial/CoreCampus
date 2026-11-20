// modules/sections/sections.service.js — admins create lecture/lab sections and assign
// lecturers and lab teachers to them (doc §2.2.4).
import { AppError } from '../../middleware/error.middleware.js';
import { oneOf, requiredId, requiredString } from '../../utils/validation.js';
import { getExisting as getCourse } from '../courses/courses.service.js';
import * as sectionsRepository from './sections.repository.js';

const KIND_NAMES = Object.keys(sectionsRepository.KINDS);
const LABELS = { lecture: 'lecturer', lab: 'lab teacher' };

function toDto(row) {
  return {
    sectionId: row.section_id,
    courseId: row.course_id,
    name: row.section_name,
    staffId: row.staff_id,
    staffName: row.staff_name, // null while unassigned
    studentCount: row.student_count,
  };
}

function parseKind(value) {
  return oneOf(value, 'Section type', KIND_NAMES);
}

/** Validates the section name and its teacher (the database requires one on every section). */
async function parseBody(kind, body = {}) {
  const sectionName = requiredString(body.sectionName, 'Section name', { max: 50 });
  if (body.staffId === undefined || body.staffId === null || body.staffId === '') {
    throw new AppError(`Choose the ${LABELS[kind]} for this section.`, 400);
  }
  const staffId = requiredId(body.staffId, 'staff member');
  const { role } = sectionsRepository.KINDS[kind];
  if (!(await sectionsRepository.staffHasRole(staffId, role))) {
    throw new AppError(`The selected staff member is not an active ${LABELS[kind]}.`, 400);
  }
  return { sectionName, staffId };
}

async function getExisting(kind, rawId) {
  const row = await sectionsRepository.findById(kind, requiredId(rawId, 'section id'));
  if (!row) throw new AppError('Section not found.', 404);
  return row;
}

export async function listCourseSections(rawCourseId) {
  const course = await getCourse(rawCourseId);
  const [lecture, lab] = await Promise.all([
    sectionsRepository.listByCourse('lecture', course.course_id),
    sectionsRepository.listByCourse('lab', course.course_id),
  ]);
  return { lectureSections: lecture.map(toDto), labSections: lab.map(toDto) };
}

/**
 * Adds a doctor (lecture group) or teacher assistant (lab group) to a course. The group name is
 * optional and defaults to the teacher's name; a teacher can be added to a course only once.
 */
export async function createSection(rawCourseId, rawKind, body = {}) {
  const kind = parseKind(rawKind);
  const course = await getCourse(rawCourseId);
  if (course.is_archived) throw new AppError('Teachers cannot be added to an archived course.', 400);
  if (body.staffId === undefined || body.staffId === null || body.staffId === '') {
    throw new AppError(`Choose the ${LABELS[kind]} to add.`, 400);
  }
  const staffId = requiredId(body.staffId, 'staff member');
  const staffName = await sectionsRepository.activeStaffName(staffId, sectionsRepository.KINDS[kind].role);
  if (!staffName) throw new AppError(`The selected staff member is not an active ${LABELS[kind]}.`, 400);
  if (await sectionsRepository.staffTeachesCourse(kind, course.course_id, staffId)) {
    throw new AppError(`${staffName} already teaches this course.`, 409);
  }
  const sectionName = body.sectionName?.trim()
    ? requiredString(body.sectionName, 'Section name', { max: 50 })
    : staffName.slice(0, 50);
  const id = await sectionsRepository.insert(kind, { courseId: course.course_id, sectionName, staffId });
  return toDto(await sectionsRepository.findById(kind, id));
}

/** Renames a section and/or (re)assigns its lecturer or lab teacher; staffId null unassigns. */
export async function updateSection(rawKind, rawId, body) {
  const kind = parseKind(rawKind);
  const section = await getExisting(kind, rawId);
  await sectionsRepository.update(kind, section.section_id, await parseBody(kind, body));
  return toDto(await sectionsRepository.findById(kind, section.section_id));
}

/** A section can be deleted only while no enrollment refers to it. */
export async function deleteSection(rawKind, rawId) {
  const kind = parseKind(rawKind);
  const section = await getExisting(kind, rawId);
  const enrollments = await sectionsRepository.countEnrollments(kind, section.section_id);
  if (enrollments > 0) {
    throw new AppError(
      `${section.staff_name ?? 'This teacher'} still has ${enrollments} student record(s) in this course. Move those students to another ${kind === 'lecture' ? 'doctor' : 'TA'} first.`,
      409,
    );
  }
  await sectionsRepository.remove(kind, section.section_id); // materials/assignments also block (FK → 409)
}
