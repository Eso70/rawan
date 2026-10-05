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
    throw new Error('Organization database tests are disabled in production');
  const connectionString = config.get('TEST_DATABASE_URL');
  if (!connectionString)
    throw new Error(
      'Set TEST_DATABASE_URL explicitly for organization database tests',
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
  let integrityChecks = 0;
  async function rejected(operation) {
    await assert.rejects(operation);
    integrityChecks++;
  }
  const notesPath = `/projects/${project.id}/notes`;
  const tagsPath = `/projects/${project.id}/tags`;
  const note = await call(
    'POST',
    notesPath,
    token,
    {
      title: ' Research ',
      content: '<script>Plain text, not executable markup</script>',
    },
    201,
  );
  assert.equal(note.title, 'Research');
  assert.equal(
    note.content,
    '<script>Plain text, not executable markup</script>',
  );
  const empty = await call('POST', notesPath, token, { title: 'Ideas' }, 201);
  assert.equal(empty.content, '');
  const large = await call(
    'POST',
    notesPath,
    token,
    { title: 'Long note', content: 'x'.repeat(50000) },
    201,
  );
  assert.equal(large.content.length, 50000);
  await prisma.note.updateMany({
    where: { projectId: project.id },
    data: { updatedAt: new Date('2020-01-01T00:00:00Z') },
  });
  let list = await call('GET', notesPath, token);
  assert.deepEqual(
    list.items.map((x) => x.id),
    [note, empty, large].map((x) => x.id).sort((a, b) => a.localeCompare(b)),
  );
  assert.ok(list.items.every((x) => !Object.hasOwn(x, 'content')));
  const page = await call('GET', notesPath + '?limit=2', token);
  assert.equal(page.nextOffset, 2);
  assert.deepEqual(
    (await call('GET', notesPath + '?limit=2&offset=2', token)).items,
    list.items.slice(2),
  );
  const changed = await call('PATCH', `/notes/${note.id}`, token, {
    title: 'Updated',
    content: 'Exact text',
  });
  assert.equal(changed.content, 'Exact text');
  assert.equal((await call('GET', notesPath, token)).items[0].id, note.id);
  assert.deepEqual(await call('GET', `/notes/${note.id}`, token), changed);
  const tag = await call('POST', tagsPath, token, { name: 'Magic' }, 201);
  assert.ok(!Object.hasOwn(tag, 'normalizedName'));
  for (const name of ['magic', ' MAGIC '])
    await call('POST', tagsPath, token, { name }, 409);
  const research = await call(
    'POST',
    tagsPath,
    token,
    { name: ' needs   research ' },
    201,
  );
  assert.equal(research.name, 'needs research');
  await call('POST', tagsPath, token, { name: 'needs research' }, 409);
  const arabic = await call('POST', tagsPath, token, { name: 'سحر' }, 201);
  await call('POST', tagsPath, token, { name: ' سحر ' }, 409);
  await call(
    'PATCH',
    `/tags/${tag.id}`,
    token,
    { name: ' needs research ' },
    409,
  );
  assert.equal((await call('GET', `/tags/${tag.id}`, token)).name, 'Magic');
  assert.equal(
    (await call('PATCH', `/tags/${tag.id}`, token, { name: ' MAGIC ' })).name,
    'MAGIC',
  );
  list = await call('GET', tagsPath, token);
  assert.equal(list.items.length, 3);
  assert.ok(list.items.every((x) => !Object.hasOwn(x, 'normalizedName')));
  assert.equal((await call('GET', tagsPath + '?limit=1', token)).nextOffset, 1);
  const race = await Promise.all(
    [1, 2].map(() =>
      fetch(base + tagsPath, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer ' + token,
        },
        body: JSON.stringify({ name: 'RACE' }),
      }),
    ),
  );
  assert.deepEqual(
    race.map((x) => x.status).sort((a, b) => a - b),
    [201, 409],
  );
  await rejected(() =>
    prisma.tag.create({
      data: {
        projectId: project.id,
        name: ' magic ',
        normalizedName: 'bypass',
      },
    }),
  );
  await rejected(() =>
    prisma.tag.create({
      data: {
        projectId: project.id,
        name: '\u00a0Magic\ufeff',
        normalizedName: 'unicode-bypass',
      },
    }),
  );
  const spoof = await prisma.tag.update({
    where: { id: tag.id },
    data: { normalizedName: 'bypass' },
  });
  assert.equal(spoof.normalizedName, 'magic');
  for (const name of [' ', 'x'.repeat(101)])
    await rejected(() =>
      prisma.tag.create({ data: { projectId: project.id, name } }),
    );
  for (const bad of [
    { title: ' ' },
    { title: '\u00a0\t' },
    { content: 'x'.repeat(50001) },
  ])
    await rejected(() =>
      prisma.note.create({
        data: { projectId: project.id, title: 'Direct', ...bad },
      }),
    );
  const otherTag = await call(
    'POST',
    `/projects/${other.id}/tags`,
    token,
    { name: 'Magic' },
    201,
  );
  const foreignTag = await call(
    'POST',
    `/projects/${foreign.id}/tags`,
    bob.accessToken,
    { name: 'Magic' },
    201,
  );
  async function resources(projectId, auth, existingNote) {
    const result = [];
    const savedNote =
      existingNote ??
      (await call(
        'POST',
        `/projects/${projectId}/notes`,
        auth,
        { title: 'Note', content: 'private' },
        201,
      ));
    result.push({
      kind: 'NOTE',
      id: savedNote.id,
      label: savedNote.title,
      field: 'noteId',
      deletePath: `/notes/${savedNote.id}`,
    });
    for (const [kind, collection] of Object.entries({
      CHARACTER: 'characters',
      PLACE: 'places',
      FACTION: 'factions',
      ARTIFACT: 'artifacts',
    })) {
      const entity = await call(
        'POST',
        `/projects/${projectId}/${collection}`,
        auth,
        { name: kind },
        201,
      );
      result.push({
        kind,
        id: entity.id,
        label: kind,
        field: kind.toLowerCase() + 'Id',
        deletePath: `/${collection}/${entity.id}`,
      });
    }
    const book = await call(
      'POST',
      `/projects/${projectId}/books`,
      auth,
      { title: 'Book' },
      201,
    );
    const chapter = await call(
      'POST',
      `/projects/${projectId}/books/${book.id}/chapters`,
      auth,
      { title: 'Chapter' },
      201,
    );
    const scenePath = `/projects/${projectId}/books/${book.id}/chapters/${chapter.id}/scenes`;
    const scene = await call(
      'POST',
      scenePath,
      auth,
      { title: 'Scene', content: 'secret manuscript' },
      201,
    );
    result.push({
      kind: 'SCENE',
      id: scene.id,
      label: scene.title,
      field: 'sceneId',
      bookId: book.id,
      chapterId: chapter.id,
      deletePath: `${scenePath}/${scene.id}`,
    });
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
      { title: 'Event', start: '-120' },
      201,
    );
    result.push({
      kind: 'TIMELINE_EVENT',
      id: event.id,
      label: event.title,
      field: 'eventId',
      deletePath: `/events/${event.id}`,
    });
    const plot = await call(
      'POST',
      `/projects/${projectId}/plots`,
      auth,
      { title: 'Story' },
      201,
    );
    const point = await call(
      'POST',
      `/plots/${plot.id}/points`,
      auth,
      { title: 'Point' },
      201,
    );
    result.push({
      kind: 'PLOT_POINT',
      id: point.id,
      label: point.title,
      field: 'plotPointId',
      deletePath: `/plot-points/${point.id}`,
    });
    return result;
  }
  const owned = await resources(project.id, token, changed);
  const otherResources = await resources(other.id, token);
  const foreignResources = await resources(foreign.id, bob.accessToken);
  const assignmentsPath = `/tags/${tag.id}/assignments`;
  const resourcePath = (projectId, resource) =>
    `/projects/${projectId}/resource-tags?resourceKind=${resource.kind}&resourceId=${resource.id}`;
  const assignments = [];
  for (const resource of owned) {
    const body = { resourceKind: resource.kind, resourceId: resource.id };
    const assignment = await call('POST', assignmentsPath, token, body, 201);
    assignments.push(assignment);
    assert.deepEqual(assignment.resource, {
      kind: resource.kind,
      id: resource.id,
      label: resource.label,
    });
    assert.equal(assignment.tag.id, tag.id);
    assert.ok(!Object.hasOwn(assignment, 'projectId'));
    assert.ok(!Object.hasOwn(assignment, 'noteId'));
    await call('POST', assignmentsPath, token, body, 409);
    await call('POST', `/tags/${research.id}/assignments`, token, body, 201);
    assert.equal(
      (await call('GET', resourcePath(project.id, resource), token)).items
        .length,
      2,
    );
    assert.equal(
      (
        await call(
          'GET',
          resourcePath(project.id, resource) + '&limit=1',
          token,
        )
      ).nextOffset,
      1,
    );
    assert.equal(
      (
        await call(
          'GET',
          assignmentsPath + '?resourceKind=' + resource.kind,
          token,
        )
      ).items.length,
      1,
    );
    await rejected(() =>
      prisma.tagAssignment.create({
        data: {
          tagId: tag.id,
          projectId: project.id,
          resourceKind: resource.kind,
          [resource.field]: resource.id,
          ...(resource.kind === 'SCENE'
            ? { bookId: resource.bookId, chapterId: resource.chapterId }
            : {}),
        },
      }),
    );
  }
  assert.equal((await call('GET', assignmentsPath, token)).items.length, 8);
  assert.equal(
    (await call('GET', notesPath + '?tagId=' + tag.id, token)).items.length,
    1,
  );
  await call('GET', notesPath + '?tagId=' + otherTag.id, token, undefined, 404);
  for (const resource of [...otherResources, ...foreignResources]) {
    await call(
      'POST',
      assignmentsPath,
      token,
      { resourceKind: resource.kind, resourceId: resource.id },
      404,
    );
    await call(
      'GET',
      resourcePath(project.id, resource),
      token,
      undefined,
      404,
    );
    await rejected(() =>
      prisma.tagAssignment.create({
        data: {
          tagId: tag.id,
          projectId: project.id,
          resourceKind: resource.kind,
          [resource.field]: resource.id,
          ...(resource.kind === 'SCENE'
            ? { bookId: resource.bookId, chapterId: resource.chapterId }
            : {}),
        },
      }),
    );
  }
  const scene = owned.find((x) => x.kind === 'SCENE');
  const foreignScene = foreignResources.find((x) => x.kind === 'SCENE');
  for (const bad of [
    { sceneId: foreignScene.id },
    { chapterId: foreignScene.chapterId },
    { bookId: foreignScene.bookId },
  ])
    await rejected(() =>
      prisma.tagAssignment.create({
        data: {
          tagId: arabic.id,
          projectId: project.id,
          resourceKind: 'SCENE',
          sceneId: scene.id,
          bookId: scene.bookId,
          chapterId: scene.chapterId,
          ...bad,
        },
      }),
    );
  const direct = {
    projectId: project.id,
    tagId: arabic.id,
    resourceKind: 'NOTE',
    noteId: note.id,
  };
  for (const bad of [
    { noteId: null },
    { resourceKind: 'CHARACTER' },
    { characterId: owned[1].id },
    { bookId: scene.bookId },
    { tagId: otherTag.id },
    { projectId: other.id },
    { noteId: 'missing' },
  ])
    await rejected(() =>
      prisma.tagAssignment.create({ data: { ...direct, ...bad } }),
    );
  for (const resource of owned)
    await call(
      'POST',
      `/tags/${foreignTag.id}/assignments`,
      token,
      { resourceKind: resource.kind, resourceId: resource.id },
      404,
    );
  const assignment = assignments[0];
  await call(
    'DELETE',
    `/tags/${research.id}/assignments/${assignment.assignmentId}`,
    token,
    undefined,
    404,
  );
  await call(
    'DELETE',
    `${assignmentsPath}/${assignment.assignmentId}`,
    bob.accessToken,
    undefined,
    404,
  );
  await call(
    'DELETE',
    `${assignmentsPath}/${assignment.assignmentId}`,
    null,
    undefined,
    401,
  );
  await call(
    'DELETE',
    `${assignmentsPath}/${assignment.assignmentId}`,
    token,
    undefined,
    204,
  );
  assert.equal(
    (await call('GET', resourcePath(project.id, owned[0]), token)).items.length,
    1,
  );
  await call(
    'POST',
    assignmentsPath,
    token,
    { resourceKind: 'NOTE', resourceId: note.id },
    201,
  );
  for (const collection of [notesPath, tagsPath]) {
    await call('GET', collection, bob.accessToken, undefined, 404);
    await call('GET', collection, null, undefined, 401);
    await call(
      'POST',
      collection,
      bob.accessToken,
      collection === notesPath ? { title: 'Stolen' } : { name: 'Stolen' },
      404,
    );
    await call('POST', collection, null, {}, 401);
  }
  for (const path of [`/notes/${note.id}`, `/tags/${tag.id}`])
    for (const method of ['GET', 'PATCH', 'DELETE']) {
      await call(
        method,
        path,
        bob.accessToken,
        method === 'PATCH' ? {} : undefined,
        404,
      );
      await call(method, path, null, method === 'PATCH' ? {} : undefined, 401);
    }
  for (const method of ['GET', 'POST']) {
    await call(
      method,
      assignmentsPath,
      bob.accessToken,
      method === 'POST'
        ? { resourceKind: 'NOTE', resourceId: note.id }
        : undefined,
      404,
    );
    await call(
      method,
      assignmentsPath,
      null,
      method === 'POST' ? {} : undefined,
      401,
    );
  }
  await call(
    'GET',
    resourcePath(project.id, owned[0]),
    bob.accessToken,
    undefined,
    404,
  );
  await call('GET', resourcePath(project.id, owned[0]), null, undefined, 401);
  await call('GET', `/tags/${foreignTag.id}`, token, undefined, 404);
  await call('GET', `/notes/${foreignResources[0].id}`, token, undefined, 404);
  await call(
    'POST',
    '/projects/missing/notes',
    token,
    { title: 'Missing' },
    404,
  );
  await call('POST', '/projects/missing/tags', token, { name: 'Missing' }, 404);
  await call(
    'POST',
    '/tags/missing/assignments',
    token,
    { resourceKind: 'NOTE', resourceId: note.id },
    404,
  );
  await call(
    'POST',
    assignmentsPath,
    token,
    { resourceKind: 'NOTE', resourceId: 'missing' },
    404,
  );
  for (const body of [
    { title: null },
    { title: ' ' },
    { title: 'x'.repeat(201) },
    { content: null },
    { content: 5 },
    { content: '\u0000' },
    { content: 'x'.repeat(50001) },
    { authorId: 'bob' },
    { projectId: other.id },
    { updatedAt: '2020-01-01' },
  ])
    await call('PATCH', `/notes/${note.id}`, token, body, 400);
  for (const body of [
    { name: ' ' },
    { name: 'x'.repeat(101) },
    { name: null },
    { normalizedName: 'hack' },
    { projectId: other.id },
  ])
    await call('PATCH', `/tags/${tag.id}`, token, body, 400);
  for (const body of [
    { resourceKind: 'USER', resourceId: note.id },
    { resourceKind: 'constructor', resourceId: note.id },
    { resourceKind: 'NOTE', resourceId: null },
    { resourceKind: 'NOTE', resourceId: note.id, projectId: other.id },
  ])
    await call('POST', assignmentsPath, token, body, 400);
  for (const query of [
    'limit=0',
    'limit=101',
    'limit=1.5',
    'offset=-1',
    'limit=2&limit=3',
    'unknown=x',
  ])
    for (const path of [notesPath, tagsPath, assignmentsPath])
      await call('GET', path + '?' + query, token, undefined, 400);
  await call(
    'GET',
    assignmentsPath + '?resourceKind=USER',
    token,
    undefined,
    400,
  );
  for (const query of [
    'resourceKind=NOTE',
    'resourceId=' + note.id,
    'resourceKind=USER&resourceId=' + note.id,
    'resourceKind=NOTE&resourceKind=SCENE&resourceId=' + note.id,
  ])
    await call(
      'GET',
      `/projects/${project.id}/resource-tags?` + query,
      token,
      undefined,
      400,
    );
  const duplicateRace = await Promise.all(
    [1, 2].map(() =>
      fetch(base + `/tags/${arabic.id}/assignments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer ' + token,
        },
        body: JSON.stringify({ resourceKind: 'NOTE', resourceId: note.id }),
      }),
    ),
  );
  assert.deepEqual(
    duplicateRace.map((x) => x.status).sort((a, b) => a - b),
    [201, 409],
  );
  await call('DELETE', `/tags/${tag.id}`, token, undefined, 204);
  assert.equal(
    await prisma.tagAssignment.count({ where: { tagId: tag.id } }),
    0,
  );
  assert.ok(await prisma.note.findUnique({ where: { id: note.id } }));
  for (const resource of owned) {
    await call('DELETE', resource.deletePath, token, undefined, 204);
    assert.equal(
      await prisma.tagAssignment.count({
        where: { [resource.field]: resource.id },
      }),
      0,
    );
  }
  const remaining = await call(
    'POST',
    notesPath,
    token,
    { title: 'Remaining' },
    201,
  );
  await call(
    'POST',
    `/tags/${research.id}/assignments`,
    token,
    { resourceKind: 'NOTE', resourceId: remaining.id },
    201,
  );
  await call('DELETE', `/projects/${project.id}`, token, undefined, 204);
  for (const model of ['note', 'tag', 'tagAssignment'])
    assert.equal(
      await prisma[model].count({ where: { projectId: project.id } }),
      0,
    );
  console.log(
    `Organization PostgreSQL + HTTP passed: note/tag CRUD, plain text and compact deterministic pages, database normalization, both assignment queries, all eight resource kinds, 401/ownership/same-author project isolation, duplicate races, ${integrityChecks} direct integrity rejections and all cascades.`,
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
