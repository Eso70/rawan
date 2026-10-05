import {
  Redis,
  Worker,
  UnrecoverableError,
  bounded,
  type Job,
  type QueueConfig,
} from "@rawan/backend";
import {
  MAINTENANCE_QUEUE,
  MEDIA_CLEANUP_JOB,
  parseMaintenanceJob,
  type MediaCleanupPayload,
  type MediaCleanupResult,
  type MaintenanceJobName,
} from "@rawan/types/jobs";
export type WorkerLog = (entry: Record<string, unknown>) => void;
export type CleanupProcessor = () => Promise<MediaCleanupResult>;
export function createMaintenanceWorker(
  config: QueueConfig & { concurrency: number },
  processor: CleanupProcessor,
  log: WorkerLog,
  fatal: () => void = () => {},
) {
  if (!config.redisUrl) throw Error("REDIS_URL is required");
  const connection = new Redis(config.redisUrl, {
    maxRetriesPerRequest: null,
    connectTimeout: 3000,
    retryStrategy: (attempt) => Math.min(attempt * 250, 5000),
  });
  connection.on("error", () =>
    log({ event: "WORKER_REDIS_ERROR", queue: MAINTENANCE_QUEUE }),
  );
  const worker = new Worker<
    MediaCleanupPayload,
    MediaCleanupResult,
    MaintenanceJobName
  >(
    MAINTENANCE_QUEUE,
    async (job) => {
      const started = Date.now();
      const context = {
        jobId: job.id,
        jobType:
          job.name === MEDIA_CLEANUP_JOB ? MEDIA_CLEANUP_JOB : "unsupported",
        queue: MAINTENANCE_QUEUE,
        attempt: job.attemptsMade + 1,
      };
      log({ ...context, event: "JOB_RUNNING" });
      try {
        parseMaintenanceJob(job.name, job.data);
      } catch {
        throw new UnrecoverableError("Invalid maintenance payload");
      }
      const result = await processor();
      log({
        ...context,
        event: "JOB_EXECUTED",
        durationMs: Date.now() - started,
      });
      return result;
    },
    {
      connection,
      prefix: config.prefix,
      concurrency: config.concurrency,
      autorun: false,
      maxStalledCount: 1,
      lockDuration: 30000,
    },
  );
  const context = (
    job?: Job<MediaCleanupPayload, MediaCleanupResult, MaintenanceJobName>,
  ) => ({
    jobId: job?.id,
    queue: MAINTENANCE_QUEUE,
    attempt: job?.attemptsMade,
  });
  worker.on("completed", (job) =>
    log({ ...context(job), event: "JOB_COMPLETED" }),
  );
  worker.on("failed", (job) =>
    log({ ...context(job), event: "JOB_FAILED", code: "CLEANUP_FAILED" }),
  );
  worker.on("stalled", (id) =>
    log({ jobId: id, queue: MAINTENANCE_QUEUE, event: "JOB_STALLED" }),
  );
  worker.on("error", () =>
    log({ event: "WORKER_QUEUE_ERROR", queue: MAINTENANCE_QUEUE }),
  );
  let closing: Promise<void> | undefined;
  return {
    worker,
    connection,
    async start() {
      await bounded(worker.waitUntilReady(), 10000);
      void worker.run().catch(() => {
        log({ event: "WORKER_RUN_FAILED", queue: MAINTENANCE_QUEUE });
        fatal();
      });
      log({
        event: "WORKER_READY",
        queue: MAINTENANCE_QUEUE,
        concurrency: config.concurrency,
      });
    },
    close() {
      closing ??= (async () => {
        try {
          await bounded(worker.close(), 30000);
        } catch {
          log({ event: "WORKER_SHUTDOWN_TIMEOUT", queue: MAINTENANCE_QUEUE });
          await bounded(worker.disconnect(), 3000).catch(() => {
            log({ event: "WORKER_FORCE_CLOSE_FAILED" });
          });
        } finally {
          connection.disconnect();
        }
        log({ event: "WORKER_CLOSED", queue: MAINTENANCE_QUEUE });
      })();
      return closing;
    },
  };
}
