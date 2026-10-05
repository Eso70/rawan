import { createOpenApiDocument } from '../dist/contracts/openapi.js';
import { assertActualResponse } from './assert-contract.mjs';
import './disable-queues.mjs';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { readFile, readdir } from 'node:fs/promises';
import { Test } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@rawan/database';
import { LocalStorageProvider } from '../dist/media/storage/local-storage.js';
import { STORAGE_PROVIDER } from '../dist/media/storage/storage-provider.js';
import { mkdtemp, readdir as diskEntries, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import pg from 'pg';

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
let storageRoot;
let failDelete = false;
let failPut = false;
let failDatabase = false;
let holdWrite;
let writeStarted;
let requests = 0;
if (process.env.NODE_ENV === 'production')
  throw new Error('Media database tests are disabled in production');
process.env.MEDIA_MAX_FILE_SIZE = '1024';
const { AppModule } = await import('../dist/app.module.js');

try {
  configModule = await Test.createTestingModule({ imports: [AppModule] })
    .overrideProvider(PrismaService)
    .useValue({})
    .compile();
  const config = configModule.get(ConfigService);
  if (config.get('NODE_ENV') === 'production')
    throw new Error('Media database tests are disabled in production');
  const connectionString = config.get('TEST_DATABASE_URL');
  if (!connectionString)
    throw new Error(
      'Set TEST_DATABASE_URL explicitly for media database tests',
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
  storageRoot = await mkdtemp(join(tmpdir(), 'rawan-media-db-test-'));
  const localStorage = new LocalStorageProvider(storageRoot);
  const storage = {
    id: 'local',
    put: async (key, source) => {
      if (failPut) throw Error('simulated write failure');
      if (holdWrite) {
        writeStarted();
        await holdWrite;
      }
      return localStorage.put(key, source);
    },
    read: (key) => localStorage.read(key),
    delete: (key) => {
      if (failDelete) throw Error('simulated delete failure');
      return localStorage.delete(key);
    },
  };
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
  const database = prisma.$extends({
    query: {
      media: {
        create: ({ args, query }) => {
          if (failDatabase) throw Error('simulated media database failure');
          return query(args);
        },
      },
    },
  });
  const module = await Test.createTestingModule({ imports: [AppModule] })
    .overrideProvider(PrismaService)
    .useValue(database)
    .overrideProvider(STORAGE_PROVIDER)
    .useValue(storage)
    .compile();
  app = module.createNestApplication({ logger: false });
  configureApp(app);
  const contract = createOpenApiDocument(app);
  await app.listen(0, '127.0.0.1');
  const base = `${await app.getUrl()}/api/v1`;
  async function call(method, path, token, body, expected = 200) {
    requests++;
    const response = await fetch(`${base}${path}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
    assert.equal(response.status, expected, `${method} ${path}`);
    const result = expected === 204 ? undefined : await response.json();
    assertActualResponse(contract, path, method, expected, result);
    return result;
  }
  const password = 'media-test-password-long';
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
    { title: 'Media project' },
    201,
  );
  const other = await call(
    'POST',
    '/projects',
    token,
    { title: 'Second project' },
    201,
  );
  const foreign = await call(
    'POST',
    '/projects',
    bob.accessToken,
    { title: 'Foreign project' },
    201,
  );
  const path = '/projects/' + project.id + '/media';
  async function upload(
    bytes,
    mime = 'text/plain',
    filename = 'reference.txt',
    expected = 201,
    auth = token,
    projectId = project.id,
    extra,
  ) {
    const form = new FormData();
    form.append('file', new Blob([bytes], { type: mime }), filename);
    if (extra) form.append('storageKey', '../../escape');
    requests++;
    const response = await fetch(base + '/projects/' + projectId + '/media', {
      method: 'POST',
      headers: auth ? { Authorization: 'Bearer ' + auth } : {},
      body: form,
    });
    assert.equal(
      response.status,
      expected,
      'upload ' + filename + ' ' + (await response.clone().text()),
    );
    const result = await response.json();
    assertActualResponse(
      contract,
      '/projects/' + projectId + '/media',
      'POST',
      expected,
      result,
    );
    return result;
  }
  const bytes = Buffer.from('Private reference text');
  const media = await upload(bytes);
  assert.equal(media.sizeBytes, bytes.length);
  assert.equal(media.sha256, createHash('sha256').update(bytes).digest('hex'));
  assert.deepEqual(
    Object.keys(media).sort(),
    [
      'id',
      'projectId',
      'originalFilename',
      'mimeType',
      'sizeBytes',
      'sha256',
      'createdAt',
      'updatedAt',
    ].sort(),
  );
  requests++;
  const content = await fetch(base + '/media/' + media.id + '/content', {
    headers: { Authorization: 'Bearer ' + token },
  });
  assert.equal(content.status, 200);
  assert.deepEqual(Buffer.from(await content.arrayBuffer()), bytes);
  assert.equal(content.headers.get('content-type'), 'text/plain');
  assert.equal(content.headers.get('content-length'), String(bytes.length));
  assert.ok(
    content.headers.get('content-disposition').startsWith('attachment;'),
  );
  assert.equal((await call('GET', path, token)).items[0].id, media.id);
  await upload(Buffer.alloc(1025, 97), 'text/plain', 'large.txt', 413);
  await upload(Buffer.from('hello'), 'text/html', 'unsafe.html', 400);
  await upload(Buffer.from('fake image'), 'image/png', 'fake.png', 400);
  await upload(Buffer.alloc(0), 'text/plain', 'empty.txt', 400);
  await upload(bytes, 'text/plain', 'owner.txt', 401, null);
  await upload(bytes, 'text/plain', 'foreign.txt', 404, bob.accessToken);
  await upload(bytes, 'text/plain', 'fields.txt', 400, token, project.id, true);
  failDatabase = true;
  await upload(bytes, 'text/plain', 'db-failure.txt', 503);
  failDatabase = false;
  failPut = true;
  await upload(bytes, 'text/plain', 'storage-failure.txt', 503);
  failPut = false;
  assert.equal(await prisma.media.count(), 1);
  assert.equal(await prisma.mediaCleanup.count(), 0);
  assert.equal((await diskEntries(storageRoot)).length, 1);
  for (const route of [
    path,
    '/media/' + media.id,
    '/media/' + media.id + '/content',
  ]) {
    await call('GET', route, null, undefined, 401);
    await call('GET', route, bob.accessToken, undefined, 404);
  }
  await call('DELETE', '/media/' + media.id, bob.accessToken, undefined, 404);
  await call('DELETE', '/media/' + media.id, null, undefined, 401);
  failDelete = true;
  await call('DELETE', '/media/' + media.id, token, undefined, 503);
  assert.equal(await prisma.media.count(), 0);
  assert.equal(await prisma.mediaCleanup.count(), 1);
  failDelete = false;
  await call('DELETE', '/media/' + media.id, token, undefined, 204);
  assert.equal(await prisma.mediaCleanup.count(), 0);
  assert.equal((await diskEntries(storageRoot)).length, 0);

  const attachedMedia = await upload(bytes);
  const targets = [{ kind: 'PROJECT', id: project.id }];
  for (const [kind, collection] of Object.entries({
    NOTE: 'notes',
    CHARACTER: 'characters',
    PLACE: 'places',
    FACTION: 'factions',
    ARTIFACT: 'artifacts',
  })) {
    const target = await call(
      'POST',
      '/projects/' + project.id + '/' + collection,
      token,
      kind === 'NOTE' ? { title: kind } : { name: kind },
      201,
    );
    targets.push({ kind, id: target.id, collection });
  }
  for (const target of targets) {
    const route = '/media/' + attachedMedia.id + '/attachments';
    const dto = {
      resourceKind: target.kind,
      resourceId: target.id,
      role: 'reference',
    };
    const attachment = await call('POST', route, token, dto, 201);
    assert.equal(attachment.resource.id, target.id);
    await call('POST', route, token, dto, 409);
    await call('POST', route, bob.accessToken, dto, 404);
    const list = await call(
      'GET',
      '/projects/' +
        project.id +
        '/media-attachments?resourceKind=' +
        target.kind +
        '&resourceId=' +
        target.id,
      token,
    );
    assert.equal(list.items.length, 1);
    await call(
      'DELETE',
      route + '/' + attachment.id,
      bob.accessToken,
      undefined,
      404,
    );
  }
  assert.equal(
    (await call('GET', '/media/' + attachedMedia.id + '/attachments', token))
      .items.length,
    6,
  );
  for (const dto of [
    { resourceKind: 'SCENE', resourceId: project.id },
    { resourceKind: 'PROJECT', resourceId: other.id },
    { resourceKind: 'PROJECT', resourceId: foreign.id },
    { resourceKind: 'NOTE', resourceId: 'missing' },
  ]) {
    await call(
      'POST',
      '/media/' + attachedMedia.id + '/attachments',
      token,
      dto,
      dto.resourceKind === 'SCENE' ? 400 : 404,
    );
  }
  for (const query of [
    'limit=101',
    'offset=-1',
    'mimeType=text/html',
    'sort=storageKey',
    'q=a',
    'storageKey=bad',
  ])
    await call('GET', path + '?' + query, token, undefined, 400);
  const otherNote = await call(
    'POST',
    '/projects/' + other.id + '/notes',
    token,
    { title: 'Other' },
    201,
  );
  await call(
    'POST',
    '/media/' + attachedMedia.id + '/attachments',
    token,
    { resourceKind: 'NOTE', resourceId: otherNote.id },
    404,
  );
  const record = await prisma.media.findUnique({
    where: { id: attachedMedia.id },
  });
  await assert.rejects(() =>
    prisma.mediaAttachment.create({
      data: {
        projectId: project.id,
        mediaId: attachedMedia.id,
        resourceKind: 'NOTE',
        noteId: otherNote.id,
      },
    }),
  );
  await assert.rejects(() =>
    prisma.mediaAttachment.create({
      data: {
        projectId: project.id,
        mediaId: attachedMedia.id,
        resourceKind: 'NOTE',
      },
    }),
  );
  await assert.rejects(() =>
    prisma.media.update({
      where: { id: attachedMedia.id },
      data: { storageKey: '../../escape' },
    }),
  );
  await call('DELETE', '/notes/' + targets[1].id, token, undefined, 204);
  assert.equal(await prisma.mediaAttachment.count(), 5);
  assert.equal(await prisma.media.count(), 1);
  for (const target of targets.slice(2)) {
    await call(
      'DELETE',
      '/' + target.collection + '/' + target.id,
      token,
      undefined,
      204,
    );
  }
  assert.equal(await prisma.mediaAttachment.count(), 1);
  const removable = (
    await call('GET', '/media/' + attachedMedia.id + '/attachments', token)
  ).items[0];
  await call(
    'DELETE',
    '/media/' + attachedMedia.id + '/attachments/' + removable.id,
    token,
    undefined,
    204,
  );
  assert.equal(await prisma.mediaAttachment.count(), 0);
  await localStorage.delete(record.storageKey);
  await call(
    'GET',
    '/media/' + attachedMedia.id + '/content',
    token,
    undefined,
    404,
  );
  await call('DELETE', '/media/' + attachedMedia.id, token, undefined, 204);
  assert.equal(await prisma.mediaAttachment.count(), 0);
  await upload(bytes);
  failDelete = true;
  await call('DELETE', '/projects/' + project.id, token, undefined, 503);
  failDelete = false;
  assert.equal(await prisma.media.count(), 0);
  assert.equal(await prisma.mediaCleanup.count(), 1);
  await call(
    'DELETE',
    '/projects/' + project.id,
    bob.accessToken,
    undefined,
    404,
  );
  await call('DELETE', '/projects/' + project.id, token, undefined, 204);
  assert.equal(await prisma.mediaCleanup.count(), 0);
  assert.equal((await diskEntries(storageRoot)).length, 0);
  const directMedia = await upload(
    bytes,
    'text/plain',
    'direct.txt',
    201,
    token,
    other.id,
  );
  await prisma.project.delete({ where: { id: other.id } });
  assert.equal(await prisma.mediaCleanup.count(), 1);
  await prisma.mediaCleanup.update({
    where: { id: directMedia.id },
    data: { createdAt: new Date(Date.now() - 7200000) },
  });
  const { MediaCleanupService } =
    await import('../dist/media/media-cleanup.service.js');
  assert.equal(await module.get(MediaCleanupService).reconcile(), 1);
  assert.equal(await prisma.mediaCleanup.count(), 0);
  assert.equal((await diskEntries(storageRoot)).length, 0);

  await upload(
    bytes,
    'text/plain',
    'user-cascade.txt',
    201,
    bob.accessToken,
    foreign.id,
  );
  await prisma.user.delete({ where: { id: bob.user.id } });
  assert.equal(await prisma.media.count(), 0);
  assert.equal(await prisma.mediaCleanup.count(), 1);
  await prisma.mediaCleanup.updateMany({
    data: { createdAt: new Date(Date.now() - 7200000) },
  });
  assert.equal(await module.get(MediaCleanupService).reconcile(), 1);
  const compensationProject = await call(
    'POST',
    '/projects',
    token,
    { title: 'Cleanup recovery' },
    201,
  );
  failDatabase = true;
  failDelete = true;
  await upload(
    bytes,
    'text/plain',
    'compensation.txt',
    503,
    token,
    compensationProject.id,
  );
  failDatabase = false;
  failDelete = false;
  assert.equal(await prisma.media.count(), 0);
  assert.equal(await prisma.mediaCleanup.count(), 1);
  assert.equal((await diskEntries(storageRoot)).length, 1);
  await prisma.mediaCleanup.updateMany({
    data: { createdAt: new Date(Date.now() - 7200000) },
  });
  assert.equal(await module.get(MediaCleanupService).reconcile(), 1);
  assert.equal((await diskEntries(storageRoot)).length, 0);

  const racing = await call(
    'POST',
    '/projects',
    token,
    { title: 'Concurrent deletion' },
    201,
  );
  let releaseWrite;
  holdWrite = new Promise((resolve) => {
    releaseWrite = resolve;
  });
  const started = new Promise((resolve) => {
    writeStarted = resolve;
  });
  const uploading = upload(
    bytes,
    'text/plain',
    'race.txt',
    201,
    token,
    racing.id,
  );
  await started;
  let deleted = false;
  const deleting = call(
    'DELETE',
    '/projects/' + racing.id,
    token,
    undefined,
    204,
  ).then(() => {
    deleted = true;
  });
  await new Promise((resolve) => setTimeout(resolve, 50));
  assert.equal(
    deleted,
    false,
    'Project deletion must wait for upload finalization',
  );
  releaseWrite();
  holdWrite = undefined;
  await Promise.all([uploading, deleting]);
  assert.equal(await prisma.media.count(), 0);
  assert.equal(await prisma.mediaCleanup.count(), 0);
  assert.equal((await diskEntries(storageRoot)).length, 0);
  const multipartProject = await call(
    'POST',
    '/projects',
    token,
    { title: 'Multipart cases' },
    201,
  );
  for (const count of [0, 2]) {
    const form = new FormData();
    for (let i = 0; i < count; i++)
      form.append(
        'file',
        new Blob([bytes], { type: 'text/plain' }),
        'test.txt',
      );
    const response = await fetch(
      base + '/projects/' + multipartProject.id + '/media',
      {
        method: 'POST',
        headers: { Authorization: 'Bearer ' + token },
        body: form,
      },
    );
    requests++;
    assert.equal(response.status, 400);
  }

  const malformed = await fetch(
    base + '/projects/' + multipartProject.id + '/media',
    {
      method: 'POST',
      headers: {
        Authorization: 'Bearer ' + token,
        'Content-Type': 'multipart/form-data',
      },
      body: 'broken',
    },
  );
  requests++;
  assert.equal(malformed.status, 400);
  const firstDuplicate = await upload(
    bytes,
    'text/plain',
    'same.txt',
    201,
    token,
    multipartProject.id,
  );
  const secondDuplicate = await upload(
    bytes,
    'text/plain',
    'same.txt',
    201,
    token,
    multipartProject.id,
  );
  assert.notEqual(firstDuplicate.id, secondDuplicate.id);
  assert.equal((await diskEntries(storageRoot)).length, 2);
  await call('DELETE', '/media/' + firstDuplicate.id, token, undefined, 204);
  await call('DELETE', '/media/' + secondDuplicate.id, token, undefined, 204);
  const exact = await upload(
    Buffer.alloc(1024, 97),
    'text/plain',
    'exact.txt',
    201,
    token,
    multipartProject.id,
  );
  await call('DELETE', '/media/' + exact.id, token, undefined, 204);
  const png = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Wl2nAAAAABJRU5ErkJggg==',
    'base64',
  );
  const image = await upload(
    png,
    'image/png',
    '../../portrait.png',
    201,
    token,
    multipartProject.id,
  );
  assert.equal(image.originalFilename, 'portrait.png');
  await call(
    'DELETE',
    '/projects/' + multipartProject.id,
    token,
    undefined,
    204,
  );
  assert.equal(await prisma.media.count(), 0);
  assert.equal(await prisma.mediaCleanup.count(), 0);
  assert.equal((await diskEntries(storageRoot)).length, 0);
  console.log(
    'Media PostgreSQL + HTTP passed: ' +
      requests +
      ' requests; upload/download, six attachment kinds, isolation, constraints, cascades, failure compensation and concurrent project deletion.',
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
  if (storageRoot) {
    assert.ok(
      storageRoot.startsWith(join(tmpdir(), 'rawan-media-db-test-')),
      'Unsafe test storage cleanup',
    );
    await rm(storageRoot, { recursive: true, force: true });
  }
  if (configModule) await configModule.close();
}
