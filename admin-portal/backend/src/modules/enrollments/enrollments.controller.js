// modules/enrollments/enrollments.controller.js — HTTP handlers for enrollments (admin)
import * as enrollmentsService from './enrollments.service.js';

// GET /api/courses/:courseId/enrollments
export async function listCourseEnrollments(req, res) {
  const enrollments = await enrollmentsService.listCourseEnrollments(req.params.courseId);
  res.status(200).json({ success: true, enrollments });
}

// POST /api/courses/:courseId/enrollments   { studentId, lectureSectionId, labSectionId|null }
export async function enrollStudent(req, res) {
  const enrollment = await enrollmentsService.enrollStudent(req.params.courseId, req.body);
  res.status(201).json({ success: true, enrollment });
}

// PUT /api/enrollments/:enrollmentId   { lectureSectionId, labSectionId|null, status }
export async function updateEnrollment(req, res) {
  const enrollment = await enrollmentsService.updateEnrollment(req.params.enrollmentId, req.body);
  res.status(200).json({ success: true, enrollment });
}
