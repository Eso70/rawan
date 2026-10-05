import { fileURLToPath } from "node:url";
import {
  integerSetting,
  validateAiConfig,
  validateQueueConfig,
  validateStorageConfig,
} from "@rawan/backend";
export function validateWorkerEnvironment(input: Record<string, unknown>) {
  const queues = validateQueueConfig(input, true);
  const databaseUrl = input.DATABASE_URL;
  let databaseSchema = "public";
  try {
    if (typeof databaseUrl !== "string") throw Error();
    const url = new URL(databaseUrl);
    databaseSchema = url.searchParams.get("schema") ?? "public";
    if (!/^[a-zA-Z_][a-zA-Z0-9_]{0,62}$/.test(databaseSchema)) throw Error();
    if (
      !["postgres:", "postgresql:"].includes(url.protocol) ||
      !url.hostname ||
      url.pathname.length < 2
    )
      throw Error();
  } catch {
    throw Error("DATABASE_URL must be a PostgreSQL URL with a database name");
  }
  const storage = validateStorageConfig(
    input,
    fileURLToPath(new URL("../../../api/", import.meta.url)),
  );
  return {
    ...queues,
    databaseUrl: databaseUrl as string,
    databaseSchema,
    storage,
    ai: validateAiConfig(input),
    concurrency: integerSetting(
      input.WORKER_CONCURRENCY,
      2,
      1,
      10,
      "WORKER_CONCURRENCY",
    ),
  };
}
