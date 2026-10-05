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

  const project = await call(
    'POST',
    '/projects',
    alice.accessToken,
    { title: 'World project' },
    201,
  );
  const records = [];
  for (const kind of ['characters', 'places', 'factions', 'artifacts']) {
    const collection = '/projects/' + project.id + '/' + kind;
    const extra =
      kind === 'characters'
        ? { role: 'Protagonist', status: 'Alive' }
        : { type: 'Custom' };
    const entity = await call(
      'POST',
      collection,
      alice.accessToken,
      {
        name: '  Zed  ',
        summary: 'Summary',
        description: '  مرحبا\nWorld  ',
        ...extra,
      },
      201,
    );
    const path = '/' + kind + '/' + entity.id;
    records.push({ kind, entity });
    assert.equal(entity.name, 'Zed');
    assert.equal(entity.projectId, project.id);
    await call('GET', collection, bob.accessToken, undefined, 404);
    await call('POST', collection, bob.accessToken, { name: 'Intruder' }, 404);
    await call('GET', path, bob.accessToken, undefined, 404);
    await call('PATCH', path, bob.accessToken, { name: 'Intruder' }, 404);
    await call('DELETE', path, bob.accessToken, undefined, 404);
    const updated = await call('PATCH', path, alice.accessToken, {
      name: 'Edited',
      summary: null,
    });
    assert.equal(updated.summary, null);
    assert.equal(updated.description, '  مرحبا\nWorld  ');
    await call('POST', collection, alice.accessToken, { name: 'Alpha' }, 201);
    assert.deepEqual(
      (await call('GET', collection, alice.accessToken)).items.map(
        (row) => row.name,
      ),
      ['Alpha', 'Edited'],
    );
    await call(
      'PATCH',
      path,
      alice.accessToken,
      { projectId: project.id },
      400,
    );
    const disposable = await call(
      'POST',
      collection,
      alice.accessToken,
      { name: 'Delete me' },
      201,
    );
    await call(
      'DELETE',
      '/' + kind + '/' + disposable.id,
      alice.accessToken,
      undefined,
      204,
    );
    await call(
      'GET',
      '/' + kind + '/' + disposable.id,
      alice.accessToken,
      undefined,
      404,
    );
  }
  await call(
    'DELETE',
    '/projects/' + project.id,
    alice.accessToken,
    undefined,
    204,
  );
  for (const { kind, entity } of records)
    assert.equal(
      await prisma[kind.slice(0, -1)].findUnique({ where: { id: entity.id } }),
      null,
    );
  console.log(
    'Worldbuilding PostgreSQL passed: all migrations, CRUD, author isolation, validation, ordering, and project cascades.',
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
