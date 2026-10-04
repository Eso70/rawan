import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@rawan/database';
import type { ApiArtifact } from '@rawan/types';
import { PrismaService } from '../database/prisma.service.js';
import { CreateArtifactDto, UpdateArtifactDto } from './artifact.dto.js';

function serialize(record: {
  id: string;
  projectId: string;
  name: string;
  summary: string | null;
  description: string | null;
  type: string | null;
  createdAt: Date;
  updatedAt: Date;
}): ApiArtifact {
  return {
    ...record,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}
@Injectable()
export class ArtifactService {
  constructor(private readonly prisma: PrismaService) {}
  private async persist<T>(operation: () => Promise<T>): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        ['P2025', 'P2003'].includes(error.code)
      )
        throw new NotFoundException('Worldbuilding resource not found');
      throw error;
    }
  }
  async list(userId: string, projectId: string): Promise<ApiArtifact[]> {
    const project = await this.prisma.project.findFirst({
      where: { id: projectId, author: { userId } },
      select: { id: true },
    });
    if (!project) throw new NotFoundException('Project not found');
    const records = await this.prisma.artifact.findMany({
      where: { projectId, project: { author: { userId } } },
      orderBy: [{ name: 'asc' }, { id: 'asc' }],
    });
    return records.map(serialize);
  }
  async read(userId: string, id: string): Promise<ApiArtifact> {
    const record = await this.prisma.artifact.findFirst({
      where: { id, project: { author: { userId } } },
    });
    if (!record)
      throw new NotFoundException('Worldbuilding resource not found');
    return serialize(record);
  }
  async create(
    userId: string,
    projectId: string,
    dto: CreateArtifactDto,
  ): Promise<ApiArtifact> {
    return this.persist(async () =>
      serialize(
        await this.prisma.artifact.create({
          data: {
            name: dto.name,
            summary: dto.summary,
            description: dto.description,
            type: dto.type,
            project: { connect: { id: projectId, author: { userId } } },
          },
        }),
      ),
    );
  }
  async update(
    userId: string,
    id: string,
    dto: UpdateArtifactDto,
  ): Promise<ApiArtifact> {
    return this.persist(async () =>
      serialize(
        await this.prisma.artifact.update({
          where: { id, project: { author: { userId } } },
          data: dto,
        }),
      ),
    );
  }
  async delete(userId: string, id: string): Promise<void> {
    await this.persist(() =>
      this.prisma.artifact.delete({
        where: { id, project: { author: { userId } } },
      }),
    );
  }
}
