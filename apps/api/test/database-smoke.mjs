import './disable-queues.mjs';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { Test } from '@nestjs/testing';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@rawan/database';
import pg from 'pg';
import { readdir, readFile } from 'node:fs/promises';
import { AppModule } from '../dist/app.module.js';
import { configureApp } from '../dist/config/configure-app.js';
import { PrismaService } from '../dist/database/prisma.service.js';

// Opt-in integration check. Every write is scoped to these random test emails.
const suffix = randomUUID();
const email = `foundation-${suffix}@example.invalid`;
const raceEmail = `race-${suffix}@example.invalid`;
const rollbackEmail = `rollback-${suffix}@example.invalid`;
const password = `smoke-${randomUUID()}`;
const name = 'Rawan foundation smoke test';
let app;
let prisma;
let sql;
let createdSchema = false;
const schema = 'rawan_auth_test_' + randomUUID().replaceAll('-', '');

try {
  const connectionString = process.env.TEST_DATABASE_URL;
  sql = new pg.Client({ connectionString, connectionTimeoutMillis: 5000 });
  await sql.connect();
  await sql.query('CREATE SCHEMA "' + schema + '"');
  createdSchema = true;
  await sql.query('SET search_path TO "' + schema + '"');
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
  await prisma.$connect();
  const module = await Test.createTestingModule({ imports: [AppModule] })
    .overrideProvider(PrismaService)
    .useValue(prisma)
    .compile();
  app = module.createNestApplication({ logger: false });
  configureApp(app);
  await app.listen(0, '127.0.0.1');
  const base = `${await app.getUrl()}/api/v1`;
  const post = (path, body) =>
    fetch(`${base}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  const get = (path, token) =>
    fetch(`${base}${path}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });

  assert.equal((await get('/health')).status, 200);
  assert.equal((await get('/users/me')).status, 401);
  const registered = await post('/auth/register', {
    email: ` ${email.toUpperCase()} `,
    password,
    name,
  });
  assert.equal(registered.status, 201);
  const auth = await registered.json();
  assert.equal(auth.user.role, 'AUTHOR');
  assert.equal(auth.user.email, email);
  assert.equal(Object.hasOwn(auth.user, 'password'), false);
  const profile = await prisma.author.findUnique({
    where: { userId: auth.user.id },
  });
  assert.equal(profile?.displayName, name);
  assert.equal((await get('/users/me', auth.accessToken)).status, 200);
  assert.equal((await get('/users', auth.accessToken)).status, 403);
  assert.equal(
    (await post('/auth/register', { email, password, name })).status,
    409,
  );
  const login = await post('/auth/login', {
    email: email.toUpperCase(),
    password,
  });
  assert.equal(login.status, 200);
  assert.equal(
    (await post('/auth/login', { email, password: 'wrong password' })).status,
    401,
  );

  // Only this temporary account is promoted/demoted; existing accounts are untouched.
  await prisma.user.update({
    where: { id: auth.user.id },
    data: { role: 'ADMIN' },
  });
  const adminRead = await get(`/users/${auth.user.id}`, auth.accessToken);
  assert.equal(adminRead.status, 200);
  assert.equal(Object.hasOwn(await adminRead.json(), 'password'), false);
  await prisma.user.update({
    where: { id: auth.user.id },
    data: { role: 'AUTHOR' },
  });
  assert.equal((await get('/users', auth.accessToken)).status, 403);

  const race = await Promise.all([
    post('/auth/register', { email: raceEmail, password, name }),
    post('/auth/register', { email: raceEmail.toUpperCase(), password, name }),
  ]);
  assert.deepEqual(
    race.map((response) => response.status).sort((left, right) => left - right),
    [201, 409],
  );
  assert.equal(await prisma.user.count({ where: { email: raceEmail } }), 1);
  assert.equal(
    await prisma.author.count({ where: { user: { email: raceEmail } } }),
    1,
  );

  const rollback = new Error('Intentional transaction rollback');
  await assert.rejects(
    prisma.$transaction(async (tx) => {
      await tx.user.create({
        data: {
          email: rollbackEmail,
          name,
          role: 'AUTHOR',
          author: { create: { displayName: name } },
        },
      });
      throw rollback;
    }),
    (error) => error === rollback,
  );
  assert.equal(await prisma.user.count({ where: { email: rollbackEmail } }), 0);
  assert.equal(
    await prisma.author.count({ where: { user: { email: rollbackEmail } } }),
    0,
  );

  await prisma.user.delete({ where: { id: auth.user.id } });
  assert.equal(
    await prisma.author.count({ where: { userId: auth.user.id } }),
    0,
  );
  assert.equal((await get('/users/me', auth.accessToken)).status, 401);
  console.log(
    'PASS: live PostgreSQL auth, author profiles, duplicate race, roles, deletion, and transaction rollback',
  );
} finally {
  try {
    if (prisma) {
      await prisma.user.deleteMany({
        where: { email: { in: [email, raceEmail, rollbackEmail] } },
      });
      assert.equal(
        await prisma.user.count({
          where: { email: { in: [email, raceEmail, rollbackEmail] } },
        }),
        0,
      );
      console.log('PASS: temporary database accounts cleaned up');
    }
  } finally {
    try {
      if (app) await app.close();
    } finally {
      try {
        if (prisma) await prisma.$disconnect();
      } finally {
        if (sql) {
          try {
            if (createdSchema && /^rawan_auth_test_[a-f0-9]{32}$/.test(schema))
              await sql.query('DROP SCHEMA "' + schema + '" CASCADE');
          } finally {
            await sql.end();
          }
        }
      }
    }
  }
}
