// modules/users/users.controller.js — HTTP handlers for /api/users (administrator portal)
import * as usersService from './users.service.js';

// GET /api/users?search=&role=
export async function listUsers(req, res) {
  const users = await usersService.listUsers({ search: req.query.search, role: req.query.role });
  res.status(200).json({ success: true, users });
}

// GET /api/users/:userId
export async function getUser(req, res) {
  res.status(200).json({ success: true, user: await usersService.getUser(req.params.userId) });
}

// POST /api/users
export async function createUser(req, res) {
  res.status(201).json({ success: true, user: await usersService.createUser(req.user, req.body) });
}

// PATCH /api/users/:userId   { fullName }
export async function updateUser(req, res) {
  res.status(200).json({ success: true, user: await usersService.updateUser(req.params.userId, req.body) });
}

// PATCH /api/users/:userId/status   { isActive }
export async function setActive(req, res) {
  res.status(200).json({ success: true, user: await usersService.setActive(req.user, req.params.userId, req.body) });
}

// POST /api/users/:userId/password-reset   { redirectTo }
export async function sendPasswordReset(req, res) {
  await usersService.sendPasswordReset(req.user, req.params.userId, req.body);
  res.status(200).json({ success: true, message: 'Password reset email sent.' });
}

// PUT /api/users/:userId/roles   { roles: [...] }
export async function setRoles(req, res) {
  res.status(200).json({ success: true, user: await usersService.setRoles(req.user, req.params.userId, req.body) });
}

// PUT /api/users/:userId/student-profile
export async function saveStudentProfile(req, res) {
  res.status(200).json({ success: true, user: await usersService.saveStudentProfile(req.params.userId, req.body) });
}

// PUT /api/users/:userId/staff-profile
export async function saveStaffProfile(req, res) {
  res.status(200).json({ success: true, user: await usersService.saveStaffProfile(req.params.userId, req.body) });
}

// GET /api/users/lookup/staff?role=lecturer|lab_teacher
export async function listStaff(req, res) {
  res.status(200).json({ success: true, staff: await usersService.listStaff(req.query.role) });
}

// GET /api/users/lookup/students?search=
export async function searchStudents(req, res) {
  res.status(200).json({ success: true, students: await usersService.searchStudents(req.query.search) });
}
