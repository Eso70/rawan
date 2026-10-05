import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
describe('database test safety gate', () => {
  const helper = fileURLToPath(
    new URL('../../test/disable-queues.mjs', import.meta.url),
  );
  it('never falls back to a configured development DATABASE_URL', () => {
    const result = spawnSync(process.execPath, [helper], {
      encoding: 'utf8',
      env: {
        ...process.env,
        NODE_ENV: 'test',
        TEST_DATABASE_URL: '',
        DATABASE_URL: 'postgresql://dev:dev@localhost/development',
      },
    });
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain('never fall back');
  });
  it('rejects production before any database or application import', () => {
    const result = spawnSync(process.execPath, [helper], {
      encoding: 'utf8',
      env: { ...process.env, NODE_ENV: 'production' },
    });
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain('disabled in production');
  });
  it('rejects a remote test URL rather than connecting or trusting its name', () => {
    const result = spawnSync(process.execPath, [helper], {
      encoding: 'utf8',
      env: {
        ...process.env,
        NODE_ENV: 'test',
        TEST_DATABASE_URL: 'postgresql://test:test@example.invalid/database',
      },
    });
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain('explicit loopback');
  });
});
