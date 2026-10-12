import { createAccountFixture } from './account-fixture.mjs';
import { createOpenApiDocument } from '../dist/contracts/openapi.js';
import { assertActualResponse } from './assert-contract.mjs';
import './disable-queues.mjs';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { readFile, readdir, mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, dirname, basename, resolve } from 'node:path';
import { LocalStorageProvider, STORAGE_PROVIDER } from '@rawan/backend';
import { artifactProcessor } from '../../worker/dist/processors/artifacts.js';
import { Test } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@rawan/database';
import pg from 'pg';
import { AppModule } from '../dist/app.module.js';
import { PrismaService } from '../dist/database/prisma.service.js';
import { configureApp } from '../dist/config/configure-app.js';

// Only a newly created disposable schema is migrated and removed.
const schema = `rawan_platform_test_${randomUUID().replaceAll('-', '')}`;
let configModule, sql, prisma, app;
const storageRoot = await mkdtemp(join(tmpdir(), 'rawan-platform-'));
const storage = new LocalStorageProvider(storageRoot);
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
    .overrideProvider(STORAGE_PROVIDER)
    .useValue(storage)
    .compile();
  app = module.createNestApplication({ logger: false });
  configureApp(app);
  await app.listen(0, '127.0.0.1');
  const base = `${await app.getUrl()}/api/v1`;
  const contract = createOpenApiDocument(app);
  let httpChecks = 0;
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
    const result = expected === 204 ? undefined : await response.json();
    assertActualResponse(contract, path, method, expected, result);
    httpChecks++;
    return result;
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
    { title: 'Private research' },
    201,
  );
  const book = await call(
    'POST',
    `/projects/${project.id}/books`,
    a,
    { title: 'Draft' },
    201,
  );
  const chapter = await call(
    'POST',
    `/projects/${project.id}/books/${book.id}/chapters`,
    a,
    { title: 'Chapter One' },
    201,
  );
  const scene = await call(
    'POST',
    `/projects/${project.id}/books/${book.id}/chapters/${chapter.id}/scenes`,
    a,
    { title: 'Opening', content: 'A quiet beginning. 100% literal.' },
    201,
  );
  const work = await call(
    'POST',
    '/works',
    a,
    { title: 'Published title' },
    201,
  );
  await call('POST', '/works', a, { title: 'bad\u0000text' }, 400);
  const source = await call(
    'POST',
    `/works/${work.id}/sources`,
    a,
    { projectId: project.id, bookId: book.id },
    201,
  );
  const meta = {
    synopsis: 'Approved public blurb',
    language: 'en',
    medium: 'PROSE',
    genres: ['Literature'],
    topics: [],
    warnings: [],
  };
  await call('PATCH', `/works/${work.id}/metadata`, b, meta, 404);
  await call(
    'PATCH',
    `/works/${work.id}/metadata`,
    a,
    { ...meta, ownerUserId: bob.user.id },
    400,
  );
  await call('PATCH', `/works/${work.id}/metadata`, a, meta);
  const persona = await call(
    'POST',
    '/creator-identities',
    a,
    {
      handle: 'pen-name',
      displayName: 'Pen Name',
      biography: 'Public bio',
      links: ['https://example.com'],
      public: false,
    },
    201,
  );
  assert.equal(persona.ownerUserId, undefined);
  await call('GET', '/catalog/creators/pen-name', null, undefined, 404);
  await call(
    'PATCH',
    `/creator-identities/${persona.id}`,
    b,
    {
      handle: 'stolen',
      displayName: 'Stolen',
      biography: '',
      links: [],
      public: true,
    },
    404,
  );
  await call(
    'POST',
    `/works/${work.id}/credits`,
    a,
    {
      creatorId: persona.id,
      displayName: 'Pen Name',
      role: 'AUTHOR',
      position: 0,
    },
    201,
  );
  await call(
    'POST',
    `/works/${work.id}/editions`,
    a,
    { label: 'First', language: 'en', isbn13: '9780306406158' },
    400,
  );
  const edition = await call(
    'POST',
    `/works/${work.id}/editions`,
    a,
    { label: 'First', language: 'en', isbn13: '9780306406157' },
    201,
  );
  const release = await call(
    'POST',
    `/works/${work.id}/releases`,
    a,
    { sourceIds: [source.id], editionId: edition.id },
    201,
  );
  await call('GET', `/catalog/releases/${release.id}`, null, undefined, 404);
  await call(
    'POST',
    `/works/${work.id}/releases/${release.id}/publish`,
    b,
    {},
    404,
  );
  await call(
    'POST',
    `/works/${work.id}/releases/${release.id}/publish`,
    a,
    {},
    201,
  );
  await call(
    'POST',
    `/works/${work.id}/releases/${release.id}/publish`,
    a,
    {},
    409,
  );
  assert.equal(
    (
      await call(
        'GET',
        '/catalog?genre=Literature&medium=PROSE&language=en',
        null,
      )
    ).items.length,
    1,
  );
  assert.equal(
    (await call('GET', '/catalog?genre=Unlisted', null)).items.length,
    0,
  );
  const credits = await call(
    'GET',
    `/catalog/releases/${release.id}/credits`,
    null,
  );
  assert.equal(credits[0].creatorHandle, null);
  assert.equal(credits[0].creatorId, undefined);
  const sections = await call(
    'GET',
    `/catalog/releases/${release.id}/sections`,
    null,
  );
  const blocks = await call(
    'GET',
    `/catalog/releases/${release.id}/sections/${sections.items[0].id}/blocks`,
    null,
  );
  assert.equal(blocks.items[0].text, 'A quiet beginning. 100% literal.');
  assert.equal(blocks.items[0].logicalKey, undefined);
  await prisma.scene.update({
    where: { id: scene.id },
    data: { content: 'Changed private draft' },
  });
  assert.equal(
    (
      await call(
        'GET',
        `/catalog/releases/${release.id}/sections/${sections.items[0].id}/blocks`,
        null,
      )
    ).items[0].text,
    blocks.items[0].text,
  );
  assert.equal((await call('GET', '/catalog', null)).items.length, 1);
  const series = await call(
    'POST',
    '/work-series',
    a,
    {
      title: 'Collected works',
      description: '',
      anthology: true,
      public: true,
    },
    201,
  );
  await call(
    'POST',
    `/work-series/${series.id}/members`,
    b,
    { workId: work.id, position: 0 },
    404,
  );
  await call(
    'POST',
    `/work-series/${series.id}/members`,
    a,
    { workId: work.id, position: 0 },
    201,
  );
  assert.equal(
    (await call('GET', `/catalog/series/${series.id}`, null)).members.items
      .length,
    1,
  );
  const entry = await call(
    'POST',
    '/reader/library',
    b,
    { releaseId: release.id, status: 'READING', favorite: true },
    201,
  );
  assert.equal(entry.userId, undefined);
  await call(
    'PATCH',
    `/reader/library/${entry.id}`,
    a,
    { status: 'FINISHED', favorite: false },
    404,
  );
  assert.equal(
    (await call('GET', '/reader/library?favorite=true', b)).items.length,
    1,
  );
  const loc = {
    releaseId: release.id,
    sectionId: sections.items[0].id,
    blockId: blocks.items[0].id,
    offset: 5,
  };
  const progress = await call(
    'POST',
    '/reader/progress',
    b,
    { ...loc, expectedRevision: 0 },
    201,
  );
  assert.equal(progress.revision, 1);
  assert.equal(progress.userId, undefined);
  await call(
    'POST',
    '/reader/progress',
    b,
    { ...loc, expectedRevision: 0 },
    409,
  );
  await call(
    'POST',
    '/reader/progress',
    b,
    { ...loc, offset: 50000, expectedRevision: 1 },
    400,
  );
  await call('GET', `/reader/progress/${work.id}`, a, undefined, 404);
  assert.equal((await call('GET', '/reader/history', b)).items.length, 1);
  const bookmark = await call(
    'POST',
    '/reader/bookmarks',
    b,
    { ...loc, label: 'Start' },
    201,
  );
  await call('DELETE', `/reader/bookmarks/${bookmark.id}`, a, undefined, 404);
  const annotation = await call(
    'POST',
    '/reader/annotations',
    b,
    {
      releaseId: release.id,
      sectionId: loc.sectionId,
      blockId: loc.blockId,
      startOffset: 2,
      endOffset: 7,
      note: 'Private reaction',
      color: 'yellow',
    },
    201,
  );
  assert.equal(annotation.quote, blocks.items[0].text.slice(2, 7));
  assert.equal(
    (await call('GET', `/reader/releases/${release.id}/annotations`, a)).items
      .length,
    0,
  );
  await call(
    'POST',
    '/reader/annotations',
    b,
    {
      releaseId: release.id,
      sectionId: loc.sectionId,
      blockId: loc.blockId,
      startOffset: 7,
      endOffset: 2,
      note: '',
      color: 'yellow',
    },
    400,
  );
  assert.equal(
    (await call('GET', `/catalog/releases/${release.id}/search?q=100%25`, null))
      .items.length,
    1,
  );
  assert.equal(
    (await call('GET', `/catalog/releases/${release.id}/search?q=zz%25`, null))
      .items.length,
    0,
  );
  const collection = await call(
    'POST',
    '/reader/collections',
    b,
    {
      title: 'My shelf',
      description: '',
      curatorLabel: 'Curator pen name',
      public: true,
      editorial: false,
    },
    201,
  );
  await call(
    'POST',
    '/reader/collections',
    b,
    {
      title: 'Editorial',
      description: '',
      curatorLabel: 'Me',
      public: true,
      editorial: true,
    },
    403,
  );
  await call(
    'POST',
    `/reader/collections/${collection.id}/members`,
    a,
    { entryId: entry.id, position: 0 },
    404,
  );
  await call(
    'POST',
    `/reader/collections/${collection.id}/members`,
    b,
    { entryId: entry.id, position: 0 },
    201,
  );
  const shared = await call(
    'GET',
    `/catalog/collections/${collection.id}/members`,
    null,
  );
  assert.equal(shared.items[0].entryId, undefined);
  assert.equal(shared.items[0].status, undefined);
  assert.equal(shared.items[0].workId, work.id);

  const document = await call(
    'POST',
    `/works/${work.id}/documents`,
    a,
    { title: 'An essay' },
    201,
  );
  await call(
    'GET',
    `/works/${work.id}/documents/${document.id}`,
    b,
    undefined,
    404,
  );
  const documentInput = {
    title: 'An essay',
    expectedRevision: 0,
    sections: [
      {
        title: 'Introduction',
        blocks: [
          {
            kind: 'PARAGRAPH',
            text: 'A scholarly paragraph.',
            referenceLabel: 'n1',
          },
          { kind: 'FOOTNOTE', text: 'A useful footnote.', footnoteLabel: 'n1' },
        ],
      },
    ],
  };
  const savedDocument = await call(
    'PATCH',
    `/works/${work.id}/documents/${document.id}`,
    a,
    documentInput,
  );
  assert.equal(savedDocument.revision, 1);
  await call(
    'PATCH',
    `/works/${work.id}/documents/${document.id}`,
    a,
    documentInput,
    409,
  );
  await call(
    'PATCH',
    `/works/${work.id}/documents/${document.id}`,
    a,
    {
      ...documentInput,
      expectedRevision: 1,
      sections: [
        {
          title: 'Bad',
          blocks: [
            { kind: 'PARAGRAPH', text: 'Broken', referenceLabel: 'missing' },
          ],
        },
      ],
    },
    400,
  );
  const research = await call(
    'POST',
    `/projects/${project.id}/research-sources`,
    a,
    {
      title: 'Primary source',
      kind: 'BOOK',
      authors: ['Researcher'],
      provenance: 'Notes from reading',
      identifier: 'ISBN example',
    },
    201,
  );
  await call(
    'GET',
    `/projects/${project.id}/research-sources`,
    b,
    undefined,
    404,
  );
  await call(
    'POST',
    `/projects/${project.id}/research-sources/${research.id}/citations`,
    b,
    {
      documentBlockId: savedDocument.sections[0].blocks[0].id,
      locator: 'p. 10',
      quotation: '',
    },
    404,
  );
  await call(
    'POST',
    `/projects/${project.id}/research-sources/${research.id}/citations`,
    a,
    {
      documentBlockId: savedDocument.sections[0].blocks[0].id,
      locator: 'p. 10',
      quotation: '',
    },
    201,
  );
  const essayRelease = await call(
    'POST',
    `/works/${work.id}/releases`,
    a,
    { documentIds: [document.id], includeBibliography: true },
    201,
  );
  assert.equal(
    (
      await call(
        'GET',
        `/works/${work.id}/releases/${essayRelease.id}/preview`,
        a,
      )
    ).items.length,
    1,
  );
  await call(
    'GET',
    `/works/${work.id}/releases/${essayRelease.id}/preview`,
    b,
    undefined,
    404,
  );
  await call(
    'POST',
    `/works/${work.id}/releases/${essayRelease.id}/publish`,
    a,
    {},
    201,
  );
  const bibliography = await call(
    'GET',
    `/catalog/releases/${essayRelease.id}/supplements`,
    null,
  );
  assert.equal(bibliography.items[0].title, 'Primary source');
  assert.equal(bibliography.items[0].sourceId, undefined);
  const pref = await call(
    'POST',
    '/preferences',
    b,
    {
      scope: 'GLOBAL',
      contextId: 'global',
      expectedRevision: 0,
      values: { theme: 'dark', fontSize: 20 },
    },
    201,
  );
  await call(
    'POST',
    '/preferences',
    b,
    {
      scope: 'GLOBAL',
      contextId: 'global',
      expectedRevision: 0,
      values: { theme: 'light' },
    },
    409,
  );
  await call(
    'POST',
    '/preferences',
    b,
    {
      scope: 'GLOBAL',
      contextId: 'global',
      expectedRevision: 1,
      values: { fontSize: 999 },
    },
    400,
  );
  await call(
    'POST',
    '/preferences',
    b,
    {
      scope: 'GLOBAL',
      contextId: 'global',
      expectedRevision: 1,
      values: { secretSetting: true },
    },
    400,
  );
  await call(
    'POST',
    '/preferences',
    b,
    {
      scope: 'PROJECT',
      contextId: project.id,
      expectedRevision: 0,
      values: { theme: 'light' },
    },
    404,
  );
  await call(
    'POST',
    '/preferences',
    b,
    {
      scope: 'WORK',
      contextId: work.id,
      expectedRevision: 0,
      values: { fontSize: 24 },
    },
    201,
  );
  assert.equal(
    (await call('GET', `/preferences/WORK/${work.id}/effective`, b)).values
      .fontSize,
    24,
  );
  assert.equal(
    (await call('GET', `/preferences/WORK/${work.id}/effective`, b)).values
      .theme,
    'dark',
  );
  await call('DELETE', `/preferences/${pref.id}`, a, undefined, 404);
  await call(
    'POST',
    `/projects/${project.id}/saved-views`,
    a,
    {
      title: 'Bad',
      resource: 'CHARACTER',
      query: { sort: 'title' },
      modules: [],
    },
    400,
  );
  const view = await call(
    'POST',
    `/projects/${project.id}/saved-views`,
    a,
    {
      title: 'Characters',
      resource: 'CHARACTER',
      query: { sort: 'name' },
      modules: ['characters', 'notes'],
    },
    201,
  );
  assert.equal(view.userId, undefined);
  await call('GET', `/projects/${project.id}/saved-views`, b, undefined, 404);
  const map = await call(
    'POST',
    `/projects/${project.id}/maps`,
    a,
    { title: 'Draft map' },
    201,
  );
  const pin = await call(
    'POST',
    `/projects/${project.id}/maps/${map.id}/pins`,
    a,
    { label: 'A location', x: 0.25, y: 0.75 },
    201,
  );
  await call(
    'POST',
    `/projects/${project.id}/maps/${map.id}/pins`,
    a,
    { label: 'Bad', x: 2, y: 0.75 },
    400,
  );
  await call(
    'PATCH',
    `/projects/${project.id}/maps/${map.id}/pins/${pin.id}`,
    b,
    { label: 'Stolen', x: 0.2, y: 0.7 },
    404,
  );
  await call(
    'POST',
    `/projects/${project.id}/maps/${map.id}/regions`,
    a,
    {
      label: 'Country',
      color: '#0088ff',
      points: [
        { x: 0, y: 0 },
        { x: 1, y: 0 },
        { x: 1, y: 1 },
      ],
    },
    201,
  );
  assert.equal(
    (await call('GET', `/projects/${project.id}/maps/${map.id}`, a)).regions
      .length,
    1,
  );
  const canvas = await call(
    'POST',
    `/projects/${project.id}/canvases`,
    a,
    { title: 'Ideas' },
    201,
  );
  const nodeData = {
    kind: 'TEXT',
    text: 'Idea',
    x: 0,
    y: 0,
    width: 200,
    height: 100,
  };
  const node1 = await call(
    'POST',
    `/projects/${project.id}/canvases/${canvas.id}/nodes`,
    a,
    nodeData,
    201,
  );
  const node2 = await call(
    'POST',
    `/projects/${project.id}/canvases/${canvas.id}/nodes`,
    a,
    { ...nodeData, x: 250 },
    201,
  );
  await call(
    'POST',
    `/projects/${project.id}/canvases/${canvas.id}/edges`,
    a,
    { sourceId: node1.id, targetId: node2.id, label: 'Connects' },
    201,
  );
  await call(
    'POST',
    `/projects/${project.id}/canvases/${canvas.id}/edges`,
    b,
    { sourceId: node1.id, targetId: node2.id, label: 'Stolen' },
    404,
  );
  assert.equal(
    (await call('GET', `/projects/${project.id}/canvases/${canvas.id}`, a))
      .nodes[0].outgoing.length,
    1,
  );
  await call(
    'DELETE',
    `/projects/${project.id}/canvases/${canvas.id}/nodes/${node2.id}`,
    a,
    undefined,
    204,
  );
  assert.equal(await prisma.canvasEdge.count(), 0);
  await call(
    'POST',
    `/works/${work.id}/releases/${essayRelease.id}/withdraw`,
    a,
    {},
    201,
  );
  const replacementRelease = await call(
    'POST',
    `/works/${work.id}/releases`,
    a,
    { documentIds: [document.id] },
    201,
  );
  assert.ok(replacementRelease.version > essayRelease.version);
  await call(
    'DELETE',
    `/works/${work.id}/releases/${replacementRelease.id}`,
    a,
    undefined,
    204,
  );
  const nextRelease = await call(
    'POST',
    `/works/${work.id}/releases`,
    a,
    { documentIds: [document.id] },
    201,
  );
  assert.ok(
    nextRelease.version > replacementRelease.version,
    'Deleted snapshot versions are never reused',
  );
  await call(
    'DELETE',
    `/works/${work.id}/releases/${nextRelease.id}`,
    a,
    undefined,
    204,
  );

  const form = new FormData();
  form.append(
    'file',
    new Blob(
      [await readFile(new URL('./fixtures/artwork.png', import.meta.url))],
      { type: 'image/png' },
    ),
    'artwork.png',
  );
  const uploaded = await fetch(`${base}/projects/${project.id}/media`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${a}` },
    body: form,
  });
  assert.equal(
    uploaded.status,
    201,
    uploaded.status === 201 ? '' : await uploaded.text(),
  );
  const image = await uploaded.json();
  await call('POST', `/works/${work.id}/assets`, b, { mediaId: image.id }, 404);
  const asset = await call(
    'POST',
    `/works/${work.id}/assets`,
    a,
    { mediaId: image.id },
    201,
  );
  assert.equal(asset.status, 'QUEUED');
  assert.equal(asset.storageKey, undefined);
  const processor = artifactProcessor(prisma, storage);
  await Promise.all([processor.artwork(asset.id), processor.artwork(asset.id)]);
  const processed = await call(
    'GET',
    `/works/${work.id}/assets/${asset.id}`,
    a,
  );
  assert.equal(processed.status, 'COMPLETED');
  assert.equal(processed.attempts, 1);
  assert.equal(processed.renditions.length, 3);
  assert.equal(processed.renditions[0].width, 64);
  assert.equal(processed.renditions[0].storageKey, undefined);
  assert.equal(processed.renditions[0].mimeType, 'image/webp');
  const failedAsset = await call(
    'POST',
    `/works/${work.id}/assets`,
    a,
    { mediaId: image.id },
    201,
  );
  const faultyProcessor = artifactProcessor(prisma, {
    id: 'local',
    read: (key) => storage.read(key),
    delete: (key) => storage.delete(key),
    put: async (key, stream) => {
      await storage.put(key, stream);
      throw Error('Simulated storage failure after write');
    },
  });
  await faultyProcessor.artwork(failedAsset.id);
  assert.equal(
    (
      await prisma.workAsset.findUniqueOrThrow({
        where: { id: failedAsset.id },
      })
    ).status,
    'FAILED',
  );
  assert.equal(
    await prisma.artifactBlob.count({
      where: { assetId: failedAsset.id, role: { not: 'ORIGINAL' } },
    }),
    0,
  );
  assert.equal(
    await prisma.artifactBlob.count({
      where: { assetId: null, exportId: null },
    }),
    1,
    'Failed partial writes retain a detached cleanup intent',
  );
  await prisma.artifactBlob.create({
    data: {
      assetId: failedAsset.id,
      role: 'DISPLAY',
      storageKey: randomUUID(),
      mimeType: 'image/webp',
      sizeBytes: 1,
    },
  });
  await processor.tick();
  assert.equal(
    await prisma.artifactBlob.count({
      where: { assetId: failedAsset.id, ready: false },
    }),
    0,
    'Terminal jobs release unfinished crash output intents',
  );
  await call('DELETE', `/media/${image.id}`, a, undefined, 204);
  await call('PATCH', `/works/${work.id}/metadata`, a, {
    ...meta,
    medium: 'GRAPHIC',
    coverAssetId: asset.id,
  });
  const comic = await call(
    'POST',
    `/works/${work.id}/comics`,
    a,
    { title: 'Visual story', layout: 'PAGED', direction: 'RTL' },
    201,
  );
  const pageData = {
    assetId: asset.id,
    position: 0,
    altText: 'A blue illustrated page',
    transcript: 'A caption explaining the scene.',
  };
  const comicPage = await call(
    'POST',
    `/works/${work.id}/comics/${comic.id}/pages`,
    a,
    pageData,
    201,
  );
  await call(
    'PATCH',
    `/works/${work.id}/comics/${comic.id}/pages/${comicPage.id}/panels`,
    a,
    {
      expectedRevision: 0,
      panels: [
        { position: 0, x: 0.8, y: 0, width: 0.5, height: 1, altText: '' },
      ],
    },
    400,
  );
  await call(
    'PATCH',
    `/works/${work.id}/comics/${comic.id}/pages/${comicPage.id}/panels`,
    a,
    {
      expectedRevision: 0,
      panels: [
        {
          position: 0,
          x: 0,
          y: 0,
          width: 0.5,
          height: 1,
          altText: 'First panel',
        },
        {
          position: 1,
          x: 0.5,
          y: 0,
          width: 0.5,
          height: 1,
          altText: 'Second panel',
        },
      ],
    },
  );
  await call(
    'PATCH',
    `/works/${work.id}/comics/${comic.id}/pages/${comicPage.id}`,
    a,
    { ...pageData, expectedRevision: 0 },
    409,
  );
  await call(
    'POST',
    `/works/${work.id}/comics/${comic.id}/pages/${comicPage.id}/scripts`,
    a,
    {
      position: 0,
      kind: 'DIALOGUE',
      text: 'Welcome',
      speakerName: 'Protagonist',
    },
    201,
  );
  const graphic = await call(
    'POST',
    `/works/${work.id}/graphic-releases`,
    a,
    { comicId: comic.id },
    201,
  );
  assert.equal(graphic.readingDirection, 'RTL');
  await call(
    'POST',
    `/works/${work.id}/releases/${graphic.id}/publish`,
    a,
    {},
    201,
  );
  const releasedPages = (
    await call('GET', `/catalog/releases/${graphic.id}/graphic-pages`, null)
  ).items;
  assert.equal(releasedPages.length, 1);
  assert.equal(releasedPages[0].logicalKey, undefined);
  assert.equal(releasedPages[0].panels.length, 2);
  const graphicState = await call(
    'POST',
    '/reader/graphic-progress',
    b,
    {
      releaseId: graphic.id,
      pageId: releasedPages[0].id,
      panelPosition: 1,
      pageProgress: 0.5,
      expectedRevision: 1,
    },
    201,
  );
  assert.equal(graphicState.locatorKind, 'GRAPHIC');
  await call(
    'POST',
    '/reader/graphic-bookmarks',
    b,
    {
      releaseId: graphic.id,
      pageId: releasedPages[0].id,
      panelPosition: 1,
      label: 'Interesting panel',
    },
    201,
  );
  await call(
    'POST',
    '/reader/graphic-progress',
    b,
    {
      releaseId: graphic.id,
      pageId: releasedPages[0].id,
      panelPosition: 999,
      pageProgress: 0,
      expectedRevision: 2,
    },
    400,
  );
  const artResponse = await fetch(
    `${base}/catalog/releases/${graphic.id}/assets/${asset.id}/DISPLAY`,
  );
  assert.equal(artResponse.status, 200);
  assert.equal(artResponse.headers.get('content-type'), 'image/webp');
  assert.equal(artResponse.headers.get('cache-control'), 'private, no-store');
  assert.ok((await artResponse.arrayBuffer()).byteLength > 0);
  await call(
    'GET',
    `/catalog/releases/${graphic.id}/assets/${asset.id}/ORIGINAL`,
    null,
    undefined,
    400,
  );
  await call(
    'DELETE',
    `/works/${work.id}/assets/${asset.id}`,
    a,
    undefined,
    409,
  );
  const job = await call(
    'POST',
    `/works/${work.id}/exports`,
    a,
    { releaseId: essayRelease.id, format: 'EPUB' },
    201,
  );
  assert.equal(job.snapshot, undefined);
  await call('GET', `/works/${work.id}/exports/${job.id}`, b, undefined, 404);
  await processor.exportJob(job.id);
  assert.equal(
    (await call('GET', `/works/${work.id}/exports/${job.id}`, a)).status,
    'COMPLETED',
  );
  const exported = await fetch(
    `${base}/works/${work.id}/exports/${job.id}/file`,
    { headers: { Authorization: `Bearer ${a}` } },
  );
  assert.equal(exported.status, 200);
  assert.equal(exported.headers.get('content-type'), 'application/epub+zip');
  const epub = Buffer.from(await exported.arrayBuffer());
  assert.equal(epub.readUInt32LE(0), 0x04034b50);
  assert.equal(
    epub.readUInt16LE(8),
    0,
    'EPUB mimetype must be stored without compression',
  );
  assert.equal(epub.subarray(30, 38).toString(), 'mimetype');
  await call(
    'POST',
    `/works/${work.id}/releases/${graphic.id}/withdraw`,
    a,
    {},
    201,
  );
  await call(
    'GET',
    `/catalog/releases/${graphic.id}/graphic-pages`,
    null,
    undefined,
    404,
  );
  await call(
    'GET',
    `/catalog/releases/${graphic.id}/assets/${asset.id}/DISPLAY`,
    null,
    undefined,
    404,
  );

  const resumed = await call(
    'GET',
    `/reader/progress/${work.id}/resume/${release.id}`,
    b,
  );
  assert.equal(resumed.locatorKind, 'PROSE');
  assert.equal(
    (await call('GET', `/catalog/works/${work.id}`, null)).id,
    release.id,
  );
  assert.equal(
    (await call('GET', `/catalog/works/${work.id}/releases`, null)).items
      .length,
    1,
  );
  await call('PATCH', `/works/${work.id}/metadata`, a, {
    ...meta,
    coverAssetId: asset.id,
  });
  const characterA = await call(
    'POST',
    `/projects/${project.id}/characters`,
    a,
    {
      name: 'Mara',
      summary: 'A traveler',
      description: 'UNSELECTED PRIVATE DESCRIPTION',
    },
    201,
  );
  const characterB = await call(
    'POST',
    `/projects/${project.id}/characters`,
    a,
    { name: 'Ilan', summary: 'A scholar' },
    201,
  );
  const relationship = await call(
    'POST',
    `/projects/${project.id}/relationships`,
    a,
    {
      source: { kind: 'CHARACTER', id: characterA.id },
      target: { kind: 'CHARACTER', id: characterB.id },
      typeKey: 'ALLY',
      label: 'Allies',
      direction: 'SYMMETRIC',
      description: 'UNSELECTED RELATION DETAIL',
    },
    201,
  );
  const selection = [
    {
      projectId: project.id,
      kind: 'CHARACTER',
      id: characterA.id,
      includeDescription: false,
    },
    {
      projectId: project.id,
      kind: 'CHARACTER',
      id: characterB.id,
      includeDescription: false,
    },
    {
      projectId: project.id,
      kind: 'RELATIONSHIP',
      id: relationship.id,
      includeDescription: false,
    },
    {
      projectId: project.id,
      kind: 'MAP',
      id: map.id,
      includeDescription: false,
      assetId: asset.id,
    },
  ];
  await call(
    'POST',
    `/works/${work.id}/releases`,
    a,
    { documentIds: [document.id], supplements: [selection[2]] },
    400,
  );
  const companion = await call(
    'POST',
    '/works',
    a,
    { title: 'Companion' },
    201,
  );
  await call('PATCH', `/works/${companion.id}/metadata`, a, meta);
  await call(
    'POST',
    `/works/${companion.id}/credits`,
    a,
    { displayName: 'Pen Name', role: 'AUTHOR', position: 0 },
    201,
  );
  const companionSource = await call(
    'POST',
    `/works/${companion.id}/sources`,
    a,
    { projectId: project.id, bookId: book.id },
    201,
  );
  const companionRelease = await call(
    'POST',
    `/works/${companion.id}/releases`,
    a,
    { sourceIds: [companionSource.id] },
    201,
  );
  await call(
    'POST',
    `/works/${companion.id}/releases/${companionRelease.id}/publish`,
    a,
    {},
    201,
  );
  const related = await call(
    'POST',
    `/works/${work.id}/related`,
    a,
    { targetWorkId: companion.id, kind: 'COMPANION' },
    201,
  );
  const lore = await call(
    'POST',
    `/works/${work.id}/releases`,
    a,
    {
      documentIds: [document.id],
      assetIds: [asset.id],
      relatedIds: [related.id],
      supplements: selection,
    },
    201,
  );
  const prepared = await call(
    'GET',
    `/works/${work.id}/releases/${lore.id}`,
    a,
  );
  assert.equal(prepared.supplements.length, 4);
  assert.equal(prepared.assets.length, 1);
  await call('GET', `/works/${work.id}/releases/${lore.id}`, b, undefined, 404);
  await call(
    'POST',
    `/works/${work.id}/releases/${lore.id}/publish`,
    a,
    {},
    201,
  );
  await call(
    'DELETE',
    `/works/${work.id}/releases/${lore.id}`,
    a,
    undefined,
    409,
  );
  const publicLore = (
    await call('GET', `/catalog/releases/${lore.id}/supplements`, null)
  ).items;
  const serialized = JSON.stringify(publicLore);
  for (const privateValue of [
    project.id,
    characterA.id,
    characterB.id,
    relationship.id,
    map.id,
    'UNSELECTED PRIVATE DESCRIPTION',
    'UNSELECTED RELATION DETAIL',
  ])
    assert.equal(serialized.includes(privateValue), false);
  const edge = publicLore.find((row) => row.kind === 'RELATIONSHIP');
  assert.ok(publicLore.some((row) => row.id === edge.data.sourceSupplementId));
  assert.equal(
    publicLore.find((row) => row.kind === 'MAP').data.pins[0].label,
    'A location',
  );
  assert.equal(
    (await call('GET', `/catalog/releases/${lore.id}/assets`, null)).items
      .length,
    1,
  );
  assert.equal(
    (await call('GET', `/catalog/releases/${lore.id}/related`, null)).items[0]
      .targetWorkId,
    companion.id,
  );
  await call('PATCH', `/creator-identities/${persona.id}`, a, {
    handle: 'pen-name',
    displayName: 'Pen Name',
    biography: 'Public bio',
    links: ['https://example.com'],
    public: true,
    avatarAssetId: asset.id,
  });
  const publicProfile = await call('GET', '/catalog/creators/pen-name', null);
  assert.equal(publicProfile.ownerUserId, undefined);
  assert.equal(publicProfile.avatarAssetId, asset.id);
  assert.equal(
    (await fetch(`${base}/catalog/creators/pen-name/avatar/THUMBNAIL`)).status,
    200,
  );
  const resumeNew = await call(
    'GET',
    `/reader/progress/${work.id}/resume/${lore.id}`,
    b,
  );
  assert.equal(
    resumeNew.mapped,
    false,
    'Different content families deliberately fall back to an approved start',
  );
  await call(
    'POST',
    `/works/${work.id}/releases/${lore.id}/withdraw`,
    a,
    {},
    201,
  );
  await call(
    'DELETE',
    `/works/${work.id}/releases/${lore.id}`,
    a,
    undefined,
    204,
  );
  await call(
    'POST',
    `/works/${companion.id}/releases/${companionRelease.id}/withdraw`,
    a,
    {},
    201,
  );

  // Additional stages are tested here before terminal lifecycle checks.
  await prisma.book.delete({ where: { id: book.id } });
  assert.equal(
    (
      await call(
        'GET',
        `/catalog/releases/${release.id}/sections/${sections.items[0].id}/blocks`,
        null,
      )
    ).items[0].text,
    blocks.items[0].text,
  );
  await call(
    'POST',
    `/works/${work.id}/releases/${release.id}/withdraw`,
    a,
    {},
    201,
  );
  await call('GET', `/catalog/releases/${release.id}`, null, undefined, 404);
  await call(
    'GET',
    `/catalog/releases/${release.id}/sections/${sections.items[0].id}/blocks`,
    null,
    undefined,
    404,
  );
  assert.equal(
    (await call('GET', `/catalog/series/${series.id}`, null)).members.items
      .length,
    0,
  );
  assert.equal(
    (await call('GET', `/catalog/collections/${collection.id}/members`, null))
      .items.length,
    0,
  );
  assert.equal(
    (await call('GET', `/reader/progress/${work.id}`, b)).available,
    false,
  );
  await prisma.user.delete({ where: { id: alice.user.id } });
  await prisma.artifactBlob.updateMany({
    where: { assetId: null, exportId: null },
    data: { createdAt: new Date(Date.now() - 600000) },
  });
  await processor.tick();
  assert.equal(
    await prisma.artifactBlob.count(),
    0,
    'All parent-deleted files are durably cleaned',
  );
  const unavailable = (await call('GET', '/reader/library', b)).items[0];
  assert.equal(unavailable.workId, null);
  assert.equal(unavailable.availableReleaseId, null);
  assert.equal(unavailable.title, 'Published title');
  console.log(
    `Platform database smoke passed: ${httpChecks} contract-checked HTTP cases, publication/readers/creation/graphics/export and cleanup.`,
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
  if (
    resolve(dirname(storageRoot)) === resolve(tmpdir()) &&
    basename(storageRoot).startsWith('rawan-platform-')
  )
    await rm(storageRoot, { recursive: true, force: true });
}
