// modules/courses/courses.service.js — a student may open only courses they are enrolled in
// (doc §2.2.1: "access courses in which they are not enrolled" is restricted).
import { AppError } from '../../middleware/error.middleware.js';
import { requiredId } from '../../utils/validation.js';
import * as coursesRepository from './courses.repository.js';

function requireStudent(user) {
  if (!user.studentId) throw new AppError('No student profile is linked to this account.', 403);
}

/** Returns the enrollment row, or throws 404 (not enrolled / archived — no information leaked). */
export async function getEnrollmentOrFail(user, rawCourseId) {
  requireStudent(user);
  const row = await coursesRepository.findEnrolledCourse(user.studentId, requiredId(rawCourseId, 'course id'));
  if (!row) throw new AppError('Course not found.', 404);
  return row;
}

export async function getCourse(user, rawCourseId) {
  const r = await getEnrollmentOrFail(user, rawCourseId);
  return {
    courseId: r.course_id,
    code: r.course_code,
    title: r.title,
    description: r.description,
    enrollmentStatus: r.status,
    semester: { name: r.semester_name, startDate: r.start_date, endDate: r.end_date },
    lectureSection: { name: r.lecture_section_name, lecturerName: r.lecturer_name, lecturerEmail: r.lecturer_email },
    labSection: r.lab_section_id
      ? { name: r.lab_section_name, labTeacherName: r.lab_teacher_name, labTeacherEmail: r.lab_teacher_email }
      : null,
  };
}
