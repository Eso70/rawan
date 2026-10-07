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

const schema = 'rawan_onboarding_test_' + randomUUID().replaceAll('-', '');
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
  for (const folder of (await readdir(migrations, { withFileTypes: true }))
    .filter((e) => e.isDirectory())
    .sort((a, b) => a.name.localeCompare(b.name)))
    await sql.query(
      await readFile(
        new URL(folder.name + '/migration.sql', migrations),
        'utf8',
      ),
    );
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
  const base = (await app.getUrl()) + '/api/v1';
  const first = await prisma.user.create({
    data: {
      email: randomUUID() + '@example.invalid',
      name: 'First',
      author: { create: { displayName: 'First' } },
    },
  });
  const second = await prisma.user.create({
    data: {
      email: randomUUID() + '@example.invalid',
      name: 'Second',
      author: { create: { displayName: 'Second' } },
    },
  });
  const { AuthService } = await import('../dist/auth/auth.service.js');
  const token = (await app.get(AuthService).createToken(first)).accessToken;
  const secondToken = (await app.get(AuthService).createToken(second))
    .accessToken;
  const request = (method, token, body) =>
    fetch(base + '/users/me/onboarding', {
      method,
      headers: {
        ...(token ? { Authorization: 'Bearer ' + token } : {}),
        ...(body ? { 'Content-Type': 'application/json' } : {}),
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
  assert.equal((await request('GET')).status, 401);
  assert.equal((await (await request('GET', token)).json()).completedAt, null);
  assert.equal(
    (
      await request('PATCH', token, {
        experience: 'reader',
        interests: ['fantasy', 'fiction'],
        goal: 'stories',
        storyType: 'fiction',
        phase: 'tour',
        step: 3,
        draftName: 'Private tutorial',
        draftText: 'Private prose.',
      })
    ).status,
    200,
  );
  assert.equal(
    (await (await request('GET', token)).json()).draftText,
    'Private prose.',
  );
  assert.equal(
    (await (await request('GET', secondToken)).json()).draftText,
    '',
  );
  const savedPreferences = await (await request('GET', token)).json();
  assert.equal(savedPreferences.experience, 'reader');
  assert.deepEqual(savedPreferences.interests, ['fantasy', 'fiction']);
  assert.equal(savedPreferences.goal, 'stories');
  assert.equal(
    (await (await request('GET', secondToken)).json()).experience,
    null,
  );
  assert.equal(
    (await prisma.user.findUnique({ where: { id: first.id } })).role,
    'AUTHOR',
  );
  for (const body of [
    { experience: 'ADMIN' },
    { interests: ['unrecognized'] },
    { step: 5 },
    { phase: null },
    { complete: false },
    { userId: second.id },
    { draftImage: 'external-url' },
  ])
    assert.equal((await request('PATCH', token, body)).status, 400);
  const done = await (
    await request('PATCH', token, { complete: true, skipped: false })
  ).json();
  assert.ok(done.completedAt);
  assert.equal(
    (await (await request('PATCH', token, { phase: 'choice', step: 0 })).json())
      .completedAt,
    done.completedAt,
  );
  assert.equal(
    (await (await request('PATCH', token, { complete: true })).json())
      .completedAt,
    done.completedAt,
  );
  await prisma.user.delete({ where: { id: first.id } });
  assert.equal(await prisma.userOnboarding.count(), 0);
  console.log(
    'Onboarding database checks passed: identity isolation, resume, validation, one-way completion and account cascade.',
  );
} finally {
  await app?.close();
  await prisma?.$disconnect();
  if (created) await sql.query(`DROP SCHEMA "${schema}" CASCADE`);
  await sql.end();
}
