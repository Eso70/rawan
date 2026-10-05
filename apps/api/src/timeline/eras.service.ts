import { arrayPagination } from '../query/query.js';
import { PaginationQueryDto } from '../query/query.dto.js';
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import { TimelineAccess, validateRange } from './timeline-access.js';
import { CreateEraDto, UpdateEraDto } from './timeline.dto.js';
import { eraResponse } from './timeline-response.js';
@Injectable()
export class ErasService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly access: TimelineAccess,
  ) {}
  async list(
    userId: string,
    timelineId: string,
    query: PaginationQueryDto = {},
  ) {
    await this.access.timeline(userId, timelineId);
    return (
      await this.prisma.era.findMany({
        where: { timelineId, timeline: { project: { author: { userId } } } },
        ...arrayPagination(query),
        orderBy: [{ position: 'asc' }, { id: 'asc' }],
      })
    ).map(eraResponse);
  }
  async read(userId: string, id: string) {
    return eraResponse(await this.access.era(userId, id));
  }
  async create(userId: string, timelineId: string, dto: CreateEraDto) {
    validateRange(dto.start, dto.end);
    return this.access.persist(async () =>
      eraResponse(
        await this.prisma.era.create({
          data: {
            name: dto.name,
            description: dto.description,
            position: dto.position,
            start: dto.start,
            end: dto.end,
            timeline: {
              connect: { id: timelineId, project: { author: { userId } } },
            },
          },
        }),
      ),
    );
  }
  async update(userId: string, id: string, dto: UpdateEraDto) {
    return this.access.transaction(async (tx) => {
      const current = await this.access.era(userId, id, tx);
      validateRange(
        dto.start === undefined ? current.start : dto.start,
        dto.end === undefined ? current.end : dto.end,
      );
      return eraResponse(
        await tx.era.update({
          where: { id, timeline: { project: { author: { userId } } } },
          data: dto,
        }),
      );
    });
  }
  async delete(userId: string, id: string): Promise<void> {
    await this.access.transaction(async (tx) => {
      const era = await this.access.era(userId, id, tx);
      await tx.timelineEvent.updateMany({
        where: {
          eraId: id,
          timelineId: era.timelineId,
          timeline: { project: { author: { userId } } },
        },
        data: { eraId: null },
      });
      await tx.era.delete({
        where: { id, timeline: { project: { author: { userId } } } },
      });
    });
  }
}
