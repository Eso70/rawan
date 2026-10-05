import {
  Redis,
  Worker,
  Queue,
  UnrecoverableError,
  AiQueue,
  publishPendingAi,
  bounded,
  type QueueConfig,
  type AiConfig,
} from "@rawan/backend";
import type { PrismaClient } from "@rawan/database";
import { AI_QUEUE, parseAiJob } from "@rawan/types/jobs";
import type { WorkerLog } from "./maintenance-worker.js";
export function createAiWorker(
  config: QueueConfig,
  ai: AiConfig,
  prisma: PrismaClient,
  processor: (id: string) => Promise<void>,
  log: WorkerLog,
  fatal: () => void = () => {},
) {
  if (!config.redisUrl) throw Error("Redis required");
  const connection = new Redis(config.redisUrl, {
    maxRetriesPerRequest: null,
    connectTimeout: 3000,
    retryStrategy: (n) => Math.min(n * 250, 5000),
  });
  connection.on("error", () => log({ event: "AI_REDIS_ERROR" }));
  const worker = new Worker(
    AI_QUEUE,
    async (job) => {
      let id: string;
      try {
        id = parseAiJob(job.name, job.data).generationId;
      } catch {
        throw new UnrecoverableError("Invalid AI payload");
      }
      log({
        event: "AI_RUNNING",
        generationId: id,
        attempt: job.attemptsMade + 1,
      });
      try {
        const started = Date.now();
        await processor(id);
        log({
          event: "AI_EXECUTED",
          generationId: id,
          provider: ai.provider,
          model: ai.model,
          durationMs: Date.now() - started,
        });
      } catch (error) {
        // BullMQ stores errors in Redis. Never persist raw database/provider exceptions there.
        if (error instanceof UnrecoverableError)
          throw new UnrecoverableError("AI generation failed");
        throw Error("AI generation temporarily unavailable");
      }
    },
    {
      connection,
      prefix: config.prefix,
      concurrency: ai.concurrency,
      autorun: false,
      maxStalledCount: 1,
      lockDuration: 30000,
    },
  );
  worker.on("error", () => log({ event: "AI_WORKER_ERROR" }));
  worker.on("failed", () => log({ event: "AI_JOB_FAILED" }));
  worker.on("completed", (job) =>
    log({ event: "AI_JOB_COMPLETED", generationId: job.id }),
  );
  const publisher = new AiQueue(config, (event) => log({ event }));
  const controls = new Queue(AI_QUEUE, { connection, prefix: config.prefix });
  controls.on("error", () => log({ event: "AI_QUEUE_CONTROL_ERROR" }));
  let interval: ReturnType<typeof setInterval> | undefined;
  let publishing: Promise<void> | undefined;
  let closing: Promise<void> | undefined;
  const recover = () => {
    if (publishing || closing) return;
    publishing = publishPendingAi(prisma, publisher)
      .catch(() => log({ event: "AI_RECOVERY_UNAVAILABLE" }))
      .finally(() => {
        publishing = undefined;
      });
  };
  return {
    worker,
    connection,
    async start() {
      await bounded(worker.waitUntilReady(), 10000);
      await bounded(controls.setGlobalConcurrency(ai.concurrency));
      void worker.run().catch(() => {
        log({ event: "AI_WORKER_RUN_FAILED" });
        fatal();
      });
      recover();
      interval = setInterval(recover, 10000);
      interval.unref();
      log({
        event: "WORKER_READY",
        queue: AI_QUEUE,
        concurrency: ai.concurrency,
      });
    },
    close() {
      closing ??= (async () => {
        clearInterval(interval);
        try {
          await bounded(worker.close(), ai.timeoutMs + 20000);
        } catch {
          await bounded(worker.disconnect(), 3000).catch(() =>
            log({ event: "AI_FORCE_CLOSE_FAILED" }),
          );
        } finally {
          await bounded(controls.close(), 2000).catch(() =>
            log({ event: "AI_QUEUE_CONTROL_CLOSE_FAILED" }),
          );
          connection.disconnect();
          await publishing;
          await publisher.close();
        }
        log({ event: "WORKER_CLOSED", queue: AI_QUEUE });
      })();
      return closing;
    },
  };
}
