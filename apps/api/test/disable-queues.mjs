// Domain tests must never register schedules in the developer's Redis namespace.
// Real queue delivery is covered separately by jobs-integration.mjs with random namespaces.
if (process.env.NODE_ENV === 'production')
  throw Error('Database tests are disabled in production');
// Load explicit opt-in only; never infer TEST_DATABASE_URL from DATABASE_URL.
try {
  process.loadEnvFile(new URL('../.env', import.meta.url));
} catch (error) {
  if (error.code !== 'ENOENT') throw error;
}
if (process.env.NODE_ENV === 'production')
  throw Error('Database tests are disabled in production');
const testDatabase = process.env.TEST_DATABASE_URL;
if (!testDatabase)
  throw Error(
    'Set TEST_DATABASE_URL explicitly; database tests never fall back to DATABASE_URL',
  );
const testLocation = new URL(testDatabase);
if (
  !['postgres:', 'postgresql:'].includes(testLocation.protocol) ||
  !['localhost', '127.0.0.1', '[::1]'].includes(testLocation.hostname) ||
  testLocation.pathname.length < 2
)
  throw Error(
    'Database smoke tests require an explicit loopback PostgreSQL TEST_DATABASE_URL',
  );
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = testDatabase;
process.env.REDIS_URL = '';
process.env.MEDIA_CLEANUP_SCHEDULE_ENABLED = 'false';
process.env.AI_PROVIDER = 'disabled';
process.env.AI_MODEL = 'fake-v1';
delete process.env.AI_API_KEY;
