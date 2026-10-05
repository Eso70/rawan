import { BadRequestException, NotFoundException } from '@nestjs/common';
import type { Prisma } from '@rawan/database';
import type { ApiPage, SortOrder } from '@rawan/types';
import { DEFAULT_LIMIT, type PaginationQueryDto } from './query.dto.js';

export function pagination(query: PaginationQueryDto) {
  return { take: (query.limit ?? DEFAULT_LIMIT) + 1, skip: query.offset ?? 0 };
}
export function arrayPagination(query: PaginationQueryDto = {}) {
  return { take: query.limit ?? DEFAULT_LIMIT, skip: query.offset ?? 0 };
}
export function page<T, R>(
  rows: T[],
  query: PaginationQueryDto,
  map: (row: T) => R,
): ApiPage<R> {
  const limit = query.limit ?? DEFAULT_LIMIT;
  return {
    items: rows.slice(0, limit).map(map),
    nextOffset: rows.length > limit ? (query.offset ?? 0) + limit : null,
  };
}
export function literalPattern(q: string): string {
  return q.replace(/[\\%_]/g, '\\$&');
}
export function contains(q: string): Prisma.StringFilter {
  return { contains: literalPattern(q), mode: 'insensitive' };
}
// Only explicit domain-owned maps may supply fields; client strings never become keys.
export function sorting<T>(
  query: { sort?: string; order?: SortOrder },
  allowed: Record<string, (order: SortOrder) => T>,
  fallback: T[],
  defaultSort: string,
  defaultOrder: SortOrder,
): T[] {
  if (query.sort === undefined && query.order === undefined) return fallback;
  const key = query.sort ?? defaultSort;
  if (!Object.hasOwn(allowed, key))
    throw new BadRequestException('Unsupported sort field');
  return [allowed[key](query.order ?? defaultOrder), ...fallback.slice(-1)];
}
export async function requireTag(
  db: Prisma.TransactionClient,
  userId: string,
  projectId: string,
  tagId?: string,
): Promise<void> {
  if (!tagId) return;
  const tag = await db.tag.findFirst({
    where: { id: tagId, projectId, project: { author: { userId } } },
    select: { id: true },
  });
  if (!tag) throw new NotFoundException('Tag not found in this project');
}
