import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { readFile, readdir, mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Readable } from 'node:stream';
import { createServer } from 'node:net';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { Test } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@rawan/database';
import {
  Queue,
  Redis,
  LocalStorageProvider,
  prismaCleanupRepository,
  bounded,
  STORAGE_PROVIDER,
} from '@rawan/backend';
import { MAINTENANCE_QUEUE, MEDIA_CLEANUP_JOB } from '@rawan/types/jobs';
import { createMaintenanceWorker } from '../../worker/dist/queues/maintenance-worker.js';
import { mediaCleanupProcessor } from '../../worker/dist/processors/media-cleanup.js';
import { PrismaService } from '../dist/database/prisma.service.js';
import { JobsService } from '../dist/jobs/jobs.service.js';
import { configureApp } from '../dist/config/configure-app.js';
import pg from 'pg';

try {
  process.loadEnvFile(new URL('../.env', import.meta.url));
} catch (error) {
  if (error.code !== 'ENOENT') throw error;
}
if (process.env.NODE_ENV === 'production')
  throw Error('Jobs integration tests are disabled in production');
const redisUrl = process.env.TEST_REDIS_URL;
const databaseUrl = process.env.TEST_DATABASE_URL;
if (!redisUrl || !databaseUrl)
  throw Error('Set TEST_REDIS_URL and TEST_DATABASE_URL explicitly');
