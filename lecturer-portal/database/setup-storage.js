// database/setup-storage.js — creates (or re-secures) the private Supabase Storage buckets.
// Usage (from backend/): npm run storage:setup     — safe to run repeatedly.
// Buckets are private: only the backend (service-role key) can read or write objects,
// and it does so only after checking the user's permissions.
import { env } from '../backend/src/config/env.js';
import { createSupabaseAdmin } from '../backend/src/config/supabase.js';

const BUCKETS = [
  { id: env.materialsBucket, label: 'course materials' },
  { id: env.submissionsBucket, label: 'student submissions' },
];

async function setupStorage() {
  const storage = createSupabaseAdmin().storage;
  const options = {
    public: false,
    allowedMimeTypes: ['application/pdf'],
    fileSizeLimit: env.maxUploadBytes,
  };

  for (const { id, label } of BUCKETS) {
    const { data: existing } = await storage.getBucket(id);
    const { error } = existing
      ? await storage.updateBucket(id, options)
      : await storage.createBucket(id, options);
    if (error) throw new Error(`Bucket "${id}": ${error.message}`);
    console.log(`  bucket ${existing ? 'updated' : 'created'}  ${id} (${label}, private, PDF only)`);
  }
}

setupStorage()
  .then(() => console.log('Storage setup complete.'))
  .catch((err) => {
    console.error(`Storage setup failed: ${err.message}`);
    process.exitCode = 1;
  });
