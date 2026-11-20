export const MAX_UPLOAD_MB = 10;
export const MAX_UPLOAD_BYTES = MAX_UPLOAD_MB * 1024 * 1024;

export function checkPdfFile(file) {
  if (!file) return 'Please choose a PDF file.';
  const isPdf = file.type === 'application/pdf' && file.name.toLowerCase().endsWith('.pdf');
  if (!isPdf) return 'Only PDF files are allowed.';
  if (file.size === 0) return 'The file is empty.';
  if (file.size > MAX_UPLOAD_BYTES) return `The file is larger than ${MAX_UPLOAD_MB} MB.`;
  return '';
}