const prefix = 'rawan-jobs-test-' + randomUUID().replaceAll('-', '');
const schema = 'rawan_jobs_test_' + randomUUID().replaceAll('-', '');
const config = { redisUrl, prefix, cleanupIntervalMs: 10000, concurrency: 1 };
let root, sql, prisma, app, outageApp, rawQueue, runtime, redis, child;
let schemaCreated = false;
let fault = false;
let deletions = 0;
const logs = [];
const log = (entry) => logs.push(entry);
async function eventually(check, timeout = 15000) {
  return bounded(
    (async () => {
      while (true) {
        const value = await check();
        if (value) return value;
        await new Promise((resolve) => setTimeout(resolve, 50));
      }
    })(),
    timeout,
  );
}
try {
  // Reject invalid configuration before touching Redis/PostgreSQL/files.
  const { validateQueueConfig } = await import('@rawan/backend');
  validateQueueConfig({ REDIS_URL: redisUrl, QUEUE_PREFIX: prefix }, true);
  const url = new URL(databaseUrl);
  assert.ok(
    ['postgres:', 'postgresql:'].includes(url.protocol) &&
      url.pathname.length > 1,
  );
  root = await mkdtemp(join(tmpdir(), 'rawan-jobs-test-'));
  const local = new LocalStorageProvider(root);
  const storage = {
    id: 'local',
    put: (key, source) => local.put(key, source),
    read: (key) => local.read(key),
    delete: async (key) => {
      deletions++;
      if (fault) throw Error('private filesystem error');
      return local.delete(key);
    },
  };
  sql = new pg.Client({
    connectionString: databaseUrl,
    connectionTimeoutMillis: 5000,
  });
  await sql.connect();
  await sql.query(`CREATE SCHEMA "${schema}"`);
  schemaCreated = true;
  await sql.query(`SET search_path TO "${schema}"`);
  const migrations = new URL(
    '../../../packages/database/prisma/migrations/',
    import.meta.url,
  );
  for (const folder of (await readdir(migrations, { withFileTypes: true }))
    .filter((entry) => entry.isDirectory())
    .sort((a, b) => a.name.localeCompare(b.name)))
    await sql.query(
      await readFile(
        new URL(folder.name + '/migration.sql', migrations),
        'utf8',
      ),
    );
  prisma = new PrismaClient({
    adapter: new PrismaPg(
      { connectionString: databaseUrl, options: `-c search_path=${schema}` },
      { schema },
    ),
  });
  await prisma.$connect();
  process.env.NODE_ENV = 'test';
  process.env.DATABASE_URL = databaseUrl;
  process.env.JWT_SECRET =
    'jobs-integration-only-secret-with-more-than-32-characters';
  process.env.REDIS_URL = redisUrl;
  process.env.QUEUE_PREFIX = prefix;
  process.env.MEDIA_LOCAL_PATH = root;
  process.env.MEDIA_CLEANUP_INTERVAL_MS = '10000';
  process.env.MEDIA_CLEANUP_SCHEDULE_ENABLED = 'false';
  process.env.AI_PROVIDER = 'disabled';
  process.env.AI_MODEL = 'fake-v1';
  delete process.env.AI_API_KEY;
  const { AppModule } = await import('../dist/app.module.js');
  const module = await Test.createTestingModule({ imports: [AppModule] })
    .overrideProvider(PrismaService)
    .useValue(prisma)
    .overrideProvider(STORAGE_PROVIDER)
    .useValue(storage)
    .compile();
  app = module.createNestApplication({ logger: false });
  configureApp(app);
  await app.listen(0, '127.0.0.1');
  const jobs = app.get(JobsService);
  await eventually(async () => {
    try {
      return (await jobs.readiness()).status === 'ready';
    } catch {
      return false;
    }
  });
  redis = new Redis(redisUrl, {
    maxRetriesPerRequest: 1,
    enableOfflineQueue: false,
    connectTimeout: 3000,
  });
  redis.on('error', () => {});
  rawQueue = new Queue(MAINTENANCE_QUEUE, { connection: redis, prefix });
  await bounded(rawQueue.waitUntilReady());
  const base = (await app.getUrl()) + '/api/v1';
  const register = await fetch(base + '/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Queue Author',
      email: 'queue@example.invalid',
      password: 'queue-integration-password-long',
    }),
  });
  assert.equal(register.status, 201);
  const author = await register.json();
  const projectResponse = await fetch(base + '/projects', {
    method: 'POST',
    headers: {
      Authorization: 'Bearer ' + author.accessToken,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ title: 'Cleanup test' }),
  });
  assert.equal(projectResponse.status, 201);
  const project = await projectResponse.json();
  async function intent(overrides = {}) {
    const row = await prisma.mediaCleanup.create({
      data: {
        id: randomUUID(),
        projectId: project.id,
        ownerUserId: author.user.id,
        storageProvider: 'local',
        storageKey: randomUUID(),
        createdAt: new Date(Date.now() - 7200000),
        ...overrides,
      },
    });
    if (row.storageProvider === 'local')
      await local.put(row.storageKey, Readable.from(['private test bytes']));
    return row;
  }
  await intent();
  const enqueued = await jobs.enqueueCleanup();
  assert.ok(enqueued.id);
  assert.equal((await jobs.status(enqueued.id)).status, 'QUEUED');
  assert.equal(
    await prisma.mediaCleanup.count(),
    1,
    'Offline worker must not execute jobs',
  );
  runtime = createMaintenanceWorker(
    config,
    mediaCleanupProcessor(prismaCleanupRepository(prisma), storage),
    log,
  );
  await runtime.start();
  const completed = await eventually(async () => {
    const status = await jobs.status(enqueued.id);
    return status?.status === 'COMPLETED' ? status : false;
  });
  assert.equal(completed.result.removed, 1);
  assert.equal(await prisma.mediaCleanup.count(), 0);
  assert.equal((await readdir(root)).length, 0);
  const duplicate = await jobs.enqueueCleanup();
  await eventually(async () => {
    const status = await jobs.status(duplicate.id);
    return status?.status === 'COMPLETED' && status.result.removed === 0;
  });
  assert.equal(await prisma.mediaCleanup.count(), 0);
  assert.equal((await readdir(root)).length, 0);
  // Real storage failure: records survive all three bounded attempts.
  await intent();
  fault = true;
  const beforeDeletions = deletions;
  const failed = await jobs.enqueueCleanup();
  const failure = await eventually(async () => {
    const status = await jobs.status(failed.id);
    return status?.status === 'FAILED' ? status : false;
  });
  assert.equal(failure.attempts, 3);
  assert.equal(deletions - beforeDeletions, 3);
  assert.ok(failure.error);
  assert.ok(!JSON.stringify(failure).includes('private filesystem'));
  assert.equal(await prisma.mediaCleanup.count(), 1);
  fault = false;
  const recovered = await jobs.enqueueCleanup();
  await eventually(async () => {
    const status = await jobs.status(recovered.id);
    return status?.status === 'COMPLETED';
  });
  assert.equal(await prisma.mediaCleanup.count(), 0);
  // Invalid job payloads and job names never invoke storage operations.
  for (const [name, data] of [
    [MEDIA_CLEANUP_JOB, { version: 1, storageKey: '../../escape' }],
    ['arbitrary-command', { version: 1 }],
  ]) {
    const before = deletions;
    const job = await rawQueue.add(name, data, {
      jobId: randomUUID(),
      attempts: 3,
      backoff: { type: 'exponential', delay: 100 },
    });
    await eventually(async () => (await job.getState()) === 'failed');
    const stored = await rawQueue.getJob(job.id);
    assert.equal(stored.attemptsMade, 1);
    assert.equal(deletions, before);
  }
  // Permanent unsupported provider is retained for operator correction, without retries.
  const invalid = await intent({ storageProvider: 'unsupported' });
  const permanent = await jobs.enqueueCleanup();
  const permanentStatus = await eventually(async () => {
    const status = await jobs.status(permanent.id);
    return status?.status === 'FAILED' ? status : false;
  });
  assert.equal(permanentStatus.attempts, 1);
  assert.equal(await prisma.mediaCleanup.count(), 1);
  await prisma.mediaCleanup.delete({ where: { id: invalid.id } });
  // Fresh upload intents are protected by the one-hour grace period.
  const fresh = await intent({ createdAt: new Date() });
  const freshJob = await jobs.enqueueCleanup();
  await eventually(async () => {
    const status = await jobs.status(freshJob.id);
    return status?.status === 'COMPLETED' && status.result.removed === 0;
  });
  assert.equal(await prisma.mediaCleanup.count(), 1);
  await local.delete(fresh.storageKey);
  await prisma.mediaCleanup.delete({ where: { id: fresh.id } });
  // Stop worker, queue a real cleanup, and restart it deterministically.
  await runtime.close();
  runtime = undefined;
  await intent();
  const offline = await jobs.enqueueCleanup();
  assert.equal((await jobs.status(offline.id)).status, 'QUEUED');
  runtime = createMaintenanceWorker(
    config,
    mediaCleanupProcessor(prismaCleanupRepository(prisma), storage),
    log,
  );
  await runtime.start();
  await eventually(async () => {
    const status = await jobs.status(offline.id);
    return status?.status === 'COMPLETED';
  });
  await runtime.close();
  runtime = undefined;
  // Graceful close waits for active processing; current job completes before resources close.
  await intent();
  let release;
  const gate = new Promise((resolve) => {
    release = resolve;
  });
  let entered;
  const running = new Promise((resolve) => {
    entered = resolve;
  });
  runtime = createMaintenanceWorker(
    config,
    async () => {
      entered();
      await gate;
      return mediaCleanupProcessor(prismaCleanupRepository(prisma), storage)();
    },
    log,
  );
  await runtime.start();
  const draining = await jobs.enqueueCleanup();
  await bounded(running);
  let closed = false;
  const closing = runtime.close().then(() => {
    closed = true;
  });
  await new Promise((resolve) => setTimeout(resolve, 50));
  assert.equal(closed, false);
  release();
  await bounded(closing, 5000);
  runtime = undefined;
  assert.equal((await jobs.status(draining.id)).status, 'COMPLETED');
  // A queue outage is bounded and does not prevent ordinary API reads/CRUD/liveness.
  const server = createServer();
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const port = server.address().port;
  await new Promise((resolve) => server.close(resolve));
  const unavailable = new JobsService(
    new ConfigService({
      REDIS_URL: 'redis://127.0.0.1:' + port,
      QUEUE_PREFIX: prefix + '-outage',
      MEDIA_CLEANUP_INTERVAL_MS: 10000,
    }),
  );
  const outageModule = await Test.createTestingModule({ imports: [AppModule] })
    .overrideProvider(PrismaService)
    .useValue(prisma)
    .overrideProvider(STORAGE_PROVIDER)
    .useValue(storage)
    .overrideProvider(JobsService)
    .useValue(unavailable)
    .compile();
  outageApp = outageModule.createNestApplication({ logger: false });
  configureApp(outageApp);
  await outageApp.listen(0, '127.0.0.1');
  const outageBase = (await outageApp.getUrl()) + '/api/v1';
  const started = Date.now();
  await assert.rejects(
    () => unavailable.enqueueCleanup(),
    /Background queue unavailable/,
  );
  assert.ok(Date.now() - started < 3000);
  assert.equal((await fetch(outageBase + '/health')).status, 200);
  assert.equal((await fetch(outageBase + '/health/queues')).status, 503);
  assert.equal(
    (
      await fetch(outageBase + '/projects/' + project.id, {
        headers: { Authorization: 'Bearer ' + author.accessToken },
      })
    ).status,
    200,
  );
  assert.equal(
    (
      await fetch(outageBase + '/jobs', {
        method: 'POST',
        headers: {
          Authorization: 'Bearer ' + author.accessToken,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ type: 'arbitrary', payload: {} }),
      })
    ).status,
    404,
  );
  assert.equal(
    (
      await fetch(outageBase + '/jobs/' + enqueued.id, {
        headers: { Authorization: 'Bearer ' + author.accessToken },
      })
    ).status,
    404,
  );
  await outageApp.close();
  outageApp = undefined;
  assert.equal(await prisma.mediaCleanup.count(), 0);
  assert.equal((await readdir(root)).length, 0);
  assert.ok(logs.some((entry) => entry.event === 'JOB_COMPLETED'));
  assert.ok(logs.some((entry) => entry.event === 'JOB_FAILED'));
  assert.ok(logs.some((entry) => entry.event === 'WORKER_CLOSED'));
  assert.ok(!JSON.stringify(logs).includes('private filesystem'));
  // Exercise the actual worker entry point against the same disposable schema/root.
  const workerUrl = new URL(databaseUrl);
  workerUrl.searchParams.set('schema', schema);
  await intent();
  let childOutput = '';
  let childErrors = '';
  child = spawn(
    process.execPath,
    [fileURLToPath(new URL('../../worker/dist/index.js', import.meta.url))],
    {
      env: {
        ...process.env,
        NODE_ENV: 'test',
        DATABASE_URL: workerUrl.href,
        REDIS_URL: redisUrl,
        QUEUE_PREFIX: prefix,
        MEDIA_LOCAL_PATH: root,
        WORKER_CONCURRENCY: '1',
      },
      stdio: ['ignore', 'pipe', 'pipe'],
    },
  );
  child.stdout.on('data', (chunk) => {
    childOutput += chunk.toString();
  });
  child.stderr.on('data', (chunk) => {
    childErrors += chunk.toString();
  });
  await eventually(async () => {
    if (child.exitCode !== null)
      throw Error('Worker entry point exited before readiness');
    return childOutput.includes('WORKER_READY');
  });
  const entryJob = await jobs.enqueueCleanup();
  await eventually(async () => {
    const status = await jobs.status(entryJob.id);
    return status?.status === 'COMPLETED';
  });
  child.kill('SIGTERM');
  await eventually(
    async () => child.exitCode !== null || child.signalCode !== null,
  );
  if (process.platform !== 'win32')
    assert.ok(childOutput.includes('WORKER_CLOSED'));
  assert.equal(childErrors, '');
  child = undefined;
  assert.equal(await prisma.mediaCleanup.count(), 0);
  assert.equal((await readdir(root)).length, 0);
  await jobs.scheduleCleanup();
  const scheduler = await rawQueue.getJobScheduler(MEDIA_CLEANUP_JOB);
  assert.ok(scheduler);
  assert.equal(scheduler.every, 10000);
  console.log(
    'Jobs Redis/PostgreSQL/HTTP/storage integration passed: offline queue, worker delivery, completion/status, three-attempt retry, permanent failures, idempotency, fresh intent protection, restart, active-job shutdown, outage isolation and internal-only API.',
  );
} finally {
  if (child) {
    child.kill('SIGTERM');
    await eventually(
      async () => child.exitCode !== null || child.signalCode !== null,
      5000,
    );
  }
  if (runtime) await runtime.close();
  if (outageApp) await outageApp.close();
  if (app) await app.close();
  if (rawQueue) {
    assert.match(prefix, /^rawan-jobs-test-[a-f0-9]{32}$/);
    await bounded(rawQueue.obliterate({ force: true }), 5000);
    await rawQueue.close();
  }
  redis?.disconnect();
  if (prisma) await prisma.$disconnect();
  if (sql) {
    try {
      if (schemaCreated) await sql.query(`DROP SCHEMA "${schema}" CASCADE`);
    } finally {
      await sql.end();
    }
  }
  if (root) {
    assert.ok(root.startsWith(join(tmpdir(), 'rawan-jobs-test-')));
    await rm(root, { recursive: true, force: true });
  }
}
