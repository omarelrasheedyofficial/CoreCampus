// modules/enrollments/enrollments.service.js — business rules for enrollments.
import { AppError } from '../../middleware/error.middleware.js';
import * as enrollmentsRepository from './enrollments.repository.js';

function toDto(row) {
  return {
    enrollmentId: row.enrollment_id,
    status: row.status,
    enrolledAt: row.enrolled_at,
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
    lectureSection: {
      sectionId: row.lecture_section_id,
      name: row.lecture_section_name,
      lecturerName: row.lecturer_name, // null while no lecturer is assigned
    },
    labSection: row.lab_section_id
      ? {
          sectionId: row.lab_section_id,
          name: row.lab_section_name,
          labTeacherName: row.lab_teacher_name,
        }
      : null,
  };
}

/**
 * A student sees only their own enrollments: the student id comes from the
 * authenticated session, never from the request.
 */
export async function getMyEnrollments(user) {
  if (!user.studentId) {
    throw new AppError('No student profile is linked to this account.', 403);
  }
  const rows = await enrollmentsRepository.findActiveByStudentId(user.studentId);
  return rows.map(toDto);
}
