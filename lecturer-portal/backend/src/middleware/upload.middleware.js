// middleware/upload.middleware.js — single-PDF upload handling (doc §6.2: PDF only, max size).
// The file is kept in memory (never written to the server's disk) and then sent to private storage.
import multer from 'multer';
import { env } from '../config/env.js';
import { AppError } from './error.middleware.js';

const PDF_SIGNATURE = Buffer.from('%PDF-');

/** Accepts exactly one file in the form field `file`, up to the configured size. */
export const uploadSinglePdf = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: env.maxUploadBytes, files: 1, fields: 5, fieldSize: 10 * 1024 },
}).single('file');

/** Browsers send multipart filenames as UTF-8 bytes; multer decodes them as latin1. */
function cleanFilename(raw) {
  const name = Buffer.from(raw, 'latin1').toString('utf8');
  const base = name.split(/[\\/]/).pop().replace(/[\u0000-\u001f\u007f]/g, '').trim();
  return (base || 'document.pdf').slice(0, 255);
}

/**
 * Validates the uploaded file is a real PDF: .pdf extension, PDF content type, and the
 * "%PDF-" signature at the start of the bytes (the extension and type alone can be faked).
 * @returns {{ buffer: Buffer, originalFilename: string, mimeType: string, size: number }}
 */
export function requirePdf(file) {
  if (!file) throw new AppError('Please choose a PDF file to upload.', 400);

  const originalFilename = cleanFilename(file.originalname);
  const isPdf =
    originalFilename.toLowerCase().endsWith('.pdf') &&
    file.mimetype === 'application/pdf' &&
    file.buffer.subarray(0, PDF_SIGNATURE.length).equals(PDF_SIGNATURE);

  if (!isPdf) throw new AppError('Only PDF files are allowed.', 400);
  if (file.size === 0) throw new AppError('The file is empty.', 400);

  return { buffer: file.buffer, originalFilename, mimeType: 'application/pdf', size: file.size };
}
