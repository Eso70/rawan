import { closeResources } from "./close-resources.js";
import { describe, it, expect, vi } from "vitest";
describe("worker resource shutdown", () => {
  it("attempts every drain and database disconnect after a queue close failure", async () => {
    const events: string[] = [];
    await expect(
      closeResources(
        [
          async () => {
            events.push("first");
            throw Error("redis secret");
          },
          async () => {
            events.push("second");
          },
        ],
        async () => {
          events.push("database");
        },
      ),
    ).rejects.toThrow("Worker resource shutdown failed");
    expect(events).toEqual(["first", "second", "database"]);
  });
  it("closes PostgreSQL only after all running worker drains settle", async () => {
    let resolve!: () => void;
    const drain = new Promise<void>((r) => {
      resolve = r;
    });
    const disconnect = vi.fn();
    const closing = closeResources([() => drain], disconnect);
    await Promise.resolve();
    expect(disconnect).not.toHaveBeenCalled();
    resolve();
    await closing;
    expect(disconnect).toHaveBeenCalledOnce();
  });
  it("hides raw database disconnect errors", async () => {
    await expect(
      closeResources([], async () => {
        throw Error("postgresql://secret");
      }),
    ).rejects.toThrow("Worker resource shutdown failed");
  });
});
