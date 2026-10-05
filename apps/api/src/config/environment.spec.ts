import { validateEnvironment } from './environment.js';
import { randomBytes } from 'node:crypto';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const valid = {
  DATABASE_URL: 'postgresql://test:test@localhost:5432/rawan',
  JWT_SECRET: randomBytes(48).toString('hex'),
  NODE_ENV: 'test',
};

describe('startup environment validation', () => {
  it('supports local defaults without exposing or replacing secrets', () => {
    expect(validateEnvironment(valid)).toMatchObject({
      PORT: 3002,
      CORS_ORIGINS: [],
      JWT_SECRET: valid.JWT_SECRET,
    });
  });

  it.each([
    { DATABASE_URL: undefined },
    { DATABASE_URL: 'mysql://localhost/rawan' },
    { DATABASE_URL: 'postgresql://localhost' },
    { JWT_SECRET: undefined },
    { JWT_SECRET: 'short' },
    { JWT_SECRET: ' '.repeat(40) },
    { NODE_ENV: 'invalid' },
    { REDIS_URL: 'http://localhost:6379' },
    { QUEUE_PREFIX: '../unsafe' },
    { MEDIA_CLEANUP_INTERVAL_MS: '0' },
    { MEDIA_CLEANUP_SCHEDULE_ENABLED: 'yes' },
    { PORT: 'abc' },
    { PORT: '0' },
    { PORT: '65536' },
    { PORT: '1.5' },
    { CORS_ORIGINS: '*' },
    { CORS_ORIGINS: 'https://example.com/path' },
    { CORS_ORIGINS: 'https://*.example.com' },
    { CORS_ORIGINS: 'https://example.com,' },
  ])('rejects invalid configuration %#', (override) => {
    expect(() => validateEnvironment({ ...valid, ...override })).toThrow(
      'Invalid API environment',
    );
  });

  it('requires explicit HTTPS origins in production', () => {
    expect(() =>
      validateEnvironment({ ...valid, NODE_ENV: 'production' }),
    ).toThrow('CORS_ORIGINS');
    expect(() =>
      validateEnvironment({
        ...valid,
        NODE_ENV: 'production',
        CORS_ORIGINS: 'http://example.com',
      }),
    ).toThrow('CORS_ORIGINS');
    expect(
      validateEnvironment({
        ...valid,
        NODE_ENV: 'production',
        CORS_ORIGINS: 'https://app.example.com,https://www.example.com',
        MEDIA_LOCAL_PATH: join(tmpdir(), 'rawan-production-config-only'),
        REDIS_URL: 'redis://localhost:6379',
      }).CORS_ORIGINS,
    ).toEqual(['https://app.example.com', 'https://www.example.com']);
  });

  it('defaults documentation to development only and requires strict opt-in', () => {
    expect(
      validateEnvironment({ ...valid, NODE_ENV: 'development' })
        .OPENAPI_ENABLED,
    ).toBe(true);
    expect(
      validateEnvironment({ ...valid, NODE_ENV: 'test' }).OPENAPI_ENABLED,
    ).toBe(false);
    const production = {
      ...valid,
      NODE_ENV: 'production',
      CORS_ORIGINS: 'https://example.com',
      MEDIA_LOCAL_PATH: join(tmpdir(), 'rawan-production-config-only'),
      REDIS_URL: 'redis://localhost:6379',
    };
    expect(validateEnvironment(production).OPENAPI_ENABLED).toBe(false);
    expect(
      validateEnvironment({ ...production, OPENAPI_ENABLED: 'true' })
        .OPENAPI_ENABLED,
    ).toBe(true);
    expect(() =>
      validateEnvironment({ ...valid, OPENAPI_ENABLED: 'yes' }),
    ).toThrow('OPENAPI_ENABLED');
  });
  it('rejects weak/default production signing keys and disabled production abuse control', () => {
    const production = {
      ...valid,
      NODE_ENV: 'production',
      CORS_ORIGINS: 'https://example.com',
      MEDIA_LOCAL_PATH: join(tmpdir(), 'rawan-production-config-only'),
      REDIS_URL: 'redis://localhost:6379',
    };
    for (const secret of [
      'a'.repeat(64),
      'replace-this-with-a-long-random-secret-for-production',
      'test-only-secret-with-more-than-32-characters',
    ])
      expect(() =>
        validateEnvironment({ ...production, JWT_SECRET: secret }),
      ).toThrow('JWT_SECRET');
    expect(() =>
      validateEnvironment({ ...production, HTTP_RATE_LIMIT_ENABLED: 'false' }),
    ).toThrow('cannot be disabled');
    expect(() =>
      validateEnvironment({ ...valid, HTTP_RATE_LIMIT_ENABLED: 'yes' }),
    ).toThrow('HTTP_RATE_LIMIT_ENABLED');
    expect(validateEnvironment(production).HTTP_RATE_LIMIT_ENABLED).toBe(true);
  });
  it('trusts forwarding headers only through explicit non-global proxy addresses', () => {
    expect(validateEnvironment(valid).HTTP_TRUSTED_PROXIES).toEqual([]);
    expect(
      validateEnvironment({
        ...valid,
        HTTP_TRUSTED_PROXIES: '127.0.0.1,10.1.0.0/16',
      }).HTTP_TRUSTED_PROXIES,
    ).toEqual(['127.0.0.1', '10.1.0.0/16']);
    for (const value of [
      'true',
      '0.0.0.0/0',
      '::/0',
      '1',
      'example.com',
      '127.0.0.1/99',
    ])
      expect(() =>
        validateEnvironment({ ...valid, HTTP_TRUSTED_PROXIES: value }),
      ).toThrow('HTTP_TRUSTED_PROXIES');
  });
  it('does not include input secrets in error messages', () => {
    const secret = 'sensitive-short';
    try {
      validateEnvironment({ ...valid, JWT_SECRET: secret });
    } catch (error) {
      expect(String(error)).not.toContain(secret);
      return;
    }
    throw new Error('Expected validation failure');
  });
  it.each([
    { MEDIA_STORAGE_DRIVER: 's3' },
    { MEDIA_LOCAL_PATH: '' },
    { MEDIA_LOCAL_PATH: 'src/uploads' },
    { MEDIA_MAX_FILE_SIZE: '0' },
    { MEDIA_MAX_FILE_SIZE: '104857601' },
    { MEDIA_MAX_FILE_SIZE: '1.5' },
    { MEDIA_MAX_FILE_SIZE: 'no' },
  ])('rejects invalid media configuration %j', (override) => {
    expect(() => validateEnvironment({ ...valid, ...override })).toThrow(
      'Invalid API environment',
    );
  });
  it('requires explicit absolute production storage', () => {
    expect(() =>
      validateEnvironment({
        ...valid,
        NODE_ENV: 'production',
        CORS_ORIGINS: 'https://example.com',
      }),
    ).toThrow('MEDIA_LOCAL_PATH');
    expect(validateEnvironment(valid)).toMatchObject({
      MEDIA_MAX_FILE_SIZE: 10485760,
      MEDIA_STORAGE_DRIVER: 'local',
    });
  });
});
