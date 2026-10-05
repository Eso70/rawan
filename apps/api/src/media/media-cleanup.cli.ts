import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module.js';
import { MediaCleanupService } from './media-cleanup.service.js';

// Explicit operator action, never an HTTP endpoint or automatic background job.
async function main() {
  if (!process.argv.includes('--confirm')) {
    console.error(
      'Pass --confirm to delete pending media objects older than one hour (up to 100).',
    );
    process.exitCode = 1;
    return;
  }
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: false,
  });
  try {
    const count = await app.get(MediaCleanupService).reconcile();
    console.log(
      `Cleaned ${count} pending media objects. Repeat if the batch contains 100.`,
    );
  } finally {
    await app.close();
  }
}
main().catch(() => {
  console.error(
    'Media cleanup failed; pending records are retained for retry.',
  );
  process.exitCode = 1;
});
