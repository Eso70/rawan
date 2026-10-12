import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@rawan/database';
import type { ApiWork, ApiWorkSource } from '@rawan/types';
import { PrismaService } from '../database/prisma.service.js';
import { ProjectQueryDto, PaginationQueryDto } from '../query/query.dto.js';
import { contains, page, pagination, sorting } from '../query/query.js';
import { AddWorkSourceDto, CreateWorkDto, UpdateWorkDto } from './works.dto.js';

const workSelect = {
  id: true,
  title: true,
  description: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.WorkSelect;
const sourceSelect = {
  id: true,
  workId: true,
  projectId: true,
  bookId: true,
  createdAt: true,
} satisfies Prisma.WorkSourceSelect;
type WorkRow = Prisma.WorkGetPayload<{ select: typeof workSelect }>;
type SourceRow = Prisma.WorkSourceGetPayload<{ select: typeof sourceSelect }>;
const workResponse = (row: WorkRow): ApiWork => ({
  ...row,
  createdAt: row.createdAt.toISOString(),
  updatedAt: row.updatedAt.toISOString(),
});
const sourceResponse = (row: SourceRow): ApiWorkSource => ({
  ...row,
  createdAt: row.createdAt.toISOString(),
});

@Injectable()
export class WorksService {
  constructor(private readonly prisma: PrismaService) {}

  private async persist<T>(operation: () => Promise<T>): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002')
          throw new ConflictException(
            'Manuscript is already linked to this work',
          );
        if (['P2025', 'P2003'].includes(error.code))
          throw new NotFoundException('Work or manuscript not found');
      }
      throw error;
    }
  }

  private async owned(
    db: Prisma.TransactionClient,
    userId: string,
    id: string,
  ) {
    const row = await db.work.findFirst({
      where: { id, ownerUserId: userId },
      select: workSelect,
    });
    if (!row) throw new NotFoundException('Work not found');
    return row;
  }

  async list(userId: string, query: ProjectQueryDto) {
    const rows = await this.prisma.work.findMany({
      where: {
        ownerUserId: userId,
        ...(query.q
          ? {
              OR: [
                { title: contains(query.q) },
                { description: contains(query.q) },
              ],
            }
          : {}),
      },
      select: workSelect,
      orderBy: sorting<Prisma.WorkOrderByWithRelationInput>(
        query,
        {
          title: (order) => ({ title: order }),
          createdAt: (order) => ({ createdAt: order }),
          updatedAt: (order) => ({ updatedAt: order }),
        },
        [{ createdAt: 'desc' }, { id: 'asc' }],
        'createdAt',
        'desc',
      ),
      ...pagination(query),
    });
    return page(rows, query, workResponse);
  }

  async read(userId: string, id: string) {
    return workResponse(await this.owned(this.prisma, userId, id));
  }

  async create(userId: string, dto: CreateWorkDto) {
    return this.persist(async () =>
      workResponse(
        await this.prisma.work.create({
          data: {
            ownerUserId: userId,
            title: dto.title,
            description: dto.description,
          },
          select: workSelect,
        }),
      ),
    );
  }

  async update(userId: string, id: string, dto: UpdateWorkDto) {
    return this.persist(async () =>
      workResponse(
        await this.prisma.work.update({
          where: { id, ownerUserId: userId },
          data: { title: dto.title, description: dto.description },
          select: workSelect,
        }),
      ),
    );
  }

  async remove(userId: string, id: string) {
    await this.persist(() =>
      this.prisma.work.delete({
        where: { id, ownerUserId: userId },
        select: { id: true },
      }),
    );
  }

  async sources(userId: string, id: string, query: PaginationQueryDto) {
    await this.owned(this.prisma, userId, id);
    const rows = await this.prisma.workSource.findMany({
      where: {
        workId: id,
        work: { ownerUserId: userId },
        book: { project: { author: { userId } } },
      },
      select: sourceSelect,
      orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
      ...pagination(query),
    });
    return page(rows, query, sourceResponse);
  }

  async addSource(userId: string, workId: string, dto: AddWorkSourceDto) {
    return this.persist(() =>
      this.prisma.$transaction(async (tx) => {
        await this.owned(tx, userId, workId);
        const book = await tx.book.findFirst({
          where: {
            id: dto.bookId,
            projectId: dto.projectId,
            project: { author: { userId } },
          },
          select: { id: true },
        });
        if (!book) throw new NotFoundException('Manuscript not found');
        return sourceResponse(
          await tx.workSource.create({
            data: { workId, projectId: dto.projectId, bookId: dto.bookId },
            select: sourceSelect,
          }),
        );
      }),
    );
  }

  async removeSource(userId: string, workId: string, id: string) {
    await this.persist(() =>
      this.prisma.workSource.delete({
        where: {
          id,
          workId,
          work: { ownerUserId: userId },
          book: { project: { author: { userId } } },
        },
        select: { id: true },
      }),
    );
  }
}
