// utils/validation.js — small server-side input validators (doc §6.2: validate incoming data).
// Each returns the cleaned value or throws a 400 AppError with a user-facing message.
// (Shared file: keep identical in every portal's backend.)
import { AppError } from '../middleware/error.middleware.js';

const PG_INTEGER_MAX = 2_147_483_647;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export function requiredString(value, field, { max = 200, min = 1 } = {}) {
  const text = typeof value === 'string' ? value.trim() : '';
  if (text.length < min) throw new AppError(`${field} is required.`, 400);
  if (text.length > max) throw new AppError(`${field} must be at most ${max} characters.`, 400);
  return text;
}

/** Empty / missing → null. */
export function optionalString(value, field, { max = 200 } = {}) {
  if (value === undefined || value === null) return null;
  if (typeof value !== 'string') throw new AppError(`${field} must be text.`, 400);
  const text = value.trim();
  if (!text) return null;
  if (text.length > max) throw new AppError(`${field} must be at most ${max} characters.`, 400);
  return text;
}


/** Empty / missing phone numbers are allowed; otherwise accept at most 15 digits. */
export function optionalPhoneNumber(value) {
  const phone = optionalString(value, 'Phone number', { max: 16 });
  if (phone !== null && !/^\+?[0-9]{1,15}$/.test(phone)) {
    throw new AppError('Phone number must contain 1 to 15 digits, with an optional + at the start.', 400);
  }
  return phone;
}

export function requiredId(value, field = 'id') {
  const id = Number(value);
  if (!/^\d+$/.test(String(value)) || id <= 0 || id > PG_INTEGER_MAX) {
    throw new AppError(`Invalid ${field}.`, 400);
  }
  return id;
}

/** Empty / missing → null. */
export function optionalId(value, field) {
  if (value === undefined || value === null || value === '') return null;
  return requiredId(value, field);
}

export function requiredEmail(value) {
  const email = requiredString(value, 'Email', { max: 255 }).toLowerCase();
  if (!EMAIL_RE.test(email)) throw new AppError('Email address is not valid.', 400);
  return email;
}

/** A real calendar date in YYYY-MM-DD form (rejects e.g. 2027-02-31, which JS would roll over). */
export function requiredDate(value, field) {
  const valid =
    typeof value === 'string' &&
    DATE_RE.test(value) &&
    new Date(`${value}T00:00:00Z`).toISOString().slice(0, 10) === value;
  if (!valid) throw new AppError(`${field} must be a valid date (YYYY-MM-DD).`, 400);
  return value;
}

/** An ISO-8601 date-time (e.g. from <input type="datetime-local"> converted with toISOString()). */
export function requiredDateTime(value, field) {
  const date = typeof value === 'string' && value.trim() ? new Date(value) : null;
  if (!date || Number.isNaN(date.getTime())) throw new AppError(`${field} must be a valid date and time.`, 400);
  const year = date.getUTCFullYear();
  if (year < 2000 || year > 2100) throw new AppError(`${field} is out of range.`, 400);
  return date;
}

/** A grade between 0 and 100 with at most two decimals (doc §4.4). */
export function requiredGrade(value) {
  const n = typeof value === 'string' && value.trim() !== '' ? Number(value) : value;
  if (typeof n !== 'number' || !Number.isFinite(n) || n < 0 || n > 100) {
    throw new AppError('Grade must be a number between 0 and 100.', 400);
  }
  if (Math.round(n * 100) !== n * 100) throw new AppError('Grade may have at most two decimals.', 400);
  return n;
}

export function requiredBoolean(value, field) {
  if (typeof value !== 'boolean') throw new AppError(`${field} must be true or false.`, 400);
  return value;
}

export function optionalInt(value, field, { min, max }) {
  if (value === undefined || value === null || value === '') return null;
  const n = Number(value);
  if (!Number.isInteger(n) || n < min || n > max) {
    throw new AppError(`${field} must be a whole number between ${min} and ${max}.`, 400);
  }
  return n;
}

export function oneOf(value, field, allowed) {
  if (!allowed.includes(value)) throw new AppError(`${field} must be one of: ${allowed.join(', ')}.`, 400);
  return value;
}

/**
 * Password rules for new accounts (doc §6.6): at least 10 characters with an upper-case letter,
 * a lower-case letter and a digit. Supabase Auth hashes it (bcrypt); CampusCore never stores it.
 */
export function requiredPassword(value) {
  if (typeof value !== 'string' || value.length < 10 || value.length > 72) {
    throw new AppError('Password must be 10–72 characters long.', 400);
  }
  if (!/[a-z]/.test(value) || !/[A-Z]/.test(value) || !/\d/.test(value)) {
    throw new AppError('Password must include an upper-case letter, a lower-case letter and a digit.', 400);
  }
  return value;
}
