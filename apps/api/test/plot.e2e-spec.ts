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
  skip?: number;
  take?: number;
};
const names = [
  'project',
  'plot',
  'plotPoint',
  'plotPointScene',
  'plotPointEvent',
  'plotPointEntity',
  'book',
  'chapter',
  'scene',
  'timeline',
  'timelineEvent',
  'character',
  'place',
  'faction',
  'artifact',
] as const;
describe('plot API with isolated persistence', () => {
  let app: INestApplication;
  let jwt: JwtService;
  let sequence = 0;
  const stores: Record<string, Map<string, Row>> = Object.fromEntries(
    ['author', ...names].map((name) => [name, new Map<string, Row>()]),
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
  const relation = (name: string) =>
    name === 'point' ? 'plotPoint' : name === 'event' ? 'timelineEvent' : name;
  function matches(row: Row, where: Row): boolean {
    return Object.entries(where).every(([key, value]) => {
      if (value === undefined) return true;
      if (key === 'id' && value !== null && typeof value === 'object')
        return (value as { in: string[] }).in.includes(String(row.id));
      if (value !== null && typeof value === 'object') {
        const parent = stores[relation(key)]?.get(String(row[key + 'Id']));
        return !!parent && matches(parent, value as Row);
      }
      return row[key] === value;
    });
  }
  function hydrate(name: string, row: Row): Row {
    if (name === 'plotPoint')
      return {
        ...row,
        ...Object.fromEntries(
          [
            ['scenes', 'plotPointScene'],
            ['events', 'plotPointEvent'],
            ['entities', 'plotPointEntity'],
          ].map(([key, model]) => [
            key,
            [...stores[model].values()]
              .filter((link) => link.pointId === row.id)
              .map((link) => hydrate(model, link)),
          ]),
        ),
      };
    if (name === 'scene') {
      const chapter = stores.chapter.get(String(row.chapterId));
      return {
        ...row,
        chapter: chapter
          ? { ...chapter, book: stores.book.get(String(chapter.bookId)) }
          : null,
      };
    }
    if (name === 'plotPointScene') {
      const scene = stores.scene.get(String(row.sceneId));
      if (!scene) throw Error('test scene absent');
      const chapter = stores.chapter.get(String(scene.chapterId));
      if (!chapter) throw Error('test chapter absent');
      const book = stores.book.get(String(chapter.bookId));
      if (!book) throw Error('test book absent');
      return {
        ...row,
        scene: {
          id: scene.id,
          title: scene.title,
          chapter: {
            id: chapter.id,
            title: chapter.title,
            book: { id: book.id, title: book.title },
          },
        },
      };
    }
    if (name === 'plotPointEvent')
      return { ...row, event: stores.timelineEvent.get(String(row.eventId)) };
    if (name === 'plotPointEntity')
      return {
        ...row,
        ...Object.fromEntries(
          ['character', 'place', 'faction', 'artifact'].map((kind) => [
            kind,
            stores[kind].get(String(row[kind + 'Id'])) ?? null,
          ]),
        ),
      };
    return { ...row };
  }
  const missing = () => {
    throw new Prisma.PrismaClientKnownRequestError('missing', {
      code: 'P2025',
      clientVersion: '7.10.0',
    });
  };
  const clean = (data: Row) =>
    Object.fromEntries(
      Object.entries(data).filter(([, value]) => value !== undefined),
    );
  const delegates = Object.fromEntries(
    names.map((name) => [
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
                  const [key] = Object.keys(order);
                  const diff =
                    key === 'position'
                      ? Number(a[key]) - Number(b[key])
                      : String(a[key]).localeCompare(String(b[key]));
                  if (diff) return diff;
                }
                return 0;
              })
              .slice(skip, take === undefined ? undefined : skip + take)
              .map((row) => hydrate(name, row)),
        ),
        aggregate: vi.fn(async ({ where = {} }: Query) => {
          const positions = [...stores[name].values()]
            .filter((row) => matches(row, where))
            .map((row) => Number(row.position));
          return {
            _max: {
              position: positions.length ? Math.max(...positions) : null,
            },
          };
        }),
        create: vi.fn(async ({ data = {} }: Query) => {
          const row: Row = {
            id: 'row-' + ++sequence,
            title: 'Beat',
            category: null,
            description: null,
            position: 0,
            status: 'PLANNED',
            role: null,
            createdAt: new Date(),
            updatedAt: new Date(),
            ...clean(data),
          };
          if (
            ['plotPointScene', 'plotPointEvent', 'plotPointEntity'].includes(
              name,
            )
          ) {
            const duplicate = [...stores[name].values()].some(
              (link) =>
                link.pointId === row.pointId &&
                (name === 'plotPointScene'
                  ? link.sceneId === row.sceneId
                  : name === 'plotPointEvent'
                    ? link.eventId === row.eventId
                    : link.kind === row.kind &&
                      [
                        'characterId',
                        'placeId',
                        'factionId',
                        'artifactId',
                      ].some(
                        (key) => row[key] != null && row[key] === link[key],
                      )),
            );
            if (duplicate)
              throw new Prisma.PrismaClientKnownRequestError('duplicate', {
                code: 'P2002',
                clientVersion: '7.10.0',
              });
          }
          stores[name].set(String(row.id), row);
          return hydrate(name, row);
        }),
        update: vi.fn(async ({ where = {}, data = {} }: Query) => {
          const row = [...stores[name].values()].find((row) =>
            matches(row, where),
          );
          if (!row) return missing();
          Object.assign(row, clean(data));
          return hydrate(name, row);
        }),
        delete: vi.fn(async ({ where = {} }: Query) => {
          const row = [...stores[name].values()].find((row) =>
            matches(row, where),
          );
          if (!row) return missing();
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
    process.env.JWT_SECRET =
      'plot-http-test-secret-with-more-than-32-characters';
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
    for (const [owner, project] of [
      ['alice', 'alice'],
      ['alice', 'other'],
      ['bob', 'bob'],
    ]) {
      stores.author.set(owner + '-author', {
        id: owner + '-author',
        userId: owner,
      });
      stores.project.set(project + '-project', {
        id: project + '-project',
        authorId: owner + '-author',
      });
      stores.plot.set(project + '-plot', {
        id: project + '-plot',
        projectId: project + '-project',
        title: 'Plot',
        category: null,
        description: null,
        position: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      stores.book.set(project + '-book', {
        id: project + '-book',
        projectId: project + '-project',
        title: 'Book',
      });
      stores.chapter.set(project + '-chapter', {
        id: project + '-chapter',
        bookId: project + '-book',
        title: 'Chapter',
      });
      stores.scene.set(project + '-scene', {
        id: project + '-scene',
        chapterId: project + '-chapter',
        title: 'Scene',
        content: 'secret',
      });
      stores.timeline.set(project + '-timeline', {
        id: project + '-timeline',
        projectId: project + '-project',
      });
      stores.timelineEvent.set(project + '-event', {
        id: project + '-event',
        projectId: project + '-project',
        timelineId: project + '-timeline',
        title: 'King dies',
        start: new Prisma.Decimal('-9007199254740993.000001'),
        end: null,
        dateLabel: 'Before the fall',
      });
      for (const kind of ['character', 'place', 'faction', 'artifact'])
        stores[kind].set(project + '-' + kind, {
          id: project + '-' + kind,
          projectId: project + '-project',
          name: kind,
        });
    }
    stores.plot.set('second-plot', {
      ...stores.plot.get('alice-plot'),
      id: 'second-plot',
    });
  });
  const auth = async (owner = 'alice') =>
    'Bearer ' + (await jwt.signAsync({ sub: owner }));
  const api = '/api/v1';
  const path = api + '/plots/alice-plot/points';
  const create = async (parent = path) =>
    request(app.getHttpServer())
      .post(parent)
      .set('Authorization', await auth())
      .send({ title: 'Crown stolen' })
      .expect(201);
  it('supports plot CRUD, custom categories, ordering and compact pagination', async () => {
    const token = await auth();
    const collection = api + '/projects/alice-project/plots';
    const saved = await request(app.getHttpServer())
      .post(collection)
      .set('Authorization', token)
      .send({
        title: ' Mystery ',
        category: 'Custom arc',
        description: 'Notes',
      })
      .expect(201);
    expect(saved.body.position).toBe(1);
    expect(saved.body.title).toBe('Mystery');
    const item = api + '/plots/' + saved.body.id;
    const list = await request(app.getHttpServer())
      .get(collection + '?limit=1')
      .set('Authorization', token)
      .expect(200);
    expect(list.body.nextOffset).toBe(1);
    expect(list.body.items[0].description).toBeUndefined();
    await request(app.getHttpServer())
      .get(item)
      .set('Authorization', token)
      .expect(200);
    const edit = await request(app.getHttpServer())
      .patch(item)
      .set('Authorization', token)
      .send({ category: null, title: 'Revised' })
      .expect(200);
    expect(edit.body.category).toBeNull();
    await request(app.getHttpServer())
      .delete(item)
      .set('Authorization', token)
      .expect(204);
    await request(app.getHttpServer())
      .get(item)
      .set('Authorization', token)
      .expect(404);
  });
  it('supports point CRUD, automatic positions, statuses and deterministic batch reorder', async () => {
    const token = await auth();
    const first = await create();
    const second = await create();
    expect([first.body.position, second.body.position]).toEqual([0, 1]);
    const item = api + '/plot-points/' + first.body.id;
    const edited = await request(app.getHttpServer())
      .patch(item)
      .set('Authorization', token)
      .send({ status: 'RESOLVED', description: 'Notes' })
      .expect(200);
    expect(edited.body.status).toBe('RESOLVED');
    await request(app.getHttpServer())
      .patch(path + '/reorder')
      .set('Authorization', token)
      .send({
        items: [
          { id: first.body.id, position: 1 },
          { id: second.body.id, position: 0 },
        ],
      })
      .expect(200);
    const list = await request(app.getHttpServer())
      .get(path)
      .set('Authorization', token)
      .expect(200);
    expect(list.body.items.map((x: { id: string }) => x.id)).toEqual([
      second.body.id,
      first.body.id,
    ]);
    expect(list.body.items[0].description).toBeUndefined();
    await request(app.getHttpServer())
      .get(item)
      .set('Authorization', token)
      .expect(200);
    await request(app.getHttpServer())
      .delete(item)
      .set('Authorization', token)
      .expect(204);
    await request(app.getHttpServer())
      .get(item)
      .set('Authorization', token)
      .expect(404);
  });
  it('rejects mixed-parent reorder atomically and duplicate nested requests', async () => {
    const token = await auth();
    const point = await create();
    const other = await create(api + '/plots/second-plot/points');
    await request(app.getHttpServer())
      .patch(path + '/reorder')
      .set('Authorization', token)
      .send({
        items: [
          { id: point.body.id, position: 9 },
          { id: other.body.id, position: 10 },
        ],
      })
      .expect(404);
    expect(stores.plotPoint.get(point.body.id)?.position).toBe(0);
    for (const items of [
      [],
      [
        { id: point.body.id, position: 0 },
        { id: point.body.id, position: 1 },
      ],
      [
        { id: point.body.id, position: 0 },
        { id: other.body.id, position: 0 },
      ],
      [null],
    ])
      await request(app.getHttpServer())
        .patch(path + '/reorder')
        .set('Authorization', token)
        .send({ items })
        .expect(400);
  });
  it('links many scenes and events, returns compact references, and removes associations', async () => {
    const token = await auth();
    const point = await create();
    const second = await create();
    const item = api + '/plot-points/' + point.body.id;
    for (const [group, key, target] of [
      ['scenes', 'sceneId', 'alice-scene'],
      ['events', 'eventId', 'alice-event'],
    ]) {
      const link = await request(app.getHttpServer())
        .post(item + '/' + group)
        .set('Authorization', token)
        .send({ [key]: target })
        .expect(201);
      await request(app.getHttpServer())
        .post(api + '/plot-points/' + second.body.id + '/' + group)
        .set('Authorization', token)
        .send({ [key]: target })
        .expect(201);
      await request(app.getHttpServer())
        .post(item + '/' + group)
        .set('Authorization', token)
        .send({ [key]: target })
        .expect(409);
      await request(app.getHttpServer())
        .delete(
          api +
            '/plot-points/' +
            second.body.id +
            '/' +
            group +
            '/' +
            link.body.associationId,
        )
        .set('Authorization', token)
        .expect(404);
      const detail = await request(app.getHttpServer())
        .get(item)
        .set('Authorization', token)
        .expect(200);
      expect(detail.body[group]).toHaveLength(1);
      if (group === 'scenes') {
        expect(detail.body.scenes[0].scene.content).toBeUndefined();
        expect(detail.body.scenes[0].scene.chapter.book.title).toBe('Book');
      } else
        expect(detail.body.events[0].event.start).toBe(
          '-9007199254740993.000001',
        );
      await request(app.getHttpServer())
        .delete(item + '/' + group + '/' + link.body.associationId)
        .set('Authorization', token)
        .expect(204);
    }
  });
  it.each(['CHARACTER', 'PLACE', 'FACTION', 'ARTIFACT'])(
    'attaches and removes %s with custom role and duplicate protection',
    async (kind) => {
      const token = await auth();
      const point = await create();
      const item = api + '/plot-points/' + point.body.id;
      const body = {
        kind,
        entityId: 'alice-' + kind.toLowerCase(),
        role: ' antagonist ',
      };
      const link = await request(app.getHttpServer())
        .post(item + '/entities')
        .set('Authorization', token)
        .send(body)
        .expect(201);
      expect(link.body.role).toBe('antagonist');
      expect(link.body.entity.kind).toBe(kind);
      await request(app.getHttpServer())
        .post(item + '/entities')
        .set('Authorization', token)
        .send(body)
        .expect(409);
      await request(app.getHttpServer())
        .delete(item + '/entities/' + link.body.associationId)
        .set('Authorization', token)
        .expect(204);
    },
  );
  it('enforces different-owner and same-owner other-project boundaries for every reference', async () => {
    const token = await auth();
    const point = await create();
    const item = api + '/plot-points/' + point.body.id;
    for (const project of ['bob', 'other']) {
      await request(app.getHttpServer())
        .post(item + '/scenes')
        .set('Authorization', token)
        .send({ sceneId: project + '-scene' })
        .expect(404);
      await request(app.getHttpServer())
        .post(item + '/events')
        .set('Authorization', token)
        .send({ eventId: project + '-event' })
        .expect(404);
      for (const kind of ['CHARACTER', 'PLACE', 'FACTION', 'ARTIFACT'])
        await request(app.getHttpServer())
          .post(item + '/entities')
          .set('Authorization', token)
          .send({ kind, entityId: project + '-' + kind.toLowerCase() })
          .expect(404);
    }
    for (const owner of ['bob', 'admin'])
      for (const method of ['get', 'patch', 'delete'] as const)
        await request(app.getHttpServer())
          [method](item)
          .set('Authorization', await auth(owner))
          .send(method === 'patch' ? { title: 'Stolen' } : undefined)
          .expect(404);
    await request(app.getHttpServer())
      .get(api + '/projects/bob-project/plots')
      .set('Authorization', token)
      .expect(404);
    await request(app.getHttpServer())
      .post(api + '/plots/bob-plot/points')
      .set('Authorization', token)
      .send({ title: 'Stolen' })
      .expect(404);
  });
  it('guards all 17 new routes before DTO or persistence work', async () => {
    const routes: [string, string][] = [
      ['post', 'projects/x/plots'],
      ['get', 'projects/x/plots'],
      ['get', 'plots/x'],
      ['patch', 'plots/x'],
      ['delete', 'plots/x'],
      ['post', 'plots/x/points'],
      ['get', 'plots/x/points'],
      ['get', 'plot-points/x'],
      ['patch', 'plot-points/x'],
      ['delete', 'plot-points/x'],
      ['patch', 'plots/x/points/reorder'],
      ...['scenes', 'events', 'entities'].flatMap(
        (group) =>
          [
            ['post', 'plot-points/x/' + group],
            ['delete', 'plot-points/x/' + group + '/y'],
          ] as [string, string][],
      ),
    ];
    for (const [method, url] of routes)
      await request(app.getHttpServer())
        [method as 'get' | 'post' | 'patch' | 'delete'](api + '/' + url)
        .expect(401);
  });
  it.each([
    { title: null },
    { title: ' ' },
    { position: -1 },
    { position: null },
    { position: 1.5 },
    { status: null },
    { status: 'CUSTOM' },
    { plotId: 'other-plot' },
    { description: 'x'.repeat(10001) },
  ])('rejects malformed or mass-assigned point patch', async (body) => {
    const point = await create();
    await request(app.getHttpServer())
      .patch(api + '/plot-points/' + point.body.id)
      .set('Authorization', await auth())
      .send(body)
      .expect(400);
  });
  it('rejects invalid pagination, roles and association IDs', async () => {
    const token = await auth();
    const point = await create();
    const item = api + '/plot-points/' + point.body.id;
    for (const query of [
      'limit=0',
      'limit=101',
      'limit=2&limit=3',
      'offset=-1',
      'unknown=1',
    ])
      await request(app.getHttpServer())
        .get(path + '?' + query)
        .set('Authorization', token)
        .expect(400);
    await request(app.getHttpServer())
      .post(item + '/entities')
      .set('Authorization', token)
      .send({ kind: 'CHARACTER', entityId: 'alice-character', role: ' ' })
      .expect(400);
    await request(app.getHttpServer())
      .post(item + '/scenes')
      .set('Authorization', token)
      .send({ sceneId: null })
      .expect(400);
    await request(app.getHttpServer())
      .post(item + '/events')
      .set('Authorization', token)
      .send({ eventId: [] })
      .expect(400);
  });
});
