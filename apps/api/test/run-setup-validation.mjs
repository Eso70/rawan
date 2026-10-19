// Create a dedicated local throwaway database; never run migrations against developer data.
import pg from 'pg';
import { randomUUID } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
if (process.env.NODE_ENV === 'production') throw Error('Local validation only');
process.loadEnvFile(new URL('../.env.local', import.meta.url));
if (process.env.NODE_ENV === 'production') throw Error('Local validation only');
const location = new URL(process.env.DATABASE_URL);
if (!['localhost', '127.0.0.1', '[::1]'].includes(location.hostname))
  throw Error('Local validation only');
const name = 'rawan_setup_validation_' + randomUUID().replaceAll('-', '');
const admin = new pg.Client({
  connectionString: location.href,
  connectionTimeoutMillis: 5000,
});
await admin.connect();
let created = false;
try {
  await admin.query(`CREATE DATABASE "${name}"`);
  created = true;
  location.pathname = '/' + name;
  const suites = [
    'setup-database-smoke.mjs',
    'onboarding-database-smoke.mjs',
    'email-signup-database-smoke.mjs',
    ...(process.env.SETUP_FULL_REGRESSION === 'true'
      ? ['database-regression.mjs']
      : []),
  ];
  for (const script of process.env.SETUP_HARDENING_ONLY === 'true'
    ? ['hardening-database.mjs']
    : suites) {
    const result = spawnSync(
      process.execPath,
      [fileURLToPath(new URL(script, import.meta.url))],
      {
        env: { ...process.env, TEST_DATABASE_URL: location.href },
        stdio: 'inherit',
      },
    );
    if (result.status !== 0) throw Error('Validation failed: ' + script);
  }
} finally {
  if (created) await admin.query(`DROP DATABASE "${name}" WITH (FORCE)`);
  await admin.end();
}
