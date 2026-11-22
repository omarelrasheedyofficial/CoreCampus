-- audit_logs.entity_id stores numeric ids ("12") AND endpoint identifiers such as
-- "GET /api/auth/me" for unauthorized (403) / unauthenticated (401) access events (doc §6.7).
-- Migration 001 defines it as VARCHAR(60), but some manually created databases made it INTEGER,
-- which silently rejected every access-attempt log. Existing values are kept as text.
-- Safe to run more than once.
ALTER TABLE audit_logs ALTER COLUMN entity_id TYPE VARCHAR(60) USING entity_id::text;
