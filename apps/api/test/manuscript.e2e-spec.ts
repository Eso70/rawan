import 'reflect-metadata';
import { Test } from '@nestjs/testing';
import type { INestApplication } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Prisma } from '@rawan/database';
import request from 'supertest';

type Row = Record<string, unknown>;
type Query = { where: Row; data?: Row; orderBy?: Row[] };
const names = ['project', 'book', 'chapter', 'scene'] as const;
type Entity = (typeof names)[number];
const parentNames = {
  project: 'author',
  book: 'project',
  chapter: 'book',
  scene: 'chapter',
};

// Isolated persistence exercises compiled Nest routing, DTOs and real JWT guards.
// PostgreSQL cascade behavior is covered separately by the database smoke check.
describe('manuscript hierarchy over HTTP', () => {
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

  function matches(model: string, row: Row, where: Row): boolean {
    return Object.entries(where).every(([key, value]) => {
      if (value === undefined) return true;
      if (value !== null && typeof value === 'object') {
        const parent = stores[key]?.get(String(row[`${key}Id`]));
        return !!parent && matches(key, parent, value as Row);
      }
      return row[key] === value;
    });
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
        findFirst: vi.fn(
          async ({ where }: Query) =>
            [...stores[name].values()].find((row) =>
              matches(name, row, where),
            ) ?? null,
        ),
        findMany: vi.fn(async ({ where, orderBy = [] }: Query) =>
          [...stores[name].values()]
            .filter((row) => matches(name, row, where))
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
            }),
        ),
        create: vi.fn(async ({ data = {} }: Query) => {
          const parentName = parentNames[name];
          const relation = data[parentName] as { connect: Row };
          const parent = [...stores[parentName].values()].find((row) =>
            matches(parentName, row, relation.connect),
          );
          if (!parent) missing();
          const { [parentName]: _relation, ...fields } = data;
          const row: Row = {
            id: `${name}-${++sequence}`,
            description: null,
            ...(name !== 'project' ? { position: 0 } : {}),
            ...(name === 'scene' ? { content: '' } : {}),
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
            matches(name, candidate, where),
          );
          if (!row) missing();
          Object.assign(row, data, { updatedAt: new Date() });
          return row;
        }),
        delete: vi.fn(async ({ where }: Query) => {
          const row = [...stores[name].values()].find((candidate) =>
            matches(name, candidate, where),
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
          [...stores.author.values()].find((row) =>
            matches('author', row, where),
          ) ?? null,
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

  async function hierarchy() {
    const authorization = await token();
    let path = '/api/v1/projects';
    const levels: { name: Entity; path: string; id: string }[] = [];
    for (const name of names) {
      const response = await request(app.getHttpServer())
        .post(path)
        .set('Authorization', authorization)
        .send({ title: `  ${name} title  ` })
        .expect(201);
      expect(response.body.title).toBe(`${name} title`);
      expect(response.body.createdAt).toEqual(expect.any(String));
      levels.push({ name, path, id: response.body.id });
      const next = names[names.indexOf(name) + 1];
      if (next) path += `/${response.body.id}/${next}s`;
    }
    return levels;
  }

  it('creates, lists, reads, edits and deletes every level', async () => {
    const levels = await hierarchy();
    const authorization = await token();
    for (const { name, path, id } of levels) {
      const list = await request(app.getHttpServer())
        .get(path)
        .set('Authorization', authorization)
        .expect(200);
      expect(
        name === 'project' || name === 'scene' ? list.body.items : list.body,
      ).toHaveLength(1);
      await request(app.getHttpServer())
        .get(`${path}/${id}`)
        .set('Authorization', authorization)
        .expect(200);
      const updated = await request(app.getHttpServer())
        .patch(`${path}/${id}`)
        .set('Authorization', authorization)
        .send({ title: 'Changed', description: 'Summary' })
        .expect(200);
      expect(updated.body).toMatchObject({
        title: 'Changed',
        description: 'Summary',
      });
      const cleared = await request(app.getHttpServer())
        .patch(`${path}/${id}`)
        .set('Authorization', authorization)
        .send({ description: null })
        .expect(200);
      expect(cleared.body.description).toBeNull();
      if (name === 'scene') {
        const content = '  Once upon a time…\n\nمرحبا  ';
        const saved = await request(app.getHttpServer())
          .patch(`${path}/${id}`)
          .set('Authorization', authorization)
          .send({ content })
          .expect(200);
        expect(saved.body.content).toBe(content);
      }
    }
    for (const { path, id } of levels.reverse()) {
      await request(app.getHttpServer())
        .delete(`${path}/${id}`)
        .set('Authorization', authorization)
        .expect(204);
      await request(app.getHttpServer())
        .get(`${path}/${id}`)
        .set('Authorization', authorization)
        .expect(404);
    }
  });

  it.each(['bob', 'admin'])(
    'isolates all content from %s, including writes',
    async (otherUser) => {
      const levels = await hierarchy();
      const authorization = await token(otherUser);
      const projects = await request(app.getHttpServer())
        .get('/api/v1/projects')
        .set('Authorization', authorization)
        .expect(200);
      expect(projects.body).toEqual({ items: [], nextOffset: null });
      for (const { name, path, id } of levels) {
        await request(app.getHttpServer())
          .get(`${path}/${id}`)
          .set('Authorization', authorization)
          .expect(404);
        await request(app.getHttpServer())
          .patch(`${path}/${id}`)
          .set('Authorization', authorization)
          .send({ title: 'Stolen' })
          .expect(404);
        await request(app.getHttpServer())
          .delete(`${path}/${id}`)
          .set('Authorization', authorization)
          .expect(404);
        if (name !== 'project') {
          await request(app.getHttpServer())
            .get(path)
            .set('Authorization', authorization)
            .expect(404);
          await request(app.getHttpServer())
            .post(path)
            .set('Authorization', authorization)
            .send({ title: 'Intruder' })
            .expect(404);
        }
      }
      expect(stores.scene.size).toBe(1);
      expect(stores.project.values().next().value?.title).toBe('project title');
    },
  );

  it('rejects mismatched ancestors on every nested operation', async () => {
    const levels = await hierarchy();
    const authorization = await token();
    for (const { path, id } of levels.slice(1)) {
      const wrongPath = path.replace(levels[0].id, 'missing-project');
      await request(app.getHttpServer())
        .get(wrongPath)
        .set('Authorization', authorization)
        .expect(404);
      await request(app.getHttpServer())
        .post(wrongPath)
        .set('Authorization', authorization)
        .send({ title: 'Wrong parent' })
        .expect(404);
      await request(app.getHttpServer())
        .get(`${wrongPath}/${id}`)
        .set('Authorization', authorization)
        .expect(404);
      await request(app.getHttpServer())
        .patch(`${wrongPath}/${id}`)
        .set('Authorization', authorization)
        .send({ title: 'Wrong parent' })
        .expect(404);
      await request(app.getHttpServer())
        .delete(`${wrongPath}/${id}`)
        .set('Authorization', authorization)
        .expect(404);
    }
  });

  it('validates all hierarchy DTOs and rejects reassignment or ownership fields', async () => {
    const levels = await hierarchy();
    const authorization = await token();
    for (const { name, path, id } of levels) {
      for (const invalid of [
        {},
        { title: '  ' },
        { title: null },
        { title: 42 },
        { title: 'x'.repeat(201) },
        { title: 'Valid', authorId: 'bob-profile' },
      ]) {
        await request(app.getHttpServer())
          .post(path)
          .set('Authorization', authorization)
          .send(invalid)
          .expect(400);
      }
      for (const invalid of [
        { title: null },
        { title: '' },
        { description: 12 },
        { description: 'x'.repeat(10001) },
        { projectId: 'other' },
      ]) {
        await request(app.getHttpServer())
          .patch(`${path}/${id}`)
          .set('Authorization', authorization)
          .send(invalid)
          .expect(400);
      }
      if (name !== 'project') {
        for (const position of [-1, 1.5, '1', null, 2147483648]) {
          await request(app.getHttpServer())
            .patch(`${path}/${id}`)
            .set('Authorization', authorization)
            .send({ position })
            .expect(400);
        }
      }
      if (name === 'scene') {
        await request(app.getHttpServer())
          .patch(`${path}/${id}`)
          .set('Authorization', authorization)
          .send({ content: null })
          .expect(400);
      }
    }
  });

  it('orders children by editable position with stable ties', async () => {
    const levels = await hierarchy();
    const authorization = await token();
    for (const { name, path, id } of levels.slice(1)) {
      await request(app.getHttpServer())
        .patch(`${path}/${id}`)
        .set('Authorization', authorization)
        .send({ position: 5 })
        .expect(200);
      const earlier = await request(app.getHttpServer())
        .post(path)
        .set('Authorization', authorization)
        .send({ title: 'Earlier', position: 1 })
        .expect(201);
      const list = await request(app.getHttpServer())
        .get(path)
        .set('Authorization', authorization)
        .expect(200);
      expect(
        (name === 'scene' ? list.body.items : list.body).map(
          (row: Row) => row.id,
        ),
      ).toEqual([earlier.body.id, id]);
    }
  });

  it('requires authentication on all routes and does not invent legacy profiles', async () => {
    const levels = await hierarchy();
    for (const { path, id } of levels) {
      await request(app.getHttpServer()).get(path).expect(401);
      await request(app.getHttpServer())
        .post(path)
        .send({ title: 'No token' })
        .expect(401);
      await request(app.getHttpServer()).get(`${path}/${id}`).expect(401);
      await request(app.getHttpServer())
        .patch(`${path}/${id}`)
        .send({ title: 'No token' })
        .expect(401);
      await request(app.getHttpServer()).delete(`${path}/${id}`).expect(401);
    }
    await request(app.getHttpServer())
      .post('/api/v1/projects')
      .set('Authorization', await token('legacy'))
      .send({ title: 'Legacy' })
      .expect(403);
    expect(stores.author.size).toBe(3);
  });

  it('allows browser preflight for editing and deleting', async () => {
    const response = await request(app.getHttpServer())
      .options('/api/v1/projects/example')
      .set('Origin', 'https://allowed.example')
      .set('Access-Control-Request-Method', 'PATCH')
      .expect(204);
    expect(response.headers['access-control-allow-methods']).toContain('PATCH');
    expect(response.headers['access-control-allow-methods']).toContain(
      'DELETE',
    );
  });
});
