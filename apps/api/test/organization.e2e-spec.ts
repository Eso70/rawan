import 'reflect-metadata';
import { Test } from '@nestjs/testing';
import type { INestApplication } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Prisma } from '@rawan/database';
import request from 'supertest';
type Row = Record<string, unknown>;
type Query = {
  where?: Row;
  data?: Row;
  orderBy?: Row[];
  take?: number;
  skip?: number;
};
const models = [
  'project',
  'note',
  'tag',
  'tagAssignment',
  'character',
  'place',
  'faction',
  'artifact',
  'book',
  'chapter',
  'scene',
  'timeline',
  'timelineEvent',
  'plot',
  'plotPoint',
] as const;
const targets = {
  NOTE: 'noteId',
  CHARACTER: 'characterId',
  PLACE: 'placeId',
  FACTION: 'factionId',
  ARTIFACT: 'artifactId',
  SCENE: 'sceneId',
  TIMELINE_EVENT: 'eventId',
  PLOT_POINT: 'plotPointId',
};
describe('organization HTTP contracts with isolated persistence', () => {
  let app: INestApplication;
  let jwt: JwtService;
  let sequence = 0;
  const stores: Record<string, Map<string, Row>> = Object.fromEntries(
    ['author', ...models].map((name) => [name, new Map<string, Row>()]),
  );
  const envKeys = [
    'NODE_ENV',
    'DATABASE_URL',
    'JWT_SECRET',
    'CORS_ORIGINS',
    'REDIS_URL',
    'MEDIA_CLEANUP_SCHEDULE_ENABLED',
  ];
  const original = Object.fromEntries(
    envKeys.map((key) => [key, process.env[key]]),
  );
  function matches(row: Row, where: Row): boolean {
    return Object.entries(where).every(([key, value]) => {
      if (value === undefined) return true;
      if (key === 'tagAssignments')
        return [...stores.tagAssignment.values()].some(
          (link) =>
            link.noteId === row.id &&
            matches(link, (value as { some: Row }).some),
        );
      if (value !== null && typeof value === 'object') {
        const parent = stores[key]?.get(String(row[key + 'Id']));
        return !!parent && matches(parent, value as Row);
      }
      return row[key] === value;
    });
  }
  function hydrate(name: string, row: Row): Row {
    if (name === 'scene') {
      const chapter = stores.chapter.get(String(row.chapterId));
      return {
        ...row,
        chapter: chapter
          ? { ...chapter, book: stores.book.get(String(chapter.bookId)) }
          : null,
      };
    }
    if (name === 'tagAssignment')
      return {
        ...row,
        tag: stores.tag.get(String(row.tagId)),
        ...Object.fromEntries(
          [
            ['note', 'note'],
            ['character', 'character'],
            ['place', 'place'],
            ['faction', 'faction'],
            ['artifact', 'artifact'],
            ['scene', 'scene'],
            ['event', 'timelineEvent'],
            ['plotPoint', 'plotPoint'],
          ].map(([key, model]) => [
            key,
            stores[model].get(String(row[key + 'Id'])) ?? null,
          ]),
        ),
      };
    return { ...row };
  }
  function missing(): never {
    throw new Prisma.PrismaClientKnownRequestError('missing', {
      code: 'P2025',
      clientVersion: '7.10.0',
    });
  }
  function duplicate(): never {
    throw new Prisma.PrismaClientKnownRequestError('duplicate', {
      code: 'P2002',
      clientVersion: '7.10.0',
    });
  }
  const clean = (data: Row) =>
    Object.fromEntries(
      Object.entries(data).filter(([, value]) => value !== undefined),
    );
  // This fixture emulates persistence only. PostgreSQL normalization/FKs/cascades
  // are independently verified by organization-database-smoke.mjs.
  function normalizeTag(row: Row) {
    row.name = String(row.name).trim().replace(/\s+/gu, ' ');
    row.normalizedName = String(row.name).toLowerCase();
    if (
      [...stores.tag.values()].some(
        (tag) =>
          tag.id !== row.id &&
          tag.projectId === row.projectId &&
          tag.normalizedName === row.normalizedName,
      )
    )
      duplicate();
  }
  const delegates = Object.fromEntries(
    models.map((name) => [
      name,
      {
        findFirst: vi.fn(async ({ where = {} }: Query) => {
          const row = [...stores[name].values()].find((row) =>
            matches(row, where),
          );
          return row ? hydrate(name, row) : null;
        }),
        findMany: vi.fn(
          async ({ where = {}, orderBy = [], skip = 0, take }: Query) =>
            [...stores[name].values()]
              .filter((row) => matches(row, where))
              .sort((a, b) => {
                for (const order of orderBy) {
                  const [key, direction] = Object.entries(order)[0];
                  const av =
                    key === 'tag'
                      ? stores.tag.get(String(a.tagId))?.normalizedName
                      : a[key];
                  const bv =
                    key === 'tag'
                      ? stores.tag.get(String(b.tagId))?.normalizedName
                      : b[key];
                  const comparison =
                    av instanceof Date && bv instanceof Date
                      ? av.getTime() - bv.getTime()
                      : String(av).localeCompare(String(bv));
                  if (comparison)
                    return direction === 'desc' ? -comparison : comparison;
                }
                return 0;
              })
              .slice(skip, take === undefined ? undefined : skip + take)
              .map((row) => hydrate(name, row)),
        ),
        create: vi.fn(async ({ data = {} }: Query) => {
          const row: Row = {
            id: 'row-' + ++sequence,
            content: '',
            createdAt: new Date(sequence * 1000),
            updatedAt: new Date(sequence * 1000),
            ...clean(data),
          };
          const connect = (data.project as { connect: Row } | undefined)
            ?.connect;
          if (connect) {
            const project = [...stores.project.values()].find((project) =>
              matches(project, connect),
            );
            if (!project) missing();
            row.projectId = project.id;
            delete row.project;
          }
          if (name === 'tag') normalizeTag(row);
          if (name === 'tagAssignment') {
            const field =
              targets[String(row.resourceKind) as keyof typeof targets];
            if (
              [...stores.tagAssignment.values()].some(
                (link) =>
                  link.tagId === row.tagId &&
                  link.resourceKind === row.resourceKind &&
                  link[field] === row[field],
              )
            )
              duplicate();
          }
          stores[name].set(String(row.id), row);
          return hydrate(name, row);
        }),
        update: vi.fn(async ({ where = {}, data = {} }: Query) => {
          const old = [...stores[name].values()].find((row) =>
            matches(row, where),
          );
          if (!old) missing();
          const row: Row = {
            ...old,
            ...clean(data),
            updatedAt: new Date(++sequence * 1000),
          };
          if (name === 'tag') normalizeTag(row);
          stores[name].set(String(row.id), row);
          return hydrate(name, row);
        }),
        delete: vi.fn(async ({ where = {} }: Query) => {
          const row = [...stores[name].values()].find((row) =>
            matches(row, where),
          );
          if (!row) missing();
          stores[name].delete(String(row.id));
          return row;
        }),
      },
    ]),
  );
  const prisma = {
    mediaCleanup: {
      findMany: vi.fn(async () => []),
      findFirst: vi.fn(async () => null),
    },
    ...delegates,
    user: {
      findUnique: vi.fn(async ({ where }: { where: Row }) =>
        ['alice', 'bob', 'admin'].includes(String(where.id))
          ? {
              id: where.id,
              email: String(where.id) + '@example.invalid',
              role: where.id === 'admin' ? 'ADMIN' : 'AUTHOR',
            }
          : null,
      ),
    },
  };
  Object.assign(prisma, {
    $transaction: async (callback: (tx: typeof prisma) => Promise<unknown>) =>
      callback(prisma),
  });
  beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    process.env.REDIS_URL = '';
    process.env.MEDIA_CLEANUP_SCHEDULE_ENABLED = 'false';
    process.env.DATABASE_URL =
      'postgresql://unused:unused@localhost:5432/unused';
    process.env.JWT_SECRET = 'organization-http-secret-more-than-32-characters';
    process.env.CORS_ORIGINS = 'https://allowed.example';
    const { AppModule } = await import('../dist/app.module.js');
    const { PrismaService } =
      await import('../dist/database/prisma.service.js');
    const { configureApp } = await import('../dist/config/configure-app.js');
    const module = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(PrismaService)
      .useValue(prisma)
      .compile();
    app = module.createNestApplication({ logger: false });
    configureApp(app);
    await app.listen(0, '127.0.0.1');
    jwt = app.get(JwtService);
  });
  afterAll(async () => {
    if (app) await app.close();
    for (const key of envKeys) {
      if (original[key] === undefined) delete process.env[key];
      else process.env[key] = original[key];
    }
  });
  beforeEach(() => {
    vi.clearAllMocks();
    sequence = 0;
    Object.values(stores).forEach((store) => store.clear());
    for (const [user, prefix] of [
      ['alice', 'alice'],
      ['alice', 'other'],
      ['bob', 'bob'],
    ]) {
      stores.author.set(user + '-author', {
        id: user + '-author',
        userId: user,
      });
      stores.project.set(prefix + '-project', {
        id: prefix + '-project',
        authorId: user + '-author',
      });
      stores.note.set(prefix + '-note', {
        id: prefix + '-note',
        projectId: prefix + '-project',
        title: 'Note',
        content: 'private',
        createdAt: new Date(0),
        updatedAt: new Date(0),
      });
      stores.tag.set(prefix + '-tag', {
        id: prefix + '-tag',
        projectId: prefix + '-project',
        name: 'Magic',
        normalizedName: 'magic',
        createdAt: new Date(0),
        updatedAt: new Date(0),
      });
      for (const kind of ['character', 'place', 'faction', 'artifact'])
        stores[kind].set(prefix + '-' + kind, {
          id: prefix + '-' + kind,
          projectId: prefix + '-project',
          name: kind,
        });
      stores.book.set(prefix + '-book', {
        id: prefix + '-book',
        projectId: prefix + '-project',
      });
      stores.chapter.set(prefix + '-chapter', {
        id: prefix + '-chapter',
        bookId: prefix + '-book',
      });
      stores.scene.set(prefix + '-scene', {
        id: prefix + '-scene',
        chapterId: prefix + '-chapter',
        title: 'Scene',
        content: 'private',
      });
      stores.timeline.set(prefix + '-timeline', {
        id: prefix + '-timeline',
        projectId: prefix + '-project',
      });
      stores.timelineEvent.set(prefix + '-event', {
        id: prefix + '-event',
        projectId: prefix + '-project',
        timelineId: prefix + '-timeline',
        title: 'Event',
      });
      stores.plot.set(prefix + '-plot', {
        id: prefix + '-plot',
        projectId: prefix + '-project',
      });
      stores.plotPoint.set(prefix + '-point', {
        id: prefix + '-point',
        projectId: prefix + '-project',
        plotId: prefix + '-plot',
        title: 'Point',
      });
    }
  });
  const auth = async (user = 'alice') =>
    'Bearer ' + (await jwt.signAsync({ sub: user }));
  const api = '/api/v1';
  const notePath = api + '/projects/alice-project/notes';
  const tagPath = api + '/projects/alice-project/tags';
  const assignmentPath = api + '/tags/alice-tag/assignments';
  const resourceId = (kind: string, prefix = 'alice') =>
    prefix +
    '-' +
    ({ TIMELINE_EVENT: 'event', PLOT_POINT: 'point' }[kind] ??
      kind.toLowerCase());
  const query = (kind: string, id: string) =>
    api +
    '/projects/alice-project/resource-tags?resourceKind=' +
    kind +
    '&resourceId=' +
    id;
  it('supports note CRUD, exact plain text, content-free pages and update ordering', async () => {
    const token = await auth();
    const saved = await request(app.getHttpServer())
      .post(notePath)
      .set('Authorization', token)
      .send({ title: ' Research ', content: '<b>plain text</b>' })
      .expect(201);
    expect(saved.body.title).toBe('Research');
    expect(saved.body.content).toBe('<b>plain text</b>');
    const item = api + '/notes/' + saved.body.id;
    const list = await request(app.getHttpServer())
      .get(notePath + '?limit=1')
      .set('Authorization', token)
      .expect(200);
    expect(list.body.items[0].id).toBe(saved.body.id);
    expect(list.body.items[0].content).toBeUndefined();
    expect(list.body.nextOffset).toBe(1);
    await request(app.getHttpServer())
      .get(item)
      .set('Authorization', token)
      .expect(200);
    const edit = await request(app.getHttpServer())
      .patch(item)
      .set('Authorization', token)
      .send({ content: '' })
      .expect(200);
    expect(edit.body.content).toBe('');
    await request(app.getHttpServer())
      .delete(item)
      .set('Authorization', token)
      .expect(204);
    await request(app.getHttpServer())
      .get(item)
      .set('Authorization', token)
      .expect(404);
  });
  it('normalizes tag display names and rejects duplicates/rename collisions', async () => {
    const token = await auth();
    for (const name of ['Magic', 'magic', ' MAGIC '])
      await request(app.getHttpServer())
        .post(tagPath)
        .set('Authorization', token)
        .send({ name })
        .expect(409);
    const saved = await request(app.getHttpServer())
      .post(tagPath)
      .set('Authorization', token)
      .send({ name: ' needs   research ' })
      .expect(201);
    expect(saved.body.name).toBe('needs research');
    expect(saved.body.normalizedName).toBeUndefined();
    const item = api + '/tags/' + saved.body.id;
    await request(app.getHttpServer())
      .get(tagPath)
      .set('Authorization', token)
      .expect(200);
    await request(app.getHttpServer())
      .get(item)
      .set('Authorization', token)
      .expect(200);
    await request(app.getHttpServer())
      .patch(item)
      .set('Authorization', token)
      .send({ name: ' magic ' })
      .expect(409);
    const edit = await request(app.getHttpServer())
      .patch(item)
      .set('Authorization', token)
      .send({ name: ' Review ' })
      .expect(200);
    expect(edit.body.name).toBe('Review');
    await request(app.getHttpServer())
      .delete(item)
      .set('Authorization', token)
      .expect(204);
  });
  it.each(Object.keys(targets))(
    'assigns %s, queries both directions and removes the link',
    async (kind) => {
      const token = await auth();
      const body = { resourceKind: kind, resourceId: resourceId(kind) };
      const assignment = await request(app.getHttpServer())
        .post(assignmentPath)
        .set('Authorization', token)
        .send(body)
        .expect(201);
      expect(assignment.body.resource.kind).toBe(kind);
      expect(assignment.body.resource.id).toBe(body.resourceId);
      expect(assignment.body.projectId).toBeUndefined();
      await request(app.getHttpServer())
        .post(assignmentPath)
        .set('Authorization', token)
        .send(body)
        .expect(409);
      const inverse = await request(app.getHttpServer())
        .get(query(kind, body.resourceId))
        .set('Authorization', token)
        .expect(200);
      expect(inverse.body.items).toHaveLength(1);
      const list = await request(app.getHttpServer())
        .get(assignmentPath + '?resourceKind=' + kind)
        .set('Authorization', token)
        .expect(200);
      expect(list.body.items[0]).toEqual(assignment.body);
      await request(app.getHttpServer())
        .delete(
          api + '/tags/other-tag/assignments/' + assignment.body.assignmentId,
        )
        .set('Authorization', token)
        .expect(404);
      await request(app.getHttpServer())
        .delete(assignmentPath + '/' + assignment.body.assignmentId)
        .set('Authorization', token)
        .expect(204);
    },
  );
  it('filters note summaries by a verified same-project tag', async () => {
    const token = await auth();
    await request(app.getHttpServer())
      .post(assignmentPath)
      .set('Authorization', token)
      .send({ resourceKind: 'NOTE', resourceId: 'alice-note' })
      .expect(201);
    const list = await request(app.getHttpServer())
      .get(notePath + '?tagId=alice-tag')
      .set('Authorization', token)
      .expect(200);
    expect(list.body.items.map((row: { id: string }) => row.id)).toEqual([
      'alice-note',
    ]);
    await request(app.getHttpServer())
      .get(notePath + '?tagId=other-tag')
      .set('Authorization', token)
      .expect(404);
  });
  it('enforces author ownership and same-author project boundaries for every kind', async () => {
    const token = await auth();
    for (const kind of Object.keys(targets))
      for (const prefix of ['other', 'bob']) {
        await request(app.getHttpServer())
          .post(assignmentPath)
          .set('Authorization', token)
          .send({ resourceKind: kind, resourceId: resourceId(kind, prefix) })
          .expect(404);
        await request(app.getHttpServer())
          .get(query(kind, resourceId(kind, prefix)))
          .set('Authorization', token)
          .expect(404);
      }
    for (const user of ['bob', 'admin'])
      for (const item of [api + '/notes/alice-note', api + '/tags/alice-tag'])
        for (const method of ['get', 'patch', 'delete'] as const)
          await request(app.getHttpServer())
            [method](item)
            .set('Authorization', await auth(user))
            .send(method === 'patch' ? {} : undefined)
            .expect(404);
    await request(app.getHttpServer())
      .post(api + '/tags/bob-tag/assignments')
      .set('Authorization', token)
      .send({ resourceKind: 'NOTE', resourceId: 'alice-note' })
      .expect(404);
  });
  it('rejects unauthenticated requests on all 14 routes', async () => {
    const routes: [string, string][] = [
      ['post', 'projects/x/notes'],
      ['get', 'projects/x/notes'],
      ['get', 'notes/x'],
      ['patch', 'notes/x'],
      ['delete', 'notes/x'],
      ['post', 'projects/x/tags'],
      ['get', 'projects/x/tags'],
      ['get', 'tags/x'],
      ['patch', 'tags/x'],
      ['delete', 'tags/x'],
      ['post', 'tags/x/assignments'],
      ['get', 'tags/x/assignments'],
      ['delete', 'tags/x/assignments/y'],
      ['get', 'projects/x/resource-tags'],
    ];
    for (const [method, path] of routes)
      await request(app.getHttpServer())
        [method as 'get' | 'post' | 'patch' | 'delete'](api + '/' + path)
        .expect(401);
  });
  it.each([
    { title: null },
    { title: ' ' },
    { content: null },
    { content: '\u0000' },
    { content: 1 },
    { content: 'x'.repeat(50001) },
    { projectId: 'other-project' },
    { authorId: 'bob' },
    { updatedAt: '2020' },
  ])('rejects invalid or mass-assigned note patch', async (body) => {
    await request(app.getHttpServer())
      .patch(api + '/notes/alice-note')
      .set('Authorization', await auth())
      .send(body)
      .expect(400);
  });
  it('rejects unsupported kind, derived key injection, invalid names/IDs and bad queries', async () => {
    const token = await auth();
    for (const body of [
      { name: ' ' },
      { name: 'x'.repeat(101) },
      { name: null },
      { normalizedName: 'bypass' },
    ])
      await request(app.getHttpServer())
        .patch(api + '/tags/alice-tag')
        .set('Authorization', token)
        .send(body)
        .expect(400);
    for (const body of [
      { resourceKind: 'USER', resourceId: 'alice-note' },
      { resourceKind: 'constructor', resourceId: 'alice-note' },
      { resourceKind: 'NOTE', resourceId: null },
      {
        resourceKind: 'NOTE',
        resourceId: 'alice-note',
        projectId: 'other-project',
      },
    ])
      await request(app.getHttpServer())
        .post(assignmentPath)
        .set('Authorization', token)
        .send(body)
        .expect(400);
    for (const suffix of [
      'limit=0',
      'limit=101',
      'offset=-1',
      'limit=1&limit=2',
      'unknown=x',
    ])
      await request(app.getHttpServer())
        .get(tagPath + '?' + suffix)
        .set('Authorization', token)
        .expect(400);
    await request(app.getHttpServer())
      .get(api + '/projects/alice-project/resource-tags?resourceKind=NOTE')
      .set('Authorization', token)
      .expect(400);
  });
  it('returns safe 404s for missing parents, tags and supported resources', async () => {
    const token = await auth();
    await request(app.getHttpServer())
      .post(api + '/projects/missing/notes')
      .set('Authorization', token)
      .send({ title: 'Note' })
      .expect(404);
    await request(app.getHttpServer())
      .post(api + '/tags/missing/assignments')
      .set('Authorization', token)
      .send({ resourceKind: 'NOTE', resourceId: 'alice-note' })
      .expect(404);
    await request(app.getHttpServer())
      .post(assignmentPath)
      .set('Authorization', token)
      .send({ resourceKind: 'NOTE', resourceId: 'missing' })
      .expect(404);
  });
});
