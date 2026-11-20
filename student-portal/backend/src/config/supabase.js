// config/supabase.js — Supabase Auth integration for the backend.
// The browser signs in directly with Supabase Auth and sends us its JWT access token.
// We verify that token locally (signature, expiry, issuer, audience) on every protected request.
// (Shared file: keep identical in every portal's backend.)
import { createRemoteJWKSet, jwtVerify } from 'jose';
import { createClient } from '@supabase/supabase-js';
import { env } from './env.js';

const issuer = `${env.supabaseUrl}/auth/v1`;

// New Supabase projects sign tokens with asymmetric keys published at the JWKS endpoint.
// Legacy projects use a shared HS256 secret (SUPABASE_JWT_SECRET) instead.
const verificationKey = env.supabaseJwtSecret
  ? new TextEncoder().encode(env.supabaseJwtSecret)
  : createRemoteJWKSet(new URL(`${issuer}/.well-known/jwks.json`));

/**
 * Verifies a Supabase access token. Throws if it is missing, forged, expired, or for another project.
 * @returns {Promise<{ authUserId: string, email: string }>}
 */
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

/**
 * Server-only Supabase client using the service-role key (seeding auth users, private Storage).
 * Never send this key to the browser.
 */
export function createSupabaseAdmin() {
  if (!env.supabaseServiceRoleKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set (see backend/.env.example)');
  }
  adminClient ??= createClient(env.supabaseUrl, env.supabaseServiceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  return adminClient;
}
