import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@rawan/database';
import { PrismaService } from '../database/prisma.service.js';
import { isTransactionWriteConflict } from '../database/transaction-errors.js';
export const organizationOwner = (userId: string) => ({
  project: { author: { userId } },
});
@Injectable()
export class OrganizationAccess {
  constructor(private readonly prisma: PrismaService) {}
  async persist<T>(operation: () => Promise<T>): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002')
          throw new ConflictException('Tag or assignment already exists');
        if (['P2003', 'P2025'].includes(error.code))
          throw new NotFoundException('Organization resource not found');
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
      'Organization changed concurrently; retry the operation',
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
  async note(
    userId: string,
    id: string,
    db: Prisma.TransactionClient = this.prisma,
  ) {
    const row = await db.note.findFirst({
      where: { id, ...organizationOwner(userId) },
    });
    if (!row) throw new NotFoundException('Note not found');
    return row;
  }
  async tag(
    userId: string,
    id: string,
    projectId?: string,
    db: Prisma.TransactionClient = this.prisma,
  ) {
    const row = await db.tag.findFirst({
      where: { id, projectId, ...organizationOwner(userId) },
    });
    if (!row) throw new NotFoundException('Tag not found in this project');
    return row;
  }
}
