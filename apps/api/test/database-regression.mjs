import { fileURLToPath } from 'node:url';
import './disable-queues.mjs';
import { spawnSync } from 'node:child_process';
const suites = [
  'database',
  'manuscript-database',
  'worldbuilding-database',
  'relationships-database',
  'timeline-database',
  'plot-database',
  'organization-database',
  'search-database',
  'media-database',
  'hardening-database',
];
for (const suite of suites) {
  const result = spawnSync(
    process.execPath,
    [
      fileURLToPath(
        new URL(
          suite === 'hardening-database'
            ? './hardening-database.mjs'
            : `./${suite}-smoke.mjs`,
          import.meta.url,
        ),
      ),
    ],
    { env: process.env, stdio: 'inherit' },
  );
  if (result.status !== 0) process.exit(result.status ?? 1);
}
