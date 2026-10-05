import { describe, it, expect, vi } from "vitest";
import type { PrismaClient } from "@rawan/database";
import { FakeAiProvider, validateAiConfig } from "@rawan/backend";
import { aiGenerationProcessor } from "./ai-generation.js";
const config = validateAiConfig({ AI_PROVIDER: "fake", NODE_ENV: "test" });
function unclaimed(
  row: { status: string; attempts: number; leaseUntil: Date | null } | null,
) {
  const updateMany = vi.fn().mockResolvedValue({ count: 0 });
  const db = {
    $queryRaw: vi.fn().mockResolvedValue([]),
    aiGeneration: { findUnique: vi.fn().mockResolvedValue(row), updateMany },
  } as unknown as PrismaClient;
  const provider = new FakeAiProvider();
  const generate = vi.spyOn(provider, "generate");
  return {
    run: aiGenerationProcessor(db, provider, config),
    generate,
    updateMany,
  };
}
describe("AI worker execution boundaries", () => {
  it.each(["COMPLETED", "FAILED"])(
    "does not invoke provider for terminal %s",
    async (status) => {
      const { run, generate, updateMany } = unclaimed({
        status,
        attempts: 1,
        leaseUntil: null,
      });
      await run("test");
      expect(generate).not.toHaveBeenCalled();
      expect(updateMany).not.toHaveBeenCalled();
    },
  );
  it("ignores a cascaded/deleted generation", async () => {
    const { run, generate } = unclaimed(null);
    await run("deleted");
    expect(generate).not.toHaveBeenCalled();
  });
  it("never overwrites or invokes provider for an active overlapping delivery", async () => {
    const { run, generate, updateMany } = unclaimed({
      status: "RUNNING",
      attempts: 1,
      leaseUntil: new Date(Date.now() + 60000),
    });
    await expect(run("overlap")).rejects.toThrow("already claimed");
    expect(generate).not.toHaveBeenCalled();
    expect(updateMany).not.toHaveBeenCalled();
  });
  it("makes exhausted expired executions fail through a conditional transition", async () => {
    const { run, generate, updateMany } = unclaimed({
      status: "RUNNING",
      attempts: 3,
      leaseUntil: new Date(0),
    });
    await expect(run("exhausted")).rejects.toThrow();
    expect(generate).not.toHaveBeenCalled();
    expect(updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          status: { in: ["QUEUED", "RUNNING"] },
        }),
        data: expect.objectContaining({
          status: "FAILED",
          errorCode: "ATTEMPTS_EXHAUSTED",
        }),
      }),
    );
  });
});
