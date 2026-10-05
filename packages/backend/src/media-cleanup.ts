import type { MediaCleanup, PrismaClient } from "@rawan/database";
import type { MediaCleanupResult } from "@rawan/types/jobs";
import { bounded } from "./queue-config.js";
import type { StorageProvider } from "./storage/storage-provider.js";

export class PermanentCleanupFailure extends Error {
  constructor() {
    super("Unsafe or unsupported cleanup record");
  }
}
export class TransientCleanupFailure extends Error {
  constructor() {
    super("Media cleanup temporarily unavailable");
  }
}
export interface CleanupRepository {
  stale(before: Date, limit: number): Promise<MediaCleanup[]>;
  live(provider: string, key: string): Promise<boolean>;
  remove(record: MediaCleanup): Promise<number>;
}
export function prismaCleanupRepository(
  prisma: Pick<PrismaClient, "mediaCleanup" | "media">,
): CleanupRepository {
  return {
    stale: (before, limit) =>
      prisma.mediaCleanup.findMany({
        where: { createdAt: { lt: before } },
        orderBy: [{ createdAt: "asc" }, { id: "asc" }],
        take: limit,
      }),
    live: async (provider, key) =>
      Boolean(
        await prisma.media.findFirst({
          where: { storageProvider: provider, storageKey: key },
          select: { id: true },
        }),
      ),
    remove: async (record) =>
      (
        await prisma.mediaCleanup.deleteMany({
          where: {
            id: record.id,
            storageKey: record.storageKey,
            storageProvider: record.storageProvider,
          },
        })
      ).count,
  };
}
export async function reconcileMediaCleanup(
  repository: CleanupRepository,
  storage: StorageProvider,
): Promise<MediaCleanupResult> {
  const started = Date.now();
  const before = new Date(started - 3600000);
  let rows: MediaCleanup[];
  try {
    rows = await bounded(repository.stale(before, 100), 3000);
  } catch {
    throw new TransientCleanupFailure();
  }
  let removed = 0;
  let permanent = false;
  let transient = false;
  for (const record of rows) {
    if (Date.now() - started > 20000) {
      transient = true;
      break;
    }
    try {
      if (
        record.storageProvider !== storage.id ||
        !/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/.test(
          record.storageKey,
        ) ||
        record.createdAt >= before
      )
        throw new PermanentCleanupFailure();
      if (
        await bounded(
          repository.live(record.storageProvider, record.storageKey),
          3000,
        )
      )
        throw new PermanentCleanupFailure();
      await bounded(storage.delete(record.storageKey), 3000);
      removed += await bounded(repository.remove(record), 3000);
    } catch (error) {
      if (error instanceof PermanentCleanupFailure) permanent = true;
      else transient = true;
    }
  }
  if (transient) throw new TransientCleanupFailure();
  if (permanent) throw new PermanentCleanupFailure();
  return { removed };
}
