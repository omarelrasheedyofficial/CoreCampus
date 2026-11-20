// config/storage.js — the only place that talks to Supabase Storage.
// Buckets are private: files are never publicly reachable. The backend checks the user's
// permissions first, then uses the service-role client to read or write the object (doc §4.5).
// (Shared file: keep identical in every portal's backend.)
import { createSupabaseAdmin } from './supabase.js';

function bucket(name) {
  return createSupabaseAdmin().storage.from(name);
}

export async function uploadObject(bucketName, key, buffer, contentType) {
  const { error } = await bucket(bucketName).upload(key, buffer, { contentType, upsert: false });
  if (error) throw new Error(`Storage upload failed: ${error.message}`);
}

/** @returns {Promise<Buffer>} */
export async function downloadObject(bucketName, key) {
  const { data, error } = await bucket(bucketName).download(key);
  if (error) throw new Error(`Storage download failed: ${error.message}`);
  return Buffer.from(await data.arrayBuffer());
}

export async function removeObject(bucketName, key) {
  const { error } = await bucket(bucketName).remove([key]);
  if (error) throw new Error(`Storage delete failed: ${error.message}`);
}
