// modules/semesters/semesters.service.js — academic semesters (admin only, doc §2.2.4).
import { AppError } from '../../middleware/error.middleware.js';
import { requiredDate, requiredId, requiredString } from '../../utils/validation.js';
import * as semestersRepository from './semesters.repository.js';

function toDto(row) {
  return {
    semesterId: row.semester_id,
    name: row.name,
    startDate: row.start_date,
    endDate: row.end_date,
    courseCount: row.course_count,
  };
}

function parse(body = {}) {
  const value = {
    name: requiredString(body.name, 'Name', { max: 60 }),
    startDate: requiredDate(body.startDate, 'Start date'),
    endDate: requiredDate(body.endDate, 'End date'),
  };
  if (value.endDate <= value.startDate) {
    throw new AppError('The semester end date must be after its start date.', 400);
  }
  return value;
}

async function getExisting(rawId) {
  const row = await semestersRepository.findById(requiredId(rawId, 'semester id'));
  if (!row) throw new AppError('Semester not found.', 404);
  return row;
}

export async function listSemesters() {
  return (await semestersRepository.list()).map(toDto);
}

export async function createSemester(body) {
  const id = await semestersRepository.insert(parse(body));
  return toDto(await semestersRepository.findById(id));
}

export async function updateSemester(rawId, body) {
  const semester = await getExisting(rawId);
  await semestersRepository.update(semester.semester_id, parse(body));
  return toDto(await semestersRepository.findById(semester.semester_id));
}

/** Only an empty semester can be deleted. */
export async function deleteSemester(rawId) {
  const semester = await getExisting(rawId);
  if (semester.course_count > 0) {
    throw new AppError('This semester has courses, so it cannot be deleted.', 409);
  }
  await semestersRepository.remove(semester.semester_id);
}
