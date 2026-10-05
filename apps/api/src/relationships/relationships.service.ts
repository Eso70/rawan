import { contains, page, pagination, sorting } from '../query/query.js';
import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@rawan/database';
import type { ApiRelationship, WorldEntityReference } from '@rawan/types';
import { PrismaService } from '../database/prisma.service.js';
import { isTransactionWriteConflict } from '../database/transaction-errors.js';
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
    db: Prisma.TransactionClient = this.prisma,
  ) {
    const query = {
      where: { id: entity.id, projectId, project: { author: { userId } } },
      select: { id: true },
    };
    let found;
    switch (entity.kind) {
      case 'CHARACTER':
        found = await db.character.findFirst(query);
        break;
      case 'PLACE':
        found = await db.place.findFirst(query);
        break;
      case 'FACTION':
        found = await db.faction.findFirst(query);
        break;
      case 'ARTIFACT':
        found = await db.artifact.findFirst(query);
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
  async list(userId: string, projectId: string, query: RelationshipQueryDto) {
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
    const rows = await this.prisma.relationship.findMany({
      where: {
        projectId,
        ...(query.q
          ? {
              AND: [
                {
                  OR: [
                    { label: contains(query.q) },
                    { description: contains(query.q) },
                  ],
                },
              ],
            }
          : {}),
        typeKey: query.typeKey,
        project: { author: { userId } },
        ...(entity ? relevant(entity) : {}),
      },
      include,
      orderBy: sorting<Prisma.RelationshipOrderByWithRelationInput>(
        query,
        {
          label: (order) => ({ label: order }),
          createdAt: (order) => ({ createdAt: order }),
          updatedAt: (order) => ({ updatedAt: order }),
        },
        [{ createdAt: 'desc' }, { id: 'asc' }],
        'createdAt',
        'desc',
      ),
      ...pagination(query),
    });
    return page(rows, query, serialize);
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
    // A partial PATCH must merge with the latest committed endpoints/direction.
    // Serializable retries prevent concurrent patches from restoring stale fields.
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        return await this.persist(() =>
          this.prisma.$transaction(
            async (tx) => {
              const record = await tx.relationship.findFirst({
                where: { id, project: { author: { userId } } },
                include,
              });
              if (!record)
                throw new NotFoundException('Relationship not found');
              const current = serialize(record);
              const direction = dto.direction ?? current.direction;
              const { source, target } = this.endpoints(
                dto.source ?? current.source,
                dto.target ?? current.target,
                direction,
              );
              // Interactive transactions use one connection: issue queries in order.
              await this.endpoint(userId, current.projectId, source, tx);
              await this.endpoint(userId, current.projectId, target, tx);
              return serialize(
                await tx.relationship.update({
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
              );
            },
            { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
          ),
        );
      } catch (error) {
        if (!isTransactionWriteConflict(error)) throw error;
      }
    }
    throw new ConflictException(
      'Relationship changed concurrently; retry the update',
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
