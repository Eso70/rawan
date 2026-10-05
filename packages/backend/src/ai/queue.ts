import { Redis } from "ioredis";
import { Queue } from "bullmq";
import {
  AI_QUEUE,
  AI_GENERATION_JOB,
  parseAiJob,
  type AiGenerationPayload,
} from "@rawan/types/jobs";
import type { PrismaClient } from "@rawan/database";
import { bounded, type QueueConfig } from "../queue-config.js";
export const AI_JOB_OPTIONS = {
  attempts: 3,
  backoff: { type: "exponential", delay: 1000 },
  removeOnComplete: { age: 86400, count: 500 },
  removeOnFail: { age: 604800, count: 1000 },
  keepLogs: 0,
};
export class AiQueue {
  readonly connection: Redis;
  private queue?: Queue<AiGenerationPayload, void, typeof AI_GENERATION_JOB>;
  private closing = false;
  constructor(
    private readonly config: QueueConfig,
    private readonly log: (event: string) => void = () => {},
  ) {
    if (!config.redisUrl) throw Error("AI queue requires Redis");
    this.connection = new Redis(config.redisUrl, {
      maxRetriesPerRequest: 1,
      enableOfflineQueue: false,
      connectTimeout: 2000,
      commandTimeout: 2000,
      retryStrategy: (n) => Math.min(n * 250, 5000),
    });
    this.connection.on("error", () => log("AI_QUEUE_CONNECTION_ERROR"));
  }
  async enqueue(id: string): Promise<void> {
    parseAiJob(AI_GENERATION_JOB, { version: 1, generationId: id });
    if (this.closing || this.connection.status !== "ready")
      throw Error("AI queue unavailable");
    this.queue ??= this.createQueue();
    const queue = this.queue;
    await bounded(queue.waitUntilReady());
    const existing = await bounded(queue.getJob(id));
    if (existing) {
      const state = await bounded(existing.getState());
      // Called only for durable pending/expired rows. Terminal Redis records must not strand them.
      if (state !== "failed" && state !== "completed") return;
      await bounded(existing.remove());
    }
    await bounded(
      queue.add(
        AI_GENERATION_JOB,
        { version: 1, generationId: id },
        { jobId: id },
      ),
    );
  }
  private createQueue() {
    const queue = new Queue<
      AiGenerationPayload,
      void,
      typeof AI_GENERATION_JOB
    >(AI_QUEUE, {
      connection: this.connection,
      prefix: this.config.prefix,
      defaultJobOptions: AI_JOB_OPTIONS,
      streams: { events: { maxLen: 1000 } },
    });
    queue.on("error", () => this.log("AI_QUEUE_ERROR"));
    return queue;
  }
  async close() {
    this.closing = true;
    try {
      if (this.queue) await bounded(this.queue.close(), 2000);
    } finally {
      this.connection.disconnect();
    }
  }
}
/** The generation row is also the publication outbox; recover Redis loss and expired execution. */
export async function publishPendingAi(
  prisma: PrismaClient,
  queue: Pick<AiQueue, "enqueue">,
) {
  const rows = await prisma.aiGeneration.findMany({
    where: {
      OR: [
        { status: "QUEUED" },
        { status: "RUNNING", leaseUntil: { lt: new Date() } },
      ],
    },
    select: { id: true },
    orderBy: [{ createdAt: "asc" }, { id: "asc" }],
    take: 20,
  });
  for (const row of rows) await queue.enqueue(row.id);
}
