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
  'timeline',
  'era',
  'timelineEvent',
  'eventEntity',
  'character',
  'place',
  'faction',
  'artifact',
] as const;
describe('timeline HTTP contract with isolated persistence', () => {
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
  const relation = (key: string) => (key === 'event' ? 'timelineEvent' : key);
  function matches(row: Row, where: Row): boolean {
    return Object.entries(where).every(([key, value]) => {
      if (value === undefined) return true;
      if (key === 'entities')
        return [...stores.eventEntity.values()].some(
          (link) =>
            link.eventId === row.id &&
            matches(link, (value as { some: Row }).some),
        );
      if (value !== null && typeof value === 'object') {
        if (key === 'start') {
          const bounds = value as { gte?: string; lte?: string };
          const start = new Prisma.Decimal(String(row.start));
          return (
            (bounds.gte === undefined || start.gte(bounds.gte)) &&
            (bounds.lte === undefined || start.lte(bounds.lte))
          );
        }
        const parent = stores[relation(key)]?.get(String(row[key + 'Id']));
        return !!parent && matches(parent, value as Row);
      }
      return row[key] === value;
    });
  }
  function hydrate(name: string, row: Row): Row {
    if (name === 'timelineEvent')
      return {
        ...row,
        era: stores.era.get(String(row.eraId)) ?? null,
        entities: [...stores.eventEntity.values()]
          .filter((link) => link.eventId === row.id)
          .map((link) => hydrate('eventEntity', link)),
      };
    if (name === 'eventEntity')
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
  function missing(): never {
    throw new Prisma.PrismaClientKnownRequestError('missing', {
      code: 'P2025',
      clientVersion: '7.10.0',
    });
  }
  function values(data: Row) {
    return Object.fromEntries(
      Object.entries(data)
        .filter(([, v]) => v !== undefined)
        .map(([key, value]) => [
          key,
          ['start', 'end'].includes(key) && value !== null
            ? new Prisma.Decimal(value as string)
            : value,
        ]),
    );
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
          async ({ where = {}, orderBy = [], take, skip = 0 }: Query) => {
            const rows = [...stores[name].values()]
              .filter((row) => matches(row, where))
              .sort((a, b) => {
                for (const order of orderBy) {
                  const [key, direction] = Object.entries(order)[0];
                  const compare =
                    key === 'start'
                      ? new Prisma.Decimal(String(a[key])).cmp(String(b[key]))
                      : key === 'position'
                        ? Number(a[key]) - Number(b[key])
                        : String(a[key]).localeCompare(String(b[key]));
                  if (compare) return direction === 'desc' ? -compare : compare;
                }
                return 0;
              });
            return rows
              .slice(skip, take === undefined ? undefined : skip + take)
              .map((row) => hydrate(name, row));
          },
        ),
        create: vi.fn(async ({ data = {} }: Query) => {
          const row: Row = {
            id: 'row-' + ++sequence,
            description: null,
            summary: null,
            start: null,
            end: null,
            dateLabel: null,
            eraId: null,
            position: 0,
            role: null,
            createdAt: new Date(),
            updatedAt: new Date(),
            ...values(data),
          };
          for (const parentName of ['project', 'timeline']) {
            const connect = (data[parentName] as { connect: Row } | undefined)
              ?.connect;
            if (connect) {
              const parent = [...stores[parentName].values()].find((parent) =>
                matches(parent, connect),
              );
              if (!parent) missing();
              row[parentName + 'Id'] = parent.id;
              delete row[parentName];
            }
          }
          if (
            name === 'eventEntity' &&
            [...stores.eventEntity.values()].some(
              (link) =>
                link.eventId === row.eventId &&
                link.kind === row.kind &&
                ['characterId', 'placeId', 'factionId', 'artifactId'].some(
                  (field) => row[field] != null && row[field] === link[field],
                ),
            )
          )
            throw new Prisma.PrismaClientKnownRequestError('duplicate', {
              code: 'P2002',
              clientVersion: '7.10.0',
            });
          stores[name].set(String(row.id), row);
          return hydrate(name, row);
        }),
        update: vi.fn(async ({ where = {}, data = {} }: Query) => {
          const row = [...stores[name].values()].find((row) =>
            matches(row, where),
          );
          if (!row) missing();
          Object.assign(row, values(data));
          return hydrate(name, row);
        }),
        updateMany: vi.fn(async ({ where = {}, data = {} }: Query) => {
          let count = 0;
          for (const row of stores[name].values())
            if (matches(row, where)) {
              Object.assign(row, values(data));
              count++;
            }
          return { count };
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
    process.env.JWT_SECRET = 'timeline-test-secret-more-than-32-characters';
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
    for (const owner of ['alice', 'bob']) {
      stores.author.set(owner + '-author', {
        id: owner + '-author',
        userId: owner,
      });
      stores.project.set(owner + '-project', {
        id: owner + '-project',
        authorId: owner + '-author',
      });
      stores.timeline.set(owner + '-timeline', {
        id: owner + '-timeline',
        projectId: owner + '-project',
        name: 'History',
        description: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      for (const kind of ['character', 'place', 'faction', 'artifact'])
        stores[kind].set(owner + '-' + kind, {
          id: owner + '-' + kind,
          projectId: owner + '-project',
          name: kind,
        });
    }
    stores.project.set('other-project', {
      id: 'other-project',
      authorId: 'alice-author',
    });
    stores.character.set('other-character', {
      id: 'other-character',
      projectId: 'other-project',
      name: 'Other',
    });
    stores.timeline.set('other-timeline', {
      ...stores.timeline.get('alice-timeline'),
      id: 'other-timeline',
    });
  });
  const auth = async (owner = 'alice') =>
    'Bearer ' + (await jwt.signAsync({ sub: owner }));
  const api = '/api/v1';
  const path = api + '/timelines/alice-timeline/events';
  const postEvent = async () =>
    request(app.getHttpServer())
      .post(path)
      .set('Authorization', await auth())
      .send({ title: 'Battle', start: '0' })
      .expect(201);
  it('supports timeline CRUD with public response', async () => {
    const token = await auth();
    const created = await request(app.getHttpServer())
      .post(api + '/projects/alice-project/timelines')
      .set('Authorization', token)
      .send({ name: ' War ' })
      .expect(201);
    const item = api + '/timelines/' + created.body.id;
    expect(created.body.name).toBe('War');
    expect(created.body.author).toBeUndefined();
    await request(app.getHttpServer())
      .get(api + '/projects/alice-project/timelines')
      .set('Authorization', token)
      .expect(200);
    await request(app.getHttpServer())
      .get(item)
      .set('Authorization', token)
      .expect(200);
    const edited = await request(app.getHttpServer())
      .patch(item)
      .set('Authorization', token)
      .send({ name: 'Peace', description: null })
      .expect(200);
    expect(edited.body.name).toBe('Peace');
    await request(app.getHttpServer())
      .delete(item)
      .set('Authorization', token)
      .expect(204);
    await request(app.getHttpServer())
      .get(item)
      .set('Authorization', token)
      .expect(404);
  });
  it('supports eras, optional event era, duration, patch and safe era deletion', async () => {
    const token = await auth();
    const created = await request(app.getHttpServer())
      .post(api + '/timelines/alice-timeline/eras')
      .set('Authorization', token)
      .send({ name: 'Age', start: '-10', end: '10' })
      .expect(201);
    const eraId = created.body.id;
    await request(app.getHttpServer())
      .get(api + '/eras/' + eraId)
      .set('Authorization', token)
      .expect(200);
    await request(app.getHttpServer())
      .get(api + '/timelines/alice-timeline/eras')
      .set('Authorization', token)
      .expect(200);
    await request(app.getHttpServer())
      .patch(api + '/eras/' + eraId)
      .set('Authorization', token)
      .send({ position: 3 })
      .expect(200);
    const event = await request(app.getHttpServer())
      .post(path)
      .set('Authorization', token)
      .send({
        title: 'War',
        start: '-5',
        end: '0',
        eraId,
        dateLabel: 'Before the fall',
      })
      .expect(201);
    const item = api + '/events/' + event.body.id;
    await request(app.getHttpServer())
      .get(item)
      .set('Authorization', token)
      .expect(200);
    await request(app.getHttpServer())
      .patch(item)
      .set('Authorization', token)
      .send({ start: '1' })
      .expect(400);
    await request(app.getHttpServer())
      .patch(item)
      .set('Authorization', token)
      .send({ end: null })
      .expect(200);
    await request(app.getHttpServer())
      .delete(api + '/eras/' + eraId)
      .set('Authorization', token)
      .expect(204);
    const detail = await request(app.getHttpServer())
      .get(item)
      .set('Authorization', token)
      .expect(200);
    expect(detail.body.era).toBeNull();
    await request(app.getHttpServer())
      .delete(item)
      .set('Authorization', token)
      .expect(204);
  });
  it('returns exact ordered compact pages with range filtering', async () => {
    const token = await auth();
    for (const start of [
      '9007199254740993.000002',
      '0',
      '-1',
      '9007199254740993.000001',
    ])
      await request(app.getHttpServer())
        .post(path)
        .set('Authorization', token)
        .send({ title: start, start, description: 'detail' })
        .expect(201);
    const list = await request(app.getHttpServer())
      .get(path + '?limit=2')
      .set('Authorization', token)
      .expect(200);
    expect(list.body.items.map((x: { start: string }) => x.start)).toEqual([
      '-1',
      '0',
    ]);
    expect(list.body.nextOffset).toBe(2);
    expect(list.body.items[0].description).toBeUndefined();
    const filtered = await request(app.getHttpServer())
      .get(path + '?from=9007199254740993.000001&to=9007199254740993.000001')
      .set('Authorization', token)
      .expect(200);
    expect(filtered.body.items).toHaveLength(1);
  });
  it.each(['CHARACTER', 'PLACE', 'FACTION', 'ARTIFACT'])(
    'attaches, retrieves, filters and removes %s',
    async (kind) => {
      const token = await auth();
      const event = await postEvent();
      const item = api + '/events/' + event.body.id;
      const entityId = 'alice-' + kind.toLowerCase();
      const link = await request(app.getHttpServer())
        .post(item + '/entities')
        .set('Authorization', token)
        .send({ kind, entityId, role: ' victim ' })
        .expect(201);
      expect(link.body.entity).toEqual({
        id: entityId,
        kind,
        name: kind.toLowerCase(),
      });
      expect(link.body.role).toBe('victim');
      await request(app.getHttpServer())
        .post(item + '/entities')
        .set('Authorization', token)
        .send({ kind, entityId })
        .expect(409);
      const detail = await request(app.getHttpServer())
        .get(item)
        .set('Authorization', token)
        .expect(200);
      expect(detail.body.entities).toHaveLength(1);
      const list = await request(app.getHttpServer())
        .get(path + '?entityKind=' + kind + '&entityId=' + entityId)
        .set('Authorization', token)
        .expect(200);
      expect(list.body.items).toHaveLength(1);
      await request(app.getHttpServer())
        .delete(item + '/entities/' + link.body.associationId)
        .set('Authorization', token)
        .expect(204);
    },
  );
  it('rejects cross-author, same-author other-project and wrong-timeline era associations', async () => {
    const token = await auth();
    const event = await postEvent();
    const item = api + '/events/' + event.body.id;
    for (const entityId of ['bob-character', 'other-character'])
      await request(app.getHttpServer())
        .post(item + '/entities')
        .set('Authorization', token)
        .send({ kind: 'CHARACTER', entityId })
        .expect(404);
    const era = await request(app.getHttpServer())
      .post(api + '/timelines/other-timeline/eras')
      .set('Authorization', token)
      .send({ name: 'Other' })
      .expect(201);
    await request(app.getHttpServer())
      .patch(item)
      .set('Authorization', token)
      .send({ eraId: era.body.id })
      .expect(404);
    for (const owner of ['bob', 'admin']) {
      await request(app.getHttpServer())
        .get(item)
        .set('Authorization', await auth(owner))
        .expect(404);
      await request(app.getHttpServer())
        .patch(item)
        .set('Authorization', await auth(owner))
        .send({ title: 'Stolen' })
        .expect(404);
      await request(app.getHttpServer())
        .delete(item)
        .set('Authorization', await auth(owner))
        .expect(404);
    }
    await request(app.getHttpServer())
      .post(api + '/timelines/bob-timeline/eras')
      .set('Authorization', token)
      .send({ name: 'Stolen' })
      .expect(404);
    await request(app.getHttpServer())
      .post(api + '/timelines/bob-timeline/events')
      .set('Authorization', token)
      .send({ title: 'Stolen', start: '0' })
      .expect(404);
  });
  it('requires authentication for every new route', async () => {
    const routes: [string, string][] = [
      ['post', '/projects/alice-project/timelines'],
      ['get', '/projects/alice-project/timelines'],
      ['get', '/timelines/alice-timeline'],
      ['patch', '/timelines/alice-timeline'],
      ['delete', '/timelines/alice-timeline'],
      ['post', '/timelines/alice-timeline/eras'],
      ['get', '/timelines/alice-timeline/eras'],
      ['get', '/eras/x'],
      ['patch', '/eras/x'],
      ['delete', '/eras/x'],
      ['post', '/timelines/alice-timeline/events'],
      ['get', '/timelines/alice-timeline/events'],
      ['get', '/events/x'],
      ['patch', '/events/x'],
      ['delete', '/events/x'],
      ['post', '/events/x/entities'],
      ['delete', '/events/x/entities/y'],
    ];
    for (const [method, url] of routes) {
      const server = request(app.getHttpServer());
      await server[method as 'get' | 'post' | 'patch' | 'delete'](
        api + url,
      ).expect(401);
    }
  });
  it.each([
    1,
    null,
    'NaN',
    'Infinity',
    '1e9',
    '01',
    '1.0000001',
    '1000000000000000000000000',
  ])(
    'rejects invalid chronology %s through global validation',
    async (start) => {
      await request(app.getHttpServer())
        .post(path)
        .set('Authorization', await auth())
        .send({ title: 'Invalid', start })
        .expect(400);
    },
  );
  it('rejects null required updates, unknown fields, bad queries and invalid roles', async () => {
    const token = await auth();
    const event = await postEvent();
    const item = api + '/events/' + event.body.id;
    for (const body of [
      { start: null },
      { title: null },
      { position: null },
      { position: -1 },
      { projectId: 'other-project' },
      { end: '-1' },
    ])
      await request(app.getHttpServer())
        .patch(item)
        .set('Authorization', token)
        .send(body)
        .expect(400);
    for (const query of [
      'entityKind=PLACE',
      'limit=0',
      'offset=-1',
      'from=2&to=1',
      'limit=2&limit=3',
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
  });
});
