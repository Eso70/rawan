import 'reflect-metadata';
import { Test } from '@nestjs/testing';
import type { INestApplication } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import request from 'supertest';
import type { Prisma } from '@rawan/database';

describe('search HTTP validation and public contract', () => {
  let app: INestApplication;
  let token: string;
  const keys = [
    'NODE_ENV',
    'DATABASE_URL',
    'JWT_SECRET',
    'CORS_ORIGINS',
    'REDIS_URL',
    'MEDIA_CLEANUP_SCHEDULE_ENABLED',
  ];
  const original = Object.fromEntries(
    keys.map((key) => [key, process.env[key]]),
  );
  const queryRaw = vi.fn(async (_query: Prisma.Sql) => [
    {
      kind: 'NOTE',
      id: 'note',
      projectId: 'owned',
      title: 'Dragon',
      snippet: 'Bounded text',
      updatedAt: new Date('2026-01-01'),
      internal: 'hidden',
    },
  ]);
  const findProject = vi.fn(
    async ({ where }: { where: { id: string; author: { userId: string } } }) =>
      where.id === 'owned' && where.author.userId === 'alice'
        ? { id: 'owned' }
        : null,
  );
  beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    process.env.REDIS_URL = '';
    process.env.MEDIA_CLEANUP_SCHEDULE_ENABLED = 'false';
    process.env.DATABASE_URL =
      'postgresql://unused:unused@localhost:5432/unused';
    process.env.JWT_SECRET = 'search-http-secret-at-least-32-characters';
    process.env.CORS_ORIGINS = '';
    const { AppModule } = await import('../dist/app.module.js');
    const { PrismaService } =
      await import('../dist/database/prisma.service.js');
    const { configureApp } = await import('../dist/config/configure-app.js');
    const module = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(PrismaService)
      .useValue({
        project: { findFirst: findProject },
        $queryRaw: queryRaw,
        user: {
          findUnique: async () => ({
            id: 'alice',
            email: 'private@example.invalid',
            role: 'AUTHOR',
            password: 'private-hash',
          }),
        },
      })
      .compile();
    app = module.createNestApplication({ logger: false });
    configureApp(app);
    await app.listen(0, '127.0.0.1');
    token = 'Bearer ' + (await app.get(JwtService).signAsync({ sub: 'alice' }));
  });
  beforeEach(() => vi.clearAllMocks());
  afterAll(async () => {
    if (app) await app.close();
    for (const key of keys) {
      if (original[key] === undefined) delete process.env[key];
      else process.env[key] = original[key];
    }
  });
  it('uses the real guard and returns only the search contract', async () => {
    const result = await request(app.getHttpServer())
      .get(
        '/api/v1/projects/owned/search?q=%20dragon%20&kind=NOTE&limit=1&offset=3',
      )
      .set('Authorization', token)
      .expect(200);
    expect(result.body).toEqual({
      items: [
        {
          kind: 'NOTE',
          id: 'note',
          projectId: 'owned',
          title: 'Dragon',
          snippet: 'Bounded text',
          updatedAt: '2026-01-01T00:00:00.000Z',
        },
      ],
      nextOffset: null,
    });
    const [sql] = queryRaw.mock.calls[0];
    expect(sql.values).toContain('dragon');
    expect(sql.values.slice(-2)).toEqual([2, 3]);
    expect(sql.text).not.toContain('"Scene"');
  });
  it('requires authentication before querying', async () => {
    await request(app.getHttpServer())
      .get('/api/v1/projects/owned/search?q=dragon')
      .expect(401);
    expect(queryRaw).not.toHaveBeenCalled();
  });
  it('hides database error details from clients', async () => {
    queryRaw.mockRejectedValueOnce(
      new Error('private SQL table and credentials'),
    );
    const result = await request(app.getHttpServer())
      .get('/api/v1/projects/owned/search?q=dragon')
      .set('Authorization', token)
      .expect(500);
    expect(result.body).toEqual({
      statusCode: 500,
      message: 'Internal server error',
      code: 'INTERNAL_ERROR',
      error: 'Internal Server Error',
    });
  });
  it.each(['foreign', 'missing'])('keeps %s project private', async (id) => {
    await request(app.getHttpServer())
      .get('/api/v1/projects/' + id + '/search?q=dragon')
      .set('Authorization', token)
      .expect(404);
    expect(queryRaw).not.toHaveBeenCalled();
  });
  it.each([
    '',
    'q=',
    'q=%20',
    'q=a',
    'q=' + 'x'.repeat(201),
    'q=dragon&limit=0',
    'q=dragon&limit=-1',
    'q=dragon&limit=101',
    'q=dragon&limit=wrong',
    'q=dragon&limit=1.5',
    'q=dragon&offset=-1',
    'q=dragon&offset=1000001',
    'q=dragon&kind=USER',
    'q=dragon&kind=constructor',
    'q=dragon&kind=NOTE&kind=SCENE',
    'q=dragon&q=other',
    'q=dragon&sort=password',
    'q=dragon&authorId=alice',
    'q=%00x',
  ])('rejects %s before persistence', async (query) => {
    await request(app.getHttpServer())
      .get('/api/v1/projects/owned/search?' + query)
      .set('Authorization', token)
      .expect(400);
    expect(queryRaw).not.toHaveBeenCalled();
  });
});
