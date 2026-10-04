import { validateEnvironment } from './environment.js';

const valid = {
  DATABASE_URL: 'postgresql://test:test@localhost:5432/rawan',
  JWT_SECRET: 'test-only-secret-with-more-than-32-characters',
  NODE_ENV: 'test',
};

describe('startup environment validation', () => {
  it('supports local defaults without exposing or replacing secrets', () => {
    expect(validateEnvironment(valid)).toMatchObject({
      PORT: 3002,
      CORS_ORIGINS: ['http://localhost:3000', 'http://localhost:3001'],
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
      }).CORS_ORIGINS,
    ).toEqual(['https://app.example.com', 'https://www.example.com']);
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
});
