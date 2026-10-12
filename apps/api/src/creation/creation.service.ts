import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@rawan/database';
import { dtoValues } from '../contracts/dto-values.js';
import { PrismaService } from '../database/prisma.service.js';
import { PublicationService } from '../publication/publication.service.js';
import { PaginationQueryDto } from '../query/query.dto.js';
import { page, pagination } from '../query/query.js';
import {
  CanvasEdgeDto,
  CanvasNodeDto,
  CitationDto,
  MapDto,
  PinDto,
  PreferenceDto,
  RegionDto,
  ReplaceDocumentDto,
  ResearchDto,
  SavedViewDto,
  TitleDto,
} from './creation.dto.js';

const prefSelect = {
  id: true,
  scope: true,
  contextId: true,
  values: true,
  revision: true,
} as const;
const viewSelect = {
  id: true,
  projectId: true,
  title: true,
  resource: true,
  query: true,
  modules: true,
} as const;
const documentInclude = {
  sections: {
    orderBy: [{ position: 'asc' as const }, { id: 'asc' as const }],
    include: {
      blocks: {
        orderBy: [{ position: 'asc' as const }, { id: 'asc' as const }],
      },
    },
  },
};

@Injectable()
export class CreationService {
  constructor(
    private readonly db: PrismaService,
    private readonly publication: PublicationService,
  ) {}

