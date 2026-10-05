import 'reflect-metadata';
import { Test } from '@nestjs/testing';
import type { INestApplication } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Prisma } from '@rawan/database';
import request from 'supertest';

type Row = Record<string, unknown>;
type Query = { where: Row; data?: Row; orderBy?: Row[] };
const names = [
  'project',
  'character',
  'place',
  'faction',
  'artifact',
  'relationship',
] as const;
const parentNames = {
  project: 'author',
  character: 'project',
  place: 'project',
  faction: 'project',
  artifact: 'project',
  relationship: 'project',
};

// Isolated persistence exercises compiled Nest routing, DTOs and real JWT guards.
// PostgreSQL cascade behavior is covered separately by the database smoke check.
describe('relationships over HTTP', () => {
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
  const originalEnv = Object.fromEntries(
    envKeys.map((key) => [key, process.env[key]]),
  );

  function matches(row: Row, where: Row): boolean {
    return Object.entries(where).every(([key, value]) => {
      if (value === undefined) return true;
      if (key === 'OR')
        return (value as Row[]).some((part) => matches(row, part));
      if (value !== null && typeof value === 'object') {
        const parent = stores[key]?.get(String(row[`${key}Id`]));
        return !!parent && matches(parent, value as Row);
      }
      return row[key] === value;
    });
  }

  function hydrate(row: Row | null): Row | null {
    if (!row) return null;
    const result = { ...row };
    for (const side of ['source', 'target'])
      for (const kind of ['Character', 'Place', 'Faction', 'Artifact']) {
        result[side + kind] =
          stores[kind.toLowerCase()].get(String(row[side + kind + 'Id'])) ??
          null;
      }
    return result;
  }
  function missing(): never {
    throw new Prisma.PrismaClientKnownRequestError('missing relation', {
      code: 'P2025',
      clientVersion: '7.10.0',
    });
  }

  const delegates = Object.fromEntries(
    names.map((name) => [
      name,
      {
        findFirst: vi.fn(async ({ where }: Query) =>
          hydrate(
            [...stores[name].values()].find((row) => matches(row, where)) ??
              null,
          ),
        ),
        findMany: vi.fn(async ({ where, orderBy = [] }: Query) =>
          [...stores[name].values()]
            .filter((row) => matches(row, where))
            .sort((a, b) => {
              for (const order of orderBy) {
                const [key, direction] = Object.entries(order)[0];
                const av = a[key] instanceof Date ? a[key].getTime() : a[key];
                const bv = b[key] instanceof Date ? b[key].getTime() : b[key];
                if (av === bv) continue;
                const comparison =
                  typeof av === 'number' && typeof bv === 'number'
                    ? av - bv
                    : String(av).localeCompare(String(bv));
                return direction === 'desc' ? -comparison : comparison;
              }
              return 0;
            })
            .map((row) => hydrate(row)),
        ),
        create: vi.fn(async ({ data = {} }: Query) => {
          if (name === 'relationship') {
            const row: Row = {
              id: 'link-' + ++sequence,
              description: null,
              ...Object.fromEntries(
                Object.entries(data).filter(([, value]) => value !== undefined),
              ),
              createdAt: new Date(),
              updatedAt: new Date(),
            };
            stores.relationship.set(String(row.id), row);
            return hydrate(row);
          }
          const parentName = parentNames[name];
          const relation = data[parentName] as { connect: Row };
          const parent = [...stores[parentName].values()].find((row) =>
            matches(row, relation.connect),
          );
          if (!parent) missing();
          const { [parentName]: _relation, ...fields } = data;
          const row: Row = {
            id: `${name}-${++sequence}`,
            description: null,
            summary: null,
            ...(name === 'character'
              ? { role: null, status: null }
              : { type: null }),
            ...fields,
            [`${parentName}Id`]: parent.id,
            createdAt: new Date(),
            updatedAt: new Date(),
          };
          stores[name].set(String(row.id), row);
          return row;
        }),
        update: vi.fn(async ({ where, data }: Query) => {
          const row = [...stores[name].values()].find((candidate) =>
            matches(candidate, where),
          );
          if (!row) missing();
          Object.assign(
            row,
            Object.fromEntries(
              Object.entries(data ?? {}).filter(
                ([, value]) => value !== undefined,
              ),
            ),
            { updatedAt: new Date() },
          );
          return hydrate(row);
        }),
        delete: vi.fn(async ({ where }: Query) => {
          const row = [...stores[name].values()].find((candidate) =>
            matches(candidate, where),
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
    author: {
      findUnique: vi.fn(
        async ({ where }: Query) =>
          [...stores.author.values()].find((row) => matches(row, where)) ??
          null,
      ),
    },
    user: {
      findUnique: vi.fn(async ({ where }: Query) =>
        ['alice', 'bob', 'admin', 'legacy'].includes(String(where.id))
          ? {
              id: where.id,
              email: `${String(where.id)}@example.com`,
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
    process.env.JWT_SECRET = 'manuscript-test-secret-longer-than-32-characters';
    process.env.CORS_ORIGINS = 'https://allowed.example';
    const { AppModule } = await import('../dist/app.module.js');
    const { PrismaService } =
      await import('../dist/database/prisma.service.js');
    const { configureApp } = await import('../dist/config/configure-app.js');
    const module = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(PrismaService)
      .useValue(prisma)
      .compile();
    app = module.createNestApplication();
    configureApp(app);
    await app.listen(0, '127.0.0.1');
    jwt = app.get(JwtService);
  });

  beforeEach(() => {
    vi.clearAllMocks();
    sequence = 0;
    Object.values(stores).forEach((store) => store.clear());
    for (const userId of ['alice', 'bob', 'admin']) {
      stores.author.set(`${userId}-profile`, {
        id: `${userId}-profile`,
        userId,
      });
    }
  });

  afterAll(async () => {
    if (app) await app.close();
    for (const key of envKeys) {
      if (originalEnv[key] === undefined) delete process.env[key];
      else process.env[key] = originalEnv[key];
    }
  });

  async function token(userId = 'alice') {
    return `Bearer ${await jwt.signAsync({ sub: userId })}`;
  }

  const collection = '/api/v1/projects/alice-project/relationships';
  const input = {
    source: { kind: 'CHARACTER', id: 'alice-character' },
    target: { kind: 'PLACE', id: 'alice-place' },
    typeKey: 'born-in',
    label: ' born in ',
  };
  beforeEach(() => {
    for (const owner of ['alice', 'bob', 'admin']) {
      stores.project.set(owner + '-project', {
        id: owner + '-project',
        authorId: owner + '-profile',
      });
      for (const kind of ['character', 'place', 'faction', 'artifact']) {
        stores[kind].set(owner + '-' + kind, {
          id: owner + '-' + kind,
          projectId: owner + '-project',
          name: owner + ' ' + kind,
        });
      }
    }
    stores.project.set('second-project', {
      id: 'second-project',
      authorId: 'alice-profile',
    });
    stores.character.set('second-character', {
      id: 'second-character',
      projectId: 'second-project',
      name: 'Second',
    });
  });
  async function create() {
    return (
      await request(app.getHttpServer())
        .post(collection)
        .set('Authorization', await token())
        .send(input)
        .expect(201)
    ).body;
  }
  it('supports CRUD with explicit endpoint summaries and ISO timestamps', async () => {
    const row = await create();
    expect(row).toMatchObject({
      typeKey: 'BORN_IN',
      label: 'born in',
      direction: 'DIRECTIONAL',
      description: null,
      source: {
        id: 'alice-character',
        kind: 'CHARACTER',
        name: 'alice character',
      },
      target: { id: 'alice-place', kind: 'PLACE', name: 'alice place' },
    });
    expect(row.createdAt).toBe(new Date(row.createdAt).toISOString());
    expect(row).not.toHaveProperty('sourceCharacterId');
    const item = '/api/v1/relationships/' + row.id;
    await request(app.getHttpServer())
      .get(item)
      .set('Authorization', await token())
      .expect(200, row);
    await request(app.getHttpServer())
      .get(collection)
      .set('Authorization', await token())
      .expect(200, { items: [row], nextOffset: null });
    const edited = await request(app.getHttpServer())
      .patch(item)
      .set('Authorization', await token())
      .send({ label: 'home', description: 'Notes' })
      .expect(200);
    expect(edited.body).toMatchObject({
      label: 'home',
      description: 'Notes',
      source: row.source,
      target: row.target,
    });
    await request(app.getHttpServer())
      .patch(item)
      .set('Authorization', await token())
      .send({ description: null })
      .expect(200);
    await request(app.getHttpServer())
      .delete(item)
      .set('Authorization', await token())
      .expect(204);
    await request(app.getHttpServer())
      .get(item)
      .set('Authorization', await token())
      .expect(404);
  });
  it('filters both endpoints and normalized type keys', async () => {
    const row = await create();
    for (const entity of [input.source, input.target]) {
      await request(app.getHttpServer())
        .get(collection)
        .query({
          entityKind: entity.kind,
          entityId: entity.id,
          typeKey: 'born-in',
        })
        .set('Authorization', await token())
        .expect(200, { items: [row], nextOffset: null });
    }
    await request(app.getHttpServer())
      .get(collection)
      .query({ typeKey: 'OWNS' })
      .set('Authorization', await token())
      .expect(200, { items: [], nextOffset: null });
  });
  it.each(['bob', 'admin'])(
    'denies %s access to another author’s collection and link',
    async (owner) => {
      const row = await create();
      const auth = await token(owner);
      await request(app.getHttpServer())
        .get(collection)
        .set('Authorization', auth)
        .expect(404);
      await request(app.getHttpServer())
        .post(collection)
        .set('Authorization', auth)
        .send(input)
        .expect(404);
      const item = '/api/v1/relationships/' + row.id;
      await request(app.getHttpServer())
        .get(item)
        .set('Authorization', auth)
        .expect(404);
      await request(app.getHttpServer())
        .patch(item)
        .set('Authorization', auth)
        .send({ label: 'stolen' })
        .expect(404);
      await request(app.getHttpServer())
        .delete(item)
        .set('Authorization', auth)
        .expect(404);
    },
  );
  it('rejects foreign, nonexistent and same-owner cross-project endpoints', async () => {
    const row = await create();
    for (const id of ['missing', 'bob-character', 'second-character'])
      for (const side of ['source', 'target']) {
        const endpoint = { kind: 'CHARACTER', id };
        await request(app.getHttpServer())
          .post(collection)
          .set('Authorization', await token())
          .send({ ...input, [side]: endpoint })
          .expect(404);
        await request(app.getHttpServer())
          .patch('/api/v1/relationships/' + row.id)
          .set('Authorization', await token())
          .send({ [side]: endpoint })
          .expect(404);
      }
  });
  it('requires JWT on every relationship route', async () => {
    const item = '/api/v1/relationships/' + (await create()).id;
    await request(app.getHttpServer()).post(collection).send(input).expect(401);
    await request(app.getHttpServer()).get(collection).expect(401);
    await request(app.getHttpServer()).get(item).expect(401);
    await request(app.getHttpServer())
      .patch(item)
      .send({ label: 'x' })
      .expect(401);
    await request(app.getHttpServer()).delete(item).expect(401);
  });
  it.each([
    { source: { kind: 'USER', id: 'alice-character' } },
    { source: null },
    { target: null },
    { source: { ...input.source, authorId: 'alice' } },
    { typeKey: '?' },
    { typeKey: 'x'.repeat(65) },
    { label: ' ' },
    { label: 'x'.repeat(101) },
    { direction: null },
    { direction: 'REVERSE' },
    { description: 'x'.repeat(10001) },
    { description: 5 },
    { authorId: 'alice' },
    { createdAt: '2026-01-01' },
  ])('rejects invalid creation fields %#', async (override) => {
    await request(app.getHttpServer())
      .post(collection)
      .set('Authorization', await token())
      .send({ ...input, ...override })
      .expect(400);
  });
  it('rejects self-links, invalid PATCH fields and invalid query fields', async () => {
    await request(app.getHttpServer())
      .post(collection)
      .set('Authorization', await token())
      .send({ ...input, target: input.source })
      .expect(400);
    const row = await create();
    for (const fields of [
      { projectId: 'bob-project' },
      { source: null },
      { typeKey: null },
      { label: '' },
      { direction: null },
      { updatedAt: 'x' },
    ]) {
      await request(app.getHttpServer())
        .patch('/api/v1/relationships/' + row.id)
        .set('Authorization', await token())
        .send(fields)
        .expect(400);
    }
    for (const query of [
      { entityKind: 'PLACE' },
      { entityId: 'alice-place' },
      { entityKind: 'USER', entityId: 'x' },
      { typeKey: '?' },
      { typeKey: ['A', 'B'] },
      { unexpected: 'x' },
    ]) {
      await request(app.getHttpServer())
        .get(collection)
        .query(query)
        .set('Authorization', await token())
        .expect(400);
    }
  });
});
