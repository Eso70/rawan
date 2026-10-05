import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@rawan/database";
import {
  LocalStorageProvider,
  prismaCleanupRepository,
  bounded,
  FakeAiProvider,
} from "@rawan/backend";
import { validateWorkerEnvironment } from "./config/environment.js";
import { createMaintenanceWorker } from "./queues/maintenance-worker.js";
import { mediaCleanupProcessor } from "./processors/media-cleanup.js";
import { aiGenerationProcessor } from "./processors/ai-generation.js";
import { createAiWorker } from "./queues/ai-worker.js";
import { closeResources } from "./queues/close-resources.js";

const log = (entry: Record<string, unknown>) =>
  console.log(
    JSON.stringify({
      service: "rawan-worker",
      time: new Date().toISOString(),
      ...entry,
    }),
  );
async function main() {
  if (process.env.NODE_ENV !== "production")
    dotenv.config({
      path: [
        fileURLToPath(new URL("../.env", import.meta.url)),
        fileURLToPath(new URL("../../api/.env", import.meta.url)),
      ],
      quiet: true,
    });
  const config = validateWorkerEnvironment(process.env);
  const prisma = new PrismaClient({
    adapter: new PrismaPg(
      {
        connectionString: config.databaseUrl,
        connectionTimeoutMillis: 5000,
        statement_timeout: 5000,
        max: Math.max(2, config.concurrency + config.ai.concurrency),
        options: `-c search_path=${config.databaseSchema}`,
      },
      { schema: config.databaseSchema },
    ),
  });
  const storage = new LocalStorageProvider(config.storage.localPath);
  const runtime = createMaintenanceWorker(
    config,
    mediaCleanupProcessor(prismaCleanupRepository(prisma), storage),
    log,
    () => {
      process.exitCode = 1;
      signal();
    },
  );
  let shutdown: Promise<void> | undefined;
  const aiRuntime =
    config.ai.provider === "disabled"
      ? undefined
      : createAiWorker(
          config,
          config.ai,
          prisma,
          aiGenerationProcessor(prisma, new FakeAiProvider(), config.ai),
          log,
          () => {
            process.exitCode = 1;
            signal();
          },
        );
  const close = () => {
    shutdown ??= (async () => {
      await closeResources(
        [() => runtime.close(), () => aiRuntime?.close() ?? Promise.resolve()],
        () => bounded(prisma.$disconnect(), 5000),
      );
    })();
    return shutdown;
  };
  const signal = () => {
    void close().catch(() => {
      log({ event: "WORKER_SHUTDOWN_FAILED" });
      process.exitCode = 1;
    });
  };
  process.once("SIGINT", signal);
  process.once("SIGTERM", signal);
  try {
    await bounded(prisma.$connect(), 7000);
    await runtime.start();
    await aiRuntime?.start();
  } catch {
    process.removeListener("SIGINT", signal);
    process.removeListener("SIGTERM", signal);
    await close();
    throw Error("Worker startup failed");
  }
}
main().catch(() => {
  log({
    event: "WORKER_STARTUP_FAILED",
    message: "Check database, Redis and storage configuration",
  });
  process.exitCode = 1;
});
