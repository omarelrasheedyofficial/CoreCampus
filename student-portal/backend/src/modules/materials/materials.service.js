// modules/materials/materials.service.js — students view and download materials of their own
// course sections (doc §2.2.1). Files are read from the private bucket after the check.
import { env } from '../../config/env.js';
import { downloadObject } from '../../config/storage.js';
import { AppError } from '../../middleware/error.middleware.js';
import { requiredId } from '../../utils/validation.js';
import { getEnrollmentOrFail } from '../courses/courses.service.js';
import * as materialsRepository from './materials.repository.js';

function toDto(row) {
  return {
    materialId: row.material_id,
    title: row.title,
    originalFilename: row.original_filename,
    fileSize: Number(row.file_size),
    scope: row.lab_section_id ? 'lab' : row.lecture_section_id ? 'lecture' : 'course',
    uploadedBy: row.uploaded_by_name,
    createdAt: row.created_at,
  };
}

export async function listCourseMaterials(user, rawCourseId) {
  const enrollment = await getEnrollmentOrFail(user, rawCourseId);
  return (await materialsRepository.listForCourse(user.studentId, enrollment.course_id)).map(toDto);
}

export async function downloadMaterial(user, rawMaterialId) {
  if (!user.studentId) throw new AppError('No student profile is linked to this account.', 403);
  const material = await materialsRepository.findVisible(user.studentId, requiredId(rawMaterialId, 'material id'));
  if (!material) throw new AppError('Material not found.', 404);
  const buffer = await downloadObject(env.materialsBucket, material.storage_key);
  return { buffer, filename: material.original_filename, mimeType: material.mime_type };
}
