import { describe, expect, it } from "vitest";
import { bounded, validateQueueConfig } from "./queue-config.js";
describe("Queue configuration", () => {
  it("allows disabled development queues and isolates the default namespace", () => {
    expect(validateQueueConfig({ NODE_ENV: "test" })).toEqual({
      redisUrl: undefined,
      prefix: "rawan-test",
      cleanupIntervalMs: 60000,
    });
  });
  it.each([
    "redis://localhost:6379/0",
    "rediss://user:secret@redis.example:6380/15",
  ])("accepts %s", (redisUrl) => {
    expect(validateQueueConfig({ REDIS_URL: redisUrl }, true).redisUrl).toBe(
      redisUrl,
    );
  });
  it.each([
    "http://localhost",
    "redis://localhost:99999",
    "redis://localhost/-1",
    "redis://localhost/16",
    "redis://localhost/path",
    "redis://localhost?password=secret",
    " redis://localhost",
    123,
  ])("rejects invalid URL %#", (REDIS_URL) => {
    expect(() => validateQueueConfig({ REDIS_URL })).toThrow("REDIS_URL");
  });
  it("requires Redis for workers and production", () => {
    expect(() => validateQueueConfig({}, true)).toThrow("required");
    expect(() => validateQueueConfig({ NODE_ENV: "production" })).toThrow(
      "required",
    );
  });
  it.each(["bull:", "X", "../test", "a", "a".repeat(81)])(
    "rejects namespace %s",
    (QUEUE_PREFIX) =>
      expect(() => validateQueueConfig({ QUEUE_PREFIX })).toThrow(
        "QUEUE_PREFIX",
      ),
  );
  it.each([0, "-1", "1.5", true, 3600001])(
    "bounds reconciliation interval %#",
    (MEDIA_CLEANUP_INTERVAL_MS) =>
      expect(() => validateQueueConfig({ MEDIA_CLEANUP_INTERVAL_MS })).toThrow(
        "MEDIA_CLEANUP_INTERVAL_MS",
      ),
  );
  it("does not disclose invalid credentials", () => {
    expect(() =>
      validateQueueConfig({ REDIS_URL: "http://secret-user:secret-pass@host" }),
    ).toThrow(/^REDIS_URL must/);
  });
  it("bounds offline operations", async () => {
    await expect(bounded(new Promise(() => {}), 10)).rejects.toThrow(
      "Operation unavailable",
    );
  });
});
