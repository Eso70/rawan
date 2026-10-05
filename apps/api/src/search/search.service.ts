import { Injectable, NotFoundException } from '@nestjs/common';
import type { ApiSearchResult } from '@rawan/types';
import { PrismaService } from '../database/prisma.service.js';
import { page } from '../query/query.js';
import { SearchQueryDto } from './search.dto.js';
import { searchSql } from './search.sql.js';
@Injectable()
export class SearchService {
  constructor(private readonly prisma: PrismaService) {}
  async search(userId: string, projectId: string, query: SearchQueryDto) {
    const project = await this.prisma.project.findFirst({
      where: { id: projectId, author: { userId } },
      select: { id: true },
    });
    if (!project) throw new NotFoundException('Project not found');
    const rows = await this.prisma.$queryRaw<
      (Omit<ApiSearchResult, 'updatedAt'> & { updatedAt: Date })[]
    >(searchSql(userId, projectId, query));
    return page(rows, query, (row) => ({
      kind: row.kind,
      id: row.id,
      projectId: row.projectId,
      title: row.title,
      snippet: row.snippet,
      updatedAt: row.updatedAt.toISOString(),
    }));
  }
}
