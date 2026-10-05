import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@rawan/database';
import { PrismaService } from '../database/prisma.service.js';
import { isTransactionWriteConflict } from '../database/transaction-errors.js';

export const owner = (userId: string) => ({ project: { author: { userId } } });
export function nextPosition(max: number | null): number {
  if (max === 2147483647)
    throw new ConflictException(
      'Position limit reached; reorder or supply an explicit position',
    );
  return max === null ? 0 : max + 1;
}
@Injectable()
export class PlotAccess {
  constructor(private readonly prisma: PrismaService) {}
  async persist<T>(operation: () => Promise<T>): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002')
          throw new ConflictException('Association already exists');
        if (['P2003', 'P2025'].includes(error.code))
          throw new NotFoundException('Plot resource not found');
      }
      throw error;
    }
  }
  async transaction<T>(
    operation: (tx: Prisma.TransactionClient) => Promise<T>,
  ): Promise<T> {
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        return await this.persist(() =>
          this.prisma.$transaction(operation, {
            isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
          }),
        );
      } catch (error) {
        if (!isTransactionWriteConflict(error)) throw error;
      }
    }
    throw new ConflictException(
      'Plot changed concurrently; retry the operation',
    );
  }
  async project(
    userId: string,
    id: string,
    db: Prisma.TransactionClient = this.prisma,
  ) {
    const row = await db.project.findFirst({
      where: { id, author: { userId } },
      select: { id: true },
    });
    if (!row) throw new NotFoundException('Project not found');
    return row;
  }
  async plot(
    userId: string,
    id: string,
    db: Prisma.TransactionClient = this.prisma,
  ) {
    const row = await db.plot.findFirst({ where: { id, ...owner(userId) } });
    if (!row) throw new NotFoundException('Plot not found');
    return row;
  }
  async point(
    userId: string,
    id: string,
    db: Prisma.TransactionClient = this.prisma,
  ) {
    const row = await db.plotPoint.findFirst({
      where: { id, plot: owner(userId) },
      select: { id: true, projectId: true, plotId: true },
    });
    if (!row) throw new NotFoundException('Plot point not found');
    return row;
  }
}
