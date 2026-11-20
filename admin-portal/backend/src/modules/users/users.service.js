// modules/users/users.service.js — administrator management of university accounts (doc §2.2.4).
// Admins create/activate/deactivate users and assign roles; they never see passwords and have
// no access to grades or submissions here.
import { withTransaction } from '../../config/db.js';
import { AUDIT_EVENTS, logAuditEvent } from '../../config/audit.js';
import { createAuthUser, deleteAuthUser, sendPasswordResetEmail, setAuthUserBlocked } from '../../config/identity.js';
import { AppError } from '../../middleware/error.middleware.js';
import { ROLES } from '../../middleware/role.middleware.js';
import {
  oneOf,
  optionalInt,
  optionalPhoneNumber,
  optionalString,
  requiredBoolean,
  requiredEmail,
  requiredId,
  requiredPassword,
  requiredString,
} from '../../utils/validation.js';
import * as usersRepository from './users.repository.js';

const ALL_ROLES = Object.values(ROLES);
const STAFF_ROLES = [ROLES.LECTURER, ROLES.LAB_TEACHER];

function toDto(row) {
  return {
    userId: row.user_id,
    fullName: row.full_name,
    email: row.email,
    isActive: row.is_active,
    createdAt: row.created_at,
    roles: row.roles,
    studentProfile: row.student_id
      ? {
          studentId: row.student_id,
          universityId: row.university_id,
          major: row.major,
          academicYear: row.academic_year,
          phoneNumber: row.student_phone,
        }
      : null,
    staffProfile: row.staff_id
      ? {
          staffId: row.staff_id,
          employeeNumber: row.employee_number,
          department: row.department,
          academicTitle: row.academic_title,
          phoneNumber: row.staff_phone,
        }
      : null,
  };
}

function parseRoles(value) {
  if (!Array.isArray(value) || value.length === 0) throw new AppError('Select at least one role.', 400);
  const roles = [...new Set(value)];
  roles.forEach((r) => oneOf(r, 'Role', ALL_ROLES));
  return roles;
}

function parseStudentProfile(p = {}) {
  return {
    universityId: requiredString(p.universityId, 'University ID', { max: 30 }),
    major: optionalString(p.major, 'Major', { max: 120 }),
    academicYear: optionalInt(p.academicYear, 'Academic year', { min: 1, max: 7 }),
    phoneNumber: optionalPhoneNumber(p.phoneNumber),
  };
}

function parseStaffProfile(p = {}) {
  return {
    employeeNumber: requiredString(p.employeeNumber, 'Employee number', { max: 30 }),
    department: optionalString(p.department, 'Department', { max: 120 }),
    academicTitle: optionalString(p.academicTitle, 'Academic title', { max: 60 }),
    phoneNumber: optionalPhoneNumber(p.phoneNumber),
  };
}

async function getExisting(rawUserId) {
  const row = await usersRepository.findById(requiredId(rawUserId, 'user id'));
  if (!row) throw new AppError('User not found.', 404);
  return row;
}

export async function listUsers({ search, role }) {
  const rows = await usersRepository.list({
    search: optionalString(search, 'Search', { max: 100 }),
    role: role ? oneOf(role, 'Role', ALL_ROLES) : null,
  });
  return rows.map(toDto);
}

export async function getUser(rawUserId) {
  return toDto(await getExisting(rawUserId));
}

/**
 * Creates the Supabase Auth account, then the CampusCore user, roles and profile in one transaction.
 * If the database step fails, the new Auth account is deleted again.
 */
export async function createUser(actor, body = {}) {
  const fullName = requiredString(body.fullName, 'Full name', { max: 150 });
  const email = requiredEmail(body.email);
  const password = requiredPassword(body.password);
  const roles = parseRoles(body.roles);
  const studentProfile = roles.includes(ROLES.STUDENT) ? parseStudentProfile(body.studentProfile) : null;
  const staffProfile = roles.some((r) => STAFF_ROLES.includes(r)) ? parseStaffProfile(body.staffProfile) : null;

  if (await usersRepository.existsByEmail(email)) {
    throw new AppError('A user with this email already exists.', 409);
  }

  let authUserId;
  try {
    authUserId = await createAuthUser(email, password);
  } catch (err) {
    if (err.authStatus === 422 || /already/i.test(err.message)) {
      throw new AppError('An account with this email already exists in the authentication service.', 409);
    }
    if (err.authStatus === 400 || /password/i.test(err.message)) {
      throw new AppError(`The authentication service rejected the account: ${err.message}`, 400);
    }
    throw err;
  }

  try {
    const userId = await withTransaction(async (client) => {
      const id = await usersRepository.insert(client, { authUserId, fullName, email });
      await usersRepository.replaceRoles(client, id, roles);
      if (studentProfile) await usersRepository.upsertStudentProfile(client, id, studentProfile);
      if (staffProfile) await usersRepository.upsertStaffProfile(client, id, staffProfile);
      return id;
    });
    await logAuditEvent({
      userId: actor.userId,
      eventType: AUDIT_EVENTS.ACCOUNT_CREATED,
      entityType: 'user',
      entityId: userId,
      details: { roles },
    });
    return toDto(await usersRepository.findById(userId));
  } catch (err) {
    await deleteAuthUser(authUserId).catch((cleanupErr) =>
      console.error(`Could not remove auth user ${authUserId} after failed create:`, cleanupErr.message),
    );
    throw err;
  }
}

export async function updateUser(rawUserId, body = {}) {
  const user = await getExisting(rawUserId);
  await usersRepository.updateName(user.user_id, requiredString(body.fullName, 'Full name', { max: 150 }));
  return toDto(await usersRepository.findById(user.user_id));
}

