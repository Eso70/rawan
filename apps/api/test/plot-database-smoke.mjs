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
    throw new Error('Plot database tests are disabled in production');
  const connectionString = config.get('TEST_DATABASE_URL');
  if (!connectionString)
    throw new Error('Set TEST_DATABASE_URL explicitly for plot database tests');
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
    { title: 'Plot planning' },
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
  let integrityChecks = 0;
  const collections = {
    CHARACTER: 'characters',
    PLACE: 'places',
    FACTION: 'factions',
    ARTIFACT: 'artifacts',
  };
  const plotPath = `/projects/${project.id}/plots`;
  const plot = await call(
    'POST',
    plotPath,
    token,
    { title: ' Main story ', category: 'Custom political arc' },
    201,
  );
  const second = await call('POST', plotPath, token, { title: 'Romance' }, 201);
  const foreignPlot = await call(
    'POST',
    `/projects/${foreign.id}/plots`,
    bob.accessToken,
    { title: 'Private' },
    201,
  );
  assert.equal(plot.title, 'Main story');
  assert.equal(plot.position, 0);
  assert.equal(second.position, 1);
  assert.equal(
    (await call('GET', `/plots/${plot.id}`, token)).category,
    'Custom political arc',
  );
  const plots = await call('GET', plotPath, token);
  assert.deepEqual(
    plots.items.map((x) => x.id),
    [plot.id, second.id],
  );
  assert.ok(!Object.hasOwn(plots.items[0], 'description'));
  await call('PATCH', `/plots/${plot.id}`, token, {
    category: null,
    description: 'Notes',
  });
  assert.equal((await call('GET', `/plots/${plot.id}`, token)).category, null);
  const pointsPath = `/plots/${plot.id}/points`;
  const points = [];
  for (const title of [
    'The crown is stolen',
    'Arin discovers the truth',
    'Mira betrays the council',
  ])
    points.push(
      await call(
        'POST',
        pointsPath,
        token,
        { title, description: 'Planning only' },
        201,
      ),
    );
  assert.deepEqual(
    points.map((x) => x.position),
    [0, 1, 2],
  );
  assert.equal(points[0].status, 'PLANNED');
  const point = points[0];
  const item = `/plot-points/${point.id}`;
  const foreignPoint = await call(
    'POST',
    `/plots/${foreignPlot.id}/points`,
    bob.accessToken,
    { title: 'Private point' },
    201,
  );
  const secondPoint = await call(
    'POST',
    `/plots/${second.id}/points`,
    token,
    { title: 'Another plot' },
    201,
  );
  await call('PATCH', item, token, {
    status: 'IN_PROGRESS',
    description: null,
  });
  assert.equal((await call('GET', item, token)).status, 'IN_PROGRESS');
  await call('PATCH', item, token, { status: 'RESOLVED' });
  const reorderPath = pointsPath + '/reorder';
  const reordered = await call('PATCH', reorderPath, token, {
    items: [
      { id: point.id, position: 2 },
      { id: points[2].id, position: 0 },
      { id: points[1].id, position: 1 },
    ],
  });
  assert.deepEqual(
    reordered.map((x) => x.id),
    [points[2].id, points[1].id, point.id],
  );
  for (const badId of [secondPoint.id, foreignPoint.id, 'missing']) {
    await call(
      'PATCH',
      reorderPath,
      token,
      {
        items: [
          { id: point.id, position: 50 },
          { id: badId, position: 51 },
        ],
      },
      404,
    );
    assert.equal((await call('GET', item, token)).position, 2);
  }
  for (const items of [
    [],
    [
      { id: point.id, position: 0 },
      { id: point.id, position: 1 },
    ],
    [
      { id: point.id, position: 0 },
      { id: points[1].id, position: 0 },
    ],
    [{ id: point.id, position: -1 }],
    Array.from({ length: 201 }, (_, i) => ({ id: 'id-' + i, position: i })),
    [null],
  ])
    await call('PATCH', reorderPath, token, { items }, 400);
  await call('POST', pointsPath, token, { title: 'Tie', position: 1 }, 201);
  const ordered = await call('GET', pointsPath, token);
  assert.deepEqual(
    ordered.items.map((x) => x.id),
    [...ordered.items]
      .sort((a, b) => a.position - b.position || a.id.localeCompare(b.id))
      .map((x) => x.id),
  );
  assert.ok(
    ordered.items.every(
      (x) => !Object.hasOwn(x, 'description') && !Object.hasOwn(x, 'scenes'),
    ),
  );
  const page = await call('GET', pointsPath + '?limit=2', token);
  assert.equal(page.nextOffset, 2);
  assert.deepEqual(
    (await call('GET', pointsPath + '?limit=2&offset=2', token)).items,
    ordered.items.slice(2, 4),
  );
  const concurrent = await Promise.all(
    ['Concurrent A', 'Concurrent B'].map((title) =>
      call('POST', pointsPath, token, { title }, 201),
    ),
  );
  assert.deepEqual(
    concurrent.map((x) => x.position).sort((a, b) => a - b),
    [3, 4],
  );
  await call(
    'POST',
    pointsPath,
    token,
    { title: 'High', position: 2147483647 },
    201,
  );
  await call('POST', pointsPath, token, { title: 'Overflow' }, 409);
  const explicit = await call(
    'POST',
    pointsPath,
    token,
    { title: 'Explicit after max', position: 0 },
    201,
  );
  assert.equal(explicit.position, 0);
  async function manuscript(projectId, auth) {
    const book = await call(
      'POST',
      `/projects/${projectId}/books`,
      auth,
      { title: 'Book' },
      201,
    );
    const chapters = `/projects/${projectId}/books/${book.id}/chapters`;
    const chapter = await call(
      'POST',
      chapters,
      auth,
      { title: 'Chapter' },
      201,
    );
    const scenes = `${chapters}/${chapter.id}/scenes`;
    const scene = await call(
      'POST',
      scenes,
      auth,
      { title: 'Scene', content: 'secret manuscript content' },
      201,
    );
    return { book, chapter, scene, scenes };
  }
  async function history(projectId, auth) {
    const timeline = await call(
      'POST',
      `/projects/${projectId}/timelines`,
      auth,
      { name: 'History' },
      201,
    );
    const event = await call(
      'POST',
      `/timelines/${timeline.id}/events`,
      auth,
      {
        title: 'King dies',
        start: '-9007199254740993.000001',
        description: 'secret event notes',
      },
      201,
    );
    return { timeline, event };
  }
  const ownManuscript = await manuscript(project.id, token);
  const extraScene = await call(
    'POST',
    ownManuscript.scenes,
    token,
    { title: 'Second scene' },
    201,
  );
  const ownHistory = await history(project.id, token);
  const extraEvent = await call(
    'POST',
    `/timelines/${ownHistory.timeline.id}/events`,
    token,
    { title: 'Flashback', start: '0' },
    201,
  );
  const sceneLink = await call(
    'POST',
    item + '/scenes',
    token,
    { sceneId: ownManuscript.scene.id },
    201,
  );
  assert.equal(sceneLink.scene.chapter.book.id, ownManuscript.book.id);
  assert.ok(!Object.hasOwn(sceneLink.scene, 'content'));
  assert.ok(!Object.hasOwn(sceneLink, 'projectId'));
  await call('POST', item + '/scenes', token, { sceneId: extraScene.id }, 201);
  await call(
    'POST',
    `/plot-points/${points[1].id}/scenes`,
    token,
    { sceneId: ownManuscript.scene.id },
    201,
  );
  await call(
    'POST',
    item + '/scenes',
    token,
    { sceneId: ownManuscript.scene.id },
    409,
  );
  const eventLink = await call(
    'POST',
    item + '/events',
    token,
    { eventId: ownHistory.event.id },
    201,
  );
  assert.equal(eventLink.event.start, '-9007199254740993.000001');
  assert.ok(!Object.hasOwn(eventLink.event, 'description'));
  await call('POST', item + '/events', token, { eventId: extraEvent.id }, 201);
  await call(
    'POST',
    `/plot-points/${points[1].id}/events`,
    token,
    { eventId: ownHistory.event.id },
    201,
  );
  await call(
    'POST',
    item + '/events',
    token,
    { eventId: ownHistory.event.id },
    409,
  );
  const entities = [];
  for (const [kind, collection] of Object.entries(collections)) {
    const entity = await call(
      'POST',
      `/projects/${project.id}/${collection}`,
      token,
      { name: kind },
      201,
    );
    entities.push({ ...entity, kind, collection });
    const link = await call(
      'POST',
      item + '/entities',
      token,
      { kind, entityId: entity.id, role: ' protagonist ' },
      201,
    );
    assert.deepEqual(link.entity, { id: entity.id, kind, name: kind });
    assert.equal(link.role, 'protagonist');
    await call(
      'POST',
      item + '/entities',
      token,
      { kind, entityId: entity.id },
      409,
    );
  }
  const detail = await call('GET', item, token);
  assert.equal(detail.scenes.length, 2);
  assert.equal(detail.events.length, 2);
  assert.equal(detail.entities.length, 4);
  for (const [group, link] of [
    ['scenes', sceneLink],
    ['events', eventLink],
    ['entities', detail.entities[0]],
  ]) {
    await call(
      'DELETE',
      `/plot-points/${points[1].id}/${group}/${link.associationId}`,
      token,
      undefined,
      404,
    );
    await call(
      'DELETE',
      `${item}/${group}/${link.associationId}`,
      bob.accessToken,
      undefined,
      404,
    );
    await call(
      'DELETE',
      `${item}/${group}/${link.associationId}`,
      null,
      undefined,
      401,
    );
    await call(
      'DELETE',
      `${item}/${group}/${link.associationId}`,
      token,
      undefined,
      204,
    );
    await call(
      'DELETE',
      `${item}/${group}/${link.associationId}`,
      token,
      undefined,
      404,
    );
  }
  // Different author and same author/different project both fail every link type.
  for (const [auth, projectId] of [
    [token, other.id],
    [bob.accessToken, foreign.id],
  ]) {
    const crossScene = await manuscript(projectId, auth);
    const crossEvent = await history(projectId, auth);
    await call(
      'POST',
      item + '/scenes',
      token,
      { sceneId: crossScene.scene.id },
      404,
    );
    await call(
      'POST',
      item + '/events',
      token,
      { eventId: crossEvent.event.id },
      404,
    );
    const sceneData = {
      projectId: project.id,
      pointId: point.id,
      sceneId: crossScene.scene.id,
      chapterId: crossScene.chapter.id,
      bookId: crossScene.book.id,
    };
    await assert.rejects(() =>
      prisma.plotPointScene.create({ data: sceneData }),
    );
    integrityChecks++;
    await assert.rejects(() =>
      prisma.plotPointEvent.create({
        data: {
          projectId: project.id,
          pointId: point.id,
          eventId: crossEvent.event.id,
        },
      }),
    );
    integrityChecks++;
    for (const [kind, collection] of Object.entries(collections)) {
      const entity = await call(
        'POST',
        `/projects/${projectId}/${collection}`,
        auth,
        { name: 'Foreign' },
        201,
      );
      await call(
        'POST',
        item + '/entities',
        token,
        { kind, entityId: entity.id },
        404,
      );
      await assert.rejects(() =>
        prisma.plotPointEntity.create({
          data: {
            projectId: project.id,
            pointId: point.id,
            kind,
            [kind.toLowerCase() + 'Id']: entity.id,
          },
        }),
      );
      integrityChecks++;
    }
  }
  const ownedLinkData = {
    projectId: project.id,
    pointId: point.id,
    sceneId: ownManuscript.scene.id,
    chapterId: ownManuscript.chapter.id,
    bookId: ownManuscript.book.id,
  };
  for (const bad of [
    { sceneId: extraScene.id, chapterId: 'missing' },
    { bookId: 'missing' },
    { chapterId: 'missing' },
    { projectId: other.id },
    { pointId: foreignPoint.id },
  ]) {
    await assert.rejects(() =>
      prisma.plotPointScene.create({ data: { ...ownedLinkData, ...bad } }),
    );
    integrityChecks++;
  }
  for (const bad of [
    { projectId: other.id },
    { pointId: foreignPoint.id },
    { eventId: 'missing' },
  ]) {
    await assert.rejects(() =>
      prisma.plotPointEvent.create({
        data: {
          projectId: project.id,
          pointId: point.id,
          eventId: ownHistory.event.id,
          ...bad,
        },
      }),
    );
    integrityChecks++;
  }
  const entityData = {
    projectId: project.id,
    pointId: point.id,
    kind: 'CHARACTER',
    characterId: entities[0].id,
  };
  await prisma.plotPointEntity.deleteMany({
    where: { pointId: point.id, kind: 'CHARACTER' },
  });
  for (const bad of [
    { characterId: null },
    { kind: 'PLACE' },
    { placeId: entities[1].id },
    { projectId: other.id },
    { pointId: foreignPoint.id },
    { role: ' ' },
  ]) {
    await assert.rejects(() =>
      prisma.plotPointEntity.create({ data: { ...entityData, ...bad } }),
    );
    integrityChecks++;
  }
  for (const bad of [{ title: ' ' }, { position: -1 }]) {
    await assert.rejects(() =>
      prisma.plotPoint.create({
        data: {
          projectId: project.id,
          plotId: plot.id,
          title: 'Direct',
          ...bad,
        },
      }),
    );
    integrityChecks++;
  }
  await assert.rejects(() =>
    prisma.plotPoint.create({
      data: { projectId: other.id, plotId: plot.id, title: 'Cross plot' },
    }),
  );
  integrityChecks++;
  for (const bad of [{ title: ' ' }, { category: ' ' }, { position: -1 }]) {
    await assert.rejects(() =>
      prisma.plot.create({
        data: { projectId: project.id, title: 'Direct', ...bad },
      }),
    );
    integrityChecks++;
  }
  // All route categories enforce owner checks, including attachment to foreign points.
  for (const [url, body] of [
    [plotPath, { title: 'stolen' }],
    [pointsPath, { title: 'stolen' }],
    [item + '/scenes', { sceneId: extraScene.id }],
    [item + '/events', { eventId: extraEvent.id }],
    [item + '/entities', { kind: 'CHARACTER', entityId: entities[0].id }],
  ]) {
    await call('POST', url, bob.accessToken, body, 404);
    await call('POST', url, null, body, 401);
  }
  for (const { group, body } of [
    { group: 'scenes', body: { sceneId: extraScene.id } },
    { group: 'events', body: { eventId: extraEvent.id } },
    {
      group: 'entities',
      body: { kind: 'CHARACTER', entityId: entities[0].id },
    },
  ])
    await call(
      'POST',
      `/plot-points/${foreignPoint.id}/${group}`,
      token,
      body,
      404,
    );
  for (const url of [plotPath, pointsPath]) {
    await call('GET', url, bob.accessToken, undefined, 404);
    await call('GET', url, null, undefined, 401);
  }
  for (const url of [`/plots/${plot.id}`, item])
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
  await call(
    'PATCH',
    reorderPath,
    bob.accessToken,
    { items: [{ id: point.id, position: 0 }] },
    404,
  );
  await call(
    'PATCH',
    reorderPath,
    null,
    { items: [{ id: point.id, position: 0 }] },
    401,
  );
  for (const body of [
    { title: null },
    { title: ' ' },
    { position: null },
    { position: -1 },
    { position: 1.5 },
    { position: 2147483648 },
    { description: 'x'.repeat(10001) },
    { plotId: second.id },
    { projectId: other.id },
    { status: null },
    { status: 'DRAFT' },
  ])
    await call('PATCH', item, token, body, 400);
  await call('POST', plotPath, token, { title: 'x', category: ' ' }, 400);
  await call('POST', pointsPath, token, { title: 'x', status: 'CUSTOM' }, 400);
  for (const query of [
    'limit=0',
    'limit=101',
    'offset=-1',
    'limit=2&limit=3',
    'unknown=x',
  ])
    for (const url of [plotPath, pointsPath])
      await call('GET', url + '?' + query, token, undefined, 400);
  for (const { group, body } of [
    { group: 'scenes', body: { sceneId: null } },
    { group: 'events', body: { eventId: [] } },
    { group: 'entities', body: { kind: 'USER', entityId: 'x' } },
    {
      group: 'entities',
      body: { kind: 'CHARACTER', entityId: entities[0].id, role: ' ' },
    },
  ])
    await call('POST', item + '/' + group, token, body, 400);
  for (const { group, body } of [
    { group: 'scenes', body: { sceneId: 'missing' } },
    { group: 'events', body: { eventId: 'missing' } },
    { group: 'entities', body: { kind: 'CHARACTER', entityId: 'missing' } },
  ])
    await call('POST', item + '/' + group, token, body, 404);
  await call('POST', '/plots/missing/points', token, { title: 'Missing' }, 404);
  // A transaction failure after the first reorder write must roll back that write.
  await sql.query(
    `CREATE FUNCTION reject_plot_test_position() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN IF NEW."position"=12345 THEN RAISE EXCEPTION 'intentional test failure'; END IF; RETURN NEW; END; $$`,
  );
  await sql.query(
    `CREATE TRIGGER reject_plot_test_position BEFORE UPDATE ON "PlotPoint" FOR EACH ROW EXECUTE FUNCTION reject_plot_test_position()`,
  );
  await call(
    'PATCH',
    reorderPath,
    token,
    {
      items: [
        { id: point.id, position: 12344 },
        { id: points[1].id, position: 12345 },
      ],
    },
    500,
  );
  assert.equal((await call('GET', item, token)).position, 2);
  await sql.query('DROP TRIGGER reject_plot_test_position ON "PlotPoint"');
  await sql.query('DROP FUNCTION reject_plot_test_position()');
  // Duplicate race and every cascade are verified in PostgreSQL, not simulated.
  const duplicate = await Promise.all(
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
    duplicate.map((x) => x.status).sort((a, b) => a - b),
    [201, 409],
  );
  for (const entity of entities) {
    if (
      entity.kind !== 'CHARACTER' &&
      !(await prisma.plotPointEntity.findFirst({
        where: { pointId: point.id, kind: entity.kind },
      }))
    )
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
    assert.equal(
      await prisma.plotPointEntity.count({
        where: { [entity.kind.toLowerCase() + 'Id']: entity.id },
      }),
      0,
    );
  }
  await call(
    'DELETE',
    ownManuscript.scenes + '/' + ownManuscript.scene.id,
    token,
    undefined,
    204,
  );
  assert.equal(
    await prisma.plotPointScene.count({
      where: { sceneId: ownManuscript.scene.id },
    }),
    0,
  );
  await call('DELETE', `/events/${ownHistory.event.id}`, token, undefined, 204);
  assert.equal(
    await prisma.plotPointEvent.count({
      where: { eventId: ownHistory.event.id },
    }),
    0,
  );
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
  await call('GET', item, token, undefined, 404);
  for (const model of ['plotPointScene', 'plotPointEvent', 'plotPointEntity'])
    assert.equal(
      await prisma[model].count({ where: { pointId: point.id } }),
      0,
    );
  for (const target of [secondPoint, points[1]]) {
    await call(
      'POST',
      `/plot-points/${target.id}/scenes`,
      token,
      { sceneId: extraScene.id },
      201,
    );
    await call(
      'POST',
      `/plot-points/${target.id}/events`,
      token,
      { eventId: extraEvent.id },
      201,
    );
    await call(
      'POST',
      `/plot-points/${target.id}/entities`,
      token,
      { kind: 'CHARACTER', entityId: survivor.id },
      201,
    );
  }
  await call('DELETE', `/plots/${second.id}`, token, undefined, 204);
  assert.equal(
    await prisma.plotPoint.count({ where: { plotId: second.id } }),
    0,
  );
  for (const model of ['plotPointScene', 'plotPointEvent', 'plotPointEntity'])
    assert.equal(
      await prisma[model].count({ where: { pointId: secondPoint.id } }),
      0,
    );
  await call('DELETE', `/projects/${project.id}`, token, undefined, 204);
  for (const model of [
    'plot',
    'plotPoint',
    'plotPointScene',
    'plotPointEvent',
    'plotPointEntity',
  ])
    assert.equal(
      await prisma[model].count({ where: { projectId: project.id } }),
      0,
    );
  console.log(
    `Plot PostgreSQL + HTTP passed: CRUD, automatic and concurrent ordering, pagination, atomic reorder (including mid-write rollback), scene/event many-to-many, all four entity kinds, validation/401/owner isolation, same-author project boundaries, ${integrityChecks} direct SQL integrity checks, duplicate race, and all cascades.`,
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
