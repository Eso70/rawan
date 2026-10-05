import { ConfigService } from '@nestjs/config';
import request from 'supertest';
import { createContractApplication } from '../../dist/contracts/openapi.cli.js';
import { configureApp } from '../../dist/config/configure-app.js';
import { RequestBudget } from './http-security.js';
import { httpSecurity } from './http-security.js';
import { Logger } from '@nestjs/common';
import type { Request, Response } from 'express';
import { passwordWork } from './password-work.js';

describe('bounded abuse defenses', () => {
  it('logs only generated correlation and failure metadata, never request content or raw paths', () => {
    const error = vi.fn();
    let finished!: () => void;
    const req = {
      method: 'POST',
      path: '/api/v1/private-secret',
      headers: { authorization: 'Bearer private-jwt' },
      body: { password: 'private-password', manuscript: 'private-story' },
    } as unknown as Request;
    const res = {
      statusCode: 500,
      setHeader: vi.fn(),
      once: vi.fn((_event: string, callback: () => void) => {
        finished = callback;
      }),
    } as unknown as Response;
    const next = vi.fn();
    httpSecurity(false, { error } as unknown as Logger)(req, res, next);
    finished();
    expect(next).toHaveBeenCalledOnce();
    expect(error).toHaveBeenCalledWith({
      event: 'HTTP_FAILURE',
      requestId: expect.any(String),
      method: 'POST',
      status: 500,
      durationMs: expect.any(Number),
    });
    expect(JSON.stringify(error.mock.calls)).not.toContain('private');
  });
  it('expires windows without evicting active budgets or growing beyond capacity', () => {
    let now = 0;
    const budget = new RequestBudget(2, () => now);
    expect(budget.consume('a', 1)).toBe(0);
    expect(budget.consume('a', 1)).toBe(60);
    expect(budget.consume('b', 1)).toBe(0);
    expect(budget.consume('c', 1)).toBe(60);
    now = 60000;
    expect(budget.consume('c', 1)).toBe(0);
    expect(budget.consume('a', 1)).toBe(0);
  });
  it('caps concurrent native password work and recovers slots after failure', async () => {
    let release!: () => void;
    const block = new Promise<void>((resolve) => {
      release = resolve;
    });
    const first = passwordWork(() => block);
    const second = passwordWork(() => block);
    await expect(passwordWork(async () => 'denied')).rejects.toMatchObject({
      status: 429,
    });
    release();
    await Promise.all([first, second]);
    await expect(
      passwordWork(async () => {
        throw Error('failure');
      }),
    ).rejects.toThrow('failure');
    expect(await passwordWork(async () => 'recovered')).toBe('recovered');
  });
  it('enforces real HTTP throttling even with spoofed forwarding headers', async () => {
    const app = await createContractApplication();
    app.get(ConfigService).set('HTTP_RATE_LIMIT_ENABLED', true);
    configureApp(app);
    await app.listen(0, '127.0.0.1');
    try {
      for (let n = 0; n < 10; n++)
        await request(app.getHttpServer())
          .post(n % 2 ? '/api/v1/auth/register/' : '/api/v1/auth/register')
          .set('X-Forwarded-For', `192.0.2.${n}`)
          .send({})
          .expect(400);
      const limited = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({})
        .expect(429);
      expect(limited.body).toMatchObject({
        code: 'RATE_LIMITED',
        statusCode: 429,
      });
      expect(Number(limited.headers['retry-after'])).toBeGreaterThan(0);
      await request(app.getHttpServer()).get('/api/v1/health').expect(200);
    } finally {
      await app.close();
    }
  });
  it('normalizes parser failures, limits bytes, rejects compression and generates server IDs', async () => {
    const app = await createContractApplication();
    app.get(ConfigService).set('HTTP_RATE_LIMIT_ENABLED', false);
    configureApp(app);
    await app.listen(0, '127.0.0.1');
    try {
      const malformed = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .set('Content-Type', 'application/json')
        .send('{"private":"SECRET",')
        .expect(400);
      expect(malformed.body.code).toBe('BAD_REQUEST');
      expect(JSON.stringify(malformed.body)).not.toContain('SECRET');
      const large = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({ data: 'x'.repeat(1048576) })
        .expect(413);
      expect(large.body.code).toBe('PAYLOAD_TOO_LARGE');
      const encoded = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .set('Content-Type', 'application/json')
        .set('Content-Encoding', 'gzip')
        .send('{}')
        .expect(415);
      expect(encoded.body.code).toBe('UNSUPPORTED_MEDIA_TYPE');
      const health = await request(app.getHttpServer())
        .get('/api/v1/health')
        .set('X-Request-Id', 'attacker-secret')
        .expect(200);
      expect(health.headers['x-request-id']).toMatch(/^[a-f0-9-]{36}$/);
      expect(health.headers['x-request-id']).not.toBe('attacker-secret');
      expect(health.headers['x-content-type-options']).toBe('nosniff');
    } finally {
      await app.close();
    }
  });
});
