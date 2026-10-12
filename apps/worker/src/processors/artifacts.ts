import {
  ARTIFACT_LIMIT,
  bounded,
  readBounded,
  renderArtwork,
  renderExport,
  type ExportSnapshot,
  type StorageProvider,
} from "@rawan/backend";
import { type PrismaClient } from "@rawan/database";
import { randomUUID } from "node:crypto";
import { Readable } from "node:stream";

export function artifactProcessor(db: PrismaClient, storage: StorageProvider) {
  let nextVerificationCleanup = 0;
  async function store(data: {
    assetId?: string;
    exportId?: string;
    role: string;
    bytes: Buffer;
    mimeType: string;
    width?: number;
    height?: number;
  }) {
    const id = randomUUID();
    const row = await db.artifactBlob.create({
      data: {
        id,
        storageKey: id,
        assetId: data.assetId,
        exportId: data.exportId,
        role: data.role,
        mimeType: data.mimeType,
        sizeBytes: data.bytes.length,
        width: data.width,
        height: data.height,
      },
    });
    try {
      await bounded(storage.put(id, Readable.from([data.bytes])), 30000);
    } catch (error) {
      // Keep the deletion intent even when storage fails after writing partial data.
      await db.artifactBlob.updateMany({
        where: { id },
        data: { assetId: null, exportId: null },
      });
      throw error;
    }
    return row.id;
  }
  async function artwork(id: string) {
    const token = randomUUID(),
      now = new Date();
    const where = {
      id,
      originalReady: true,
      attempts: { lt: 3 },
      OR: [
        { status: "QUEUED" as const },
        { status: "RUNNING" as const, leaseUntil: { lt: now } },
      ],
    };
    const claim = await db.workAsset.updateMany({
      where,
      data: {
        status: "RUNNING",
        leaseToken: token,
        leaseUntil: new Date(now.getTime() + 120000),
        attempts: { increment: 1 },
        errorCode: null,
      },
    });
    if (!claim.count) return;
    const fence = { id, status: "RUNNING" as const, leaseToken: token };
    const written: string[] = [];
    try {
      const original = await db.artifactBlob.findFirst({
        where: { assetId: id, role: "ORIGINAL", ready: true },
        select: { storageKey: true },
      });
      if (!original) throw Error("INVALID_ARTWORK");
      const source = await bounded(storage.read(original.storageKey), 10000);
      const output = await renderArtwork(
        await bounded(readBounded(source.stream), 10000),
      );
      for (const rendition of output)
        written.push(await store({ assetId: id, ...rendition }));
      await db.$transaction(async (tx) => {
        const finished = await tx.workAsset.updateMany({
          where: fence,
          data: { status: "COMPLETED", leaseToken: null, leaseUntil: null },
        });
        if (!finished.count) {
          await tx.artifactBlob.updateMany({
            where: { id: { in: written } },
            data: { assetId: null },
          });
          return;
        }
        await tx.artifactBlob.updateMany({
          where: {
            assetId: id,
            role: { not: "ORIGINAL" },
            id: { notIn: written },
          },
          data: { assetId: null },
        });
        await tx.artifactBlob.updateMany({
          where: { id: { in: written }, assetId: id },
          data: { ready: true },
        });
      });
    } catch {
      await db.artifactBlob.updateMany({
        where: { id: { in: written } },
        data: { assetId: null },
      });
      // Decoder failures are terminal. Owners may import a corrected file as a new version.
      await db.workAsset.updateMany({
        where: fence,
        data: {
          status: "FAILED",
          errorCode: "ARTWORK_PROCESSING_FAILED",
          leaseToken: null,
          leaseUntil: null,
        },
      });
    }
  }
  async function exportJob(id: string) {
    const token = randomUUID(),
      now = new Date();
    const claim = await db.exportJob.updateMany({
      where: {
        id,
        attempts: { lt: 3 },
        OR: [
          { status: "QUEUED" },
          { status: "RUNNING", leaseUntil: { lt: now } },
        ],
      },
      data: {
        status: "RUNNING",
        leaseToken: token,
        leaseUntil: new Date(now.getTime() + 120000),
        attempts: { increment: 1 },
        errorCode: null,
      },
    });
    if (!claim.count) return;
    const fence = { id, status: "RUNNING" as const, leaseToken: token };
    let blobId: string | undefined;
    try {
      const job = await db.exportJob.findUniqueOrThrow({ where: { id } });
      const snapshot = job.snapshot as unknown as ExportSnapshot;
      if (
        !["TXT", "HTML", "EPUB"].includes(job.format) ||
        !snapshot.sections?.length
      )
        throw Error("INVALID_EXPORT");
      const output = renderExport(
        snapshot,
        job.format as "TXT" | "HTML" | "EPUB",
        id,
      );
      if (output.bytes.length > ARTIFACT_LIMIT)
        throw Error("ARTIFACT_SIZE_LIMIT");
      blobId = await store({ exportId: id, role: "EXPORT", ...output });
      await db.$transaction(async (tx) => {
        const changed = await tx.exportJob.updateMany({
          where: fence,
          data: {
            status: "COMPLETED",
            completedAt: new Date(),
            leaseToken: null,
            leaseUntil: null,
          },
        });
        if (!changed.count) {
          await tx.artifactBlob.updateMany({
            where: { id: blobId },
            data: { exportId: null },
          });
          return;
        }
        await tx.artifactBlob.updateMany({
          where: { exportId: id, id: { not: blobId } },
          data: { exportId: null },
        });
        await tx.artifactBlob.updateMany({
          where: { id: blobId, exportId: id },
          data: { ready: true },
        });
      });
    } catch {
      if (blobId)
        await db.artifactBlob.updateMany({
          where: { id: blobId },
          data: { exportId: null },
        });
      await db.exportJob.updateMany({
        where: fence,
        data: {
          status: "FAILED",
          errorCode: "EXPORT_PROCESSING_FAILED",
          completedAt: new Date(),
          leaseToken: null,
          leaseUntil: null,
        },
      });
    }
  }
  async function tick() {
    const now = new Date();
    if (now.getTime() >= nextVerificationCleanup) {
      await db.emailSignupVerification.deleteMany({
        where: { updatedAt: { lt: new Date(now.getTime() - 86400000) } },
      });
      await db.emailDeliveryBudget.deleteMany({
        where: { day: { lt: new Date(now.getTime() - 3 * 86400000) } },
      });
      nextVerificationCleanup = now.getTime() + 3600000;
    }
    await db.workAsset.updateMany({
      where: {
        attempts: { gte: 3 },
        status: { in: ["QUEUED", "RUNNING"] },
        OR: [{ leaseUntil: null }, { leaseUntil: { lt: now } }],
      },
      data: {
        status: "FAILED",
        errorCode: "ATTEMPTS_EXHAUSTED",
        leaseToken: null,
        leaseUntil: null,
      },
    });
    await db.exportJob.updateMany({
      where: {
        attempts: { gte: 3 },
        status: { in: ["QUEUED", "RUNNING"] },
        OR: [{ leaseUntil: null }, { leaseUntil: { lt: now } }],
      },
      data: {
        status: "FAILED",
        errorCode: "ATTEMPTS_EXHAUSTED",
        completedAt: now,
        leaseToken: null,
        leaseUntil: null,
      },
    });
    await db.workAsset.deleteMany({
      where: {
        originalReady: false,
        createdAt: { lt: new Date(now.getTime() - 3600000) },
      },
    });
    const asset = await db.workAsset.findFirst({
      where: {
        originalReady: true,
        attempts: { lt: 3 },
        OR: [
          { status: "QUEUED" },
          { status: "RUNNING", leaseUntil: { lt: now } },
        ],
      },
      orderBy: [{ createdAt: "asc" }, { id: "asc" }],
      select: { id: true },
    });
    if (asset) await artwork(asset.id);
    const job = await db.exportJob.findFirst({
      where: {
        attempts: { lt: 3 },
        OR: [
          { status: "QUEUED" },
          { status: "RUNNING", leaseUntil: { lt: now } },
        ],
      },
      orderBy: [{ createdAt: "asc" }, { id: "asc" }],
      select: { id: true },
    });
    if (job) await exportJob(job.id);
    // Recover unfinished output intents left by a crash on the final attempt.
    await db.artifactBlob.updateMany({
      where: {
        ready: false,
        role: { not: "ORIGINAL" },
        asset: { status: { in: ["FAILED", "COMPLETED"] } },
      },
      data: { assetId: null },
    });
    await db.artifactBlob.updateMany({
      where: {
        ready: false,
        export: { status: { in: ["FAILED", "COMPLETED"] } },
      },
      data: { exportId: null },
    });
    const orphans = await db.artifactBlob.findMany({
      where: {
        assetId: null,
        exportId: null,
        createdAt: { lt: new Date(now.getTime() - 300000) },
      },
      take: 20,
      orderBy: { createdAt: "asc" },
    });
    for (const blob of orphans) {
      await bounded(storage.delete(blob.storageKey), 10000);
      await db.artifactBlob.deleteMany({
        where: { id: blob.id, assetId: null, exportId: null },
      });
    }
  }
  return { artwork, exportJob, tick };
}

export function createArtifactRuntime(
  db: PrismaClient,
  storage: StorageProvider,
  log: (entry: Record<string, unknown>) => void,
) {
  const processor = artifactProcessor(db, storage);
  let timer: ReturnType<typeof setTimeout> | undefined,
    running: Promise<void> = Promise.resolve(),
    stopped = true;
  const next = () => {
    if (stopped) return;
    running = processor
      .tick()
      .catch(() => log({ event: "ARTIFACT_PROCESSING_RETRY" }))
      .finally(() => {
        if (!stopped) timer = setTimeout(next, 1000);
      });
  };
  return {
    start() {
      stopped = false;
      next();
    },
    async close() {
      stopped = true;
      if (timer) clearTimeout(timer);
      await running;
    },
  };
}
