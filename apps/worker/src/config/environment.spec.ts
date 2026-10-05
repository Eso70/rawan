import { describe, expect, it } from "vitest";
import { validateWorkerEnvironment } from "./environment.js";
const valid = {
  NODE_ENV: "test",
  REDIS_URL: "redis://localhost:6379/1",
  DATABASE_URL: "postgresql://unused:unused@localhost:5432/unused",
};
describe("Worker environment", () => {
  it("uses small concurrency and the API storage root", () => {
    const config = validateWorkerEnvironment(valid);
    expect(config.concurrency).toBe(2);
    expect(config.storage.localPath.replaceAll("\\", "/")).toMatch(
      /apps\/api\/\.data\/media$/,
    );
  });
  it.each([
    { REDIS_URL: undefined },
    { DATABASE_URL: "" },
    { DATABASE_URL: "mysql://host/db" },
    { DATABASE_URL: "postgresql://host/db?schema=public%3BDROP" },
    { WORKER_CONCURRENCY: 0 },
    { WORKER_CONCURRENCY: 11 },
    { WORKER_CONCURRENCY: "2.5" },
    { WORKER_CONCURRENCY: true },
    { MEDIA_STORAGE_DRIVER: "s3" },
    { MEDIA_LOCAL_PATH: "../src/media" },
  ])("rejects unsafe input %#", (overrides) =>
    expect(() =>
      validateWorkerEnvironment({ ...valid, ...overrides }),
    ).toThrow(),
  );
  it("requires an explicit absolute durable path in production", () =>
    expect(() =>
      validateWorkerEnvironment({ ...valid, NODE_ENV: "production" }),
    ).toThrow("absolute MEDIA_LOCAL_PATH"));
});
