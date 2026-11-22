import { query } from './db.js';

export const AUDIT_EVENTS = Object.freeze({
  UNAUTHORIZED_ACCESS: 'unauthorized_access',
  UNAUTHENTICATED_ACCESS: 'unauthenticated_access',
  GRADE_CHANGED: 'grade_changed',
  ROLE_CHANGED: 'role_changed',
  ACCOUNT_STATUS_CHANGED: 'account_status_changed',
  ACCOUNT_CREATED: 'account_created',
  PASSWORD_CHANGED: 'password_changed',
  PASSWORD_RESET_SENT: 'password_reset_sent',
  LOGIN_FAILED: 'login_failed',
});

// By default a failed audit write is logged and swallowed, so it never breaks the action being
// audited. Pass { rethrow: true } when the audit record IS the action (e.g. login_failed reports).
/**
 * @param {{ userId?: number|null, eventType: string, entityType?: string, entityId?: string|number, details?: object }} event
 * @param {{ rethrow?: boolean }} [options]
 */
export async function logAuditEvent(
  { userId = null, eventType, entityType = null, entityId = null, details = null },
  { rethrow = false } = {},
) {
  try {
    await query(
      `INSERT INTO audit_logs (user_id, event_type, entity_type, entity_id, details)
       VALUES ($1, $2, $3, $4, $5)`,
      [userId, eventType, entityType, entityId === null ? null : String(entityId), details ? JSON.stringify(details) : null],
    );
  } catch (err) {
    console.error(`Audit log write failed (${eventType}):`, err.message);
    if (rethrow) throw err;
  }
}
