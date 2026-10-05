import {
  contains,
  page,
  pagination,
  requireTag,
  sorting,
} from '../query/query.js';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@rawan/database';
import type { ApiEventPage } from '@rawan/types';
import { PrismaService } from '../database/prisma.service.js';
import {
  TimelineAccess,
  entityFields,
  validateRange,
} from './timeline-access.js';
import {
  CreateEventDto,
  UpdateEventDto,
  EventQueryDto,
  AttachEventEntityDto,
} from './timeline.dto.js';
import {
  entityInclude,
  entityResponse,
  eventInclude,
  eventResponse,
  eventSelect,
  eventSummary,
} from './timeline-response.js';
@Injectable()
export class EventsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly access: TimelineAccess,
  ) {}
  async read(userId: string, id: string) {
    const row = await this.prisma.timelineEvent.findFirst({
      where: { id, timeline: { project: { author: { userId } } } },
      include: eventInclude,
    });
    if (!row) throw new NotFoundException('Event not found');
    return eventResponse(row);
  }
  async list(
    userId: string,
    timelineId: string,
    query: EventQueryDto,
  ): Promise<ApiEventPage> {
    const timeline = await this.access.timeline(userId, timelineId);
    await requireTag(this.prisma, userId, timeline.projectId, query.tagId);
    validateRange(query.from, query.to);
    if (!!query.entityId !== !!query.entityKind)
      throw new BadRequestException(
        'entityKind and entityId must be provided together',
      );
    if (query.eraId)
      await this.access.eraInTimeline(userId, timelineId, query.eraId);
    let entityWhere: Prisma.EventEntityWhereInput | undefined;
    if (query.entityId && query.entityKind) {
      const entity = { id: query.entityId, kind: query.entityKind };
      await this.access.entity(userId, timeline.projectId, entity);
      const fields = entityFields(entity);
      entityWhere = {
        kind: entity.kind,
        ...(entity.kind === 'CHARACTER'
          ? { characterId: fields.characterId }
          : entity.kind === 'PLACE'
            ? { placeId: fields.placeId }
            : entity.kind === 'FACTION'
              ? { factionId: fields.factionId }
              : { artifactId: fields.artifactId }),
      };
    }

    const rows = await this.prisma.timelineEvent.findMany({
      where: {
        timelineId,
        ...(query.q
          ? {
              OR: [
                { title: contains(query.q) },
                { summary: contains(query.q) },
                { description: contains(query.q) },
              ],
            }
          : {}),
        ...(query.tagId
          ? { tagAssignments: { some: { tagId: query.tagId } } }
          : {}),
        timeline: { project: { author: { userId } } },
        eraId: query.eraId,
        start: { gte: query.from, lte: query.to },
        ...(entityWhere ? { entities: { some: entityWhere } } : {}),
      },
      select: eventSelect,
      orderBy: sorting<Prisma.TimelineEventOrderByWithRelationInput>(
        query,
        {
          title: (order) => ({ title: order }),
          start: (order) => ({ start: order }),
          position: (order) => ({ position: order }),
          createdAt: (order) => ({ createdAt: order }),
          updatedAt: (order) => ({ updatedAt: order }),
        },
        [{ start: 'asc' }, { position: 'asc' }, { id: 'asc' }],
        'start',
        'asc',
      ),
      ...pagination(query),
    });
    return page(rows, query, eventSummary);
  }
  async create(userId: string, timelineId: string, dto: CreateEventDto) {
    validateRange(dto.start, dto.end);
    return this.access.transaction(async (tx) => {
      const timeline = await this.access.timeline(userId, timelineId, tx);
      if (dto.eraId)
        await this.access.eraInTimeline(userId, timelineId, dto.eraId, tx);
      return eventResponse(
        await tx.timelineEvent.create({
          data: {
            projectId: timeline.projectId,
            timelineId,
            title: dto.title,
            summary: dto.summary,
            description: dto.description,
            start: dto.start,
            end: dto.end,
            dateLabel: dto.dateLabel,
            position: dto.position,
            eraId: dto.eraId,
          },
          include: eventInclude,
        }),
      );
    });
  }
  async update(userId: string, id: string, dto: UpdateEventDto) {
    return this.access.transaction(async (tx) => {
      const current = await this.access.event(userId, id, tx);
      validateRange(
        dto.start === undefined ? current.start : dto.start,
        dto.end === undefined ? current.end : dto.end,
      );
      if (dto.eraId)
        await this.access.eraInTimeline(
          userId,
          current.timelineId,
          dto.eraId,
          tx,
        );
      return eventResponse(
        await tx.timelineEvent.update({
          where: { id, timeline: { project: { author: { userId } } } },
          data: dto,
          include: eventInclude,
        }),
      );
    });
  }
  async delete(userId: string, id: string): Promise<void> {
    await this.access.persist(() =>
      this.prisma.timelineEvent.delete({
        where: { id, timeline: { project: { author: { userId } } } },
      }),
    );
  }
  async attach(userId: string, eventId: string, dto: AttachEventEntityDto) {
    return this.access.transaction(async (tx) => {
      const event = await this.access.event(userId, eventId, tx);
      await this.access.entity(
        userId,
        event.projectId,
        { kind: dto.kind, id: dto.entityId },
        tx,
      );
      return entityResponse(
        await tx.eventEntity.create({
          data: {
            eventId,
            projectId: event.projectId,
            ...entityFields({ kind: dto.kind, id: dto.entityId }),
            role: dto.role,
          },
          include: entityInclude,
        }),
      );
    });
  }
  async detach(userId: string, eventId: string, id: string): Promise<void> {
    await this.access.persist(() =>
      this.prisma.eventEntity.delete({
        where: {
          id,
          eventId,
          event: { timeline: { project: { author: { userId } } } },
        },
      }),
    );
  }
}
