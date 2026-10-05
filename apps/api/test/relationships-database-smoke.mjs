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
  const config = configModule.get(ConfigService);
  if (config.get('NODE_ENV') === 'production')
    throw new Error('Relationship database tests are disabled in production');
  const connectionString = config.get('TEST_DATABASE_URL');
  if (!connectionString)
    throw new Error(
      'Set TEST_DATABASE_URL explicitly for relationship database tests',
    );
  const testUrl = new URL(connectionString);
  if (
    !['postgres:', 'postgresql:'].includes(testUrl.protocol) ||
    !testUrl.hostname ||
    testUrl.pathname.length < 2
  )
    throw new Error(
      'TEST_DATABASE_URL must be a PostgreSQL URL with a database name',
    );
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
  const token = alice.accessToken;
  const project = await call(
    'POST',
    '/projects',
    token,
    { title: 'Relationships' },
    201,
  );
  const other = await call(
    'POST',
    '/projects',
    token,
    { title: 'Another world' },
    201,
  );
  const foreign = await call(
    'POST',
    '/projects',
    bob.accessToken,
    { title: 'Private world' },
    201,
  );
  const path = '/projects/' + project.id + '/relationships';
  const entities = [];
  const collections = {
    CHARACTER: 'characters',
    PLACE: 'places',
    FACTION: 'factions',
    ARTIFACT: 'artifacts',
  };
  for (const [kind, collection] of Object.entries(collections)) {
    for (let i = 0; i < 2; i++) {
      const row = await call(
        'POST',
        '/projects/' + project.id + '/' + collection,
        token,
        { name: kind + ' ' + i },
        201,
      );
      entities.push({ kind, id: row.id, name: row.name });
    }
  }
  const input = (
    source,
    target,
    typeKey = 'RELATED_TO',
    direction = 'DIRECTIONAL',
  ) => ({
    source: { kind: source.kind, id: source.id },
    target: { kind: target.kind, id: target.id },
    typeKey,
    label: 'related to',
    direction,
    description: 'A connection',
  });
  const saved = [];
  for (const source of entities.filter((_, i) => i % 2 === 0)) {
    for (const target of entities.filter((_, i) => i % 2 === 1)) {
      const row = await call('POST', path, token, input(source, target), 201);
      assert.deepEqual(row.source, source);
      assert.deepEqual(row.target, target);
      assert.equal(row.projectId, project.id);
      assert.ok(!Object.hasOwn(row, 'sourceCharacterId'));
      saved.push(row);
    }
  }
  assert.equal((await call('GET', path, token)).items.length, 16);
  assert.equal(
    (await call('GET', path + '?typeKey=related-to', token)).items.length,
    16,
  );
  assert.equal(
    (await call('GET', path + '?typeKey=UNKNOWN', token)).items.length,
    0,
  );
  for (const entity of entities) {
    const filtered = await call(
      'GET',
      path + '?entityKind=' + entity.kind + '&entityId=' + entity.id,
      token,
    );
    assert.equal(filtered.items.length, 4);
    assert.ok(
      filtered.items.every((row) =>
        [row.source, row.target].some(
          (end) => end.kind === entity.kind && end.id === entity.id,
        ),
      ),
    );
  }
  const first = saved[0];
  const item = '/relationships/' + first.id;
  const concurrent = await call(
    'POST',
    path,
    token,
    input(entities[0], entities[2], 'CONCURRENT_PATCH'),
    201,
  );
  await Promise.all([
    call('PATCH', '/relationships/' + concurrent.id, token, {
      target: { kind: entities[4].kind, id: entities[4].id },
    }),
    call('PATCH', '/relationships/' + concurrent.id, token, {
      label: 'Concurrent notes',
    }),
  ]);
  const merged = await call('GET', '/relationships/' + concurrent.id, token);
  assert.equal(merged.target.id, entities[4].id);
  assert.equal(merged.label, 'Concurrent notes');
  const duplicateRace = await Promise.all([
    fetch(base + path, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + token,
      },
      body: JSON.stringify(input(entities[0], entities[2], 'DUPLICATE_RACE')),
    }),
    fetch(base + path, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + token,
      },
      body: JSON.stringify(input(entities[0], entities[2], 'DUPLICATE_RACE')),
    }),
  ]);
  assert.deepEqual(
    duplicateRace.map((response) => response.status).sort((a, b) => a - b),
    [201, 409],
  );
  assert.deepEqual(await call('GET', item, token), first);
  const edit = await call('PATCH', item, token, {
    label: ' knows ',
    typeKey: 'knows-about',
    description: null,
  });
  assert.equal(edit.label, 'knows');
  assert.equal(edit.typeKey, 'KNOWS_ABOUT');
  assert.equal(edit.description, null);
  await call(
    'POST',
    path,
    token,
    input(first.source, first.target, 'knows about'),
    409,
  );
  await call('PATCH', item, token, { projectId: other.id }, 400);
  await call('POST', path, token, input(entities[0], entities[0]), 400);
  for (const body of [
    { ...input(entities[0], entities[1]), source: { kind: 'USER', id: 'x' } },
    { ...input(entities[0], entities[1]), target: null },
    { ...input(entities[0], entities[1]), typeKey: '?' },
    { ...input(entities[0], entities[1]), label: ' ' },
    { ...input(entities[0], entities[1]), direction: null },
    {
      ...input(entities[0], entities[1]),
      source: { ...entities[0], extra: 'unknown' },
    },
  ])
    await call('POST', path, token, body, 400);
  await call('PATCH', item, token, { source: null }, 400);
  await call('GET', path + '?entityKind=PLACE', token, undefined, 400);
  await call(
    'GET',
    path + '?entityKind=USER&entityId=x',
    token,
    undefined,
    400,
  );
  await call('GET', path, null, undefined, 401);
  await call('GET', path, bob.accessToken, undefined, 404);
  await call(
    'POST',
    path,
    bob.accessToken,
    input(entities[0], entities[1]),
    404,
  );
  for (const method of ['GET', 'PATCH', 'DELETE'])
    await call(
      method,
      item,
      bob.accessToken,
      method === 'PATCH' ? { label: 'stolen' } : undefined,
      404,
    );
  await call('GET', '/relationships/missing', token, undefined, 404);
  const missing = { kind: 'CHARACTER', id: 'missing' };
  await call('POST', path, token, input(missing, entities[1]), 404);
  await call('POST', path, token, input(entities[0], missing), 404);
  const otherEntity = await call(
    'POST',
    '/projects/' + other.id + '/characters',
    token,
    { name: 'Other' },
    201,
  );
  const foreignEntity = await call(
    'POST',
    '/projects/' + foreign.id + '/characters',
    bob.accessToken,
    { name: 'Foreign' },
    201,
  );
  for (const id of [otherEntity.id, foreignEntity.id]) {
    const endpoint = { kind: 'CHARACTER', id };
    await call('POST', path, token, input(endpoint, entities[1]), 404);
    await call('POST', path, token, input(entities[1], endpoint), 404);
    await call('PATCH', item, token, { target: endpoint }, 404);
    await call(
      'GET',
      path + '?entityKind=CHARACTER&entityId=' + id,
      token,
      undefined,
      404,
    );
  }
  const symmetric = await call(
    'POST',
    path,
    token,
    input(entities[6], entities[2], 'ALLIED_WITH', 'SYMMETRIC'),
    201,
  );
  await call(
    'POST',
    path,
    token,
    input(entities[2], entities[6], 'ALLIED_WITH', 'SYMMETRIC'),
    409,
  );
  const directional = await call(
    'POST',
    path,
    token,
    input(entities[6], entities[2], 'ALLIED_WITH'),
    201,
  );
  await call(
    'POST',
    path,
    token,
    input(entities[2], entities[6], 'ALLIED_WITH'),
    201,
  );
  await call(
    'PATCH',
    '/relationships/' + directional.id,
    token,
    { direction: 'SYMMETRIC' },
    409,
  );
  const switched = await call(
    'PATCH',
    '/relationships/' + symmetric.id,
    token,
    {
      source: { kind: entities[4].kind, id: entities[4].id },
      target: { kind: entities[0].kind, id: entities[0].id },
    },
  );
  assert.equal(switched.source.id, entities[0].id);
  // Exercise SQL invariants directly: the API cannot be the only integrity boundary.
  const data = {
    projectId: project.id,
    sourceKind: 'CHARACTER',
    targetKind: 'PLACE',
    sourceCharacterId: entities[0].id,
    targetPlaceId: entities[2].id,
    typeKey: 'DIRECT_TEST',
    label: 'direct test',
  };
  for (const bad of [
    { ...data, sourceCharacterId: otherEntity.id },
    { ...data, sourceCharacterId: 'missing' },
    { ...data, sourceCharacterId: null },
    { ...data, sourceKind: 'PLACE' },
    { ...data, sourcePlaceId: entities[2].id },
    {
      ...data,
      targetKind: 'CHARACTER',
      targetPlaceId: null,
      targetCharacterId: entities[0].id,
    },
    { ...data, typeKey: 'not normalized' },
    { ...data, label: ' ' },
    {
      ...data,
      sourceKind: 'PLACE',
      sourceCharacterId: null,
      sourcePlaceId: entities[2].id,
      targetKind: 'CHARACTER',
      targetPlaceId: null,
      targetCharacterId: entities[0].id,
      direction: 'SYMMETRIC',
    },
  ])
    await assert.rejects(() => prisma.relationship.create({ data: bad }));
  const direct = await prisma.relationship.create({ data });
  await assert.rejects(() => prisma.relationship.create({ data }));
  await prisma.relationship.delete({ where: { id: direct.id } });
  await call('DELETE', item, token, undefined, 204);
  await call('GET', item, token, undefined, 404);
  // Deleting each entity kind removes incoming and outgoing links.
  for (const entity of entities.filter((_, i) => i % 2 === 0)) {
    await call(
      'DELETE',
      '/' + collections[entity.kind] + '/' + entity.id,
      token,
      undefined,
      204,
    );
    const field = entity.kind[0] + entity.kind.slice(1).toLowerCase();
    assert.equal(
      await prisma.relationship.count({
        where: {
          OR: [
            { ['source' + field + 'Id']: entity.id },
            { ['target' + field + 'Id']: entity.id },
          ],
        },
      }),
      0,
    );
  }
  await call(
    'POST',
    path,
    token,
    input(entities[1], entities[3], 'CASCADE'),
    201,
  );
  await call('DELETE', '/projects/' + project.id, token, undefined, 204);
  assert.equal(
    await prisma.relationship.count({ where: { projectId: project.id } }),
    0,
  );
  console.log(
    'Relationships PostgreSQL passed: all 16 kind pairs, CRUD, normalization, filtering, owner/project isolation, DTO validation, SQL constraints, duplicate prevention, symmetric identity, and entity/project cascades.',
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
