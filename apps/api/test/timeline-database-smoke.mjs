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
    throw new Error('Timeline database tests are disabled in production');
  const connectionString = config.get('TEST_DATABASE_URL');
  if (!connectionString)
    throw new Error(
      'Set TEST_DATABASE_URL explicitly for timeline database tests',
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
  let checks = 0;
  const collections = {
    CHARACTER: 'characters',
    PLACE: 'places',
    FACTION: 'factions',
    ARTIFACT: 'artifacts',
  };
  const makeTimeline = (projectId, name = 'World history', auth = token) =>
    call('POST', `/projects/${projectId}/timelines`, auth, { name }, 201);
  const timeline = await makeTimeline(project.id);
  const second = await makeTimeline(project.id, 'Royal dynasty');
  const foreignTimeline = await makeTimeline(
    foreign.id,
    'Private',
    bob.accessToken,
  );
  assert.equal(
    (await call('GET', `/projects/${project.id}/timelines`, token)).length,
    2,
  );
  assert.equal(
    (await call('GET', `/timelines/${timeline.id}`, token)).name,
    'World history',
  );
  assert.equal(
    (
      await call('PATCH', `/timelines/${timeline.id}`, token, {
        name: ' History ',
        description: 'notes',
      })
    ).name,
    'History',
  );
  const era = await call(
    'POST',
    `/timelines/${timeline.id}/eras`,
    token,
    { name: 'First Age', start: '-100', end: '100', position: 2 },
    201,
  );
  const earlier = await call(
    'POST',
    `/timelines/${timeline.id}/eras`,
    token,
    { name: 'Before', position: 0 },
    201,
  );
  const secondEra = await call(
    'POST',
    `/timelines/${second.id}/eras`,
    token,
    { name: 'Other era' },
    201,
  );
  assert.deepEqual(
    (await call('GET', `/timelines/${timeline.id}/eras`, token)).map(
      (x) => x.id,
    ),
    [earlier.id, era.id],
  );
  assert.equal((await call('GET', `/eras/${era.id}`, token)).start, '-100');
  await call('PATCH', `/eras/${era.id}`, token, { start: '101' }, 400);
  assert.equal(
    (
      await call('PATCH', `/eras/${era.id}`, token, {
        position: 1,
        description: null,
      })
    ).position,
    1,
  );
  const path = `/timelines/${timeline.id}/events`;
  const event = await call(
    'POST',
    path,
    token,
    {
      title: 'War',
      start: '-10.000001',
      end: '4.5',
      eraId: era.id,
      dateLabel: 'Day 14 of the Red Moon',
      description: 'Long account',
    },
    201,
  );
  assert.equal(event.start, '-10.000001');
  assert.equal(event.end, '4.5');
  assert.equal(event.era.id, era.id);
  assert.equal(event.dateLabel, 'Day 14 of the Red Moon');
  assert.deepEqual(event.entities, []);
  const values = [
    '9007199254740993.000002',
    '0',
    '-120',
    '9007199254740993.000001',
    '999999999999999999999999.999999',
  ];
  for (const start of values)
    await call('POST', path, token, { title: start, start }, 201);
  const ties = [];
  for (const position of [2, 1, 1])
    ties.push(
      await call(
        'POST',
        path,
        token,
        { title: 'Tie', start: '0', position },
        201,
      ),
    );
  let list = await call('GET', path, token);
  assert.deepEqual(
    list.items.map((x) => x.start),
    [
      '-120',
      '-10.000001',
      '0',
      '0',
      '0',
      '0',
      '9007199254740993.000001',
      '9007199254740993.000002',
      '999999999999999999999999.999999',
    ],
  );
  assert.deepEqual(
    list.items.filter((x) => ties.some((t) => t.id === x.id)).map((x) => x.id),
    ties
      .sort((a, b) => a.position - b.position || a.id.localeCompare(b.id))
      .map((x) => x.id),
  );
  assert.ok(
    list.items.every(
      (x) => !Object.hasOwn(x, 'description') && !Object.hasOwn(x, 'entities'),
    ),
  );
  const page = await call('GET', path + '?limit=2', token);
  assert.equal(page.items.length, 2);
  assert.equal(page.nextOffset, 2);
  assert.deepEqual(
    (await call('GET', path + '?limit=2&offset=2', token)).items,
    list.items.slice(2, 4),
  );
  assert.equal(
    (await call('GET', path + '?offset=100', token)).nextOffset,
    null,
  );
  assert.equal(
    (await call('GET', path + '?from=-10.000001&to=0', token)).items.length,
    5,
  );
  assert.equal(
    (await call('GET', path + '?eraId=' + era.id, token)).items.length,
    1,
  );
  const item = `/events/${event.id}`;
  assert.deepEqual(await call('GET', item, token), event);
  await call('PATCH', item, token, { start: '5' }, 400);
  await call('PATCH', item, token, { end: '-11' }, 400);
  await call(
    'POST',
    path,
    token,
    { title: 'Invalid duration', start: '1', end: '0' },
    400,
  );
  await call(
    'POST',
    path,
    token,
    { title: 'Wrong era', start: '0', eraId: secondEra.id },
    404,
  );
  await call('PATCH', item, token, { eraId: secondEra.id }, 404);
  await call('GET', path + '?eraId=' + secondEra.id, token, undefined, 404);
  await call('PATCH', item, token, { end: null, summary: 'Updated' });
  await Promise.all([
    call('PATCH', item, token, { title: 'Concurrent title' }),
    call('PATCH', item, token, { dateLabel: 'Before the battle' }),
  ]);
  assert.equal((await call('GET', item, token)).title, 'Concurrent title');
  assert.equal((await call('GET', item, token)).dateLabel, 'Before the battle');
  // Competing range updates must not combine into start > end.
  const raceEvent = await call(
    'POST',
    path,
    token,
    { title: 'Range race', start: '0', end: '10' },
    201,
  );
  const rangeRace = await Promise.all([
    fetch(base + '/events/' + raceEvent.id, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + token,
      },
      body: JSON.stringify({ start: '8' }),
    }),
    fetch(base + '/events/' + raceEvent.id, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + token,
      },
      body: JSON.stringify({ end: '2' }),
    }),
  ]);
  assert.deepEqual(
    rangeRace.map((x) => x.status).sort((a, b) => a - b),
    [200, 400],
  );
  const entities = [];
  for (const [kind, collection] of Object.entries(collections)) {
    const row = await call(
      'POST',
      `/projects/${project.id}/${collection}`,
      token,
      { name: kind },
      201,
    );
    entities.push({ kind, id: row.id, collection });
    const attached = await call(
      'POST',
      item + '/entities',
      token,
      { kind, entityId: row.id, role: ' participant ' },
      201,
    );
    assert.deepEqual(attached.entity, { id: row.id, kind, name: kind });
    assert.equal(attached.role, 'participant');
    assert.ok(!Object.hasOwn(attached, 'projectId'));
    await call(
      'POST',
      item + '/entities',
      token,
      { kind, entityId: row.id },
      409,
    );
    assert.equal(
      (
        await call(
          'GET',
          path + '?entityKind=' + kind + '&entityId=' + row.id,
          token,
        )
      ).items.length,
      1,
    );
  }
  let detail = await call('GET', item, token);
  assert.equal(detail.entities.length, 4);
  const association = detail.entities[0];
  await call(
    'DELETE',
    `/events/${raceEvent.id}/entities/${association.associationId}`,
    token,
    undefined,
    404,
  );
  await call(
    'DELETE',
    item + '/entities/' + association.associationId,
    bob.accessToken,
    undefined,
    404,
  );
  await call(
    'DELETE',
    item + '/entities/' + association.associationId,
    token,
    undefined,
    204,
  );
  assert.equal((await call('GET', item, token)).entities.length, 3);
  for (const [owner, projectId] of [
    [token, other.id],
    [bob.accessToken, foreign.id],
  ]) {
    for (const [kind, collection] of Object.entries(collections)) {
      const cross = await call(
        'POST',
        `/projects/${projectId}/${collection}`,
        owner,
        { name: 'Other world' },
        201,
      );
      await call(
        'POST',
        item + '/entities',
        token,
        { kind, entityId: cross.id },
        404,
      );
      await call(
        'GET',
        path + '?entityKind=' + kind + '&entityId=' + cross.id,
        token,
        undefined,
        404,
      );
    }
  }
  for (const [url, create] of [
    [`/projects/${project.id}/timelines`, { name: 'stolen' }],
    [`/timelines/${timeline.id}/eras`, { name: 'stolen' }],
    [path, { title: 'stolen', start: '0' }],
    [item + '/entities', { kind: 'CHARACTER', entityId: entities[0].id }],
  ]) {
    await call('POST', url, bob.accessToken, create, 404);
    await call('POST', url, null, create, 401);
  }
  for (const url of [`/timelines/${timeline.id}`, `/eras/${era.id}`, item]) {
    for (const method of ['GET', 'PATCH', 'DELETE']) {
      await call(
        method,
        url,
        bob.accessToken,
        method === 'PATCH' ? {} : undefined,
        404,
      );
      await call(method, url, null, method === 'PATCH' ? {} : undefined, 401);
    }
  }
  for (const url of [
    `/projects/${project.id}/timelines`,
    `/timelines/${timeline.id}/eras`,
    path,
  ]) {
    await call('GET', url, bob.accessToken, undefined, 404);
    await call('GET', url, null, undefined, 401);
  }
  const foreignEvent = await call(
    'POST',
    `/timelines/${foreignTimeline.id}/events`,
    bob.accessToken,
    { title: 'Private', start: '0' },
    201,
  );
  await call(
    'POST',
    `/events/${foreignEvent.id}/entities`,
    token,
    { kind: 'CHARACTER', entityId: entities[0].id },
    404,
  );
  await call(
    'POST',
    `/timelines/missing/events`,
    token,
    { title: 'Missing', start: '0' },
    404,
  );
  await call(
    'POST',
    `/timelines/missing/eras`,
    token,
    { name: 'Missing' },
    404,
  );
  for (const start of [
    1,
    null,
    'NaN',
    'Infinity',
    '1e6',
    '01',
    '1.0000001',
    '1000000000000000000000000',
  ])
    await call('POST', path, token, { title: 'Bad', start }, 400);
  for (const update of [
    { start: null },
    { title: null },
    { title: ' ' },
    { position: null },
    { position: -1 },
    { position: 1.5 },
    { projectId: other.id },
    { eraId: [] },
    { summary: 'x'.repeat(1001) },
    { description: 'x'.repeat(10001) },
    { dateLabel: 'x'.repeat(201) },
  ])
    await call('PATCH', item, token, update, 400);
  for (const query of [
    'entityKind=PLACE',
    'entityId=x',
    'entityKind=USER&entityId=x',
    'from=1&to=-1',
    'from=NaN',
    'limit=0',
    'limit=101',
    'limit=1.5',
    'offset=-1',
    'offset=1000001',
    'limit=2&limit=3',
    'unknown=x',
  ])
    await call('GET', path + '?' + query, token, undefined, 400);
  for (const body of [
    { kind: 'USER', entityId: 'x' },
    { kind: 'CHARACTER', entityId: null },
    { kind: 'CHARACTER', entityId: 'missing', role: ' ' },
  ])
    await call('POST', item + '/entities', token, body, 400);
  await call(
    'POST',
    item + '/entities',
    token,
    { kind: 'CHARACTER', entityId: 'missing' },
    404,
  );
  await call(
    'POST',
    `/timelines/${timeline.id}/eras`,
    token,
    { name: 'Bad era', start: '2', end: '1' },
    400,
  );
  await call(
    'POST',
    `/projects/${project.id}/timelines`,
    token,
    { name: ' ' },
    400,
  );
  // Database constraints, independently of DTOs and service checks.
  const eventData = {
    projectId: project.id,
    timelineId: timeline.id,
    title: 'Direct',
    start: '0',
  };
  for (const bad of [
    { eraId: secondEra.id },
    { projectId: other.id },
    { start: '2', end: '1' },
    { start: 'NaN' },
    { end: 'NaN' },
    { position: -1 },
    { title: ' ' },
  ]) {
    await assert.rejects(() =>
      prisma.timelineEvent.create({ data: { ...eventData, ...bad } }),
    );
    checks++;
  }
  for (const bad of [
    { start: '2', end: '1' },
    { start: 'NaN' },
    { end: 'NaN' },
    { position: -1 },
    { name: ' ' },
  ]) {
    await assert.rejects(() =>
      prisma.era.create({
        data: { timelineId: timeline.id, name: 'Direct era', ...bad },
      }),
    );
    checks++;
  }
  const linkData = {
    projectId: project.id,
    eventId: event.id,
    kind: 'CHARACTER',
    characterId: entities[0].id,
  };
  await prisma.eventEntity.deleteMany({ where: { eventId: event.id } });
  const directLink = await prisma.eventEntity.create({ data: linkData });
  for (const bad of [
    {},
    { characterId: null },
    { kind: 'PLACE' },
    { placeId: entities[1].id },
    { projectId: other.id },
    { characterId: 'missing' },
    { role: ' ' },
  ]) {
    await assert.rejects(() =>
      prisma.eventEntity.create({ data: { ...linkData, ...bad } }),
    );
    checks++;
  }
  const otherCharacter = await prisma.character.findFirst({
    where: { projectId: other.id },
  });
  await assert.rejects(() =>
    prisma.eventEntity.create({
      data: { ...linkData, characterId: otherCharacter.id },
    }),
  );
  checks++;
  await prisma.eventEntity.delete({ where: { id: directLink.id } });
  // Concurrent duplicates have one winner; all four entity deletions cascade.
  const duplicateRace = await Promise.all(
    [1, 2].map(() =>
      fetch(base + item + '/entities', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer ' + token,
        },
        body: JSON.stringify({ kind: 'CHARACTER', entityId: entities[0].id }),
      }),
    ),
  );
  assert.deepEqual(
    duplicateRace.map((x) => x.status).sort((a, b) => a - b),
    [201, 409],
  );
  for (const entity of entities) {
    if (entity.kind !== 'CHARACTER')
      await call(
        'POST',
        item + '/entities',
        token,
        { kind: entity.kind, entityId: entity.id },
        201,
      );
    await call(
      'DELETE',
      `/${entity.collection}/${entity.id}`,
      token,
      undefined,
      204,
    );
    const field = entity.kind.toLowerCase() + 'Id';
    assert.equal(
      await prisma.eventEntity.count({ where: { [field]: entity.id } }),
      0,
    );
  }
  await assert.rejects(() => prisma.era.delete({ where: { id: era.id } }));
  await call('DELETE', `/eras/${era.id}`, token, undefined, 204);
  assert.equal((await call('GET', item, token)).era, null);
  await call('GET', `/eras/${era.id}`, token, undefined, 404);
  const survivor = await call(
    'POST',
    `/projects/${project.id}/characters`,
    token,
    { name: 'Survivor' },
    201,
  );
  await call(
    'POST',
    item + '/entities',
    token,
    { kind: 'CHARACTER', entityId: survivor.id },
    201,
  );
  await call('DELETE', item, token, undefined, 204);
  assert.equal(
    await prisma.eventEntity.count({ where: { eventId: event.id } }),
    0,
  );
  await call('GET', item, token, undefined, 404);
  // Timeline cascade with a still-assigned era verifies composite NoAction behavior.
  const cascadeEra = await call(
    'POST',
    `/timelines/${second.id}/eras`,
    token,
    { name: 'Cascade era' },
    201,
  );
  const cascadeEvent = await call(
    'POST',
    `/timelines/${second.id}/events`,
    token,
    { title: 'Cascade event', start: '0', eraId: cascadeEra.id },
    201,
  );
  await call(
    'POST',
    `/events/${cascadeEvent.id}/entities`,
    token,
    { kind: 'CHARACTER', entityId: survivor.id },
    201,
  );
  await call('DELETE', `/timelines/${second.id}`, token, undefined, 204);
  assert.equal(await prisma.era.count({ where: { timelineId: second.id } }), 0);
  assert.equal(
    await prisma.timelineEvent.count({ where: { timelineId: second.id } }),
    0,
  );
  assert.equal(
    await prisma.eventEntity.count({ where: { eventId: cascadeEvent.id } }),
    0,
  );
  const remaining = await call(
    'POST',
    path,
    token,
    { title: 'Project cascade', start: '0', eraId: earlier.id },
    201,
  );
  await call(
    'POST',
    `/events/${remaining.id}/entities`,
    token,
    { kind: 'CHARACTER', entityId: survivor.id },
    201,
  );
  await call('DELETE', `/projects/${project.id}`, token, undefined, 204);
  for (const model of ['timeline', 'timelineEvent', 'eventEntity'])
    assert.equal(
      await prisma[model].count({ where: { projectId: project.id } }),
      0,
    );
  assert.equal(
    await prisma.era.count({ where: { timelineId: timeline.id } }),
    0,
  );
  console.log(
    `Timeline PostgreSQL + HTTP passed: CRUD, exact fictional chronology/order/pagination, all four entity kinds, validation, 401, owner/project/timeline isolation, concurrent range/duplicate updates, ${checks} direct SQL integrity rejections, and all cascades.`,
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
