import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@rawan/database';
import type { ApiRelationship, WorldEntityReference } from '@rawan/types';
import { PrismaService } from '../database/prisma.service.js';
import {
  CreateRelationshipDto,
  UpdateRelationshipDto,
  RelationshipQueryDto,
} from './relationship.dto.js';
import { canonicalEndpoints } from './relationship-policy.js';

const names = { select: { id: true, name: true } } as const;
const include = {
  sourceCharacter: names,
  sourcePlace: names,
  sourceFaction: names,
  sourceArtifact: names,
  targetCharacter: names,
  targetPlace: names,
  targetFaction: names,
  targetArtifact: names,
} satisfies Prisma.RelationshipInclude;
type RecordRelationship = Prisma.RelationshipGetPayload<{
  include: typeof include;
}>;

function reference(record: RecordRelationship, side: 'source' | 'target') {
  const kind = side === 'source' ? record.sourceKind : record.targetKind;
  const entities =
    side === 'source'
      ? {
          CHARACTER: record.sourceCharacter,
          PLACE: record.sourcePlace,
          FACTION: record.sourceFaction,
          ARTIFACT: record.sourceArtifact,
        }
      : {
          CHARACTER: record.targetCharacter,
          PLACE: record.targetPlace,
          FACTION: record.targetFaction,
          ARTIFACT: record.targetArtifact,
        };
  const entity = entities[kind];
  if (!entity) throw new NotFoundException('Relationship endpoint not found');
  return { id: entity.id, kind, name: entity.name };
}
function serialize(record: RecordRelationship): ApiRelationship {
  return {
    id: record.id,
    projectId: record.projectId,
    source: reference(record, 'source'),
    target: reference(record, 'target'),
    typeKey: record.typeKey,
    label: record.label,
    description: record.description,
    direction: record.direction,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}
function endpointFields(
  source: WorldEntityReference,
  target: WorldEntityReference,
) {
  return {
    sourceKind: source.kind,
    targetKind: target.kind,
    sourceCharacterId: source.kind === 'CHARACTER' ? source.id : null,
    sourcePlaceId: source.kind === 'PLACE' ? source.id : null,
    sourceFactionId: source.kind === 'FACTION' ? source.id : null,
    sourceArtifactId: source.kind === 'ARTIFACT' ? source.id : null,
    targetCharacterId: target.kind === 'CHARACTER' ? target.id : null,
    targetPlaceId: target.kind === 'PLACE' ? target.id : null,
    targetFactionId: target.kind === 'FACTION' ? target.id : null,
    targetArtifactId: target.kind === 'ARTIFACT' ? target.id : null,
  };
}
function relevant(entity: WorldEntityReference): Prisma.RelationshipWhereInput {
  switch (entity.kind) {
    case 'CHARACTER':
      return {
        OR: [
          { sourceCharacterId: entity.id },
          { targetCharacterId: entity.id },
        ],
      };
    case 'PLACE':
      return {
        OR: [{ sourcePlaceId: entity.id }, { targetPlaceId: entity.id }],
      };
    case 'FACTION':
      return {
        OR: [{ sourceFactionId: entity.id }, { targetFactionId: entity.id }],
      };
    case 'ARTIFACT':
      return {
        OR: [{ sourceArtifactId: entity.id }, { targetArtifactId: entity.id }],
      };
  }
}

@Injectable()
export class RelationshipsService {
  constructor(private readonly prisma: PrismaService) {}

  private async persist<T>(operation: () => Promise<T>): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002')
          throw new ConflictException('This relationship already exists');
        if (['P2025', 'P2003'].includes(error.code))
          throw new NotFoundException('Relationship resource not found');
      }
      throw error;
    }
  }
  private async project(userId: string, projectId: string) {
    const project = await this.prisma.project.findFirst({
      where: { id: projectId, author: { userId } },
      select: { id: true },
    });
    if (!project) throw new NotFoundException('Project not found');
  }
  private async endpoint(
    userId: string,
    projectId: string,
    entity: WorldEntityReference,
  ) {
    const query = {
      where: { id: entity.id, projectId, project: { author: { userId } } },
      select: { id: true },
    };
    let found;
    switch (entity.kind) {
      case 'CHARACTER':
        found = await this.prisma.character.findFirst(query);
        break;
      case 'PLACE':
        found = await this.prisma.place.findFirst(query);
        break;
      case 'FACTION':
        found = await this.prisma.faction.findFirst(query);
        break;
      case 'ARTIFACT':
        found = await this.prisma.artifact.findFirst(query);
        break;
      default:
        throw new BadRequestException('Unsupported entity kind');
    }
    if (!found) throw new NotFoundException('Relationship endpoint not found');
  }
  private endpoints(
    source: WorldEntityReference,
    target: WorldEntityReference,
    direction: 'DIRECTIONAL' | 'SYMMETRIC',
  ) {
    try {
      return canonicalEndpoints(source, target, direction);
    } catch {
      throw new BadRequestException('Self relationships are not supported');
    }
  }
  async list(
    userId: string,
    projectId: string,
    query: RelationshipQueryDto,
  ): Promise<ApiRelationship[]> {
    await this.project(userId, projectId);
    if (!!query.entityId !== !!query.entityKind)
      throw new BadRequestException(
        'entityId and entityKind must be provided together',
      );
    const entity =
      query.entityId && query.entityKind
        ? { id: query.entityId, kind: query.entityKind }
        : undefined;
    if (entity) await this.endpoint(userId, projectId, entity);
    return (
      await this.prisma.relationship.findMany({
        where: {
          projectId,
          project: { author: { userId } },
          ...(entity ? relevant(entity) : {}),
        },
        include,
        orderBy: [{ createdAt: 'desc' }, { id: 'asc' }],
      })
    ).map(serialize);
  }
  async read(userId: string, id: string): Promise<ApiRelationship> {
    const record = await this.prisma.relationship.findFirst({
      where: { id, project: { author: { userId } } },
      include,
    });
    if (!record) throw new NotFoundException('Relationship not found');
    return serialize(record);
  }
  async create(
    userId: string,
    projectId: string,
    dto: CreateRelationshipDto,
  ): Promise<ApiRelationship> {
    await this.project(userId, projectId);
    const direction = dto.direction ?? 'DIRECTIONAL';
    const { source, target } = this.endpoints(
      dto.source,
      dto.target,
      direction,
    );
    await Promise.all([
      this.endpoint(userId, projectId, source),
      this.endpoint(userId, projectId, target),
    ]);
    return this.persist(async () =>
      serialize(
        await this.prisma.relationship.create({
          data: {
            projectId,
            ...endpointFields(source, target),
            typeKey: dto.typeKey,
            label: dto.label,
            direction,
            description: dto.description,
          },
          include,
        }),
      ),
    );
  }
  async update(
    userId: string,
    id: string,
    dto: UpdateRelationshipDto,
  ): Promise<ApiRelationship> {
    const current = await this.read(userId, id);
    const direction = dto.direction ?? current.direction;
    const { source, target } = this.endpoints(
      dto.source ?? current.source,
      dto.target ?? current.target,
      direction,
    );
    await Promise.all([
      this.endpoint(userId, current.projectId, source),
      this.endpoint(userId, current.projectId, target),
    ]);
    return this.persist(async () =>
      serialize(
        await this.prisma.relationship.update({
          where: { id, project: { author: { userId } } },
          data: {
            ...endpointFields(source, target),
            typeKey: dto.typeKey,
            label: dto.label,
            direction,
            description: dto.description,
          },
          include,
        }),
      ),
    );
  }
  async delete(userId: string, id: string): Promise<void> {
    await this.persist(() =>
      this.prisma.relationship.delete({
        where: { id, project: { author: { userId } } },
      }),
    );
  }
}
