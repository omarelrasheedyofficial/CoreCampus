// modules/enrollments/enrollments.controller.js — HTTP handlers for /api/enrollments
import * as enrollmentsService from './enrollments.service.js';

// GET /api/enrollments/me
export async function getMyEnrollments(req, res) {
  const enrollments = await enrollmentsService.getMyEnrollments(req.user);
  res.status(200).json({ success: true, enrollments });
}
