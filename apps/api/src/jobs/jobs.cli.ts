import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module.js';
import { JobsService } from './jobs.service.js';
import { bounded } from '@rawan/backend';

async function main() {
  const [action, id] = process.argv.slice(2);
  if (action !== 'enqueue' && action !== 'status') {
    console.error('Use enqueue --confirm or status <job UUID>');
    process.exitCode = 1;
    return;
  }
  if (action === 'enqueue' && !process.argv.includes('--confirm')) {
    console.error('Pass --confirm to enqueue stale media cleanup');
    process.exitCode = 1;
    return;
  }
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: false,
  });
  try {
    const jobs = app.get(JobsService);
    // The producer connects asynchronously. Operator commands allow a bounded initial connection window.
    await bounded(
      (async () => {
        for (let i = 0; i < 20; i++) {
          try {
            await jobs.readiness();
            return;
          } catch {
            await new Promise((resolve) => setTimeout(resolve, 100));
          }
        }
        throw Error('Unavailable');
      })(),
    );
    if (action === 'enqueue')
      console.log(JSON.stringify(await jobs.enqueueCleanup()));
    else {
      if (!id) throw Error('Missing job ID');
      console.log(JSON.stringify(await jobs.status(id)));
    }
  } finally {
    await app.close();
  }
}
main().catch(() => {
  console.error(
    'Background queue operation failed; check validated configuration and queue readiness',
  );
  process.exitCode = 1;
});
