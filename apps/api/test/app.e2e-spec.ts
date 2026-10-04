import 'reflect-metadata';
import { Test } from '@nestjs/testing';
import type { INestApplication } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { UserRole } from '@rawan/types';
import * as argon2 from 'argon2';
import request from 'supertest';

type RecordUser = {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  password: string | null;
  createdAt: Date;
  updatedAt: Date;
};

describe('backend foundation over HTTP (real Nest/JWT/validation, isolated persistence)', () => {
  let app: INestApplication;
  let jwt: JwtService;
  let hash: string;
  const users = new Map<string, RecordUser>();
  const profiles = new Map<string, { displayName: string }>();
  const envKeys = ['NODE_ENV', 'DATABASE_URL', 'JWT_SECRET', 'CORS_ORIGINS'];
  const originalEnv = Object.fromEntries(
    envKeys.map((key) => [key, process.env[key]]),
  );
  const prisma = {
    user: {
      findFirst: vi.fn(
        async ({ where }: { where: { email: { equals: string } } }) =>
          [...users.values()].find(
            (user) => user.email.toLowerCase() === where.email.equals,
          ) ?? null,
      ),
      findUnique: vi.fn(
        async ({ where }: { where: { id: string } }) =>
          users.get(where.id) ?? null,
      ),
      findMany: vi.fn(async () => [...users.values()]),
      create: vi.fn(
        async ({
          data,
        }: {
          data: {
            email: string;
            name: string;
            password: string;
            role: UserRole;
            author: { create: { displayName: string } };
          };
        }) => {
          const user = {
            id: 'registered-author',
            email: data.email,
            name: data.name,
            password: data.password,
            role: data.role,
            createdAt: new Date(),
            updatedAt: new Date(),
          };
          users.set(user.id, user);
          profiles.set(user.id, data.author.create);
          return user;
        },
      ),
    },
    $transaction: vi.fn(),
  };

  beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    process.env.DATABASE_URL =
      'postgresql://unused:unused@localhost:5432/unused';
    process.env.JWT_SECRET = 'test-only-secret-with-more-than-32-characters';
    process.env.CORS_ORIGINS = 'http://localhost:3000,http://localhost:3001';
    // Exercise the compiled production application: TypeScript emits Nest's DI/DTO metadata.
    const { AppModule } = await import('../dist/app.module.js');
    const { PrismaService } =
      await import('../dist/database/prisma.service.js');
    const { configureApp } = await import('../dist/config/configure-app.js');
    prisma.$transaction.mockImplementation((callback) => callback(prisma));
    const module = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(PrismaService)
      .useValue(prisma)
      .compile();
    app = module.createNestApplication();
    configureApp(app);
    await app.init();
    jwt = app.get(JwtService);
    hash = await argon2.hash('correct password', { type: argon2.argon2id });
  });

  beforeEach(() => {
    vi.clearAllMocks();
    users.clear();
    profiles.clear();
    for (const role of ['AUTHOR', 'ADMIN'] as const) {
      const id = role.toLowerCase();
      users.set(id, {
        id,
        email: `${id}@example.com`,
        name: id,
        role,
        password: hash,
        createdAt: new Date(),
        updatedAt: new Date(),
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

  const bearer = async (id: string, options = {}) => {
    const user = users.get(id)!;
    return `Bearer ${await jwt.signAsync({ sub: id, email: user.email, role: user.role }, options)}`;
  };

  it('serves public health with Helmet headers under the prefix', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/v1/health')
      .expect(200);
    expect(response.body).toEqual({ status: 'ok', service: 'rawan-api' });
    expect(response.headers['x-content-type-options']).toBe('nosniff');
    expect(response.headers['x-powered-by']).toBeUndefined();
    await request(app.getHttpServer()).get('/health').expect(404);
  });

  it('registers a normalized AUTHOR and profile, returns a working token without hashes', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({
        email: ' New@Example.com ',
        password: 'a long password',
        name: ' New Author ',
      })
      .expect(201);
    expect(response.body).toMatchObject({
      tokenType: 'Bearer',
      expiresIn: 604800,
      user: { email: 'new@example.com', name: 'New Author', role: 'AUTHOR' },
    });
    expect(response.body.user).not.toHaveProperty('password');
    expect(profiles.get(response.body.user.id)).toEqual({
      displayName: 'New Author',
    });
    expect(prisma.$transaction).toHaveBeenCalledOnce();
    expect(
      await argon2.verify(
        users.get(response.body.user.id)!.password!,
        'a long password',
      ),
    ).toBe(true);
    const me = await request(app.getHttpServer())
      .get('/api/v1/users/me')
      .set('Authorization', `Bearer ${response.body.accessToken}`)
      .expect(200);
    expect(me.body).toEqual(response.body.user);
  });

  it('rejects an existing email regardless of case with 409', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({
        email: ' AUTHOR@Example.com ',
        password: 'a long password',
        name: 'Duplicate',
      })
      .expect(409);
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it.each([
    { email: 'invalid', password: 'a long password', name: 'Author' },
    { email: 'new@example.com', password: 'short', name: 'Author' },
    { email: 'new@example.com', password: ' '.repeat(12), name: 'Author' },
    { email: 'new@example.com', password: 'a'.repeat(129), name: 'Author' },
    { email: 'new@example.com', password: 'a long password', name: '   ' },
    {
      email: 'new@example.com',
      password: 'a long password',
      name: 'a'.repeat(101),
    },
    {
      email: 'new@example.com',
      password: 'a long password',
      name: 'Author',
      role: 'ADMIN',
    },
    {
      email: 'new@example.com',
      password: 'a long password',
      name: 'Author',
      author: { create: {} },
    },
    { email: 123, password: 'a long password', name: 'Author' },
    { email: 'new@example.com', password: ['a long password'], name: 'Author' },
    {},
  ])(
    'rejects invalid or extra registration fields %# before database writes',
    async (body) => {
      await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send(body)
        .expect(400);
      expect(prisma.user.findFirst).not.toHaveBeenCalled();
      expect(prisma.$transaction).not.toHaveBeenCalled();
    },
  );

  it('normalizes login, accepts legacy shorter passwords, and returns 200', async () => {
    users.get('author')!.password = await argon2.hash('legacy', {
      type: argon2.argon2id,
    });
    const response = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: ' AUTHOR@Example.com ', password: 'legacy' })
      .expect(200);
    expect(response.body.accessToken).toEqual(expect.any(String));
    expect(response.body.user).not.toHaveProperty('password');
  });

  it('returns the same generic 401 for unknown, passwordless, and incorrect credentials', async () => {
    const responses = [];
    for (const email of [
      'unknown@example.com',
      'author@example.com',
      'admin@example.com',
    ]) {
      if (email.startsWith('admin')) users.get('admin')!.password = null;
      responses.push(
        await request(app.getHttpServer())
          .post('/api/v1/auth/login')
          .send({ email, password: 'wrong password' })
          .expect(401),
      );
    }
    expect(responses.map((response) => response.body.message)).toEqual(
      Array(3).fill('Invalid email or password'),
    );
  });

  it('validates login fields without coercing types', async () => {
    for (const body of [
      { email: 'invalid', password: 'a' },
      { email: 'author@example.com', password: 123 },
      { email: 'author@example.com', password: '' },
      { email: 'author@example.com', password: 'x', role: 'ADMIN' },
    ]) {
      await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send(body)
        .expect(400);
    }
    expect(prisma.user.findFirst).not.toHaveBeenCalled();
  });

  it.each(['/api/v1/users', '/api/v1/users/me', '/api/v1/users/author'])(
    'protects %s without a token',
    async (path) => {
      await request(app.getHttpServer()).get(path).expect(401);
    },
  );

  it('rejects malformed, expired, incorrectly signed, and unsupported-algorithm JWTs', async () => {
    const badSignature = new JwtService({
      secret: 'a-different-test-secret-with-32-characters',
    });
    const headers = [
      'Bearer invalid',
      await bearer('author', { expiresIn: -1 }),
      `Bearer ${await badSignature.signAsync({ sub: 'author' })}`,
      await bearer('author', { algorithm: 'HS384' }),
      `Bearer ${await jwt.signAsync({ sub: 123 })}`,
    ];
    for (const header of headers) {
      await request(app.getHttpServer())
        .get('/api/v1/users/me')
        .set('Authorization', header)
        .expect(401);
    }
  });

  it.each(['author', 'admin'])(
    'resolves /users/me correctly for %s',
    async (id) => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/users/me')
        .set('Authorization', await bearer(id))
        .expect(200);
      expect(response.body.id).toBe(id);
      expect(response.body).not.toHaveProperty('password');
    },
  );

  it('denies AUTHOR access to both admin routes', async () => {
    for (const path of ['/api/v1/users', '/api/v1/users/admin']) {
      await request(app.getHttpServer())
        .get(path)
        .set('Authorization', await bearer('author'))
        .expect(403);
    }
  });

  it('allows ADMIN to list and read safe users, returning 404 for unknown ids', async () => {
    const auth = await bearer('admin');
    const list = await request(app.getHttpServer())
      .get('/api/v1/users')
      .set('Authorization', auth)
      .expect(200);
    expect(list.body).toHaveLength(2);
    expect(JSON.stringify(list.body)).not.toContain('password');
    const user = await request(app.getHttpServer())
      .get('/api/v1/users/author')
      .set('Authorization', auth)
      .expect(200);
    expect(user.body.id).toBe('author');
    expect(user.body).not.toHaveProperty('password');
    await request(app.getHttpServer())
      .get('/api/v1/users/missing')
      .set('Authorization', auth)
      .expect(404);
  });

  it('revokes access immediately for deleted users and applies role changes to existing tokens', async () => {
    const authorToken = await bearer('author');
    users.delete('author');
    await request(app.getHttpServer())
      .get('/api/v1/users/me')
      .set('Authorization', authorToken)
      .expect(401);
    const adminToken = await bearer('admin');
    users.get('admin')!.role = 'AUTHOR';
    await request(app.getHttpServer())
      .get('/api/v1/users')
      .set('Authorization', adminToken)
      .expect(403);
  });

  it('allows configured CORS origins and omits CORS permission for others', async () => {
    const allowed = await request(app.getHttpServer())
      .options('/api/v1/auth/login')
      .set('Origin', 'http://localhost:3000')
      .set('Access-Control-Request-Method', 'POST')
      .set('Access-Control-Request-Headers', 'authorization,content-type')
      .expect(204);
    expect(allowed.headers['access-control-allow-origin']).toBe(
      'http://localhost:3000',
    );
    expect(allowed.headers['access-control-allow-credentials']).toBeUndefined();
    const denied = await request(app.getHttpServer())
      .get('/api/v1/health')
      .set('Origin', 'https://untrusted.example')
      .expect(200);
    expect(denied.headers['access-control-allow-origin']).toBeUndefined();
  });
});
