import {
  Inject,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { Prisma } from '@rawan/database';
import type { MediaCleanup } from '@rawan/database';
import { PrismaService } from '../database/prisma.service.js';
import {
  STORAGE_PROVIDER,
  type StorageProvider,
} from './storage/storage-provider.js';
@Injectable()
export class MediaCleanupService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(STORAGE_PROVIDER) private readonly storage: StorageProvider,
  ) {}
  async flush(record: MediaCleanup): Promise<void> {
    try {
      if (record.storageProvider !== this.storage.id)
        throw Error('Unavailable storage provider');
      await this.storage.delete(record.storageKey);
      await this.prisma.mediaCleanup.deleteMany({
        where: { id: record.id, storageKey: record.storageKey },
      });
    } catch {
      throw new ServiceUnavailableException(
        'Media cleanup pending; retry deletion',
      );
    }
  }
  async flushProject(userId: string, projectId: string): Promise<void> {
    const rows = await this.prisma.mediaCleanup.findMany({
      where: { ownerUserId: userId, projectId },
      orderBy: { id: 'asc' },
      take: 100,
    });
    for (const row of rows) await this.flush(row);
    if (
      rows.length === 100 &&
      (await this.prisma.mediaCleanup.findFirst({
        where: { ownerUserId: userId, projectId },
        select: { id: true },
      }))
    )
      throw new ServiceUnavailableException(
        'Media cleanup pending; retry deletion',
      );
  }
  async deleteProject(userId: string, id: string): Promise<void> {
    try {
      await this.prisma.project.delete({ where: { id, author: { userId } } });
    } catch (error) {
      if (!(
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ))
        throw error;
      const pending = await this.prisma.mediaCleanup.findFirst({
        where: { projectId: id, ownerUserId: userId },
        select: { id: true },
      });
      if (!pending) throw new NotFoundException('Project not found');
    }
    await this.flushProject(userId, id);
  }
  async reconcile(): Promise<number> {
    // Operator-only maintenance skips recent upload intents still in progress.
    const rows = await this.prisma.mediaCleanup.findMany({
      where: { createdAt: { lt: new Date(Date.now() - 3600000) } },
      orderBy: { id: 'asc' },
      take: 100,
    });
    for (const row of rows) await this.flush(row);
    return rows.length;
  }
}
