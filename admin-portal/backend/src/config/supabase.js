import { createRemoteJWKSet, jwtVerify } from 'jose';
import { createClient } from '@supabase/supabase-js';
import { env } from './env.js';

const issuer = `${env.supabaseUrl}/auth/v1`;

const verificationKey = env.supabaseJwtSecret
  ? new TextEncoder().encode(env.supabaseJwtSecret)
  : createRemoteJWKSet(new URL(`${issuer}/.well-known/jwks.json`));

export async function verifyAccessToken(token) {
  const { payload } = await jwtVerify(token, verificationKey, {
    issuer,
    audience: 'authenticated',
  });
  return {
    authUserId: payload.sub,
    email: payload.email,
    // Set by the admin portal on new accounts; only the service role can change app_metadata.
    mustChangePassword: payload.app_metadata?.must_change_password === true,
    amr: Array.isArray(payload.amr) ? payload.amr : [], // how this session was opened (password, recovery…)
  };
}

let adminClient = null;

export function createSupabaseAdmin() {
  if (!env.supabaseServiceRoleKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set (see backend/.env.example)');
  }
  adminClient ??= createClient(env.supabaseUrl, env.supabaseServiceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  return adminClient;
}
