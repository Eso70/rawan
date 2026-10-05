import './disable-queues.mjs';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { readFile, readdir } from 'node:fs/promises';
import { Test } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { Prisma, PrismaClient } from '@rawan/database';
import { searchSql } from '../dist/search/search.sql.js';
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
    throw new Error('Search database tests are disabled in production');
  const connectionString = config.get('TEST_DATABASE_URL');
  if (!connectionString)
    throw new Error(
      'Set TEST_DATABASE_URL explicitly for search database tests',
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
    adapter: new PrismaPg(
      { connectionString, options: `-c search_path=${schema}` },
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
  const password = 'search-test-password-long';
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
    { title: 'Dragon' },
    201,
  );
  const other = await call(
    'POST',
    '/projects',
    token,
    { title: 'Other project' },
    201,
  );
  const foreign = await call(
    'POST',
    '/projects',
    bob.accessToken,
    { title: 'Foreign project' },
    201,
  );
  const note = await call(
    'POST',
    '/projects/' + project.id + '/notes',
    token,
    { title: 'Dragon tale', content: 'x'.repeat(1000) + ' dragon in the cave' },
    201,
  );
  for (const [p, t] of [
    [other, token],
    [foreign, bob.accessToken],
  ])
    await call(
      'POST',
      '/projects/' + p.id + '/notes',
      t,
      { title: 'SECRET_DRAGON_OTHER', content: 'Foreign-secret-body' },
      201,
    );
  const path = '/projects/' + project.id + '/search';
  let found = await call('GET', path + '?q=dragon', token);
  assert.deepEqual(
    found.items.map((x) => x.kind),
    ['PROJECT', 'NOTE'],
  );
  assert.ok(found.items[1].snippet.includes('dragon'));
  assert.ok(found.items[1].snippet.length <= 240);
  assert.deepEqual(
    Object.keys(found.items[1]).sort(),
    ['kind', 'id', 'projectId', 'snippet', 'title', 'updatedAt'].sort(),
  );
  assert.equal((await call('GET', path + '?q=secret', token)).items.length, 0);
  assert.equal(
    (await call('GET', path + '?q=dragon&kind=NOTE', token)).items[0].id,
    note.id,
  );
  await call('GET', path + '?q=dragon', null, undefined, 401);
  await call('GET', path + '?q=dragon', bob.accessToken, undefined, 404);
  for (const q of [
    '',
    '?q= ',
    '?q=a',
    '?q=' + 'x'.repeat(201),
    '?q=dragon&kind=User',
    '?q=dragon&limit=101',
  ])
    await call('GET', path + q, token, undefined, 400);
  assert.equal(
    (
      await call(
        'GET',
        path + '?q=' + encodeURIComponent("' OR true --"),
        token,
      )
    ).items.length,
    0,
  );
  // Seed each searchable architectural category using the real API.
  const projectPath = '/projects/' + project.id;
  const book = await call(
    'POST',
    projectPath + '/books',
    token,
    { title: 'Dragon', description: 'book-body-match' },
    201,
  );
  const chapterPath = projectPath + '/books/' + book.id + '/chapters';
  const chapter = await call(
    'POST',
    chapterPath,
    token,
    { title: 'Dragon', description: 'chapter-body-match' },
    201,
  );
  const scenesPath = chapterPath + '/' + chapter.id + '/scenes';
  const scene = await call(
    'POST',
    scenesPath,
    token,
    { title: 'Dragon', content: 'x'.repeat(30000) + ' body-search-dragon' },
    201,
  );
  const resources = [
    {
      kind: 'NOTE',
      row: note,
      path: projectPath + '/notes',
      label: 'title',
      sorts: ['title', 'createdAt', 'updatedAt'],
    },
  ];
  resources.push({
    kind: 'SCENE',
    row: scene,
    path: scenesPath,
    label: 'title',
    sorts: ['title', 'position', 'createdAt', 'updatedAt'],
  });
  for (const [kind, collection] of [
    ['CHARACTER', 'characters'],
    ['PLACE', 'places'],
    ['FACTION', 'factions'],
    ['ARTIFACT', 'artifacts'],
  ]) {
    const row = await call(
      'POST',
      projectPath + '/' + collection,
      token,
      { name: 'Dragon', description: 'world-body-match' },
      201,
    );
    resources.push({
      kind,
      row,
      path: projectPath + '/' + collection,
      label: 'name',
      sorts: ['name', 'createdAt', 'updatedAt'],
    });
  }
  const timeline = await call(
    'POST',
    projectPath + '/timelines',
    token,
    { name: 'Chronology' },
    201,
  );
  const eventsPath = '/timelines/' + timeline.id + '/events';
  const era = await call(
    'POST',
    '/timelines/' + timeline.id + '/eras',
    token,
    { name: 'First' },
    201,
  );
  const event = await call(
    'POST',
    eventsPath,
    token,
    {
      title: 'Dragon',
      description: 'event-body-match',
      start: '1',
      eraId: era.id,
    },
    201,
  );
  resources.push({
    kind: 'TIMELINE_EVENT',
    row: event,
    path: eventsPath,
    label: 'title',
    sorts: ['title', 'start', 'position', 'createdAt', 'updatedAt'],
  });
  const plot = await call(
    'POST',
    projectPath + '/plots',
    token,
    { title: 'Dragon', description: 'plot-body-match' },
    201,
  );
  const pointsPath = '/plots/' + plot.id + '/points';
  const point = await call(
    'POST',
    pointsPath,
    token,
    { title: 'Dragon', description: 'point-body-match', status: 'IN_PROGRESS' },
    201,
  );
  resources.push({
    kind: 'PLOT_POINT',
    row: point,
    path: pointsPath,
    label: 'title',
    sorts: ['title', 'position', 'createdAt', 'updatedAt'],
  });
  found = await call('GET', path + '?q=DRAGON', token);
  assert.deepEqual(
    new Set(found.items.map((x) => x.kind)),
    new Set([
      'PROJECT',
      'BOOK',
      'CHAPTER',
      'SCENE',
      'CHARACTER',
      'PLACE',
      'FACTION',
      'ARTIFACT',
      'TIMELINE_EVENT',
      'PLOT',
      'PLOT_POINT',
      'NOTE',
    ]),
  );
  for (const kind of [
    'PROJECT',
    'BOOK',
    'CHAPTER',
    'SCENE',
    'CHARACTER',
    'PLACE',
    'FACTION',
    'ARTIFACT',
    'TIMELINE_EVENT',
    'PLOT',
    'PLOT_POINT',
    'NOTE',
  ]) {
    const results = await call('GET', path + '?q=dragon&kind=' + kind, token);
    assert.ok(results.items.length > 0);
    assert.ok(
      results.items.every(
        (x) =>
          x.kind === kind &&
          x.projectId === project.id &&
          [...x.snippet].length <= 240,
      ),
    );
  }
  for (const q of [
    'book-body-match',
    'chapter-body-match',
    'world-body-match',
    'event-body-match',
    'plot-body-match',
    'point-body-match',
    'body-search-dragon',
  ])
    assert.ok((await call('GET', path + '?q=' + q, token)).items.length > 0);
  assert.equal(
    (await call('GET', path + '?q=alice%40example.invalid', token)).items
      .length,
    0,
  );
  assert.equal(
    (await call('GET', path + '?q=' + password, token)).items.length,
    0,
  );
  const authUser = await prisma.user.findUniqueOrThrow({
    where: { id: alice.user.id },
  });
  assert.equal(
    (
      await call(
        'GET',
        path + '?q=' + encodeURIComponent(authUser.password),
        token,
      )
    ).items.length,
    0,
  );
  assert.ok(
    found.items.every(
      (x) =>
        Object.keys(x).sort().join(',') ===
        'id,kind,projectId,snippet,title,updatedAt',
    ),
  );
  await call('GET', '/projects/missing/search?q=dragon', token, undefined, 404);
  const tag = await call(
    'POST',
    projectPath + '/tags',
    token,
    { name: 'Magic' },
    201,
  );
  const otherTag = await call(
    'POST',
    '/projects/' + other.id + '/tags',
    token,
    { name: 'Magic' },
    201,
  );
  const foreignTag = await call(
    'POST',
    '/projects/' + foreign.id + '/tags',
    bob.accessToken,
    { name: 'Magic' },
    201,
  );
  const unusedTag = await call(
    'POST',
    projectPath + '/tags',
    token,
    { name: 'Unused' },
    201,
  );
  for (const r of resources) {
    await call(
      'POST',
      '/tags/' + tag.id + '/assignments',
      token,
      { resourceKind: r.kind, resourceId: r.row.id },
      201,
    );
    for (const label of ['Alpha', 'Zeta'])
      await call(
        'POST',
        r.path,
        token,
        {
          [r.label]: label,
          ...(r.kind === 'TIMELINE_EVENT' ? { start: '2' } : {}),
        },
        201,
      );
    const ascending = await call(
      'GET',
      r.path + '?sort=' + r.label + '&order=asc&limit=1',
      token,
    );
    const next = await call(
      'GET',
      r.path +
        '?sort=' +
        r.label +
        '&order=asc&limit=1&offset=' +
        ascending.nextOffset,
      token,
    );
    assert.equal(ascending.items[0][r.label], 'Alpha');
    assert.notEqual(ascending.items[0].id, next.items[0].id);
    assert.equal(
      (await call('GET', r.path + '?sort=' + r.label + '&order=desc', token))
        .items[0][r.label],
      'Zeta',
    );
    assert.deepEqual(await call('GET', r.path + '?offset=9999', token), {
      items: [],
      nextOffset: null,
    });
    assert.deepEqual(
      (await call('GET', r.path + '?tagId=' + tag.id, token)).items.map(
        (x) => x.id,
      ),
      [r.row.id],
    );
    assert.equal(
      (await call('GET', r.path + '?tagId=' + unusedTag.id, token)).items
        .length,
      0,
    );
    for (const invalidTag of [otherTag.id, foreignTag.id, 'missing'])
      await call('GET', r.path + '?tagId=' + invalidTag, token, undefined, 404);
    assert.ok(
      (
        await call('GET', r.path + '?q=DRAGON&tagId=' + tag.id, token)
      ).items.some((x) => x.id === r.row.id),
    );
    for (const sort of r.sorts)
      for (const order of ['asc', 'desc'])
        await call('GET', r.path + '?sort=' + sort + '&order=' + order, token);
    for (const query of [
      'limit=0',
      'limit=-1',
      'limit=101',
      'limit=no',
      'limit=1.5',
      'limit=2&limit=3',
      'offset=-1',
      'offset=1000001',
      'sort=password',
      'sort=constructor',
      'order=ASC',
      'q= ',
      'q=a',
      'q=' + 'x'.repeat(201),
      'q=' + encodeURIComponent('\u0000x'),
      'unknown=1',
    ])
      await call('GET', r.path + '?' + query, token, undefined, 400);
    await call('GET', r.path + '?q=dragon', null, undefined, 401);
    await call('GET', r.path + '?q=dragon', bob.accessToken, undefined, 404);
  }
  assert.ok(
    !(await call('GET', scenesPath, token)).items.some((x) =>
      Object.hasOwn(x, 'content'),
    ),
  );
  assert.equal(
    (await call('GET', pointsPath + '?status=IN_PROGRESS', token)).items[0].id,
    point.id,
  );
  await call('GET', pointsPath + '?status=unknown', token, undefined, 400);
  assert.equal(
    (
      await call(
        'GET',
        eventsPath + '?eraId=' + era.id + '&from=0&to=1&tagId=' + tag.id,
        token,
      )
    ).items[0].id,
    event.id,
  );
  const relationPath = projectPath + '/relationships';
  for (const label of ['Alpha', 'Dragon', 'Zeta'])
    await call(
      'POST',
      relationPath,
      token,
      {
        source: {
          kind: 'CHARACTER',
          id: resources.find((x) => x.kind === 'CHARACTER').row.id,
        },
        target: {
          kind: 'PLACE',
          id: resources.find((x) => x.kind === 'PLACE').row.id,
        },
        typeKey: label.toUpperCase(),
        label,
        description: 'rel-body-match',
      },
      201,
    );
  assert.equal(
    (await call('GET', relationPath + '?sort=label&order=desc&limit=1', token))
      .items[0].label,
    'Zeta',
  );
  assert.equal(
    (await call('GET', relationPath + '?q=dragon&typeKey=DRAGON', token)).items
      .length,
    1,
  );
  assert.equal(
    (await call('GET', relationPath + '?q=rel-body-match', token)).items.length,
    3,
  );
  await call(
    'GET',
    relationPath + '?sort=sourceCharacterId',
    token,
    undefined,
    400,
  );
  assert.ok(
    (
      await call('GET', projectPath + '/plots?q=plot-body-match', token)
    ).items.some((x) => x.id === plot.id),
  );
  assert.equal(
    (await call('GET', projectPath + '/tags?q=magic', token)).items[0].id,
    tag.id,
  );
  assert.equal(
    (
      await call(
        'GET',
        '/projects?q=dragon&sort=title&order=asc&limit=1',
        token,
      )
    ).items[0].id,
    project.id,
  );
  // Literal wildcards and escaping behave identically for SQL and Prisma search.
  for (const title of ['50X discount', 'underXscore', 'backslash'])
    await call('POST', projectPath + '/notes', token, { title }, 201);
  for (const text of [
    '50% discount',
    'under_score',
    'back\\slash',
    "O'Reilly",
    'سحر عربي',
  ]) {
    const special = await call(
      'POST',
      projectPath + '/notes',
      token,
      { title: text },
      201,
    );
    const encoded = encodeURIComponent(text);
    assert.deepEqual(
      (
        await call('GET', path + '?q=' + encoded + '&kind=NOTE', token)
      ).items.map((x) => x.id),
      [special.id],
    );
    assert.deepEqual(
      (await call('GET', projectPath + '/notes?q=' + encoded, token)).items.map(
        (x) => x.id,
      ),
      [special.id],
    );
  }
  const ranking = [];
  for (const [title, content] of [
    ['Needle', ''],
    ['Needle prefix', ''],
    ['a Needle suffix', ''],
    ['Body only', 'needle'],
  ])
    ranking.push(
      await call(
        'POST',
        projectPath + '/notes',
        token,
        { title, content },
        201,
      ),
    );
  assert.deepEqual(
    (await call('GET', path + '?q=needle&kind=NOTE', token)).items.map(
      (x) => x.id,
    ),
    ranking.map((x) => x.id),
  );
  const searchPage = await call('GET', path + '?q=dragon&limit=2', token);
  const searchPage2 = await call(
    'GET',
    path + '?q=dragon&limit=2&offset=' + searchPage.nextOffset,
    token,
  );
  assert.equal(searchPage.items.length, 2);
  assert.equal(
    new Set(
      [...searchPage.items, ...searchPage2.items].map(
        (x) => x.kind + ':' + x.id,
      ),
    ).size,
    4,
  );
  assert.deepEqual(await call('GET', path + '?q=dragon&offset=9999', token), {
    items: [],
    nextOffset: null,
  });
  await prisma.note.createMany({
    data: Array.from({ length: 105 }, (_, i) => ({
      projectId: project.id,
      title: 'Bulk ' + String(i).padStart(3, '0'),
      content: '',
    })),
  });
  assert.equal(
    (await call('GET', projectPath + '/notes?q=Bulk', token)).items.length,
    50,
  );
  assert.equal(
    (await call('GET', projectPath + '/notes?q=Bulk&limit=100', token)).items
      .length,
    100,
  );
  const bulk1 = await call(
    'GET',
    projectPath + '/notes?q=Bulk&sort=title&limit=100',
    token,
  );
  const bulk2 = await call(
    'GET',
    projectPath +
      '/notes?q=Bulk&sort=title&limit=100&offset=' +
      bulk1.nextOffset,
    token,
  );
  assert.equal(
    new Set([...bulk1.items, ...bulk2.items].map((x) => x.id)).size,
    105,
  );
  await prisma.note.updateMany({
    where: { projectId: project.id, title: { startsWith: 'Bulk' } },
    data: { updatedAt: new Date('2026-01-01') },
  });
  const ties1 = await call(
    'GET',
    projectPath + '/notes?q=Bulk&sort=updatedAt&limit=100',
    token,
  );
  const ties2 = await call(
    'GET',
    projectPath + '/notes?q=Bulk&sort=updatedAt&limit=100&offset=100',
    token,
  );
  const tiedIds = [...ties1.items, ...ties2.items].map((x) => x.id);
  assert.deepEqual(
    tiedIds,
    [...tiedIds].sort((a, b) => (a < b ? -1 : a > b ? 1 : 0)),
  );
  const explain = await prisma.$queryRaw(
    Prisma.sql`EXPLAIN (FORMAT JSON) ${searchSql(alice.user.id, project.id, { q: 'dragon', limit: 2 })}`,
  );
  assert.equal(explain[0]['QUERY PLAN'][0].Plan['Node Type'], 'Limit');
  const indexes = (
    await sql.query('SELECT indexname FROM pg_indexes WHERE schemaname=$1', [
      schema,
    ])
  ).rows.map((x) => x.indexname);
  for (const name of [
    'Project_authorId_createdAt_id_idx',
    'Scene_chapterId_position_createdAt_id_idx',
    'Character_projectId_name_id_idx',
    'Place_projectId_name_id_idx',
    'Faction_projectId_name_id_idx',
    'Artifact_projectId_name_id_idx',
    'Relationship_projectId_createdAt_id_idx',
  ])
    assert.ok(indexes.includes(name), name);
  await call('DELETE', '/tags/' + tag.id, token, undefined, 204);
  for (const r of resources)
    await call('GET', r.path + '?tagId=' + tag.id, token, undefined, 404);
  console.log(
    'Search PostgreSQL + HTTP passed: twelve kinds, ranking/snippets, literal wildcard/Unicode search, stable pages, safe sorts, all eight tag filters, validation, author/project isolation and sensitive-field protection.',
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
