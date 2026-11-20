// modules/courses/courses.service.js — course catalogue per semester (admin only, doc §2.2.4).
// A course is created on its own. Its doctors and teacher assistants are added afterwards
// (sections module): each doctor has a lecture group and each TA a lab group inside the course.
import { AppError } from '../../middleware/error.middleware.js';
import { optionalId, optionalString, requiredBoolean, requiredId, requiredString } from '../../utils/validation.js';
import * as semestersRepository from '../semesters/semesters.repository.js';
import * as coursesRepository from './courses.repository.js';

const CODE_RE = /^[A-Z0-9-]{2,20}$/;

function toDto(row) {
  return {
    courseId: row.course_id,
    code: row.course_code,
    title: row.title,
    description: row.description,
    isArchived: row.is_archived,
    semester: { semesterId: row.semester_id, name: row.semester_name },
    lectureSectionCount: row.lecture_section_count,
    labSectionCount: row.lab_section_count,
    activeEnrollments: row.active_enrollments,
    lecturerNames: row.lecturer_names ?? [], // doctors teaching the course (lecture groups)
    labTeacherNames: row.lab_teacher_names ?? [], // teacher assistants (lab groups)
  };
}

function parseCode(value) {
  const code = requiredString(value, 'Course code', { max: 20 }).toUpperCase();
  if (!CODE_RE.test(code)) throw new AppError('Course code may contain only letters, digits and "-".', 400);
  return code;
}

export async function getExisting(rawId) {
  const row = await coursesRepository.findById(requiredId(rawId, 'course id'));
  if (!row) throw new AppError('Course not found.', 404);
  return row;
}

export async function listCourses({ semesterId, includeArchived }) {
  const rows = await coursesRepository.list({
    semesterId: optionalId(semesterId, 'semester id'),
    includeArchived: includeArchived === 'true',
  });
  return rows.map(toDto);
}

export async function getCourse(rawId) {
  return toDto(await getExisting(rawId));
}

export async function createCourse(body = {}) {
  const semesterId = requiredId(body.semesterId, 'semester');
  if (!(await semestersRepository.findById(semesterId))) throw new AppError('Semester not found.', 400);
  const id = await coursesRepository.insert({
    semesterId,
    code: parseCode(body.code),
    title: requiredString(body.title, 'Title', { max: 200 }),
    description: optionalString(body.description, 'Description', { max: 2000 }),
  });
  return toDto(await coursesRepository.findById(id));
}

export async function updateCourse(rawId, body = {}) {
  const course = await getExisting(rawId);
  await coursesRepository.update(course.course_id, {
    code: parseCode(body.code),
    title: requiredString(body.title, 'Title', { max: 200 }),
    description: optionalString(body.description, 'Description', { max: 2000 }),
    isArchived: requiredBoolean(body.isArchived, 'isArchived'),
  });
  return toDto(await coursesRepository.findById(course.course_id));
}
