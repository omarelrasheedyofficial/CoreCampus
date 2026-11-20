// modules/enrollments/enrollments.service.js — admins enroll students in courses and sections,
// move them between sections, and remove (drop) them (doc §2.2.4). Records are never deleted,
// so academic history is kept; a dropped student can be re-enrolled.
import { AppError } from '../../middleware/error.middleware.js';
import { oneOf, optionalId, requiredId } from '../../utils/validation.js';
import { getExisting as getCourse } from '../courses/courses.service.js';
import * as sectionsRepository from '../sections/sections.repository.js';
import * as enrollmentsRepository from './enrollments.repository.js';

const STATUSES = ['active', 'dropped', 'completed'];

function toDto(row) {
  return {
    enrollmentId: row.enrollment_id,
    courseId: row.course_id,
    status: row.status,
    enrolledAt: row.enrolled_at,
    student: { studentId: row.student_id, fullName: row.full_name, email: row.email, universityId: row.university_id },
    lectureSection: { sectionId: row.lecture_section_id, name: row.lecture_section_name },
    labSection: row.lab_section_id ? { sectionId: row.lab_section_id, name: row.lab_section_name } : null,
  };
}

/** Lecture section is required, lab section optional; both must belong to the course. */
async function parseSections(courseId, body = {}) {
  const lectureSectionId = requiredId(body.lectureSectionId, 'lecture section');
  const labSectionId = optionalId(body.labSectionId, 'lab section');
  if (!(await enrollmentsRepository.sectionBelongsToCourse('lecture', lectureSectionId, courseId))) {
    throw new AppError('The selected doctor does not teach this course.', 400);
  }
  if (labSectionId !== null && !(await enrollmentsRepository.sectionBelongsToCourse('lab', labSectionId, courseId))) {
    throw new AppError('The selected TA does not teach this course.', 400);
  }
  return { lectureSectionId, labSectionId };
}

const isMissing = (value) => value === undefined || value === '';

/**
 * When the doctor / TA is not given and the course has exactly one, the student gets that one
 * (so small courses need no choice). With several doctors the admin must choose. An explicit
 * labSectionId of null means "no TA".
 */
async function defaultSections(courseId, body = {}) {
  const [lectures, labs] = await Promise.all([
    isMissing(body.lectureSectionId) ? sectionsRepository.listByCourse('lecture', courseId) : null,
    isMissing(body.labSectionId) ? sectionsRepository.listByCourse('lab', courseId) : null,
  ]);
  const filled = { ...body };
  if (lectures) {
    if (lectures.length === 0) throw new AppError('Add a doctor to this course first.', 400);
    if (lectures.length > 1) throw new AppError('This course has several doctors. Choose the student\'s doctor.', 400);
    filled.lectureSectionId = lectures[0].section_id;
  }
  if (labs) filled.labSectionId = labs.length === 1 ? labs[0].section_id : null;
  return filled;
}

export async function listCourseEnrollments(rawCourseId) {
  const course = await getCourse(rawCourseId);
  return (await enrollmentsRepository.listByCourse(course.course_id)).map(toDto);
}

export async function enrollStudent(rawCourseId, body = {}) {
  const course = await getCourse(rawCourseId);
  if (course.is_archived) throw new AppError('Students cannot be enrolled in an archived course.', 400);

  const studentId = requiredId(body.studentId, 'student');
  if (!(await enrollmentsRepository.isEnrollableStudent(studentId))) {
    throw new AppError('The selected user is not an active student.', 400);
  }
  const sections = await parseSections(course.course_id, await defaultSections(course.course_id, body));

  const existing = await enrollmentsRepository.findByStudentAndCourse(studentId, course.course_id);
  if (existing && existing.status !== 'dropped') {
    throw new AppError('This student is already enrolled in the course.', 409);
  }

  let enrollmentId;
  if (existing) {
    // Re-enroll a previously dropped student by reactivating the same record.
    enrollmentId = existing.enrollment_id;
    await enrollmentsRepository.update(enrollmentId, { ...sections, status: 'active' });
  } else {
    enrollmentId = await enrollmentsRepository.insert({ studentId, courseId: course.course_id, ...sections });
  }
  return toDto(await enrollmentsRepository.findById(enrollmentId));
}

/** Changes sections and/or status (active | dropped | completed). */
export async function updateEnrollment(rawEnrollmentId, body = {}) {
  const enrollment = await enrollmentsRepository.findById(requiredId(rawEnrollmentId, 'enrollment id'));
  if (!enrollment) throw new AppError('Enrollment not found.', 404);
  const sections = await parseSections(enrollment.course_id, body);
  const status = oneOf(body.status, 'Status', STATUSES);
  await enrollmentsRepository.update(enrollment.enrollment_id, { ...sections, status });
  return toDto(await enrollmentsRepository.findById(enrollment.enrollment_id));
}
