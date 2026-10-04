import 'reflect-metadata';
import { Test } from '@nestjs/testing';
import type { INestApplication } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Prisma } from '@rawan/database';
import request from 'supertest';

type Row = Record<string, unknown>;
type Query = { where: Row; data?: Row; orderBy?: Row[] };
const names = ['project', 'character', 'place', 'faction', 'artifact'] as const;
const parentNames = {
  project: 'author',
  character: 'project',
  place: 'project',
  faction: 'project',
  artifact: 'project',
};

// Isolated persistence exercises compiled Nest routing, DTOs and real JWT guards.
// PostgreSQL cascade behavior is covered separately by the database smoke check.
describe('worldbuilding over HTTP', () => {
  let app: INestApplication;
  let jwt: JwtService;
  let sequence = 0;
  const stores: Record<string, Map<string, Row>> = Object.fromEntries(
    ['author', ...names].map((name) => [name, new Map<string, Row>()]),
  );
  const envKeys = ['NODE_ENV', 'DATABASE_URL', 'JWT_SECRET', 'CORS_ORIGINS'];
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
            matches(name, candidate, where),
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
    process.env.DATABASE_URL =
      'postgresql://unused:unused@localhost:5432/unused';
    process.env.JWT_SECRET = 'manuscript-test-secret-longer-than-32-characters';
    process.env.CORS_ORIGINS = 'http://localhost:3000';
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
    await app.init();
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

  for (const kind of ['characters', 'places', 'factions', 'artifacts']) {
    it(
      kind + ': CRUD, validation, authentication and author/admin isolation',
      async () => {
        const alice = await token();
        const project = (
          await request(app.getHttpServer())
            .post('/api/v1/projects')
            .set('Authorization', alice)
            .send({ title: 'World' })
            .expect(201)
        ).body;
        const collection = '/api/v1/projects/' + project.id + '/' + kind;
        await request(app.getHttpServer()).get(collection).expect(401);
        await request(app.getHttpServer())
          .get(collection)
          .set('Authorization', alice)
          .expect(200, []);
        for (const body of [
          { name: ' ' },
          { name: null },
          { name: 'Name', authorId: 'alice' },
          { name: 'Name', projectId: project.id },
          { name: 'Name', summary: 2 },
          { name: 'Name', description: 'x'.repeat(10001) },
        ]) {
          await request(app.getHttpServer())
            .post(collection)
            .set('Authorization', alice)
            .send(body)
            .expect(400);
        }
        const extra =
          kind === 'characters'
            ? { role: 'Protagonist', status: 'Alive' }
            : { type: 'Custom kind' };
        const entity = (
          await request(app.getHttpServer())
            .post(collection)
            .set('Authorization', alice)
            .send({
              name: '  Zed  ',
              summary: 'A summary',
              description: '  مرحبا\nWorld  ',
              ...extra,
            })
            .expect(201)
        ).body;
        expect(entity.name).toBe('Zed');
        expect(entity.projectId).toBe(project.id);
        expect(entity.description).toBe('  مرحبا\nWorld  ');
        const path = '/api/v1/' + kind + '/' + entity.id;
        for (const intruder of ['bob', 'admin']) {
          const auth = await token(intruder);
          await request(app.getHttpServer())
            .get(collection)
            .set('Authorization', auth)
            .expect(404);
          await request(app.getHttpServer())
            .post(collection)
            .set('Authorization', auth)
            .send({ name: 'Intruder' })
            .expect(404);
          await request(app.getHttpServer())
            .get(path)
            .set('Authorization', auth)
            .expect(404);
          await request(app.getHttpServer())
            .patch(path)
            .set('Authorization', auth)
            .send({ name: 'Intruder' })
            .expect(404);
          await request(app.getHttpServer())
            .delete(path)
            .set('Authorization', auth)
            .expect(404);
        }
        for (const method of ['get', 'patch', 'delete'] as const)
          await request(app.getHttpServer())[method](path).expect(401);
        await request(app.getHttpServer())
          .get(path)
          .set('Authorization', alice)
          .expect(200);
        await request(app.getHttpServer())
          .patch(path)
          .set('Authorization', alice)
          .send({ projectId: 'other' })
          .expect(400);
        const updated = await request(app.getHttpServer())
          .patch(path)
          .set('Authorization', alice)
          .send({ summary: null })
          .expect(200);
        expect(updated.body.summary).toBeNull();
        expect(updated.body.name).toBe('Zed');
        await request(app.getHttpServer())
          .post(collection)
          .set('Authorization', alice)
          .send({ name: 'Alpha' })
          .expect(201);
        const listed = await request(app.getHttpServer())
          .get(collection)
          .set('Authorization', alice)
          .expect(200);
        expect(listed.body.map((row: { name: string }) => row.name)).toEqual([
          'Alpha',
          'Zed',
        ]);
        await request(app.getHttpServer())
          .delete(path)
          .set('Authorization', alice)
          .expect(204);
        await request(app.getHttpServer())
          .get(path)
          .set('Authorization', alice)
          .expect(404);
      },
    );
  }
});
