import type { Prisma } from '@rawan/database';
import { contains, page, pagination, sorting } from '../query/query.js';
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import {
  OrganizationAccess,
  organizationOwner,
} from './organization-access.js';
import {
  CreateNoteDto,
  UpdateNoteDto,
  NoteQueryDto,
} from './organization.dto.js';
import {
  noteSelect,
  noteSummary,
  noteResponse,
} from './organization-response.js';
@Injectable()
export class NotesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly access: OrganizationAccess,
  ) {}
  async list(userId: string, projectId: string, query: NoteQueryDto) {
    await this.access.project(userId, projectId);
    if (query.tagId) await this.access.tag(userId, query.tagId, projectId);

    const rows = await this.prisma.note.findMany({
      where: {
        projectId,
        ...organizationOwner(userId),
        ...(query.q
          ? {
              OR: [
                { title: contains(query.q) },
                { content: contains(query.q) },
              ],
            }
          : {}),
        ...(query.tagId
          ? { tagAssignments: { some: { tagId: query.tagId } } }
          : {}),
      },
      select: noteSelect,
      orderBy: sorting<Prisma.NoteOrderByWithRelationInput>(
        query,
        {
          title: (order) => ({ title: order }),
          createdAt: (order) => ({ createdAt: order }),
          updatedAt: (order) => ({ updatedAt: order }),
        },
        [{ updatedAt: 'desc' }, { id: 'asc' }],
        'updatedAt',
        'desc',
      ),
      ...pagination(query),
    });
    return page(rows, query, noteSummary);
  }
  async read(userId: string, id: string) {
    return noteResponse(await this.access.note(userId, id));
  }
  async create(userId: string, projectId: string, dto: CreateNoteDto) {
    return this.access.persist(async () =>
      noteResponse(
        await this.prisma.note.create({
          data: {
            title: dto.title,
            content: dto.content,
            project: { connect: { id: projectId, author: { userId } } },
          },
        }),
      ),
    );
  }
  async update(userId: string, id: string, dto: UpdateNoteDto) {
    return this.access.persist(async () =>
      noteResponse(
        await this.prisma.note.update({
          where: { id, ...organizationOwner(userId) },
          data: dto,
        }),
      ),
    );
  }
  async delete(userId: string, id: string): Promise<void> {
    await this.access.persist(() =>
      this.prisma.note.delete({ where: { id, ...organizationOwner(userId) } }),
    );
  }
}
