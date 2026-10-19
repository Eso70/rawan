import './disable-queues.mjs';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { Test } from '@nestjs/testing';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@rawan/database';
import pg from 'pg';
import { readdir, readFile } from 'node:fs/promises';
import { AppModule } from '../dist/app.module.js';
import { PrismaService } from '../dist/database/prisma.service.js';
import { configureApp } from '../dist/config/configure-app.js';
import { AuthService } from '../dist/auth/auth.service.js';

const schema = 'rawan_setup_test_' + randomUUID().replaceAll('-', '');
const connectionString = process.env.TEST_DATABASE_URL;
const sql = new pg.Client({ connectionString, connectionTimeoutMillis: 5000 });
let prisma,
  app,
  created = false;
try {
  await sql.connect();
  await sql.query(`CREATE SCHEMA "${schema}"`);
  created = true;
  await sql.query(`SET search_path TO "${schema}"`);
  const migrations = new URL(
    '../../../packages/database/prisma/migrations/',
    import.meta.url,
  );
  const folders = (await readdir(migrations, { withFileTypes: true }))
    .filter((e) => e.isDirectory())
    .sort((a, b) => a.name.localeCompare(b.name));
  const legacyId = randomUUID();
  for (const folder of folders) {
    if (folder.name === '20261018020000_remove_age_requirement') {
      await sql.query(
        'UPDATE "UserOnboarding" SET "ageConfirmedAt"=$2,"agePolicyVersion"=$3 WHERE "userId"=$1',
        [legacyId, '2026-10-18 00:00:00', '18-plus-v1'],
      );
    }
    if (folder.name === '20261018010000_account_setup') {
      await sql.query(
        'INSERT INTO "User" (id,email,name,"updatedAt") VALUES ($1,$2,$3,NOW())',
        [legacyId, legacyId + '@example.invalid', 'Existing name'],
      );
      await sql.query(
        'INSERT INTO "UserOnboarding" ("userId",experience,interests,"draftText","updatedAt") VALUES ($1,$2,$3,$4,NOW())',
        [legacyId, 'reader', ['fiction'], 'Existing private prose'],
      );
    }
    await sql.query(
      await readFile(
        new URL(folder.name + '/migration.sql', migrations),
        'utf8',
      ),
    );
  }
  prisma = new PrismaClient({
    adapter: new PrismaPg(
      { connectionString, options: '-c search_path=' + schema },
      { schema },
    ),
  });
  const module = await Test.createTestingModule({ imports: [AppModule] })
    .overrideProvider(PrismaService)
    .useValue(prisma)
    .compile();
  app = module.createNestApplication({ logger: false });
  configureApp(app);
  await app.listen(0, '127.0.0.1');
  const base = (await app.getUrl()) + '/api/v1/users/me/setup';
  const legacy = await prisma.user.findUniqueOrThrow({
    where: { id: legacyId },
  });
  const historical = await prisma.userOnboarding.findUniqueOrThrow({
    where: { userId: legacyId },
  });
  assert.equal(
    historical.ageConfirmedAt.toISOString(),
    '2026-10-18T00:00:00.000Z',
  );
  assert.equal(historical.agePolicyVersion, '18-plus-v1');
  const fresh = await prisma.user.create({
    data: {
      email: randomUUID() + '@example.invalid',
      name: 'New account',
      onboarding: { create: { setupRequired: true } },
    },
  });
  const other = await prisma.user.create({
    data: {
      email: randomUUID() + '@example.invalid',
      name: 'Other existing account',
    },
  });
  const token = async (user) =>
    (await app.get(AuthService).createToken(user)).accessToken;
  const [oldToken, newToken, otherToken] = await Promise.all([
    token(legacy),
    token(fresh),
    token(other),
  ]);
  const request = (method, bearer, body) =>
    fetch(base, {
      method,
      headers: {
        ...(bearer ? { Authorization: 'Bearer ' + bearer } : {}),
        ...(body ? { 'Content-Type': 'application/json' } : {}),
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
  const get = async (bearer) => (await request('GET', bearer)).json();
  const product = (bearer) =>
    fetch(base.replace('/users/me/setup', '/reader/library'), {
      headers: { Authorization: 'Bearer ' + bearer },
    });
  assert.equal((await request('GET')).status, 401);
  assert.equal((await get(oldToken)).required, false);
  assert.equal((await get(newToken)).required, true);
  assert.equal((await get(otherToken)).required, false);
  assert.notEqual((await product(oldToken)).status, 403);
  assert.equal((await product(newToken)).status, 403);
  assert.equal(
    (await prisma.userOnboarding.findUnique({ where: { userId: legacyId } }))
      .draftText,
    'Existing private prose',
  );
  for (const body of [
    { userId: other.id },
    { role: 'ADMIN' },
    { setupRequired: false },
    { status: 'completed' },
    { completedAt: new Date().toISOString() },
    { revision: 100 },
    { version: 2 },
    { step: 'dashboard' },
    { ageConfirmedAt: new Date().toISOString() },
    { agePolicyVersion: 'fake' },
    { purpose: 'ADMIN' },
    { creativeInterests: ['made-up'] },
    { readingFormats: null },
    { creativeInterests: ['novels', 'novels'] },
    { interfaceLanguage: 'ar' },
    { preferredName: 'a'.repeat(81) },
    { discoveryOther: 'a'.repeat(121) },
    { confirmAdult: true },
    { complete: false },
    { complete: true },
    { purpose: null, complete: true },
  ])
    assert.equal(
      (await request('PATCH', newToken, { expectedRevision: 0, ...body }))
        .status,
      400,
      JSON.stringify(body),
    );
  const partial = await request('PATCH', newToken, {
    expectedRevision: 0,
    preferredName: '  Quiet   Reader ',
    purpose: 'both',
    creativeInterests: ['novels'],
    readingFormats: ['comics'],
    step: 'preferences',
  });
  assert.equal(partial.status, 200);
  const saved = await partial.json();
  assert.equal(saved.revision, 1);
  assert.equal(saved.draft.preferredName, 'Quiet Reader');
  assert.equal(Object.hasOwn(saved, 'ageConfirmedAt'), false);
  assert.equal((await get(newToken)).step, 'preferences');
  assert.deepEqual((await get(otherToken)).draft.creativeInterests, []);
  assert.equal(
    (
      await request('PATCH', newToken, {
        expectedRevision: 0,
        preferredName: 'stale',
      })
    ).status,
    409,
  );
  const raced = await Promise.all(
    ['studio', 'reader'].map((preferredStart) =>
      request('PATCH', newToken, { expectedRevision: 1, preferredStart }),
    ),
  );
  assert.deepEqual(
    raced.map((r) => r.status).sort((a, b) => a - b),
    [200, 409],
  );
  const current = await get(newToken);
  assert.deepEqual(current.draft.creativeInterests, ['novels']);
  assert.deepEqual(current.draft.readingFormats, ['comics']);
  const finish = await request('PATCH', newToken, {
    expectedRevision: current.revision,
    complete: true,
  });
  assert.equal(finish.status, 200);
  const done = await finish.json();
  assert.equal(done.status, 'completed');
  assert.ok(done.completedAt);
  assert.equal(Object.hasOwn(done, 'ageConfirmedAt'), false);
  const completedRow = await prisma.userOnboarding.findUniqueOrThrow({
    where: { userId: fresh.id },
  });
  assert.equal(completedRow.ageConfirmedAt, null);
  assert.equal(completedRow.agePolicyVersion, null);
  // This fixture has no author row; after the setup guard it reaches domain ownership validation.
  assert.notEqual((await product(newToken)).status, 403);
  assert.deepEqual(
    await (
      await request('PATCH', newToken, {
        expectedRevision: current.revision,
        complete: true,
      })
    ).json(),
    done,
  );
  const oldDone = await request('PATCH', oldToken, {
    expectedRevision: 0,
    complete: true,
  });
  assert.equal(oldDone.status, 200);
  assert.equal((await oldDone.json()).draft.purpose, null);
  assert.notEqual((await product(oldToken)).status, 403);
  const oldRow = await prisma.userOnboarding.findUniqueOrThrow({
    where: { userId: legacyId },
  });
  assert.equal(oldRow.draftText, 'Existing private prose');
  assert.deepEqual(oldRow.interests, ['fiction']);
  assert.equal(
    (await prisma.user.findUniqueOrThrow({ where: { id: legacyId } })).name,
    'Existing name',
  );
  assert.equal(
    (await prisma.user.findUniqueOrThrow({ where: { id: fresh.id } })).role,
    'AUTHOR',
  );
  assert.equal(await prisma.userOnboarding.count(), 2);
  console.log(
    'Setup database checks passed: additive legacy migration, legacy access without declaration, new-account requirements, ownership, validation, resume, concurrency, idempotency, and preserved names/roles/prose.',
  );
} finally {
  await app?.close();
  await prisma?.$disconnect();
  if (created) await sql.query(`DROP SCHEMA "${schema}" CASCADE`);
  await sql.end();
}