  async documents(userId: string, workId: string, query: PaginationQueryDto) {
    await this.publication.ownedWork(userId, workId);
    return page(
      await this.db.workDocument.findMany({
        where: { workId },
        orderBy: { id: 'asc' },
        ...pagination(query),
      }),
      query,
      (row) => row,
    );
  }
  async createDocument(userId: string, workId: string, dto: TitleDto) {
    return this.publication.persist(() =>
      this.db.$transaction(async (tx) => {
        await this.publication.ownedWork(userId, workId, tx);
        return tx.workDocument.create({ data: { workId, title: dto.title } });
      }),
    );
  }
  async document(userId: string, workId: string, id: string) {
    const row = await this.db.workDocument.findFirst({
      where: { id, workId, work: { ownerUserId: userId } },
      include: documentInclude,
    });
    if (!row) throw new NotFoundException('Document not found');
    return row;
  }
  async replaceDocument(
    userId: string,
    workId: string,
    id: string,
    dto: ReplaceDocumentDto,
  ) {
    const allBlocks = dto.sections.flatMap((section) => section.blocks);
    if (
      allBlocks.length > 1000 ||
      allBlocks.reduce((sum, block) => sum + Buffer.byteLength(block.text), 0) >
        4 * 1024 * 1024
    )
      throw new BadRequestException('Document content limit exceeded');
    const labels = allBlocks
      .filter((block) => block.kind === 'FOOTNOTE')
      .map((block) => block.footnoteLabel);
    if (
      labels.some((label) => !label) ||
      new Set(labels).size !== labels.length ||
      allBlocks.some(
        (block) =>
          (block.referenceLabel && !labels.includes(block.referenceLabel)) ||
          (block.footnoteLabel && block.kind !== 'FOOTNOTE'),
      )
    )
      throw new BadRequestException('Invalid footnote links');
    const sectionIds = dto.sections.flatMap((section) =>
      section.id ? [section.id] : [],
    );
    const blockIds = allBlocks.flatMap((block) => (block.id ? [block.id] : []));
    if (
      new Set(sectionIds).size !== sectionIds.length ||
      new Set(blockIds).size !== blockIds.length
    )
      throw new BadRequestException('Duplicate document IDs');
    return this.publication.persist(() =>
      this.db.$transaction(
        async (tx) => {
          const previous = await tx.workDocument.findFirst({
            where: { id, workId, work: { ownerUserId: userId } },
            include: documentInclude,
          });
          if (!previous) throw new NotFoundException('Document not found');
          if (previous.revision !== dto.expectedRevision)
            throw new ConflictException(
              'Document changed; reload before retrying',
            );
          for (const section of dto.sections) {
            const original = section.id
              ? previous.sections.find((row) => row.id === section.id)
              : undefined;
            if (section.id && !original)
              throw new NotFoundException('Document section not found');
            if (
              section.blocks.some(
                (block) =>
                  block.id &&
                  !original?.blocks.some((row) => row.id === block.id),
              )
            )
              throw new NotFoundException(
                'Document block not found in section',
              );
          }
          await tx.workDocument.update({
            where: { id, revision: dto.expectedRevision },
            data: { title: dto.title, revision: { increment: 1 } },
          });
          await tx.documentSection.deleteMany({
            where: { documentId: id, id: { notIn: sectionIds } },
          });
          for (const [position, section] of dto.sections.entries()) {
            const saved = section.id
              ? await tx.documentSection.update({
                  where: { id: section.id, documentId: id },
                  data: { title: section.title, position },
                })
              : await tx.documentSection.create({
                  data: { documentId: id, title: section.title, position },
                });
            await tx.documentBlock.deleteMany({
              where: {
                sectionId: saved.id,
                id: {
                  notIn: section.blocks.flatMap((block) =>
                    block.id ? [block.id] : [],
                  ),
                },
              },
            });
            for (const [blockPosition, block] of section.blocks.entries()) {
              const data = {
                kind: block.kind,
                text: block.text,
                position: blockPosition,
                footnoteLabel: block.footnoteLabel ?? null,
                referenceLabel: block.referenceLabel ?? null,
              };
              if (block.id)
                await tx.documentBlock.update({
                  where: { id: block.id, sectionId: saved.id },
                  data,
                });
              else
                await tx.documentBlock.create({
                  data: { sectionId: saved.id, ...data },
                });
            }
          }
          return tx.workDocument.findUniqueOrThrow({
            where: { id },
            include: documentInclude,
          });
        },
        {
          isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
          timeout: 15000,
        },
      ),
    );
  }
  async deleteDocument(userId: string, workId: string, id: string) {
    await this.publication.persist(() =>
      this.db.workDocument.delete({
        where: { id, workId, work: { ownerUserId: userId } },
      }),
    );
  }
  async research(userId: string, projectId: string, query: PaginationQueryDto) {
    await this.publication.ownedProject(userId, projectId);
    return page(
      await this.db.researchSource.findMany({
        where: { projectId },
        orderBy: { id: 'asc' },
        ...pagination(query),
      }),
      query,
      (row) => row,
    );
  }
  async saveResearch(
    userId: string,
    projectId: string,
    dto: ResearchDto,
    id?: string,
  ) {
    return this.publication.persist(() =>
      this.db.$transaction(async (tx) => {
        await this.publication.ownedProject(userId, projectId, tx);
        if (
          dto.mediaId &&
          !(await tx.media.findFirst({
            where: { id: dto.mediaId, projectId },
            select: { id: true },
          }))
        )
          throw new NotFoundException('Reference media not found in project');
        return id
          ? tx.researchSource.update({ where: { id, projectId }, data: dto })
          : tx.researchSource.create({
              data: { projectId, ...dtoValues(dto) },
            });
      }),
    );
  }
  async deleteResearch(userId: string, projectId: string, id: string) {
    await this.publication.persist(() =>
      this.db.researchSource.delete({
        where: { id, projectId, project: { author: { userId } } },
      }),
    );
  }
  async citations(
    userId: string,
    projectId: string,
    sourceId: string,
    query: PaginationQueryDto,
  ) {
    if (
      !(await this.db.researchSource.findFirst({
        where: { id: sourceId, projectId, project: { author: { userId } } },
        select: { id: true },
      }))
    )
      throw new NotFoundException('Source not found');
    return page(
      await this.db.researchCitation.findMany({
        where: {
          sourceId,
          block: { section: { document: { work: { ownerUserId: userId } } } },
        },
        orderBy: { id: 'asc' },
        ...pagination(query),
      }),
      query,
      (row) => row,
    );
  }
  async addCitation(
    userId: string,
    projectId: string,
    sourceId: string,
    dto: CitationDto,
  ) {
    return this.publication.persist(() =>
      this.db.$transaction(async (tx) => {
        if (
          !(await tx.researchSource.findFirst({
            where: { id: sourceId, projectId, project: { author: { userId } } },
            select: { id: true },
          })) ||
          !(await tx.documentBlock.findFirst({
            where: {
              id: dto.documentBlockId,
              section: { document: { work: { ownerUserId: userId } } },
            },
            select: { id: true },
          }))
        )
          throw new NotFoundException('Source or document block not found');
        return tx.researchCitation.create({
          data: { sourceId, ...dtoValues(dto) },
        });
      }),
    );
  }
  async deleteCitation(
    userId: string,
    projectId: string,
    sourceId: string,
    id: string,
  ) {
    await this.publication.persist(() =>
      this.db.researchCitation.delete({
        where: {
          id,
          sourceId,
          source: { projectId, project: { author: { userId } } },
        },
      }),
    );
  }
  async preferenceContext(
    userId: string,
    scope: string,
    contextId: string,
    tx: Prisma.TransactionClient = this.db,
  ) {
    if (['GLOBAL', 'CREATOR', 'READER'].includes(scope)) {
      if (contextId !== 'global')
        throw new BadRequestException('This scope uses global context');
    } else if (scope === 'PROJECT')
      await this.publication.ownedProject(userId, contextId, tx);
    else if (scope === 'WORK') {
      if (
        !(await tx.work.findFirst({
          where: {
            id: contextId,
            OR: [
              { ownerUserId: userId },
              { releases: { some: { status: 'PUBLISHED' } } },
            ],
          },
          select: { id: true },
        }))
      )
        throw new NotFoundException('Work not found');
    } else throw new BadRequestException('Invalid preference scope');
  }
  async preferences(userId: string, query: PaginationQueryDto) {
    return page(
      await this.db.userPreference.findMany({
        where: { userId },
        select: prefSelect,
        orderBy: { id: 'asc' },
        ...pagination(query),
      }),
      query,
      (row) => row,
    );
  }
  async savePreference(userId: string, dto: PreferenceDto) {
    if (!dto.values || typeof dto.values !== 'object')
      throw new BadRequestException('Preference values required');
    return this.publication.persist(() =>
      this.db.$transaction(
        async (tx) => {
          await this.preferenceContext(userId, dto.scope, dto.contextId, tx);
          const where = {
            userId_scope_contextId: {
              userId,
              scope: dto.scope,
              contextId: dto.contextId,
            },
          };
          const previous = await tx.userPreference.findUnique({ where });
          if ((previous?.revision ?? 0) !== dto.expectedRevision)
            throw new ConflictException(
              'Preferences changed; reload before retrying',
            );
          const values = {
            ...(previous?.values as Record<string, Prisma.InputJsonValue>),
          };
          for (const [name, value] of Object.entries(dto.values)) {
            if (value === null) delete values[name];
            else if (value !== undefined) values[name] = value;
          }
          return tx.userPreference.upsert({
            where,
            create: {
              userId,
              scope: dto.scope,
              contextId: dto.contextId,
              values,
              revision: 1,
            },
            update: { values, revision: { increment: 1 } },
            select: prefSelect,
          });
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
      ),
    );
  }
  async deletePreference(userId: string, id: string) {
    await this.publication.persist(() =>
      this.db.userPreference.delete({ where: { id, userId } }),
    );
  }
  async effectivePreferences(userId: string, scope: string, contextId: string) {
    await this.preferenceContext(userId, scope, contextId);
    const order = [
      'GLOBAL',
      ...(scope === 'PROJECT'
        ? ['CREATOR', 'PROJECT']
        : scope === 'WORK'
          ? ['READER', 'WORK']
          : scope === 'GLOBAL'
            ? []
            : [scope]),
    ];
    const rows = await this.db.userPreference.findMany({
      where: {
        userId,
        OR: order.map((item) => ({
          scope: item,
          contextId: ['PROJECT', 'WORK'].includes(item) ? contextId : 'global',
        })),
      },
      select: prefSelect,
    });
    return {
      scope,
      contextId,
      values: Object.assign(
        {},
        ...order.map(
          (item) => rows.find((row) => row.scope === item)?.values ?? {},
        ),
      ) as Record<string, unknown>,
    };
  }
  async views(userId: string, projectId: string, query: PaginationQueryDto) {
    await this.publication.ownedProject(userId, projectId);
    return page(
      await this.db.savedView.findMany({
        where: { userId, projectId },
        select: viewSelect,
        orderBy: { id: 'asc' },
        ...pagination(query),
      }),
      query,
      (row) => row,
    );
  }
  async saveView(
    userId: string,
    projectId: string,
    dto: SavedViewDto,
    id?: string,
  ) {
    if (!dto.query || typeof dto.query !== 'object')
      throw new BadRequestException('View query required');
    const world = ['CHARACTER', 'PLACE', 'FACTION', 'ARTIFACT'].includes(
      dto.resource,
    );
    const sorts = world
      ? ['name', 'createdAt', 'updatedAt']
      : dto.resource === 'TIMELINE_EVENT'
        ? ['title', 'start', 'position', 'createdAt', 'updatedAt']
        : ['SCENE', 'PLOT_POINT'].includes(dto.resource)
          ? ['title', 'position', 'createdAt', 'updatedAt']
          : ['title', 'createdAt', 'updatedAt'];
    if (dto.query.sort && !sorts.includes(dto.query.sort))
      throw new BadRequestException('Unsupported resource sort');
    if (dto.resource === 'BOOK' && dto.query.tagId)
      throw new BadRequestException('Book tags are not supported');
    return this.publication.persist(() =>
      this.db.$transaction(async (tx) => {
        await this.publication.ownedProject(userId, projectId, tx);
        const parentKeys = [
          'bookId',
          'chapterId',
          'timelineId',
          'eraId',
          'plotId',
        ] as const;
        const allowedParents =
          dto.resource === 'SCENE'
            ? ['bookId', 'chapterId']
            : dto.resource === 'TIMELINE_EVENT'
              ? ['timelineId', 'eraId']
              : dto.resource === 'PLOT_POINT'
                ? ['plotId']
                : [];
        if (
          parentKeys.some(
            (key) => dto.query[key] && !allowedParents.includes(key),
          )
        )
          throw new BadRequestException('Unexpected saved-view parent');
        if (
          dto.resource === 'SCENE' &&
          (!dto.query.bookId ||
            !dto.query.chapterId ||
            !(await tx.chapter.findFirst({
              where: {
                id: dto.query.chapterId,
                bookId: dto.query.bookId,
                book: { projectId },
              },
              select: { id: true },
            })))
        )
          throw new NotFoundException('Saved-view manuscript parent not found');
        if (dto.resource === 'TIMELINE_EVENT') {
          if (
            !dto.query.timelineId ||
            !(await tx.timeline.findFirst({
              where: { id: dto.query.timelineId, projectId },
              select: { id: true },
            }))
          )
            throw new NotFoundException('Saved-view timeline not found');
          if (
            dto.query.eraId &&
            !(await tx.era.findFirst({
              where: {
                id: dto.query.eraId,
                timelineId: dto.query.timelineId,
                projectId,
              },
              select: { id: true },
            }))
          )
            throw new NotFoundException('Saved-view era not found');
        }
        if (
          dto.resource === 'PLOT_POINT' &&
          (!dto.query.plotId ||
            !(await tx.plot.findFirst({
              where: { id: dto.query.plotId, projectId },
              select: { id: true },
            })))
        )
          throw new NotFoundException('Saved-view plot not found');
        if (
          dto.query.tagId &&
          !(await tx.tag.findFirst({
            where: { id: dto.query.tagId, projectId },
            select: { id: true },
          }))
        )
          throw new NotFoundException('Tag not found');
        const data = {
          title: dto.title,
          resource: dto.resource,
          query: { ...dtoValues(dto.query) },
          modules: dto.modules,
        };
        return id
          ? tx.savedView.update({
              where: { id, projectId, userId },
              data,
              select: viewSelect,
            })
          : tx.savedView.create({
              data: { projectId, userId, ...data },
              select: viewSelect,
            });
      }),
    );
  }
  async deleteView(userId: string, projectId: string, id: string) {
    await this.publication.persist(() =>
      this.db.savedView.delete({
        where: { id, projectId, userId, project: { author: { userId } } },
      }),
    );
  }
  async entity(
    tx: Prisma.TransactionClient,
    projectId: string,
    kind?: string,
    id?: string,
  ) {
    if (!kind && !id) return;
    if (!kind || !id)
      throw new BadRequestException('Reference kind and ID must be paired');
    let row: { id: string } | null = null;
    const where = { id, projectId };
    if (kind === 'CHARACTER')
      row = await tx.character.findFirst({ where, select: { id: true } });
    if (kind === 'PLACE')
      row = await tx.place.findFirst({ where, select: { id: true } });
    if (kind === 'FACTION')
      row = await tx.faction.findFirst({ where, select: { id: true } });
    if (kind === 'ARTIFACT')
      row = await tx.artifact.findFirst({ where, select: { id: true } });
    if (kind === 'IMAGE')
      row = await tx.media.findFirst({
        where: {
          ...where,
          mimeType: { in: ['image/png', 'image/jpeg', 'image/webp'] },
        },
        select: { id: true },
      });
    if (!row) throw new NotFoundException('Reference not found in project');
  }
  async maps(userId: string, projectId: string, query: PaginationQueryDto) {
    await this.publication.ownedProject(userId, projectId);
    return page(
      await this.db.projectMap.findMany({
        where: { projectId },
        orderBy: { id: 'asc' },
        ...pagination(query),
      }),
      query,
      (row) => row,
    );
  }
  async saveMap(userId: string, projectId: string, dto: MapDto, id?: string) {
    return this.publication.persist(() =>
      this.db.$transaction(async (tx) => {
        await this.publication.ownedProject(userId, projectId, tx);
        if (dto.imageMediaId)
          await this.entity(tx, projectId, 'IMAGE', dto.imageMediaId);
        return id
          ? tx.projectMap.update({
              where: { id, projectId },
              data: {
                title: dto.title,
                imageMediaId: dto.imageMediaId ?? null,
                revision: { increment: 1 },
              },
            })
          : tx.projectMap.create({
              data: {
                projectId,
                title: dto.title,
                imageMediaId: dto.imageMediaId,
              },
            });
      }),
    );
  }
  async map(userId: string, projectId: string, id: string) {
    const row = await this.db.projectMap.findFirst({
      where: { id, projectId, project: { author: { userId } } },
      include: {
        pins: { take: 1000, orderBy: { id: 'asc' } },
        regions: { take: 100, orderBy: { id: 'asc' } },
      },
    });
    if (!row) throw new NotFoundException('Map not found');
    return row;
  }
  async deleteMap(userId: string, projectId: string, id: string) {
    await this.publication.persist(() =>
      this.db.projectMap.delete({
        where: { id, projectId, project: { author: { userId } } },
      }),
    );
  }
  async savePin(
    userId: string,
    projectId: string,
    mapId: string,
    dto: PinDto,
    id?: string,
  ) {
    return this.publication.persist(() =>
      this.db.$transaction(
        async (tx) => {
          const map = await tx.projectMap.findFirst({
            where: { id: mapId, projectId, project: { author: { userId } } },
            select: { id: true },
          });
          if (!map) throw new NotFoundException('Map not found');
          await this.entity(tx, projectId, dto.entityKind, dto.entityId);
          if (!id && (await tx.mapPin.count({ where: { mapId } })) >= 1000)
            throw new ConflictException('Map pin limit reached');
          const data = {
            ...dtoValues(dto),
            entityKind: dto.entityKind ?? null,
            entityId: dto.entityId ?? null,
          };
          return id
            ? tx.mapPin.update({ where: { id, mapId }, data })
            : tx.mapPin.create({ data: { mapId, ...data } });
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
      ),
    );
  }
  async saveRegion(
    userId: string,
    projectId: string,
    mapId: string,
    dto: RegionDto,
    id?: string,
  ) {
    return this.publication.persist(() =>
      this.db.$transaction(
        async (tx) => {
          if (
            !(await tx.projectMap.findFirst({
              where: { id: mapId, projectId, project: { author: { userId } } },
              select: { id: true },
            }))
          )
            throw new NotFoundException('Map not found');
          if (!id && (await tx.mapRegion.count({ where: { mapId } })) >= 100)
            throw new ConflictException('Map region limit reached');
          const data = {
            label: dto.label,
            color: dto.color,
            points: dto.points.map((point) => ({ x: point.x, y: point.y })),
          };
          return id
            ? tx.mapRegion.update({ where: { id, mapId }, data })
            : tx.mapRegion.create({ data: { mapId, ...data } });
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
      ),
    );
  }
  async deletePin(
    userId: string,
    projectId: string,
    mapId: string,
    id: string,
  ) {
    await this.publication.persist(() =>
      this.db.mapPin.delete({
        where: {
          id,
          mapId,
          map: { projectId, project: { author: { userId } } },
        },
      }),
    );
  }
  async deleteRegion(
    userId: string,
    projectId: string,
    mapId: string,
    id: string,
  ) {
    await this.publication.persist(() =>
      this.db.mapRegion.delete({
        where: {
          id,
          mapId,
          map: { projectId, project: { author: { userId } } },
        },
      }),
    );
  }
  async canvases(userId: string, projectId: string, query: PaginationQueryDto) {
    await this.publication.ownedProject(userId, projectId);
    return page(
      await this.db.projectCanvas.findMany({
        where: { projectId },
        orderBy: { id: 'asc' },
        ...pagination(query),
      }),
      query,
      (row) => row,
    );
  }
  async saveCanvas(
    userId: string,
    projectId: string,
    dto: TitleDto,
    id?: string,
  ) {
    return this.publication.persist(() =>
      this.db.$transaction(async (tx) => {
        await this.publication.ownedProject(userId, projectId, tx);
        return id
          ? tx.projectCanvas.update({
              where: { id, projectId },
              data: { title: dto.title, revision: { increment: 1 } },
            })
          : tx.projectCanvas.create({ data: { projectId, title: dto.title } });
      }),
    );
  }
  async canvas(userId: string, projectId: string, id: string) {
    const row = await this.db.projectCanvas.findFirst({
      where: { id, projectId, project: { author: { userId } } },
      include: {
        nodes: {
          take: 1000,
          orderBy: { id: 'asc' },
          include: { outgoing: { take: 100, orderBy: { id: 'asc' } } },
        },
      },
    });
    if (!row) throw new NotFoundException('Canvas not found');
    return row;
  }
  async deleteCanvas(userId: string, projectId: string, id: string) {
    await this.publication.persist(() =>
      this.db.projectCanvas.delete({
        where: { id, projectId, project: { author: { userId } } },
      }),
    );
  }
  async saveNode(
    userId: string,
    projectId: string,
    canvasId: string,
    dto: CanvasNodeDto,
    id?: string,
  ) {
    return this.publication.persist(() =>
      this.db.$transaction(
        async (tx) => {
          if (
            !(await tx.projectCanvas.findFirst({
              where: {
                id: canvasId,
                projectId,
                project: { author: { userId } },
              },
              select: { id: true },
            }))
          )
            throw new NotFoundException('Canvas not found');
          if (dto.kind === 'TEXT' && dto.referenceId)
            throw new BadRequestException(
              'Text nodes cannot reference resources',
            );
          if (dto.kind !== 'TEXT') {
            if (!dto.referenceId)
              throw new BadRequestException('Reference required');
            await this.entity(tx, projectId, dto.kind, dto.referenceId);
          }
          if (
            !id &&
            (await tx.canvasNode.count({ where: { canvasId } })) >= 1000
          )
            throw new ConflictException('Canvas node limit reached');
          const data = {
            ...dtoValues(dto),
            referenceId: dto.referenceId ?? null,
          };
          return id
            ? tx.canvasNode.update({ where: { id, canvasId }, data })
            : tx.canvasNode.create({ data: { canvasId, ...data } });
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
      ),
    );
  }
  async addEdge(
    userId: string,
    projectId: string,
    canvasId: string,
    dto: CanvasEdgeDto,
  ) {
    if (dto.sourceId === dto.targetId)
      throw new BadRequestException('Canvas edge requires distinct nodes');
    return this.publication.persist(() =>
      this.db.$transaction(
        async (tx) => {
          if (
            (await tx.canvasNode.count({
              where: {
                canvasId,
                id: { in: [dto.sourceId, dto.targetId] },
                canvas: { projectId, project: { author: { userId } } },
              },
            })) !== 2
          )
            throw new NotFoundException('Canvas nodes not found');
          if (
            (await tx.canvasEdge.count({
              where: { canvasId, sourceId: dto.sourceId },
            })) >= 100 ||
            (await tx.canvasEdge.count({ where: { canvasId } })) >= 2000
          )
            throw new ConflictException('Canvas edge limit reached');
          return tx.canvasEdge.create({
            data: { canvasId, ...dtoValues(dto) },
          });
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
      ),
    );
  }
  async deleteNode(
    userId: string,
    projectId: string,
    canvasId: string,
    id: string,
  ) {
    await this.publication.persist(() =>
      this.db.canvasNode.delete({
        where: {
          id,
          canvasId,
          canvas: { projectId, project: { author: { userId } } },
        },
      }),
    );
  }
  async deleteEdge(
    userId: string,
    projectId: string,
    canvasId: string,
    id: string,
  ) {
    await this.publication.persist(() =>
      this.db.canvasEdge.delete({
        where: {
          id,
          canvasId,
          source: { canvas: { projectId, project: { author: { userId } } } },
        },
      }),
    );
  }
}
