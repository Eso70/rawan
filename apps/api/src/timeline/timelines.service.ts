import { arrayPagination } from '../query/query.js';
import { PaginationQueryDto } from '../query/query.dto.js';
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import { TimelineAccess } from './timeline-access.js';
import { CreateTimelineDto, UpdateTimelineDto } from './timeline.dto.js';
import { timelineResponse } from './timeline-response.js';
@Injectable()
export class TimelinesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly access: TimelineAccess,
  ) {}
  async list(
    userId: string,
    projectId: string,
    query: PaginationQueryDto = {},
  ) {
    await this.access.project(userId, projectId);
    return (
      await this.prisma.timeline.findMany({
        where: { projectId, project: { author: { userId } } },
        ...arrayPagination(query),
        orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
      })
    ).map(timelineResponse);
  }
  async read(userId: string, id: string) {
    return timelineResponse(await this.access.timeline(userId, id));
  }
  async create(userId: string, projectId: string, dto: CreateTimelineDto) {
    return this.access.persist(async () =>
      timelineResponse(
        await this.prisma.timeline.create({
          data: {
            name: dto.name,
            description: dto.description,
            project: { connect: { id: projectId, author: { userId } } },
          },
        }),
      ),
    );
  }
  async update(userId: string, id: string, dto: UpdateTimelineDto) {
    return this.access.persist(async () =>
      timelineResponse(
        await this.prisma.timeline.update({
          where: { id, project: { author: { userId } } },
          data: dto,
        }),
      ),
    );
  }
  async delete(userId: string, id: string): Promise<void> {
    await this.access.persist(() =>
      this.prisma.timeline.delete({
        where: { id, project: { author: { userId } } },
      }),
    );
  }
}
