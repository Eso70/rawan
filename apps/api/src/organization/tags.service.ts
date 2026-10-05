import type { Prisma } from '@rawan/database';
import { contains, page, pagination, sorting } from '../query/query.js';
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import {
  OrganizationAccess,
  organizationOwner,
} from './organization-access.js';
import {
  CreateTagDto,
  UpdateTagDto,
  TagQueryDto,
  AssignTagDto,
  TagAssignmentQueryDto,
  ResourceTagsQueryDto,
} from './organization.dto.js';
import {
  tagResponse,
  assignmentInclude,
  assignmentResponse,
} from './organization-response.js';
import { resolveTagResource, resourceWhere } from './tag-resource.js';
@Injectable()
export class TagsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly access: OrganizationAccess,
  ) {}
  async list(userId: string, projectId: string, query: TagQueryDto) {
    await this.access.project(userId, projectId);

    const rows = await this.prisma.tag.findMany({
      where: {
        projectId,
        ...organizationOwner(userId),
        ...(query.q ? { name: contains(query.q) } : {}),
      },
      orderBy: sorting<Prisma.TagOrderByWithRelationInput>(
        query,
        {
          name: (order) => ({ normalizedName: order }),
          createdAt: (order) => ({ createdAt: order }),
          updatedAt: (order) => ({ updatedAt: order }),
        },
        [{ normalizedName: 'asc' }, { id: 'asc' }],
        'name',
        'asc',
      ),
      ...pagination(query),
    });
    return page(rows, query, tagResponse);
  }
  async read(userId: string, id: string) {
    return tagResponse(await this.access.tag(userId, id));
  }
  async create(userId: string, projectId: string, dto: CreateTagDto) {
    return this.access.persist(async () =>
      tagResponse(
        await this.prisma.tag.create({
          data: {
            name: dto.name,
            project: { connect: { id: projectId, author: { userId } } },
          },
        }),
      ),
    );
  }
  async update(userId: string, id: string, dto: UpdateTagDto) {
    return this.access.persist(async () =>
      tagResponse(
        await this.prisma.tag.update({
          where: { id, ...organizationOwner(userId) },
          data: { name: dto.name },
        }),
      ),
    );
  }
  async delete(userId: string, id: string): Promise<void> {
    await this.access.persist(() =>
      this.prisma.tag.delete({ where: { id, ...organizationOwner(userId) } }),
    );
  }
  async assign(userId: string, tagId: string, dto: AssignTagDto) {
    return this.access.transaction(async (tx) => {
      const tag = await this.access.tag(userId, tagId, undefined, tx);
      const resource = await resolveTagResource(
        tx,
        userId,
        tag.projectId,
        dto.resourceKind,
        dto.resourceId,
      );
      return assignmentResponse(
        await tx.tagAssignment.create({
          data: { projectId: tag.projectId, tagId, ...resource },
          include: assignmentInclude,
        }),
      );
    });
  }
  async assignments(
    userId: string,
    tagId: string,
    query: TagAssignmentQueryDto,
  ) {
    const tag = await this.access.tag(userId, tagId);

    const rows = await this.prisma.tagAssignment.findMany({
      where: {
        tagId,
        projectId: tag.projectId,
        resourceKind: query.resourceKind,
        tag: organizationOwner(userId),
      },
      include: assignmentInclude,
      orderBy: [{ resourceKind: 'asc' }, { id: 'asc' }],
      ...pagination(query),
    });
    return page(rows, query, assignmentResponse);
  }
  async forResource(
    userId: string,
    projectId: string,
    query: ResourceTagsQueryDto,
  ) {
    await this.access.project(userId, projectId);
    await resolveTagResource(
      this.prisma,
      userId,
      projectId,
      query.resourceKind,
      query.resourceId,
    );

    const rows = await this.prisma.tagAssignment.findMany({
      where: {
        projectId,
        ...resourceWhere(query.resourceKind, query.resourceId),
        tag: organizationOwner(userId),
      },
      include: assignmentInclude,
      orderBy: [{ tag: { normalizedName: 'asc' } }, { id: 'asc' }],
      ...pagination(query),
    });
    return page(rows, query, assignmentResponse);
  }
  async unassign(userId: string, tagId: string, id: string): Promise<void> {
    await this.access.persist(() =>
      this.prisma.tagAssignment.delete({
        where: { id, tagId, tag: organizationOwner(userId) },
      }),
    );
  }
}
