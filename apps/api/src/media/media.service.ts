import {
  BadRequestException,
  HttpException,
  Inject,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'node:crypto';
import type { Readable } from 'node:stream';
import { Prisma } from '@rawan/database';
import { PrismaService } from '../database/prisma.service.js';
import { contains, page, pagination, sorting } from '../query/query.js';
import { MediaQueryDto } from './media.dto.js';
import { mediaResponse } from './media-response.js';
import { lockMediaProject, mediaOwner, mediaPersist } from './media-access.js';
import { MediaCleanupService } from './media-cleanup.service.js';
import {
  STORAGE_PROVIDER,
  StorageObjectMissing,
  type StorageProvider,
} from './storage/storage-provider.js';
import { safeFilename, validatedContent } from './upload-content.js';
export interface UploadSource {
  originalFilename: string;
  mimeType: string;
  open: () => Readable;
}
@Injectable()
export class MediaService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    @Inject(STORAGE_PROVIDER) private readonly storage: StorageProvider,
    private readonly cleanup: MediaCleanupService,
  ) {}
  async project(userId: string, projectId: string) {
    const row = await this.prisma.project.findFirst({
      where: { id: projectId, author: { userId } },
      select: { id: true },
    });
    if (!row) throw new NotFoundException('Project not found');
    return row;
  }
  async owned(userId: string, id: string) {
    const row = await this.prisma.media.findFirst({
      where: { id, ...mediaOwner(userId) },
    });
    if (!row) throw new NotFoundException('Media not found');
    return row;
  }
  async list(userId: string, projectId: string, query: MediaQueryDto) {
    await this.project(userId, projectId);
    const rows = await this.prisma.media.findMany({
      where: {
        projectId,
        ...mediaOwner(userId),
        mimeType: query.mimeType,
        ...(query.q ? { originalFilename: contains(query.q) } : {}),
      },
      orderBy: sorting<Prisma.MediaOrderByWithRelationInput>(
        query,
        {
          createdAt: (order) => ({ createdAt: order }),
          originalFilename: (order) => ({ originalFilename: order }),
          sizeBytes: (order) => ({ sizeBytes: order }),
        },
        [{ createdAt: 'desc' }, { id: 'asc' }],
        'createdAt',
        'desc',
      ),
      ...pagination(query),
    });
    return page(rows, query, mediaResponse);
  }
  async read(userId: string, id: string) {
    return mediaResponse(await this.owned(userId, id));
  }
  async upload(userId: string, projectId: string, file: UploadSource) {
    await this.project(userId, projectId);
    const originalFilename = safeFilename(file.originalFilename);
    const id = randomUUID();
    const storageKey = randomUUID();
    const intent = await this.prisma.mediaCleanup.create({
      data: {
        id,
        projectId,
        ownerUserId: userId,
        storageProvider: this.storage.id,
        storageKey,
      },
    });
    try {
      const row = await this.prisma.$transaction(
        async (tx) => {
          await lockMediaProject(tx, userId, projectId);
          const checked = validatedContent(
            file.open(),
            file.mimeType,
            this.config.getOrThrow<number>('MEDIA_MAX_FILE_SIZE'),
          );
          try {
            await this.storage.put(storageKey, checked.stream);
          } finally {
            checked.stream.destroy();
          }
          const metadata = checked.metadata();
          const media = await tx.media.create({
            data: {
              id,
              projectId,
              uploadedByUserId: userId,
              storageProvider: this.storage.id,
              storageKey,
              originalFilename,
              mimeType: file.mimeType,
              ...metadata,
            },
          });
          await tx.mediaCleanup.delete({ where: { id } });
          return media;
        },
        { timeout: 30000 },
      );
      return mediaResponse(row);
    } catch (error) {
      await this.cleanup.flush(intent);
      if (error instanceof HttpException) throw error;
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        ['P2002', 'P2003', 'P2025'].includes(error.code)
      )
        await mediaPersist(async () => {
          throw error;
        });
      throw new ServiceUnavailableException('Media upload failed');
    }
  }
  async content(userId: string, id: string) {
    const row = await this.owned(userId, id);
    try {
      if (row.storageProvider !== this.storage.id)
        throw Error('Provider unavailable');
      const object = await this.storage.read(row.storageKey);
      if (object.sizeBytes !== row.sizeBytes) {
        object.stream.destroy();
        throw Error('File size mismatch');
      }
      return { media: mediaResponse(row), ...object };
    } catch (error) {
      if (error instanceof StorageObjectMissing)
        throw new NotFoundException('Media content not found');
      throw new ServiceUnavailableException('Media content unavailable');
    }
  }
  async delete(userId: string, id: string): Promise<void> {
    const row = await this.prisma.media.findFirst({
      where: { id, ...mediaOwner(userId) },
    });
    if (row) {
      await mediaPersist(() =>
        this.prisma.media.delete({ where: { id, ...mediaOwner(userId) } }),
      );
    }
    const pending = await this.prisma.mediaCleanup.findFirst({
      where: { id, ownerUserId: userId },
    });
    if (!row && !pending) throw new NotFoundException('Media not found');
    if (pending) await this.cleanup.flush(pending);
  }
  requireFile(file?: UploadSource): UploadSource {
    if (!file) throw new BadRequestException('A file is required');
    return file;
  }
}
