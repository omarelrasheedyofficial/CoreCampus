// config/env.js — loads and validates environment variables in one place.
// (Shared file: keep identical in every portal's backend. Per-portal values live in .env.)
import 'dotenv/config';

function required(name) {
  const value = process.env[name];
  if (!value || !value.trim()) {
    throw new Error(`Missing required environment variable: ${name} (see backend/.env.example)`);
  }
  return value.trim();
}

const supabaseUrl = required('SUPABASE_URL').replace(/\/+$/, '');

export const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  isProduction: process.env.NODE_ENV === 'production',
  port: Number(required('PORT')),
  // Only needed when the frontend runs on another origin without the Vite proxy
  clientUrl: process.env.CLIENT_URL || '',

  databaseUrl: required('DATABASE_URL'),
  dbSsl: process.env.DB_SSL !== 'false',
  dbSslCaPath: process.env.DB_SSL_CA_PATH || '',

  supabaseUrl,
  supabaseJwtSecret: process.env.SUPABASE_JWT_SECRET || '',
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',

  // Private Supabase Storage buckets
  materialsBucket: process.env.MATERIALS_BUCKET || 'course-materials',
  submissionsBucket: process.env.SUBMISSIONS_BUCKET || 'student-submissions',
  // Maximum size of one uploaded PDF (doc §6.2)
  maxUploadBytes: (Number(process.env.MAX_UPLOAD_MB) || 10) * 1024 * 1024,
};
