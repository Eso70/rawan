import { ConflictException, NotFoundException } from '@nestjs/common';
import { Prisma } from '@rawan/database';
export const mediaOwner = (userId: string) => ({
  project: { author: { userId } },
});
export async function mediaPersist<T>(operation: () => Promise<T>): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002')
        throw new ConflictException('Media attachment already exists');
      if (['P2003', 'P2025'].includes(error.code))
        throw new NotFoundException('Media resource not found');
    }
    throw error;
  }
}
// A parent lock serializes file finalization with Project deletion, without holding
// a database transaction while the network multipart upload is received.
export async function lockMediaProject(
  tx: Prisma.TransactionClient,
  userId: string,
  projectId: string,
) {
  const rows = await tx.$queryRaw<{ id: string }[]>(
    Prisma.sql`SELECT p.id FROM "Project" p JOIN "Author" a ON a.id=p."authorId" WHERE p.id=${projectId} AND a."userId"=${userId} FOR UPDATE OF p`,
  );
  if (!rows.length) throw new NotFoundException('Project not found');
}
