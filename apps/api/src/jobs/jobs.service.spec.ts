import { ConfigService } from '@nestjs/config';
import { JobsService } from './jobs.service.js';
describe('Optional API background jobs', () => {
  const service = () =>
    new JobsService(
      new ConfigService({
        MEDIA_CLEANUP_INTERVAL_MS: 60000,
        QUEUE_PREFIX: 'rawan-test',
      }),
    );
  it('reports disabled queues without requiring Redis', async () =>
    expect(await service().readiness()).toEqual({
      status: 'disabled',
      enabled: false,
    }));
  it('rejects queue-dependent work instead of pretending it was queued', async () =>
    await expect(service().enqueueCleanup()).rejects.toThrow(
      'Background queue disabled',
    ));
  it('starts and closes safely with queues disabled', async () => {
    const jobs = service();
    jobs.onApplicationBootstrap();
    await jobs.onApplicationShutdown();
  });
});
