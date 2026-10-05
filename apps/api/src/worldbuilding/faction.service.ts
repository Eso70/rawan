import { WorldQueryDto } from '../query/query.dto.js';
import {
  contains,
  page,
  pagination,
  requireTag,
  sorting,
} from '../query/query.js';
import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@rawan/database';
import type { ApiFaction } from '@rawan/types';
import { PrismaService } from '../database/prisma.service.js';
import { CreateFactionDto, UpdateFactionDto } from './faction.dto.js';

function serialize(record: {
  id: string;
  projectId: string;
  name: string;
  summary: string | null;
  description: string | null;
  type: string | null;
  createdAt: Date;
  updatedAt: Date;
}): ApiFaction {
  return {
    ...record,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}
@Injectable()
export class FactionService {
  constructor(private readonly prisma: PrismaService) {}
  private async persist<T>(operation: () => Promise<T>): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        ['P2025', 'P2003'].includes(error.code)
      )
        throw new NotFoundException('Worldbuilding resource not found');
      throw error;
    }
  }
  async list(userId: string, projectId: string, query: WorldQueryDto = {}) {
    const project = await this.prisma.project.findFirst({
      where: { id: projectId, author: { userId } },
      select: { id: true },
    });
    if (!project) throw new NotFoundException('Project not found');
    await requireTag(this.prisma, userId, projectId, query.tagId);
    const records = await this.prisma.faction.findMany({
      where: {
        projectId,
        project: { author: { userId } },
        ...(query.q
          ? {
              OR: [
                { name: contains(query.q) },
                { summary: contains(query.q) },
                { description: contains(query.q) },
              ],
            }
          : {}),
        ...(query.tagId
          ? { tagAssignments: { some: { tagId: query.tagId } } }
          : {}),
      },
      orderBy: sorting<Prisma.FactionOrderByWithRelationInput>(
        query,
        {
          name: (order) => ({ name: order }),
          createdAt: (order) => ({ createdAt: order }),
          updatedAt: (order) => ({ updatedAt: order }),
        },
        [{ name: 'asc' }, { id: 'asc' }],
        'name',
        'asc',
      ),
      ...pagination(query),
    });
    return page(records, query, serialize);
  }
  async read(userId: string, id: string): Promise<ApiFaction> {
    const record = await this.prisma.faction.findFirst({
      where: { id, project: { author: { userId } } },
    });
    if (!record)
      throw new NotFoundException('Worldbuilding resource not found');
    return serialize(record);
  }
  async create(
    userId: string,
    projectId: string,
    dto: CreateFactionDto,
  ): Promise<ApiFaction> {
    return this.persist(async () =>
      serialize(
        await this.prisma.faction.create({
          data: {
            name: dto.name,
            summary: dto.summary,
            description: dto.description,
            type: dto.type,
            project: { connect: { id: projectId, author: { userId } } },
          },
        }),
      ),
    );
  }
  async update(
    userId: string,
    id: string,
    dto: UpdateFactionDto,
  ): Promise<ApiFaction> {
    return this.persist(async () =>
      serialize(
        await this.prisma.faction.update({
          where: { id, project: { author: { userId } } },
          data: dto,
        }),
      ),
    );
  }
  async delete(userId: string, id: string): Promise<void> {
    await this.persist(() =>
      this.prisma.faction.delete({
        where: { id, project: { author: { userId } } },
      }),
    );
  }
}
