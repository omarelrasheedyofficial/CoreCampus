// modules/submissions/submissions.repository.js — the student's own submission records.
import { query } from '../../config/db.js';

export async function insert({ assignmentId, studentId, storageKey, originalFilename }) {
  await query(
    `INSERT INTO submissions (assignment_id, student_id, storage_key, original_filename)
     VALUES ($1, $2, $3, $4)`,
    [assignmentId, studentId, storageKey, originalFilename],
  );
}

/**
 * Replaces the file of an ungraded submission (permitted resubmission updates the same record,
 * doc §4.4). Returns false if the submission was graded in the meantime.
 */
export async function replaceFile(submissionId, { storageKey, originalFilename }) {
  const { rowCount } = await query(
    `UPDATE submissions
        SET storage_key = $2, original_filename = $3, submitted_at = now()
      WHERE submission_id = $1 AND grade IS NULL`,
    [submissionId, storageKey, originalFilename],
  );
  return rowCount === 1;
}
