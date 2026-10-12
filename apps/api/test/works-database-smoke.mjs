import { createAccountFixture } from './account-fixture.mjs';
import './disable-queues.mjs';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { readFile, readdir } from 'node:fs/promises';
import { Test } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@rawan/database';
import pg from 'pg';
import { AppModule } from '../dist/app.module.js';
import { PrismaService } from '../dist/database/prisma.service.js';
import { configureApp } from '../dist/config/configure-app.js';

// Only a newly created disposable schema is migrated and removed.
const schema = `rawan_works_test_${randomUUID().replaceAll('-', '')}`;
let configModule, sql, prisma, app;
let createdSchema = false;
try {
  configModule = await Test.createTestingModule({ imports: [AppModule] })
    .overrideProvider(PrismaService)
    .useValue({})
    .compile();
  const connectionString = configModule
    .get(ConfigService)
    .getOrThrow('DATABASE_URL');
  sql = new pg.Client({ connectionString, connectionTimeoutMillis: 5000 });
  await sql.connect();
  await sql.query(`CREATE SCHEMA "${schema}"`);
  createdSchema = true;
  await sql.query(`SET search_path TO "${schema}"`);
  const migrations = new URL(
    '../../../packages/database/prisma/migrations/',
    import.meta.url,
  );
  for (const folder of (await readdir(migrations, { withFileTypes: true }))
    .filter((item) => item.isDirectory())
    .sort((a, b) => a.name.localeCompare(b.name))) {
    if (folder.name === '20261012010000_private_work_identity') {
      await sql.query(`INSERT INTO "User" ("id", "email", "name", "updatedAt") VALUES ('before-user', 'before@example.invalid', 'Before', NOW());
        INSERT INTO "Author" ("id", "userId", "displayName", "updatedAt") VALUES ('before-author', 'before-user', 'Before', NOW());
        INSERT INTO "Project" ("id", "authorId", "title", "updatedAt") VALUES ('before-project', 'before-author', 'Before', NOW());
        INSERT INTO "Book" ("id", "projectId", "title", "updatedAt") VALUES ('before-book', 'before-project', 'Existing manuscript', NOW());`);
    }
    await sql.query(
      await readFile(
        new URL(`${folder.name}/migration.sql`, migrations),
        'utf8',
      ),
    );
  }
  prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString }, { schema }),
  });
  await prisma.$connect();
  assert.equal(
    (await prisma.book.findUnique({ where: { id: 'before-book' } })).title,
    'Existing manuscript',
  );
  assert.equal(
    await prisma.work.count(),
    0,
    'Migration must not invent works from existing books',
  );
  const module = await Test.createTestingModule({ imports: [AppModule] })
    .overrideProvider(PrismaService)
    .useValue(prisma)
    .compile();
  app = module.createNestApplication({ logger: false });
  configureApp(app);
  await app.listen(0, '127.0.0.1');
  const base = `${await app.getUrl()}/api/v1`;
  async function call(method, path, token, body, expected = 200) {
    const response = await fetch(`${base}${path}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
    assert.equal(response.status, expected, `${method} ${path}`);
    return expected === 204 ? undefined : response.json();
  }
  const password = `smoke-${randomUUID()}`;
  const register = (name) =>
    createAccountFixture(app, { email: `${name}@example.invalid`, name, password });
  const alice = await register('alice');
  const bob = await register('bob');
  const a = alice.accessToken,
    b = bob.accessToken;
  const project = await call(
    'POST',
    '/projects',
    a,
    { title: 'Source project' },
    201,
  );
  const second = await call(
    'POST',
    '/projects',
    a,
    { title: 'Second source' },
    201,
  );
  const foreign = await call('POST', '/projects', b, { title: 'Private' }, 201);
  const book = await call(
    'POST',
    `/projects/${project.id}/books`,
    a,
    { title: 'Manuscript' },
    201,
  );
  const book2 = await call(
    'POST',
    `/projects/${second.id}/books`,
    a,
    { title: 'Another manuscript' },
    201,
  );
  const foreignBook = await call(
    'POST',
    `/projects/${foreign.id}/books`,
    b,
    { title: 'Private manuscript' },
    201,
  );
  await call('GET', '/works', null, undefined, 401);
  await call(
    'POST',
    '/works',
    a,
    { title: 'Invalid', ownerUserId: bob.user.id },
    400,
  );
  await call(
    'POST',
    '/works',
    a,
    { title: 'Invalid', publicationStatus: 'PUBLISHED' },
    400,
  );
  await call('POST', '/works', a, { title: '   ' }, 400);
  const work = await call(
    'POST',
    '/works',
    a,
    { title: '  Work identity  ', description: 'Private' },
    201,
  );
  assert.equal(work.title, 'Work identity');
  assert.deepEqual(
    Object.keys(work).sort(),
    ['id', 'title', 'description', 'createdAt', 'updatedAt'].sort(),
  );
  assert.equal((await call('GET', '/works', b)).items.length, 0);
  for (const method of ['GET', 'PATCH', 'DELETE'])
    await call(
      method,
      `/works/${work.id}`,
      b,
      method === 'PATCH' ? { title: 'Hijack' } : undefined,
      404,
    );
  await call('GET', `/works/${work.id}`, null, undefined, 401);
  await call('GET', `/works/${work.id}/sources`, b, undefined, 404);
  await call(
    'POST',
    `/works/${work.id}/sources`,
    b,
    { projectId: foreign.id, bookId: foreignBook.id },
    404,
  );
  await call(
    'POST',
    `/works/${work.id}/sources`,
    a,
    { projectId: foreign.id, bookId: foreignBook.id },
    404,
  );
  await call(
    'POST',
    `/works/${work.id}/sources`,
    a,
    { projectId: second.id, bookId: book.id },
    404,
  );
  await call(
    'POST',
    `/works/${work.id}/sources`,
    a,
    { projectId: project.id, bookId: book.id, role: 'published' },
    400,
  );
  const source = await call(
    'POST',
    `/works/${work.id}/sources`,
    a,
    { projectId: project.id, bookId: book.id },
    201,
  );
  await call(
    'POST',
    `/works/${work.id}/sources`,
    a,
    { projectId: project.id, bookId: book.id },
    409,
  );
  await call(
    'POST',
    `/works/${work.id}/sources`,
    a,
    { projectId: second.id, bookId: book2.id },
    201,
  );
  const page = await call('GET', `/works/${work.id}/sources?limit=1`, a);
  assert.equal(page.items.length, 1);
  assert.equal(page.nextOffset, 1);
  const next = await call(
    'GET',
    `/works/${work.id}/sources?limit=1&offset=1`,
    a,
  );
  assert.equal(next.nextOffset, null);
  assert.notEqual(next.items[0].id, page.items[0].id);
  await call('GET', '/works?limit=101', a, undefined, 400);
  await call('GET', '/works?sort=ownerUserId', a, undefined, 400);
  await call('GET', '/works?q=%', a, undefined, 400);
  assert.equal(
    (await call('GET', '/works?q=Work&sort=title', a)).items[0].id,
    work.id,
  );
  const updated = await call('PATCH', `/works/${work.id}`, a, {
    description: null,
  });
  assert.equal(updated.description, null);
  assert.equal(updated.title, 'Work identity');
  const otherWork = await call('POST', '/works', a, { title: 'Other' }, 201);
  await call(
    'DELETE',
    `/works/${otherWork.id}/sources/${source.id}`,
    a,
    undefined,
    404,
  );
  await call(
    'DELETE',
    `/works/${work.id}/sources/${source.id}`,
    b,
    undefined,
    404,
  );
  await call(
    'DELETE',
    `/works/${work.id}/sources/${source.id}`,
    a,
    undefined,
    204,
  );
  assert.ok(await prisma.book.findUnique({ where: { id: book.id } }));
  await call(
    'POST',
    `/works/${otherWork.id}/sources`,
    a,
    { projectId: project.id, bookId: book.id },
    201,
  );
  await call('DELETE', `/works/${otherWork.id}`, a, undefined, 204);
  assert.ok(
    await prisma.book.findUnique({ where: { id: book.id } }),
    'Deleting a work must not delete its source manuscript',
  );
  await call(
    'DELETE',
    `/projects/${second.id}/books/${book2.id}`,
    a,
    undefined,
    204,
  );
  assert.equal(
    (await call('GET', `/works/${work.id}/sources`, a)).items.length,
    0,
  );
  assert.equal(
    (await call('GET', `/works/${work.id}`, a)).id,
    work.id,
    'Source deletion preserves private work identity',
  );
  await prisma.user.update({
    where: { id: bob.user.id },
    data: { role: 'ADMIN' },
  });
  await call('GET', `/works/${work.id}`, b, undefined, 404);
  await prisma.user.delete({ where: { id: alice.user.id } });
  assert.equal(await prisma.work.findUnique({ where: { id: work.id } }), null);
  assert.equal(await prisma.workSource.count(), 0);
  console.log(
    'Work database smoke passed: additive migration, validation, ownership, source links, paging and deletion isolation.',
  );
} finally {
  if (app) await app.close();
  if (prisma) await prisma.$disconnect();
  if (sql) {
    try {
      if (createdSchema) await sql.query(`DROP SCHEMA "${schema}" CASCADE`);
    } finally {
      await sql.end();
    }
  }
  if (configModule) await configModule.close();
}
