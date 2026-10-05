export interface QueueConfig {
  redisUrl?: string;
  prefix: string;
  cleanupIntervalMs: number;
}

export function integerSetting(
  value: unknown,
  fallback: number,
  min: number,
  max: number,
  name: string,
): number {
  const candidate = value ?? fallback;
  if (
    (typeof candidate !== "string" && typeof candidate !== "number") ||
    !/^\d+$/.test(String(candidate))
  )
    throw new Error(`${name} must be an integer between ${min} and ${max}`);
  const number = Number(candidate);
  if (!Number.isSafeInteger(number) || number < min || number > max)
    throw new Error(`${name} must be an integer between ${min} and ${max}`);
  return number;
}

export function validateQueueConfig(
  input: Record<string, unknown>,
  required = false,
): QueueConfig {
  const candidate = input.REDIS_URL;
  let redisUrl: string | undefined;
  if (candidate !== undefined && candidate !== "") {
    try {
      if (typeof candidate !== "string" || candidate !== candidate.trim())
        throw Error();
      const url = new URL(candidate);
      decodeURIComponent(url.username);
      decodeURIComponent(url.password);
      if (
        !["redis:", "rediss:"].includes(url.protocol) ||
        !url.hostname ||
        url.hash ||
        url.search ||
        (url.port &&
          (!/^\d+$/.test(url.port) ||
            Number(url.port) < 1 ||
            Number(url.port) > 65535)) ||
        (url.pathname &&
          url.pathname !== "/" &&
          !/^\/(?:[0-9]|1[0-5])$/.test(url.pathname))
      )
        throw Error();
      redisUrl = candidate;
    } catch {
      throw new Error(
        "REDIS_URL must be a redis:// or rediss:// connection URL with database 0–15",
      );
    }
  }
  if (!redisUrl && (required || input.NODE_ENV === "production"))
    throw new Error("REDIS_URL is required for the worker and production API");
  const env = input.NODE_ENV ?? "development";
  if (
    typeof env !== "string" ||
    !["development", "test", "production"].includes(env)
  )
    throw new Error("NODE_ENV must be development, test, or production");
  const prefix = input.QUEUE_PREFIX ?? `rawan-${env}`;
  if (typeof prefix !== "string" || !/^[a-z][a-z0-9_-]{2,79}$/.test(prefix))
    throw new Error(
      "QUEUE_PREFIX must be a lowercase application/environment namespace, 3–80 characters",
    );
  return {
    redisUrl,
    prefix,
    cleanupIntervalMs: integerSetting(
      input.MEDIA_CLEANUP_INTERVAL_MS,
      60000,
      10000,
      3600000,
      "MEDIA_CLEANUP_INTERVAL_MS",
    ),
  };
}

export async function bounded<T>(
  operation: Promise<T>,
  timeoutMs = 3000,
): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      operation,
      new Promise<never>((_resolve, reject) => {
        timer = setTimeout(
          () => reject(new Error("Operation unavailable")),
          timeoutMs,
        );
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}
