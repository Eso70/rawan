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

// Opt-in: apply committed migrations only inside a disposable PostgreSQL schema.
// Existing tables, accounts, data and migration history are never modified.
const schema = `rawan_domain_test_${randomUUID().replaceAll('-', '')}`;
let configModule;
let sql;
let prisma;
let app;
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
    .filter((entry) => entry.isDirectory())
    .sort((a, b) => a.name.localeCompare(b.name))) {
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
  const alice = await call(
    'POST',
    '/auth/register',
    null,
    { email: 'alice@example.invalid', name: 'Alice', password },
    201,
  );
  const bob = await call(
    'POST',
    '/auth/register',
    null,
    { email: 'bob@example.invalid', name: 'Bob', password },
    201,
  );
  async function hierarchy() {
    const project = await call(
      'POST',
      '/projects',
      alice.accessToken,
      { title: 'Project' },
      201,
    );
    const books = `/projects/${project.id}/books`;
    const book = await call(
      'POST',
      books,
      alice.accessToken,
      { title: 'Book' },
      201,
    );
    const chapters = `${books}/${book.id}/chapters`;
    const chapter = await call(
      'POST',
      chapters,
      alice.accessToken,
      { title: 'Chapter' },
      201,
    );
    const scenes = `${chapters}/${chapter.id}/scenes`;
    const scene = await call(
      'POST',
      scenes,
      alice.accessToken,
      { title: 'Scene', content: '  مرحبا\nStory  ' },
      201,
    );
    assert.equal(scene.content, '  مرحبا\nStory  ');
    return [
      { model: 'project', path: '/projects', record: project },
      { model: 'book', path: books, record: book },
      { model: 'chapter', path: chapters, record: chapter },
      { model: 'scene', path: scenes, record: scene },
    ];
  }
  const levels = await hierarchy();
  for (const { model, path, record } of levels) {
    await call('GET', `${path}/${record.id}`, bob.accessToken, undefined, 404);
    await call(
      'PATCH',
      `${path}/${record.id}`,
      bob.accessToken,
      { title: 'Intruder' },
      404,
    );
    await call(
      'DELETE',
      `${path}/${record.id}`,
      bob.accessToken,
      undefined,
      404,
    );
    if (model !== 'project')
      await call('POST', path, bob.accessToken, { title: 'Intruder' }, 404);
    const updated = await call(
      'PATCH',
      `${path}/${record.id}`,
      alice.accessToken,
      { title: 'Updated', description: 'Summary' },
    );
    assert.equal(updated.title, 'Updated');
    assert.equal(updated.description, 'Summary');
    const cleared = await call(
      'PATCH',
      `${path}/${record.id}`,
      alice.accessToken,
      { description: null },
    );
    assert.equal(cleared.description, null);
    assert.equal(cleared.title, 'Updated');
    if (model !== 'project') {
      await call('PATCH', `${path}/${record.id}`, alice.accessToken, {
        position: 10,
      });
      const earlier = await call(
        'POST',
        path,
        alice.accessToken,
        { title: 'Earlier', position: 1 },
        201,
      );
      const list = await call('GET', path, alice.accessToken);
      assert.deepEqual(
        (model === 'scene' ? list.items : list).map((row) => row.id),
        [earlier.id, record.id],
      );
    }
  }
  const wrongProject = await call(
    'POST',
    '/projects',
    alice.accessToken,
    { title: 'Other project' },
    201,
  );
  for (const { path, record } of levels.slice(1)) {
    const wrongPath = path.replace(levels[0].record.id, wrongProject.id);
    await call(
      'GET',
      wrongPath,
      alice.accessToken,
      undefined,
      path === levels[1].path ? 200 : 404,
    );
    if (path !== levels[1].path)
      await call(
        'POST',
        wrongPath,
        alice.accessToken,
        { title: 'Wrong ancestor' },
        404,
      );
    await call(
      'GET',
      `${wrongPath}/${record.id}`,
      alice.accessToken,
      undefined,
      404,
    );
    await call(
      'PATCH',
      `${wrongPath}/${record.id}`,
      alice.accessToken,
      { title: 'Wrong parent' },
      404,
    );
    await call(
      'DELETE',
      `${wrongPath}/${record.id}`,
      alice.accessToken,
      undefined,
      404,
    );
  }
  // Deletion at each parent level removes all of its descendants in PostgreSQL.
  await call(
    'DELETE',
    `/projects/${levels[0].record.id}`,
    alice.accessToken,
    undefined,
    204,
  );
  for (const { model, record } of levels)
    assert.equal(
      await prisma[model].findUnique({ where: { id: record.id } }),
      null,
    );
  for (const parentIndex of [1, 2]) {
    const tree = await hierarchy();
    const parent = tree[parentIndex];
    await call(
      'DELETE',
      `${parent.path}/${parent.record.id}`,
      alice.accessToken,
      undefined,
      204,
    );
    for (const { model, record } of tree.slice(parentIndex))
      assert.equal(
        await prisma[model].findUnique({ where: { id: record.id } }),
        null,
      );
  }
  await prisma.user.delete({ where: { id: alice.user.id } });
  assert.equal(await prisma.project.count(), 0);
  assert.equal(await prisma.book.count(), 0);
  assert.equal(await prisma.chapter.count(), 0);
  assert.equal(await prisma.scene.count(), 0);
  console.log(
    'Manuscript database smoke passed: migrations, real API/Prisma ownership, updates, ordering and cascades.',
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
