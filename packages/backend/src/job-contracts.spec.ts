import { describe, expect, it } from "vitest";
import { parseMaintenanceJob, MEDIA_CLEANUP_JOB } from "@rawan/types/jobs";
describe("Internal job contracts", () => {
  it("accepts the exact versioned cleanup contract", () =>
    expect(parseMaintenanceJob(MEDIA_CLEANUP_JOB, { version: 1 })).toEqual({
      version: 1,
    }));
  it.each([
    null,
    [],
    {},
    { version: 2 },
    { version: "1" },
    { version: 1, storageKey: "../../escape" },
    { version: 1, projectId: "untrusted" },
  ])("rejects invalid payload %#", (data) =>
    expect(() => parseMaintenanceJob(MEDIA_CLEANUP_JOB, data)).toThrow(
      "Unsupported maintenance",
    ),
  );
  it("rejects an arbitrary job name", () =>
    expect(() => parseMaintenanceJob("execute", { version: 1 })).toThrow());
});