/**
 * Emails the user a one-time "choose a new password" link (for someone who cannot use
 * Forgot password themselves). The administrator never sees or sets the new password.
 * `redirectTo` is the reset page of the portal the user works in; Supabase only accepts it when
 * it is in the project's Redirect URLs list.
 */
export async function sendPasswordReset(actor, rawUserId, body = {}) {
  const user = await getExisting(rawUserId);
  if (!user.is_active) throw new AppError('This account is deactivated. Activate it first.', 400);

  let redirectTo;
  try {
    redirectTo = new URL(requiredString(body.redirectTo, 'Portal address', { max: 300 }));
  } catch (err) {
    if (err instanceof AppError) throw err;
    throw new AppError('The portal address is not valid.', 400);
  }
  if (!['http:', 'https:'].includes(redirectTo.protocol) || redirectTo.pathname !== '/reset-password') {
    throw new AppError('The portal address is not valid.', 400);
  }

  try {
    await sendPasswordResetEmail(user.email, redirectTo.toString());
  } catch (err) {
    if (err.authStatus === 429) {
      throw new AppError('Too many emails were sent recently. Please wait a while and try again.', 429);
    }
    throw err;
  }
  await logAuditEvent({
    userId: actor.userId,
    eventType: AUDIT_EVENTS.PASSWORD_RESET_SENT,
    entityType: 'user',
    entityId: user.user_id,
    details: { portal: redirectTo.origin },
  });
}

/** Activates/deactivates in CampusCore and blocks/unblocks sign-in at Supabase Auth together. */
export async function setActive(actor, rawUserId, body = {}) {
  const user = await getExisting(rawUserId);
  const isActive = requiredBoolean(body.isActive, 'isActive');
  if (user.user_id === actor.userId && !isActive) {
    throw new AppError('You cannot deactivate your own account.', 400);
  }
  await withTransaction(async (client) => {
    await usersRepository.setActive(client, user.user_id, isActive);
    await setAuthUserBlocked(user.auth_user_id, !isActive); // failure rolls back the DB change
  });
  if (isActive !== user.is_active) {
    await logAuditEvent({
      userId: actor.userId,
      eventType: AUDIT_EVENTS.ACCOUNT_STATUS_CHANGED,
      entityType: 'user',
      entityId: user.user_id,
      details: { isActive },
    });
  }
  return toDto(await usersRepository.findById(user.user_id));
}

/**
 * Replaces a user's roles. Teaching roles need a staff profile, the student role a student
 * profile; a role cannot be removed while it is still in use, and admins keep their own admin role.
 */
export async function setRoles(actor, rawUserId, body = {}) {
  const user = await getExisting(rawUserId);
  const roles = parseRoles(body.roles);
  const removed = user.roles.filter((r) => !roles.includes(r));

  if (user.user_id === actor.userId && removed.includes(ROLES.ADMIN)) {
    throw new AppError('You cannot remove your own administrator role.', 400);
  }
  if (roles.includes(ROLES.STUDENT) && !user.student_id) {
    throw new AppError('Add a student profile before assigning the Student role.', 400);
  }
  if (roles.some((r) => STAFF_ROLES.includes(r)) && !user.staff_id) {
    throw new AppError('Add a staff profile before assigning a teaching role.', 400);
  }
  if (user.staff_id && (removed.includes(ROLES.LECTURER) || removed.includes(ROLES.LAB_TEACHER))) {
    const { lectures, labs } = await usersRepository.countTeachingAssignments(user.staff_id);
    if (removed.includes(ROLES.LECTURER) && lectures > 0) {
      throw new AppError(`Unassign this lecturer from ${lectures} lecture section(s) first.`, 409);
    }
    if (removed.includes(ROLES.LAB_TEACHER) && labs > 0) {
      throw new AppError(`Unassign this lab teacher from ${labs} lab section(s) first.`, 409);
    }
  }
  if (user.student_id && removed.includes(ROLES.STUDENT)) {
    const active = await usersRepository.countActiveEnrollments(user.student_id);
    if (active > 0) throw new AppError(`Remove the student's ${active} active enrollment(s) first.`, 409);
  }

  await withTransaction((client) => usersRepository.replaceRoles(client, user.user_id, roles));
  const added = roles.filter((r) => !user.roles.includes(r));
  if (added.length || removed.length) {
    await logAuditEvent({
      userId: actor.userId,
      eventType: AUDIT_EVENTS.ROLE_CHANGED,
      entityType: 'user',
      entityId: user.user_id,
      details: { added, removed },
    });
  }
  return toDto(await usersRepository.findById(user.user_id));
}

export async function saveStudentProfile(rawUserId, body) {
  const user = await getExisting(rawUserId);
  const profile = parseStudentProfile(body);
  await withTransaction((client) => usersRepository.upsertStudentProfile(client, user.user_id, profile));
  return toDto(await usersRepository.findById(user.user_id));
}

export async function saveStaffProfile(rawUserId, body) {
  const user = await getExisting(rawUserId);
  const profile = parseStaffProfile(body);
  await withTransaction((client) => usersRepository.upsertStaffProfile(client, user.user_id, profile));
  return toDto(await usersRepository.findById(user.user_id));
}

export async function listStaff(role) {
  const rows = await usersRepository.listStaffWithRole(oneOf(role, 'Role', STAFF_ROLES));
  return rows.map((r) => ({
    staffId: r.staff_id,
    fullName: r.full_name,
    email: r.email,
    employeeNumber: r.employee_number,
    academicTitle: r.academic_title,
  }));
}

export async function searchStudents(search) {
  const rows = await usersRepository.searchStudents(optionalString(search, 'Search', { max: 100 }));
  return rows.map((r) => ({
    studentId: r.student_id,
    fullName: r.full_name,
    email: r.email,
    universityId: r.university_id,
    major: r.major,
  }));
}
