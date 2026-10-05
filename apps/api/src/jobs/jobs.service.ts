import {
  Injectable,
  Logger,
  ServiceUnavailableException,
  type OnApplicationBootstrap,
  type OnApplicationShutdown,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MaintenanceQueue } from '@rawan/backend';

@Injectable()
export class JobsService
  implements OnApplicationBootstrap, OnApplicationShutdown
{
  private readonly logger = new Logger(JobsService.name);
  private readonly producer?: MaintenanceQueue;
  private timer?: ReturnType<typeof setInterval>;
  private registration?: Promise<void>;
  private readonly interval: number;
  private readonly scheduleEnabled: boolean;
  private started = false;
  private scheduleRegistered = false;
  constructor(config: ConfigService) {
    this.interval = config.getOrThrow<number>('MEDIA_CLEANUP_INTERVAL_MS');
    this.scheduleEnabled =
      config.get<boolean>('MEDIA_CLEANUP_SCHEDULE_ENABLED') ?? true;
    const redisUrl = config.get<string>('REDIS_URL');
    if (redisUrl) {
      this.producer = new MaintenanceQueue(
        {
          redisUrl,
          prefix: config.getOrThrow<string>('QUEUE_PREFIX'),
          cleanupIntervalMs: this.interval,
        },
        (event) => this.logger.warn({ event }),
      );
      this.producer.connection.on('ready', () => {
        if (this.started) this.register();
      });
      this.producer.connection.on('close', () => {
        this.scheduleRegistered = false;
      });
    }
  }
  onApplicationBootstrap() {
    if (!this.producer || !this.scheduleEnabled) return;
    this.started = true;
    this.register();
    this.timer = setInterval(
      () => this.register(),
      Math.min(this.interval, 10000),
    );
    this.timer.unref();
  }
  private register() {
    if (
      this.registration ||
      !this.producer ||
      !this.started ||
      this.scheduleRegistered
    )
      return;
    this.registration = this.producer
      .registerCleanupSchedule()
      .then(() => {
        this.scheduleRegistered = true;
      })
      .catch(() => {
        this.logger.warn({ event: 'CLEANUP_SCHEDULE_UNAVAILABLE' });
      })
      .finally(() => {
        this.registration = undefined;
      });
  }
  async scheduleCleanup() {
    if (!this.producer)
      throw new ServiceUnavailableException('Background queue disabled');
    try {
      await this.producer.registerCleanupSchedule();
    } catch {
      throw new ServiceUnavailableException('Background queue unavailable');
    }
  }
  async enqueueCleanup() {
    if (!this.producer)
      throw new ServiceUnavailableException('Background queue disabled');
    try {
      return await this.producer.enqueueCleanup();
    } catch {
      throw new ServiceUnavailableException('Background queue unavailable');
    }
  }
  async status(id: string) {
    if (!this.producer)
      throw new ServiceUnavailableException('Background queue disabled');
    try {
      return await this.producer.status(id);
    } catch {
      throw new ServiceUnavailableException('Background queue unavailable');
    }
  }
  async readiness() {
    if (!this.producer) return { status: 'disabled', enabled: false };
    if (!(await this.producer.health()))
      throw new ServiceUnavailableException({
        status: 'unavailable',
        enabled: true,
      });
    return { status: 'ready', enabled: true };
  }
  async onApplicationShutdown() {
    this.started = false;
    if (this.timer) clearInterval(this.timer);
    if (this.registration) await this.registration;
    try {
      await this.producer?.close();
    } catch {
      this.logger.error({ event: 'QUEUE_SHUTDOWN_ERROR' });
    }
  }
}
