// From this folder: node start-all.mjs
// Keep the terminal open. Ctrl+C stops the servers started by this command.
import fs from 'node:fs';
import path from 'node:path';
import net from 'node:net';
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { setTimeout as delay } from 'node:timers/promises';

const root = path.dirname(fileURLToPath(import.meta.url));
const portals = [
  { folder: 'admin-portal', name: 'Admin', web: 5176, api: 5004 },
  { folder: 'lecturer-portal', name: 'Lecturer', web: 5174, api: 5002 },
  { folder: 'lab-teacher-portal', name: 'Lab teacher', web: 5175, api: 5003 },
  { folder: 'student-portal', name: 'Student', web: 5173, api: 5001 },
];
const children = new Set();
const logDir = path.join(root, '.runtime');

function stopStartedServers() {
  for (const child of children) child.kill();
}

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => {
    console.log('\nStopping the servers started by this launcher...');
    stopStartedServers();
    process.exit(0);
  });
}

async function isReady(service) {
  try {
    const response = await fetch(service.url, { signal: AbortSignal.timeout(service.kind === 'api' ? 12000 : 3000) });
    if (!response.ok) return false;
    if (service.kind === 'api') {
      const body = await response.json();
      return body.success === true && body.message?.includes('CampusCore');
    }
    return (await response.text()).includes('CampusCore');
  } catch {
    return false;
  }
}

/**
 * Opens a plain TCP connection to the database host. A timeout here means the network (e.g. a
 * campus Wi-Fi that only allows web traffic) blocks the Postgres port — no app setting can fix that.
 */
function checkDatabaseReachable(databaseUrl, timeoutMs = 6000) {
  const { hostname, port } = new URL(databaseUrl);
  return new Promise((resolve) => {
    const socket = net.connect({ host: hostname, port: Number(port) || 5432 });
    const finish = (ok) => {
      socket.destroy();
      resolve(ok ? null : `${hostname}:${port || 5432}`);
    };
    socket.setTimeout(timeoutMs, () => finish(false));
    socket.once('connect', () => finish(true));
    socket.once('error', () => finish(false));
  });
}

function checkPort(port) {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.once('error', reject);
    server.listen(port, () => server.close(resolve));
  });
}

function prepareServices() {
  return portals.flatMap((portal) => {
    const folder = path.join(root, portal.folder);
    const backend = path.join(folder, 'backend');
    const require = createRequire(path.join(backend, 'package.json'));
    let parse;
    try { ({ parse } = require('dotenv')); }
    catch { throw new Error(`Install backend dependencies first: npm --prefix ${portal.folder}/backend install`); }
    const frontendEnv = parse(fs.readFileSync(path.join(folder, '.env')));
    const backendEnv = parse(fs.readFileSync(path.join(backend, '.env')));
    for (const key of ['PORT', 'DATABASE_URL', 'SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY']) {
      if (!backendEnv[key]?.trim()) throw new Error(`Fill ${key} in ${portal.folder}/backend/.env`);
    }
    if (Number(backendEnv.PORT) !== portal.api) throw new Error(`Set PORT=${portal.api} in ${portal.folder}/backend/.env`);
    for (const key of ['VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY']) {
      if (!frontendEnv[key]?.trim()) throw new Error(`Fill ${key} in ${portal.folder}/.env`);
    }
    if (frontendEnv.VITE_SUPABASE_URL.replace(/\/+$/, '') !== backendEnv.SUPABASE_URL.replace(/\/+$/, '')) {
      throw new Error(`Frontend and backend Supabase projects differ for ${portal.folder}`);
    }
    const vite = path.join(folder, 'node_modules/vite/bin/vite.js');
    if (!fs.existsSync(vite)) throw new Error(`Install frontend dependencies first: npm --prefix ${portal.folder} install`);
    return [
      { name: `${portal.name} API`, kind: 'api', cwd: backend, entry: 'src/server.js', port: portal.api,
        url: `http://localhost:${portal.api}/api/health`, env: backendEnv, log: `${portal.folder}-api.log` },
      { name: `${portal.name} website`, kind: 'web', cwd: folder, entry: vite, port: portal.web,
        url: `http://localhost:${portal.web}`, env: frontendEnv, log: `${portal.folder}-web.log` },
    ];
  });
}

async function startService(service) {
  if (await isReady(service)) {
    console.log(`${service.name}: already running`);
    return;
  }
  try { await checkPort(service.port); }
  catch { throw new Error(`${service.name}: port ${service.port} is occupied, but its health check is not responding successfully.`); }
  const logPath = path.join(logDir, service.log);
  const log = fs.openSync(logPath, 'a');
  let child;
  try {
    child = spawn(process.execPath, [service.entry], {
      cwd: service.cwd,
      env: { ...process.env, ...service.env },
      windowsHide: true,
      stdio: ['ignore', log, log],
    });
  } finally { fs.closeSync(log); }
  children.add(child);
  let startupError;
  child.once('error', (error) => { startupError = error; children.delete(child); });
  child.once('exit', () => children.delete(child));
  const deadline = Date.now() + 25000;
  while (Date.now() < deadline) {
    if (startupError || child.exitCode !== null || child.signalCode !== null) break;
    if (await isReady(service)) {
      console.log(`${service.name}: ready`);
      return;
    }
    await delay(500);
  }
  throw new Error(`${service.name} did not start. See ${path.relative(root, logPath)}.`);
}

try {
  const services = prepareServices();
  fs.mkdirSync(logDir, { recursive: true });

  const databaseUrls = [...new Set(services.filter((s) => s.kind === 'api').map((s) => s.env.DATABASE_URL))];
  const unreachable = (await Promise.all(databaseUrls.map((url) => checkDatabaseReachable(url)))).filter(Boolean);
  if (unreachable.length) {
    console.error(
      `Cannot reach the database at ${unreachable.join(', ')}.\n` +
        'Your network is blocking the PostgreSQL port (common on university/office Wi-Fi, which often allows only web traffic).\n' +
        'Fix: connect to another network (e.g. a phone hotspot), or point DATABASE_URL at a local PostgreSQL for development.\n' +
        'The APIs will fail to start until the database is reachable.\n',
    );
  }

  console.log('Starting CampusCore portals...');
  const results = await Promise.allSettled(services.map(startService));
  const failures = results.filter((result) => result.status === 'rejected');
  if (failures.length) {
    for (const failure of failures) console.error(failure.reason.message);
    console.log('\nOther running servers remain available. Fix the reported issue and run this command again.');
    process.exitCode = 1;
  } else {
    console.log('\nAll portals are ready.');
  }
  console.log('\nWebsite links:');
  for (const portal of portals) console.log(`${portal.name.padEnd(12)} http://localhost:${portal.web}`);
  if (children.size) console.log('\nKeep this terminal open. Press Ctrl+C to stop the servers started here.');
} catch (error) {
  console.error(`Startup failed: ${error.message}`);
  stopStartedServers();
  process.exitCode = 1;
}
