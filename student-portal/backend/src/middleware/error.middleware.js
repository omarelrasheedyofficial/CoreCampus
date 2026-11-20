// middleware/error.middleware.js — centralized error handling.
// (Shared file: keep identical in every portal's backend.)
import { env } from '../config/env.js';
import { AUDIT_EVENTS, logAuditEvent } from '../config/audit.js';

/** Expected (operational) error with an HTTP status code and a safe, user-facing message. */
export class AppError extends Error {
  constructor(message, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
  }
}

// Friendly messages for database constraints the UI can trigger (names from migration 001).
const CONSTRAINT_MESSAGES = {
  users_email_unique: 'A user with this email already exists.',
  staff_employee_number_key: 'This employee number is already in use.',
  students_university_id_key: 'This university ID is already in use.',
  semesters_name_key: 'A semester with this name already exists.',
  semesters_dates_check: 'The semester end date must be after its start date.',
  courses_code_per_semester_unique: 'This course code already exists in the selected semester.',
  courses_semester_code_unique: 'This course code already exists in the selected semester.',
  lecture_sections_name_unique: 'This course already has a lecture section with that name.',
  lab_sections_name_unique: 'This course already has a lab section with that name.',
  enrollments_student_course_unique: 'This student is already enrolled in the course.',
};

// PostgreSQL error codes → HTTP status
const PG_STATUS = {
  23505: 409, // unique_violation
  23503: 409, // foreign_key_violation
  23514: 400, // check_violation
};

export function notFound(req, res) {
  res.status(404).json({ success: false, message: 'Endpoint not found.' });
}

// Express recognises error handlers by their 4 parameters.
// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  if (err instanceof AppError) {
    if (err.statusCode === 403) {
      // Unauthorized access attempt (doc §6.7): who, what, where — never request bodies or tokens.
      logAuditEvent({
        userId: req.user?.userId ?? null,
        eventType: AUDIT_EVENTS.UNAUTHORIZED_ACCESS,
        entityType: 'endpoint',
        entityId: `${req.method} ${req.originalUrl.split('?')[0]}`.slice(0, 60),
        details: { reason: err.message, ip: req.ip },
      });
    }
    return res.status(err.statusCode).json({ success: false, message: err.message });
  }

  // Malformed JSON body
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ success: false, message: 'Invalid JSON body.' });
  }

  // File upload errors raised by multer (size limit, unexpected fields, too many files)
  if (err.name === 'MulterError') {
    const tooLarge = err.code === 'LIMIT_FILE_SIZE';
    return res.status(tooLarge ? 413 : 400).json({
      success: false,
      message: tooLarge ? 'The file is too large.' : 'Invalid file upload.',
    });
  }

  // Database integrity rules (doc §4.4) violated by a request
  if (PG_STATUS[err.code]) {
    const fallback =
      err.code === '23503'
        ? 'This record is linked to other records, so it cannot be changed or removed.'
        : err.code === '23505'
          ? 'A record with these details already exists.'
          : 'One of the values is not allowed.';
    return res.status(PG_STATUS[err.code]).json({
      success: false,
      message: CONSTRAINT_MESSAGES[err.constraint] ?? fallback,
    });
  }

  // Unexpected error: log details on the server, never leak them to the client.
  console.error(err);
  res.status(500).json({
    success: false,
    message: 'An unexpected error occurred.',
    ...(!env.isProduction && { detail: err.message }),
  });
}
