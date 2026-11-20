import { AppError } from '../../middleware/error.middleware.js';
import { optionalPhoneNumber } from '../../utils/validation.js';
import * as profileRepository from './profile.repository.js';



function toDto(user, row) {
  return {
    fullName: row.full_name,
    email: row.email,
    roles: user.roles,
    studentProfile: row.university_id
      ? { universityId: row.university_id, major: row.major, academicYear: row.academic_year, phoneNumber: row.student_phone }
      : null,
    staffProfile: row.employee_number
      ? { employeeNumber: row.employee_number, department: row.department, academicTitle: row.academic_title, phoneNumber: row.staff_phone }
      : null,
  };
}

export async function getProfile(user) {
  return toDto(user, await profileRepository.findByUserId(user.userId));
}

export async function updateProfile(user, body = {}) {
  const phoneNumber = optionalPhoneNumber(body.phoneNumber);
  if (!user.studentId && !user.staffId) {
    throw new AppError('Your account has no student or staff profile to update.', 400);
  }
  await profileRepository.updatePhone(user.userId, phoneNumber);
  return getProfile(user);
}
