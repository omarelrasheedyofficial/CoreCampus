// modules/materials/materials.service.js — business rules for lab materials.
// A lab teacher manages materials only in lab sections assigned to them; lecture materials
// (lecturers) and other lab teachers' sections are off-limits (doc §2.2.3).
import crypto from 'node:crypto';
import { env } from '../../config/env.js';
import { withTransaction } from '../../config/db.js';
import { uploadObject, downloadObject, removeObject } from '../../config/storage.js';
import { AppError } from '../../middleware/error.middleware.js';
import { getOwnedSection } from '../lab-sections/lab-sections.service.js';
import * as materialsRepository from './materials.repository.js';

const PG_INTEGER_MAX = 2_147_483_647;
const TITLE_MAX = 200;

function parseId(value) {
  const id = Number(value);
  if (!/^\d+$/.test(String(value)) || id <= 0 || id > PG_INTEGER_MAX) {
    throw new AppError('Invalid material id.', 400);
  }
  return id;
}

function validateTitle(raw) {
  const title = typeof raw === 'string' ? raw.trim() : '';
  if (!title) throw new AppError('Title is required.', 400);
  if (title.length > TITLE_MAX) throw new AppError(`Title must be at most ${TITLE_MAX} characters.`, 400);
  return title;
}

function toDto(row) {
  return {
    materialId: row.material_id,
    title: row.title,
    originalFilename: row.original_filename,
    mimeType: row.mime_type,
    fileSize: Number(row.file_size),
    uploadedBy: row.uploaded_by_name,
    createdAt: row.created_at,
  };
}

/** Loads a material and verifies it belongs to a lab section assigned to this lab teacher. */
async function getOwnedMaterial(user, rawMaterialId) {
  const material = await materialsRepository.findById(parseId(rawMaterialId));
  if (!material || material.is_archived) {
    throw new AppError('Material not found.', 404);
  }
  if (!material.lab_section_id || material.lab_teacher_staff_id !== user.staffId) {
    throw new AppError('You can only manage materials of your own lab sections.', 403);
  }
  return material;
}

export async function listSectionMaterials(user, rawSectionId) {
  const section = await getOwnedSection(user, rawSectionId);
  const rows = await materialsRepository.findByLabSection(section.lab_section_id);
  return rows.map(toDto);
}

/**
 * Stores the PDF in the private bucket first, then records its metadata. If the database insert
 * fails, the stored file is removed again so no orphaned file remains.
 */
export async function uploadSectionMaterial(user, rawSectionId, rawTitle, pdf) {
  const section = await getOwnedSection(user, rawSectionId);
  const title = validateTitle(rawTitle);

  const storageKey = `lab-sections/${section.lab_section_id}/${crypto.randomUUID()}.pdf`;
  await uploadObject(env.materialsBucket, storageKey, pdf.buffer, pdf.mimeType);

  let materialId;
  try {
    materialId = await materialsRepository.insert({
      courseId: section.course_id,
      labSectionId: section.lab_section_id,
      uploadedBy: user.staffId,
      title,
      storageKey,
      originalFilename: pdf.originalFilename,
      mimeType: pdf.mimeType,
      fileSize: pdf.size,
    });
  } catch (err) {
    await removeObject(env.materialsBucket, storageKey).catch(() => {});
    throw err;
  }
  return toDto(await materialsRepository.findOne(materialId));
}

export async function renameMaterial(user, rawMaterialId, rawTitle) {
  const material = await getOwnedMaterial(user, rawMaterialId);
  await materialsRepository.updateTitle(material.material_id, validateTitle(rawTitle));
  return toDto(await materialsRepository.findOne(material.material_id));
}

/** Removes the record and the stored file together: if the file cannot be deleted, the record stays. */
export async function deleteMaterial(user, rawMaterialId) {
  const material = await getOwnedMaterial(user, rawMaterialId);
  await withTransaction(async (client) => {
    await materialsRepository.deleteById(client, material.material_id);
    await removeObject(env.materialsBucket, material.storage_key);
  });
}

export async function downloadMaterial(user, rawMaterialId) {
  const material = await getOwnedMaterial(user, rawMaterialId);
  const buffer = await downloadObject(env.materialsBucket, material.storage_key);
  return { buffer, filename: material.original_filename, mimeType: material.mime_type };
}
