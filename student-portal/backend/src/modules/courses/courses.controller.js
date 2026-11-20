// modules/courses/courses.controller.js — HTTP handlers for /api/courses (student)
import * as coursesService from './courses.service.js';

// GET /api/courses/:courseId
export async function getCourse(req, res) {
  res.status(200).json({ success: true, course: await coursesService.getCourse(req.user, req.params.courseId) });
}
