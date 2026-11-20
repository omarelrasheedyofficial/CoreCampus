// modules/courses/courses.controller.js — HTTP handlers for /api/courses
import * as coursesService from './courses.service.js';

// GET /api/courses?semesterId=&includeArchived=true
export async function listCourses(req, res) {
  const courses = await coursesService.listCourses(req.query);
  res.status(200).json({ success: true, courses });
}

// GET /api/courses/:courseId
export async function getCourse(req, res) {
  res.status(200).json({ success: true, course: await coursesService.getCourse(req.params.courseId) });
}

// POST /api/courses   { semesterId, code, title, description }
export async function createCourse(req, res) {
  res.status(201).json({ success: true, course: await coursesService.createCourse(req.body) });
}

// PUT /api/courses/:courseId   { code, title, description, isArchived }
export async function updateCourse(req, res) {
  res.status(200).json({ success: true, course: await coursesService.updateCourse(req.params.courseId, req.body) });
}
