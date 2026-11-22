import crypto from 'node:crypto';
import fs from 'node:fs';
import { query } from '../../config/db.js';
import { AUDIT_EVENTS, logAuditEvent } from '../../config/audit.js';
import { AppError } from '../../middleware/error.middleware.js';

export function getCurrentUser(user) {
  return {
    fullName: user.fullName,
    email: user.email,
    roles: user.roles,
    studentProfile: user.studentProfile,
    staffProfile: user.staffProfile,
  };
}

// ---------------------------------------------------------------------------------------------
// Failed sign-in reports (POST /api/auth/login-failed)
//
// The browser calls this after Supabase Auth rejected a password with `invalid_credentials`.
// It is CLIENT-REPORTED: the backend cannot prove a Supabase failure really happened, so the
// record is marked `source: 'client_report'` and must not be treated as authoritative auth
// auditing (Supabase's own Auth audit log is the authoritative source).
// ---------------------------------------------------------------------------------------------

const MAX_EMAIL_LENGTH = 254; // RFC 5321 path limit
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Which portal produced the record, derived from package.json ("campuscore-<portal>-portal-backend")
// so this file stays identical in every portal's backend.
const PORTAL = (() => {
  try {
    const { name } = JSON.parse(fs.readFileSync(new URL('../../../package.json', import.meta.url), 'utf8'));
    return name.replace(/^campuscore-/, '').replace(/-portal-backend$/, '') || 'unknown';
  } catch {
    return 'unknown';
  }
})();

/** Validate and normalize the reported email; throws a 400 AppError when unusable. */
function normalizeEmail(body) {
  const raw = body && typeof body === 'object' ? body.email : undefined;
  if (typeof raw !== 'string' || raw.length > MAX_EMAIL_LENGTH + 64) {
    throw new AppError('A valid email address is required.', 400);
  }
  const email = raw.trim().toLowerCase();
  if (!email || email.length > MAX_EMAIL_LENGTH || !EMAIL_PATTERN.test(email)) {
    throw new AppError('A valid email address is required.', 400);
  }
  return email;
}

/**
 * Record a client-reported failed sign-in. Known and unknown emails are handled identically from
 * the caller's point of view (same response), so the endpoint does not reveal which accounts exist.
 * Never stores the password, tokens or the plain email address.
 */
export async function recordFailedLogin(body, ip) {
  const email = normalizeEmail(body);

  const { rows } = await query('SELECT user_id FROM users WHERE lower(email) = $1 LIMIT 1', [email]);
  const userId = rows[0]?.user_id ?? null;

  await logAuditEvent(
    {
      userId,
      eventType: AUDIT_EVENTS.LOGIN_FAILED,
      entityType: 'user',
      entityId: userId, // null for an unknown email
      details: {
        portal: PORTAL,
        source: 'client_report',
        // Lets repeated attempts on the same (possibly unknown) address be correlated without
        // storing the address itself.
        emailHash: crypto.createHash('sha256').update(email).digest('hex').slice(0, 16),
        ip: ip ?? null,
      },
    },
    { rethrow: true }, // the audit record is the whole point here: surface DB errors as 500s
  );
}
