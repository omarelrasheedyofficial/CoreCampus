// config/db.js — the single, centralized PostgreSQL connection pool for this portal.
// Every repository (and the database/ scripts) imports from here; nothing else opens connections.
// (Shared file: keep identical in every portal's backend.)
import fs from 'node:fs';
import pg from 'pg';
import { env } from './env.js';

const { Pool, types } = pg;

// Return DATE columns as 'YYYY-MM-DD' strings. The default converts them to a JS Date at local
// midnight, which shifts the day when serialized to JSON in UTC.
types.setTypeParser(types.builtins.DATE, (value) => value);

function sslConfig() {
  if (!env.dbSsl) return false;
  if (env.dbSslCaPath) {
    // Full verification of the Supabase server certificate.
    return { ca: fs.readFileSync(env.dbSslCaPath, 'utf8'), rejectUnauthorized: true };
  }
  // No insecure fallback: SSL without a CA certificate would skip server verification.
  throw new Error('DB_SSL_CA_PATH is required when DB_SSL=true');
}

// The database is remote (Supabase pooler): opening a TLS connection costs ~0.5–3 s and the
// network sometimes drops sockets. So keep a couple of connections open and alive, and retry
// when a connection (not a query) fails.
// pg mis-parses usernames that contain a dot (e.g. Supabase pooler "postgres.<ref>"),
// so we pass every field individually instead of using connectionString.
const _dbUrl = new URL(env.databaseUrl);
const pool = new Pool({
  host: _dbUrl.hostname,
  port: Number(_dbUrl.port) || 5432,
  database: _dbUrl.pathname.replace(/^\//, ''),
  user: decodeURIComponent(_dbUrl.username),
  password: decodeURIComponent(_dbUrl.password),
  ssl: sslConfig(),
  max: 10,
  min: 2, // never evict below this, so requests after a quiet period don't pay a new handshake
  idleTimeoutMillis: 120_000,
  connectionTimeoutMillis: 15_000,
  keepAlive: true,
  keepAliveInitialDelayMillis: 10_000,
});

pool.on('error', (err) => {
  console.error('Unexpected PostgreSQL pool error:', err.message);
});

// A socket can die while a client is checked out; without a listener its 'error' event would
// crash the process. The failing query still rejects and is handled below.
pool.on('connect', (client) => {
  client.on('error', (err) => console.error('PostgreSQL connection lost:', err.message));
});

const CONNECTION_ERROR_CODES = new Set(['ECONNRESET', 'ECONNREFUSED', 'ETIMEDOUT', 'EPIPE', 'EAI_AGAIN', '57P01', '08000', '08001', '08003', '08006']);
const CONNECTION_ERROR_RE = /Connection terminated|timeout exceeded when trying to connect|Client has encountered a connection error/i;

function isConnectionError(err) {
  return CONNECTION_ERROR_CODES.has(err?.code) || CONNECTION_ERROR_RE.test(err?.message ?? '');
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/** Check out a client, retrying when the connection itself fails (safe: nothing was sent yet). */
async function connect(attempts = 3) {
  for (let attempt = 1; ; attempt++) {
    try {
      return await pool.connect();
    } catch (err) {
      if (attempt >= attempts || !isConnectionError(err)) throw err;
      await sleep(250 * attempt);
    }
  }
}

/**
 * Run a parameterized query. Always pass user input through `params`, never string concatenation.
 * A read that fails because its connection dropped is retried once on a fresh connection;
 * writes are not retried after being sent, since they may already have been applied.
 */
export async function query(text, params = []) {
  const retryable = /^\s*select\b/i.test(text);
  for (let attempt = 1; ; attempt++) {
    const client = await connect();
    try {
      const result = await client.query(text, params);
      client.release();
      return result;
    } catch (err) {
      const broken = isConnectionError(err);
      client.release(broken ? err : undefined); // passing an error destroys the dead client
      if (broken && retryable && attempt < 2) continue;
      throw err;
    }
  }
}

/** Run `fn(client)` inside a transaction; commits on success, rolls back on error. */
export async function withTransaction(fn) {
  const client = await connect();
  let broken = false;
  try {
    await client.query('BEGIN');
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    broken = isConnectionError(err);
    // A failed ROLLBACK on a dead connection must not hide the original error.
    if (!broken) await client.query('ROLLBACK').catch(() => { });
    throw err;
  } finally {
    client.release(broken || undefined);
  }
}

export async function testConnection() {
  const { rows } = await query('SELECT current_database() AS db');
  return rows[0].db;
}

// Heartbeat: keeps an open connection warm and replaces any the network silently dropped,
// so the first click after a pause is fast. unref() lets the process exit normally.
setInterval(() => {
  query('SELECT 1').catch((err) => console.error('PostgreSQL heartbeat failed:', err.message));
}, 60_000).unref();

export default pool;
