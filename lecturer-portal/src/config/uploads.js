// config/uploads.js — client-side upload rules. These only give early feedback;
// the backend enforces the same rules (PDF only, MAX_UPLOAD_MB in backend/.env).
export const MAX_UPLOAD_MB = 10;
export const MAX_UPLOAD_BYTES = MAX_UPLOAD_MB * 1024 * 1024;

/** Returns an error message, or '' when the file looks acceptable. */
export function checkPdfFile(file) {
  if (!file) return 'Please choose a PDF file.';
  const isPdf = file.type === 'application/pdf' && file.name.toLowerCase().endsWith('.pdf');
  if (!isPdf) return 'Only PDF files are allowed.';
  if (file.size === 0) return 'The file is empty.';
  if (file.size > MAX_UPLOAD_BYTES) return `The file is larger than ${MAX_UPLOAD_MB} MB.`;
  return '';
}
