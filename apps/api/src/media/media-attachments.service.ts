import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { Prisma } from '@rawan/database';
import type { MediaResourceKind } from '@rawan/types';
import { PrismaService } from '../database/prisma.service.js';
import { page, pagination } from '../query/query.js';
import { PaginationQueryDto } from '../query/query.dto.js';
import { requireWorldEntity } from '../worldbuilding/world-entity-access.js';
import { AttachMediaDto, MediaResourceQueryDto } from './media.dto.js';
import { mediaOwner, mediaPersist, lockMediaProject } from './media-access.js';
import { attachmentResponse } from './media-response.js';
import { MediaService } from './media.service.js';
const fields = {
  PROJECT: 'projectId',
  NOTE: 'noteId',
  CHARACTER: 'characterId',
  PLACE: 'placeId',
  FACTION: 'factionId',
  ARTIFACT: 'artifactId',
} as const;
export function attachmentWhere(
  kind: MediaResourceKind,
  id: string,
): Prisma.MediaAttachmentWhereInput {
  if (!Object.hasOwn(fields, kind))
    throw new BadRequestException('Unsupported media resource kind');
  return { resourceKind: kind, [fields[kind]]: id };
}
async function resolveResource(
  db: Prisma.TransactionClient,
  userId: string,
  projectId: string,
  kind: MediaResourceKind,
  id: string,
) {
  attachmentWhere(kind, id);
  const data = {
    resourceKind: kind,
    noteId: kind === 'NOTE' ? id : null,
    characterId: kind === 'CHARACTER' ? id : null,
    placeId: kind === 'PLACE' ? id : null,
    factionId: kind === 'FACTION' ? id : null,
    artifactId: kind === 'ARTIFACT' ? id : null,
  };
  if (kind === 'PROJECT') {
    if (id !== projectId) throw new NotFoundException('Project not found');
  } else if (kind === 'NOTE') {
    if (
      !(await db.note.findFirst({
        where: { id, projectId, ...mediaOwner(userId) },
        select: { id: true },
      }))
    )
      throw new NotFoundException('Note not found in this project');
  } else await requireWorldEntity(db, userId, projectId, { kind, id });
  return data;
}
@Injectable()
export class MediaAttachmentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly media: MediaService,
  ) {}
  async attach(userId: string, mediaId: string, dto: AttachMediaDto) {
    const media = await this.media.owned(userId, mediaId);
    return mediaPersist(() =>
      this.prisma.$transaction(async (tx) => {
        await lockMediaProject(tx, userId, media.projectId);
        const target = await resolveResource(
          tx,
          userId,
          media.projectId,
          dto.resourceKind,
          dto.resourceId,
        );
        return attachmentResponse(
          await tx.mediaAttachment.create({
            data: {
              projectId: media.projectId,
              mediaId,
              ...target,
              role: dto.role,
            },
            include: { media: true },
          }),
        );
      }),
    );
  }
  async list(userId: string, mediaId: string, query: PaginationQueryDto) {
    const media = await this.media.owned(userId, mediaId);
    const rows = await this.prisma.mediaAttachment.findMany({
      where: { mediaId, projectId: media.projectId, media: mediaOwner(userId) },
      include: { media: true },
      orderBy: { id: 'asc' },
      ...pagination(query),
    });
    return page(rows, query, attachmentResponse);
  }
  async forResource(
    userId: string,
    projectId: string,
    query: MediaResourceQueryDto,
  ) {
    await this.media.project(userId, projectId);
    await resolveResource(
      this.prisma,
      userId,
      projectId,
      query.resourceKind,
      query.resourceId,
    );
    const rows = await this.prisma.mediaAttachment.findMany({
      where: {
        projectId,
        ...attachmentWhere(query.resourceKind, query.resourceId),
        media: mediaOwner(userId),
      },
      include: { media: true },
      orderBy: { id: 'asc' },
      ...pagination(query),
    });
    return page(rows, query, attachmentResponse);
  }
  async remove(userId: string, mediaId: string, id: string): Promise<void> {
    await mediaPersist(() =>
      this.prisma.mediaAttachment.delete({
        where: { id, mediaId, media: mediaOwner(userId) },
      }),
    );
  }
}
