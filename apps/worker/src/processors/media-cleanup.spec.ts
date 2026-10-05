import { randomUUID } from "node:crypto";
import { describe, it, expect, vi } from "vitest";
import {
  UnrecoverableError,
  type CleanupRepository,
  type StorageProvider,
} from "@rawan/backend";
import type { MediaCleanup } from "@rawan/database";
import { mediaCleanupProcessor } from "./media-cleanup.js";
function fixture() {
  const records: MediaCleanup[] = [
    {
      id: randomUUID(),
      projectId: "project",
      ownerUserId: "owner",
      storageProvider: "local",
      storageKey: randomUUID(),
      createdAt: new Date(Date.now() - 7200000),
    },
  ];
  const objects = new Set(records.map((row) => row.storageKey));
  const repository = {
    stale: vi.fn(async () => [...records]),
    live: vi.fn(async () => false),
    remove: vi.fn(async (record: MediaCleanup) => {
      const index = records.findIndex((row) => row.id === record.id);
      if (index < 0) return 0;
      records.splice(index, 1);
      return 1;
    }),
  } satisfies CleanupRepository;
  const storage = {
    id: "local",
    put: vi.fn(),
    read: vi.fn(),
    delete: vi.fn(async (key: string) => {
      objects.delete(key);
    }),
  } satisfies StorageProvider;
  return {
    records,
    objects,
    repository,
    storage,
    process: mediaCleanupProcessor(repository, storage),
  };
}
describe("Real cleanup processor policy", () => {
  it("deletes objects before removing the durable intent and is safe to repeat", async () => {
    const f = fixture();
    expect(await f.process()).toEqual({ removed: 1 });
    expect(await f.process()).toEqual({ removed: 0 });
    expect(f.objects.size).toBe(0);
    expect(f.records).toEqual([]);
  });
  it("clears an intent whose object was already removed", async () => {
    const f = fixture();
    f.objects.clear();
    expect(await f.process()).toEqual({ removed: 1 });
  });
  it("bounds stale records and excludes fresh upload intents", async () => {
    const f = fixture();
    await f.process();
    expect(f.repository.stale).toHaveBeenCalledWith(expect.any(Date), 100);
  });
  it("retains intent and uses safe transient errors when storage fails", async () => {
    const f = fixture();
    f.storage.delete = vi.fn(async () => {
      throw Error("private/path/password");
    });
    await expect(f.process()).rejects.toThrow("temporarily unavailable");
    expect(f.records).toHaveLength(1);
    expect(f.repository.remove).not.toHaveBeenCalled();
  });
  it("can safely retry after deletion succeeded but DB removal failed", async () => {
    const f = fixture();
    const remove = f.repository.remove;
    f.repository.remove = vi.fn(async () => {
      throw Error("DB offline");
    });
    await expect(f.process()).rejects.toThrow("temporarily unavailable");
    expect(f.objects.size).toBe(0);
    expect(f.records).toHaveLength(1);
    f.repository.remove = remove;
    expect(await f.process()).toEqual({ removed: 1 });
  });
  it.each(["../escape", "C:\\escape", "not-a-key"])(
    "permanently rejects unsafe DB key %s",
    async (key) => {
      const f = fixture();
      f.records[0].storageKey = key;
      await expect(f.process()).rejects.toBeInstanceOf(UnrecoverableError);
      expect(f.storage.delete).not.toHaveBeenCalled();
    },
  );
  it("does not delete an active Media object", async () => {
    const f = fixture();
    f.repository.live = vi.fn(async () => true);
    await expect(f.process()).rejects.toBeInstanceOf(UnrecoverableError);
    expect(f.storage.delete).not.toHaveBeenCalled();
  });
  it("does not send keys for an unavailable provider to local storage", async () => {
    const f = fixture();
    f.records[0].storageProvider = "remote";
    await expect(f.process()).rejects.toBeInstanceOf(UnrecoverableError);
    expect(f.storage.delete).not.toHaveBeenCalled();
  });
  it("processes safe records even if a different record is malformed", async () => {
    const f = fixture();
    f.records.unshift({
      ...f.records[0],
      id: randomUUID(),
      storageKey: "../bad",
    });
    await expect(f.process()).rejects.toBeInstanceOf(UnrecoverableError);
    expect(f.records).toHaveLength(1);
    expect(f.objects.size).toBe(0);
  });
});
