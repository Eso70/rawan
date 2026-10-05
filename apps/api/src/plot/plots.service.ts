import type { Prisma } from '@rawan/database';
import { contains, page, pagination, sorting } from '../query/query.js';
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import { PlotAccess, nextPosition, owner } from './plot-access.js';
import { CreatePlotDto, UpdatePlotDto, PlotPageQueryDto } from './plot.dto.js';
import { plotResponse, plotSelect, plotSummary } from './plot-response.js';
@Injectable()
export class PlotsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly access: PlotAccess,
  ) {}
  async list(userId: string, projectId: string, query: PlotPageQueryDto) {
    await this.access.project(userId, projectId);

    const rows = await this.prisma.plot.findMany({
      where: {
        projectId,
        ...owner(userId),
        ...(query.q
          ? {
              OR: [
                { title: contains(query.q) },
                { description: contains(query.q) },
              ],
            }
          : {}),
      },
      select: plotSelect,
      orderBy: sorting<Prisma.PlotOrderByWithRelationInput>(
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
    return page(rows, query, plotSummary);
  }
  async read(userId: string, id: string) {
    return plotResponse(await this.access.plot(userId, id));
  }
  async create(userId: string, projectId: string, dto: CreatePlotDto) {
    return this.access.transaction(async (tx) => {
      await this.access.project(userId, projectId, tx);
      const position =
        dto.position ??
        nextPosition(
          (
            await tx.plot.aggregate({
              where: { projectId },
              _max: { position: true },
            })
          )._max.position,
        );
      return plotResponse(
        await tx.plot.create({
          data: {
            projectId,
            title: dto.title,
            description: dto.description,
            category: dto.category,
            position,
          },
        }),
      );
    });
  }
  async update(userId: string, id: string, dto: UpdatePlotDto) {
    return this.access.persist(async () =>
      plotResponse(
        await this.prisma.plot.update({
          where: { id, ...owner(userId) },
          data: dto,
        }),
      ),
    );
  }
  async delete(userId: string, id: string): Promise<void> {
    await this.access.persist(() =>
      this.prisma.plot.delete({ where: { id, ...owner(userId) } }),
    );
  }
}
