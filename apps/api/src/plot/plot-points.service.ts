import type { Prisma } from '@rawan/database';
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
import { PrismaService } from '../database/prisma.service.js';
import {
  entityFields,
  requireWorldEntity,
} from '../worldbuilding/world-entity-access.js';
import { PlotAccess, nextPosition, owner } from './plot-access.js';
import {
  CreatePlotPointDto,
  UpdatePlotPointDto,
  PlotPointQueryDto,
  ReorderPlotPointsDto,
  AttachPlotPointSceneDto,
  AttachPlotPointEventDto,
  AttachPlotPointEntityDto,
} from './plot.dto.js';
import {
  pointInclude,
  pointSelect,
  pointResponse,
  pointSummary,
  sceneInclude,
  sceneResponse,
  eventInclude,
  eventResponse,
  entityInclude,
  entityResponse,
} from './plot-response.js';
@Injectable()
export class PlotPointsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly access: PlotAccess,
  ) {}
  async list(userId: string, plotId: string, query: PlotPointQueryDto) {
    const plot = await this.access.plot(userId, plotId);
    await requireTag(this.prisma, userId, plot.projectId, query.tagId);

    const rows = await this.prisma.plotPoint.findMany({
      where: {
        plotId,
        plot: owner(userId),
        status: query.status,
        ...(query.q
          ? {
              OR: [
                { title: contains(query.q) },
                { description: contains(query.q) },
              ],
            }
          : {}),
        ...(query.tagId
          ? { tagAssignments: { some: { tagId: query.tagId } } }
          : {}),
      },
      select: pointSelect,
      orderBy: sorting<Prisma.PlotPointOrderByWithRelationInput>(
        query,
        {
          title: (order) => ({ title: order }),
          position: (order) => ({ position: order }),
          createdAt: (order) => ({ createdAt: order }),
          updatedAt: (order) => ({ updatedAt: order }),
        },
        [{ position: 'asc' }, { id: 'asc' }],
        'position',
        'asc',
      ),
      ...pagination(query),
    });
    return page(rows, query, pointSummary);
  }
  async read(userId: string, id: string) {
    const row = await this.prisma.plotPoint.findFirst({
      where: { id, plot: owner(userId) },
      include: pointInclude,
    });
    if (!row) throw new NotFoundException('Plot point not found');
    return pointResponse(row);
  }
  async create(userId: string, plotId: string, dto: CreatePlotPointDto) {
    return this.access.transaction(async (tx) => {
      const plot = await this.access.plot(userId, plotId, tx);
      const position =
        dto.position ??
        nextPosition(
          (
            await tx.plotPoint.aggregate({
              where: { plotId },
              _max: { position: true },
            })
          )._max.position,
        );
      return pointResponse(
        await tx.plotPoint.create({
          data: {
            projectId: plot.projectId,
            plotId,
            title: dto.title,
            description: dto.description,
            position,
            status: dto.status,
          },
          include: pointInclude,
        }),
      );
    });
  }
  async update(userId: string, id: string, dto: UpdatePlotPointDto) {
    return this.access.persist(async () =>
      pointResponse(
        await this.prisma.plotPoint.update({
          where: { id, plot: owner(userId) },
          data: dto,
          include: pointInclude,
        }),
      ),
    );
  }
  async delete(userId: string, id: string): Promise<void> {
    await this.access.persist(() =>
      this.prisma.plotPoint.delete({ where: { id, plot: owner(userId) } }),
    );
  }
  async reorder(userId: string, plotId: string, dto: ReorderPlotPointsDto) {
    const ids = dto.items.map((item) => item.id);
    if (
      !ids.length ||
      ids.length > 200 ||
      new Set(ids).size !== ids.length ||
      new Set(dto.items.map((item) => item.position)).size !== ids.length
    )
      throw new BadRequestException(
        'Reorder requires 1–200 distinct IDs and positions',
      );
    return this.access.transaction(async (tx) => {
      await this.access.plot(userId, plotId, tx);
      const points = await tx.plotPoint.findMany({
        where: { id: { in: ids }, plotId, plot: owner(userId) },
        select: { id: true },
      });
      if (points.length !== ids.length)
        throw new NotFoundException(
          'A plot point does not belong to this plot',
        );
      const updated = [];
      for (const item of dto.items)
        updated.push(
          await tx.plotPoint.update({
            where: { id: item.id, plotId, plot: owner(userId) },
            data: { position: item.position },
            select: pointSelect,
          }),
        );
      return updated
        .sort((a, b) => a.position - b.position || a.id.localeCompare(b.id))
        .map(pointSummary);
    });
  }
  async attachScene(
    userId: string,
    pointId: string,
    dto: AttachPlotPointSceneDto,
  ) {
    return this.access.transaction(async (tx) => {
      const point = await this.access.point(userId, pointId, tx);
      const scene = await tx.scene.findFirst({
        where: {
          id: dto.sceneId,
          chapter: { book: { projectId: point.projectId, ...owner(userId) } },
        },
        select: {
          id: true,
          chapterId: true,
          chapter: { select: { bookId: true } },
        },
      });
      if (!scene)
        throw new NotFoundException('Scene not found in this project');
      return sceneResponse(
        await tx.plotPointScene.create({
          data: {
            pointId,
            projectId: point.projectId,
            sceneId: scene.id,
            chapterId: scene.chapterId,
            bookId: scene.chapter.bookId,
          },
          include: sceneInclude,
        }),
      );
    });
  }
  async attachEvent(
    userId: string,
    pointId: string,
    dto: AttachPlotPointEventDto,
  ) {
    return this.access.transaction(async (tx) => {
      const point = await this.access.point(userId, pointId, tx);
      const event = await tx.timelineEvent.findFirst({
        where: {
          id: dto.eventId,
          projectId: point.projectId,
          timeline: owner(userId),
        },
        select: { id: true },
      });
      if (!event)
        throw new NotFoundException('Event not found in this project');
      return eventResponse(
        await tx.plotPointEvent.create({
          data: { pointId, projectId: point.projectId, eventId: event.id },
          include: eventInclude,
        }),
      );
    });
  }
  async attachEntity(
    userId: string,
    pointId: string,
    dto: AttachPlotPointEntityDto,
  ) {
    return this.access.transaction(async (tx) => {
      const point = await this.access.point(userId, pointId, tx);
      const entity = { kind: dto.kind, id: dto.entityId };
      await requireWorldEntity(tx, userId, point.projectId, entity);
      return entityResponse(
        await tx.plotPointEntity.create({
          data: {
            pointId,
            projectId: point.projectId,
            ...entityFields(entity),
            role: dto.role,
          },
          include: entityInclude,
        }),
      );
    });
  }
  async detachScene(
    userId: string,
    pointId: string,
    id: string,
  ): Promise<void> {
    await this.access.persist(() =>
      this.prisma.plotPointScene.delete({
        where: { id, pointId, point: { plot: owner(userId) } },
      }),
    );
  }
  async detachEvent(
    userId: string,
    pointId: string,
    id: string,
  ): Promise<void> {
    await this.access.persist(() =>
      this.prisma.plotPointEvent.delete({
        where: { id, pointId, point: { plot: owner(userId) } },
      }),
    );
  }
  async detachEntity(
    userId: string,
    pointId: string,
    id: string,
  ): Promise<void> {
    await this.access.persist(() =>
      this.prisma.plotPointEntity.delete({
        where: { id, pointId, point: { plot: owner(userId) } },
      }),
    );
  }
}
