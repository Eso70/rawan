import { randomUUID } from "node:crypto";
import { Redis } from "ioredis";
import { Queue, type DefaultJobOptions } from "bullmq";
import {
  MAINTENANCE_QUEUE,
  MEDIA_CLEANUP_JOB,
  MEDIA_CLEANUP_SCHEDULER,
  type MediaCleanupPayload,
  type MediaCleanupResult,
  type MaintenanceJobName,
} from "@rawan/types/jobs";
import { bounded, type QueueConfig } from "./queue-config.js";

export const MAINTENANCE_JOB_OPTIONS: DefaultJobOptions = {
  attempts: 3,
  backoff: { type: "exponential", delay: 1000 },
  removeOnComplete: { age: 86400, count: 500 },
  removeOnFail: { age: 604800, count: 1000 },
  keepLogs: 10,
};
export class QueueUnavailable extends Error {
  constructor() {
    super("Background queue unavailable");
  }
}
export type MaintenanceQueueType = Queue<
  MediaCleanupPayload,
  MediaCleanupResult,
  MaintenanceJobName
>;

export class MaintenanceQueue {
  readonly connection: Redis;
  private queue?: MaintenanceQueueType;
  private closing = false;
  constructor(
    private readonly config: QueueConfig,
    private readonly log: (event: string) => void = () => {},
  ) {
    if (!config.redisUrl) throw new QueueUnavailable();
    this.connection = new Redis(config.redisUrl, {
      maxRetriesPerRequest: 1,
      enableOfflineQueue: false,
      connectTimeout: 2000,
      commandTimeout: 2000,
      retryStrategy: (attempt) => Math.min(attempt * 250, 5000),
    });
    this.connection.on("error", () => log("QUEUE_CONNECTION_ERROR"));
  }
  private async ready(): Promise<MaintenanceQueueType> {
    if (this.closing || this.connection.status !== "ready")
      throw new QueueUnavailable();
    if (!this.queue) {
      this.queue = new Queue<
        MediaCleanupPayload,
        MediaCleanupResult,
        MaintenanceJobName
      >(MAINTENANCE_QUEUE, {
        connection: this.connection,
        prefix: this.config.prefix,
        defaultJobOptions: MAINTENANCE_JOB_OPTIONS,
        streams: { events: { maxLen: 1000 } },
      });
      this.queue.on("error", () => this.log("QUEUE_OPERATION_ERROR"));
    }
    try {
      await bounded(this.queue.waitUntilReady());
      return this.queue;
    } catch {
      throw new QueueUnavailable();
    }
  }
  async enqueueCleanup(): Promise<{ id: string }> {
    try {
      const queue = await this.ready();
      const id = randomUUID();
      await bounded(
        queue.add(MEDIA_CLEANUP_JOB, { version: 1 }, { jobId: id }),
      );
      return { id };
    } catch {
      throw new QueueUnavailable();
    }
  }
  async registerCleanupSchedule(): Promise<void> {
    try {
      const queue = await this.ready();
      await bounded(
        queue.upsertJobScheduler(
          MEDIA_CLEANUP_SCHEDULER,
          { every: this.config.cleanupIntervalMs },
          {
            name: MEDIA_CLEANUP_JOB,
            data: { version: 1 },
            opts: MAINTENANCE_JOB_OPTIONS,
          },
        ),
      );
    } catch {
      throw new QueueUnavailable();
    }
  }
  async health(): Promise<boolean> {
    try {
      const queue = await this.ready();
      await bounded(this.connection.ping());
      return !queue.closing;
    } catch {
      return false;
    }
  }
  async status(id: string) {
    if (
      !/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/.test(
        id,
      )
    )
      throw new Error("Invalid job ID");
    try {
      const queue = await this.ready();
      let job = await bounded(queue.getJob(id));
      if (!job) return null;
      const state = await bounded(job.getState());
      // A job can finish between the two reads. Refresh terminal result/attempt metadata.
      if (state === "completed" || state === "failed") {
        job = await bounded(queue.getJob(id));
        if (!job) return null;
      }
      const status =
        state === "active"
          ? "RUNNING"
          : state === "completed"
            ? "COMPLETED"
            : state === "failed"
              ? "FAILED"
              : "QUEUED";
      return {
        id,
        type: "MEDIA_CLEANUP",
        status,
        attempts: job.attemptsMade,
        error:
          state === "failed"
            ? {
                code: "CLEANUP_FAILED",
                message:
                  "Media cleanup failed; pending records remain available for reconciliation",
              }
            : null,
        result:
          state === "completed" && typeof job.returnvalue?.removed === "number"
            ? { removed: job.returnvalue.removed }
            : null,
      };
    } catch {
      throw new QueueUnavailable();
    }
  }
  async close(): Promise<void> {
    if (this.closing) return;
    this.closing = true;
    try {
      if (this.queue) await bounded(this.queue.close(), 2000);
      if (this.connection.status === "ready")
        await bounded(this.connection.quit(), 2000);
    } finally {
      this.connection.disconnect();
    }
  }
}
