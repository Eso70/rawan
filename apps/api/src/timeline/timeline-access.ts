import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@rawan/database';
import type { WorldEntityReference } from '@rawan/types';
import { requireWorldEntity } from '../worldbuilding/world-entity-access.js';
import { PrismaService } from '../database/prisma.service.js';
import { isTransactionWriteConflict } from '../database/transaction-errors.js';

export function validateRange(
  start: string | Prisma.Decimal | null | undefined,
  end: string | Prisma.Decimal | null | undefined,
): void {
  if (start != null && end != null && new Prisma.Decimal(start).gt(end))
    throw new BadRequestException('end must be greater than or equal to start');
}
export { entityFields } from '../worldbuilding/world-entity-access.js';
@Injectable()
export class TimelineAccess {
  constructor(private readonly prisma: PrismaService) {}
  async persist<T>(operation: () => Promise<T>): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002')
          throw new ConflictException(
            'Entity is already attached to this event',
          );
        if (['P2003', 'P2025'].includes(error.code))
          throw new NotFoundException('Timeline resource not found');
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
      'Timeline changed concurrently; retry the operation',
    );
  }
  async project(
    userId: string,
    id: string,
    db: Prisma.TransactionClient = this.prisma,
  ) {
    const record = await db.project.findFirst({
      where: { id, author: { userId } },
      select: { id: true },
    });
    if (!record) throw new NotFoundException('Project not found');
    return record;
  }
  async timeline(
    userId: string,
    id: string,
    db: Prisma.TransactionClient = this.prisma,
  ) {
    const record = await db.timeline.findFirst({
      where: { id, project: { author: { userId } } },
    });
    if (!record) throw new NotFoundException('Timeline not found');
    return record;
  }
  async era(
    userId: string,
    id: string,
    db: Prisma.TransactionClient = this.prisma,
  ) {
    const record = await db.era.findFirst({
      where: { id, timeline: { project: { author: { userId } } } },
    });
    if (!record) throw new NotFoundException('Era not found');
    return record;
  }
  async event(
    userId: string,
    id: string,
    db: Prisma.TransactionClient = this.prisma,
  ) {
    const record = await db.timelineEvent.findFirst({
      where: { id, timeline: { project: { author: { userId } } } },
    });
    if (!record) throw new NotFoundException('Event not found');
    return record;
  }
  async eraInTimeline(
    userId: string,
    timelineId: string,
    eraId: string,
    db: Prisma.TransactionClient = this.prisma,
  ) {
    const record = await db.era.findFirst({
      where: {
        id: eraId,
        timelineId,
        timeline: { project: { author: { userId } } },
      },
      select: { id: true },
    });
    if (!record) throw new NotFoundException('Era not found in this timeline');
  }
  async entity(
    userId: string,
    projectId: string,
    entity: WorldEntityReference,
    db: Prisma.TransactionClient = this.prisma,
  ) {
    await requireWorldEntity(db, userId, projectId, entity);
  }
}
