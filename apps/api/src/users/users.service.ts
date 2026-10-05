import { arrayPagination } from '../query/query.js';
import { PaginationQueryDto } from '../query/query.dto.js';
import { Injectable, NotFoundException } from '@nestjs/common';
import type { ApiUser } from '@rawan/types';
import { PrismaService } from '../database/prisma.service.js';
import { PUBLIC_USER_SELECT, toApiUser } from './public-user.js';
import { normalizeEmail } from '../auth/normalize-email.js';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: PaginationQueryDto = {}): Promise<ApiUser[]> {
    const users = await this.prisma.user.findMany({
      select: PUBLIC_USER_SELECT,
      orderBy: [{ createdAt: 'desc' }, { id: 'asc' }],
      ...arrayPagination(query),
    });
    return users.map(toApiUser);
  }

  async findById(id: string): Promise<ApiUser> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: PUBLIC_USER_SELECT,
    });
    if (!user) throw new NotFoundException('User not found');
    return toApiUser(user);
  }

  async findByEmail(email: string): Promise<ApiUser | null> {
    const user = await this.prisma.user.findFirst({
      where: { email: { equals: normalizeEmail(email), mode: 'insensitive' } },
      select: PUBLIC_USER_SELECT,
    });
    return user ? toApiUser(user) : null;
  }
}
