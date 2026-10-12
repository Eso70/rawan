import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@rawan/database';
import { createHash, randomUUID } from 'node:crypto';
import { dtoValues } from '../contracts/dto-values.js';
import { PrismaService } from '../database/prisma.service.js';
import { PaginationQueryDto } from '../query/query.dto.js';
import { contains, page, pagination } from '../query/query.js';
import {
  CatalogQueryDto,
  CreateReleaseDto,
  CreatorDto,
  CreditDto,
  EditionDto,
  MetadataDto,
  RelatedDto,
  SeriesDto,
  SeriesMemberDto,
} from './publication.dto.js';

const creatorSelect = {
  id: true,
  handle: true,
  displayName: true,
  biography: true,
  links: true,
  public: true,
  avatarAssetId: true,
} as const;
const seriesSelect = {
  id: true,
  title: true,
  description: true,
  anthology: true,
  public: true,
} as const;
const key = (value: string) => createHash('sha256').update(value).digest('hex');

@Injectable()
export class PublicationService {
  constructor(private readonly db: PrismaService) {}

  async ownedWork(
    userId: string,
    workId: string,
    tx: Prisma.TransactionClient = this.db,
  ) {
    const work = await tx.work.findFirst({
      where: { id: workId, ownerUserId: userId },
    });
    if (!work) throw new NotFoundException('Work not found');
    return work;
  }
  async ownedProject(
    userId: string,
    projectId: string,
    tx: Prisma.TransactionClient = this.db,
  ) {
    const project = await tx.project.findFirst({
      where: { id: projectId, author: { userId } },
      select: { id: true },
    });
    if (!project) throw new NotFoundException('Project not found');
    return project;
  }
  async nextVersion(
    tx: Prisma.TransactionClient,
    userId: string,
    workId: string,
  ) {
    const row = await tx.work.update({
      where: { id: workId, ownerUserId: userId },
      data: { nextReleaseVersion: { increment: 1 } },
      select: { nextReleaseVersion: true },
    });
    return row.nextReleaseVersion - 1;
  }
  async persist<T>(fn: () => Promise<T>): Promise<T> {
    try {
      return await fn();
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (['P2002', 'P2034'].includes(error.code))
          throw new ConflictException(
            'Resource already exists or changed concurrently',
          );
        if (['P2025', 'P2003'].includes(error.code))
          throw new NotFoundException('Resource not found');
      }
      throw error;
    }
  }
  async metadata(userId: string, workId: string) {
    await this.ownedWork(userId, workId);
    const row = await this.db.workMetadata.findUnique({ where: { workId } });
    if (!row) throw new NotFoundException('Metadata not configured');
    return row;
  }
  async setMetadata(userId: string, workId: string, dto: MetadataDto) {
    return this.persist(() =>
      this.db.$transaction(async (tx) => {
        await this.ownedWork(userId, workId, tx);
        if (
          dto.coverAssetId &&
          !(await tx.workAsset.findFirst({
            where: { id: dto.coverAssetId, workId, status: 'COMPLETED' },
            select: { id: true },
          }))
        )
          throw new NotFoundException('Processed cover not found');
        return tx.workMetadata.upsert({
          where: { workId },
          create: { workId, ...dtoValues(dto) },
          update: dto,
        });
      }),
    );
  }
  async creators(userId: string, query: PaginationQueryDto) {
    return page(
      await this.db.creatorIdentity.findMany({
        where: { ownerUserId: userId },
        select: creatorSelect,
        orderBy: { id: 'asc' },
        ...pagination(query),
      }),
      query,
      (row) => row,
    );
  }
  async saveCreator(userId: string, dto: CreatorDto, id?: string) {
    return this.persist(() =>
      this.db.$transaction(async (tx) => {
        if (
          dto.avatarAssetId &&
          !(await tx.workAsset.findFirst({
            where: {
              id: dto.avatarAssetId,
              work: { ownerUserId: userId },
              status: 'COMPLETED',
            },
            select: { id: true },
          }))
        )
          throw new NotFoundException('Avatar asset not found');
        return id
          ? tx.creatorIdentity.update({
              where: { id, ownerUserId: userId },
              data: {
                ...dtoValues(dto),
                avatarAssetId: dto.avatarAssetId ?? null,
              },
              select: creatorSelect,
            })
          : tx.creatorIdentity.create({
              data: { ownerUserId: userId, ...dtoValues(dto) },
              select: creatorSelect,
            });
      }),
    );
  }
  async deleteCreator(userId: string, id: string) {
    await this.persist(() =>
      this.db.creatorIdentity.delete({ where: { id, ownerUserId: userId } }),
    );
  }
  async publicCreator(handle: string) {
    const row = await this.db.creatorIdentity.findFirst({
      where: { handle, public: true },
      select: creatorSelect,
    });
    if (!row) throw new NotFoundException('Creator not found');
    return row;
  }
  async credits(userId: string, workId: string, query: PaginationQueryDto) {
    await this.ownedWork(userId, workId);
    return page(
      await this.db.workCredit.findMany({
        where: { workId },
        orderBy: [{ position: 'asc' }, { id: 'asc' }],
        ...pagination(query),
      }),
      query,
      (row) => row,
    );
  }
  async addCredit(userId: string, workId: string, dto: CreditDto) {
    return this.persist(() =>
      this.db.$transaction(
        async (tx) => {
          await this.ownedWork(userId, workId, tx);
          if (
            dto.creatorId &&
            !(await tx.creatorIdentity.findFirst({
              where: { id: dto.creatorId, ownerUserId: userId },
              select: { id: true },
            }))
          )
            throw new NotFoundException('Creator not found');
          if ((await tx.workCredit.count({ where: { workId } })) >= 30)
            throw new ConflictException('Credit limit reached');
          return tx.workCredit.create({ data: { workId, ...dtoValues(dto) } });
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
      ),
    );
  }
  async deleteCredit(userId: string, workId: string, id: string) {
    await this.persist(() =>
      this.db.workCredit.delete({
        where: { id, workId, work: { ownerUserId: userId } },
      }),
    );
  }
  async editions(userId: string, workId: string, query: PaginationQueryDto) {
    await this.ownedWork(userId, workId);
    return page(
      await this.db.workEdition.findMany({
        where: { workId },
        orderBy: { id: 'asc' },
        ...pagination(query),
      }),
      query,
      (row) => row,
    );
  }
  async addEdition(userId: string, workId: string, dto: EditionDto) {
    if (dto.isbn13) {
      const digits = dto.isbn13.split('').map(Number);
      if (
        digits.reduce((sum, digit, i) => sum + digit * (i % 2 ? 3 : 1), 0) %
          10 !==
        0
      )
        throw new BadRequestException('Invalid ISBN checksum');
    }
    if (
      dto.publicationDate?.length === 10 &&
      new Date(`${dto.publicationDate}T00:00:00.000Z`)
        .toISOString()
        .slice(0, 10) !== dto.publicationDate
    )
      throw new BadRequestException('Invalid publication date');
    return this.persist(() =>
      this.db.$transaction(async (tx) => {
        await this.ownedWork(userId, workId, tx);
        return tx.workEdition.create({
          data: { workId, ...dtoValues(dto), format: dto.format ?? 'WEB' },
        });
      }),
    );
  }
  async deleteEdition(userId: string, workId: string, id: string) {
    await this.persist(() =>
      this.db.workEdition.delete({
        where: { id, workId, work: { ownerUserId: userId } },
      }),
    );
  }
  async series(userId: string, query: PaginationQueryDto) {
    return page(
      await this.db.workSeries.findMany({
        where: { ownerUserId: userId },
        select: seriesSelect,
        orderBy: { id: 'asc' },
        ...pagination(query),
      }),
      query,
      (row) => row,
    );
  }
  async saveSeries(userId: string, dto: SeriesDto, id?: string) {
    return this.persist(() =>
      id
        ? this.db.workSeries.update({
            where: { id, ownerUserId: userId },
            data: dto,
            select: seriesSelect,
          })
        : this.db.workSeries.create({
            data: { ownerUserId: userId, ...dtoValues(dto) },
            select: seriesSelect,
          }),
    );
  }
  async deleteSeries(userId: string, id: string) {
    await this.persist(() =>
      this.db.workSeries.delete({ where: { id, ownerUserId: userId } }),
    );
  }
  async seriesMembers(
    userId: string,
    seriesId: string,
    query: PaginationQueryDto,
  ) {
    if (
      !(await this.db.workSeries.findFirst({
        where: { id: seriesId, ownerUserId: userId },
        select: { id: true },
      }))
    )
      throw new NotFoundException('Series not found');
    return page(
      await this.db.seriesMember.findMany({
        where: { seriesId },
        orderBy: [{ position: 'asc' }, { id: 'asc' }],
        ...pagination(query),
      }),
      query,
      (row) => row,
    );
  }
  async addMember(userId: string, seriesId: string, dto: SeriesMemberDto) {
    return this.persist(() =>
      this.db.$transaction(async (tx) => {
        if (
          !(await tx.workSeries.findFirst({
            where: { id: seriesId, ownerUserId: userId },
            select: { id: true },
          }))
        )
          throw new NotFoundException('Series not found');
        await this.ownedWork(userId, dto.workId, tx);
        return tx.seriesMember.create({
          data: { seriesId, ...dtoValues(dto) },
        });
      }),
    );
  }
  async deleteMember(userId: string, seriesId: string, id: string) {
    await this.persist(() =>
      this.db.seriesMember.delete({
        where: { id, seriesId, series: { ownerUserId: userId } },
      }),
    );
  }
  async relations(userId: string, workId: string, query: PaginationQueryDto) {
    await this.ownedWork(userId, workId);
    return page(
      await this.db.relatedWork.findMany({
        where: { workId },
        orderBy: { id: 'asc' },
        ...pagination(query),
      }),
      query,
      (row) => row,
    );
  }
  async addRelation(userId: string, workId: string, dto: RelatedDto) {
    if (workId === dto.targetWorkId)
      throw new BadRequestException('Cannot relate a work to itself');
    return this.persist(() =>
      this.db.$transaction(async (tx) => {
        await this.ownedWork(userId, workId, tx);
        if (
          !(await tx.work.findFirst({
            where: {
              id: dto.targetWorkId,
              OR: [
                { ownerUserId: userId },
                { releases: { some: { status: 'PUBLISHED' } } },
              ],
            },
            select: { id: true },
          }))
        )
          throw new NotFoundException('Related work not found');
        return tx.relatedWork.create({ data: { workId, ...dtoValues(dto) } });
      }),
    );
  }
  async deleteRelation(userId: string, workId: string, id: string) {
    await this.persist(() =>
      this.db.relatedWork.delete({
        where: { id, workId, work: { ownerUserId: userId } },
      }),
    );
  }
  async createRelease(userId: string, workId: string, dto: CreateReleaseDto) {
    const sourceIds = dto.sourceIds ?? [];
    const documentIds = dto.documentIds ?? [];
    if (!sourceIds.length && !documentIds.length)
      throw new BadRequestException(
        'Select manuscript sources or structured documents',
      );
    return this.persist(() =>
      this.db.$transaction(
        async (tx) => {
          const work = await this.ownedWork(userId, workId, tx);
          if ((await tx.workRelease.count({ where: { workId } })) >= 100)
            throw new ConflictException('Work release quota exceeded');
          const metadata = await tx.workMetadata.findUnique({
            where: { workId },
          });
          if (!metadata)
            throw new ConflictException(
              'Configure public metadata before preparing a release',
            );
          if (metadata.medium !== 'PROSE')
            throw new ConflictException(
              'A prose source requires PROSE metadata',
            );
          const sources = await tx.workSource.findMany({
            where: {
              workId,
              id: { in: sourceIds },
              book: { project: { author: { userId } } },
            },
            include: {
              book: {
                include: {
                  chapters: {
                    take: 201,
                    orderBy: [{ position: 'asc' }, { id: 'asc' }],
                    include: {
                      scenes: {
                        take: 1001,
                        orderBy: [{ position: 'asc' }, { id: 'asc' }],
                      },
                    },
                  },
                },
              },
            },
          });
          if (sources.length !== sourceIds.length)
            throw new NotFoundException('Source not found');
          let textSize = 0,
            blocks = 0,
            sections = 0;
          const sectionData: Prisma.ReleaseSectionCreateWithoutReleaseInput[] =
            sourceIds.flatMap((sourceId) => {
              const source = sources.find((row) => row.id === sourceId)!;
              if (source.book.chapters.length > 200)
                throw new ConflictException('Release chapter limit exceeded');
              return source.book.chapters.map((chapter) => {
                sections++;
                if (sections > 200 || chapter.scenes.length > 1000)
                  throw new ConflictException('Release content limit exceeded');
                const content = chapter.scenes.map((scene, position) => {
                  blocks++;
                  textSize += Buffer.byteLength(scene.content);
                  if (blocks > 1000 || textSize > 4 * 1024 * 1024)
                    throw new ConflictException(
                      'Release content limit exceeded',
                    );
                  return {
                    logicalKey: key(`scene:${scene.id}`),
                    kind: 'PARAGRAPH',
                    text: scene.content,
                    position,
                  };
                });
                return {
                  logicalKey: key(`chapter:${chapter.id}`),
                  groupTitle: source.book.title,
                  title: chapter.title,
                  position: sections - 1,
                  blocks: { create: content },
                };
              });
            });
          const documents = await tx.workDocument.findMany({
            where: { workId, id: { in: documentIds } },
            include: {
              sections: {
                take: 101,
                orderBy: [{ position: 'asc' }, { id: 'asc' }],
                include: {
                  blocks: {
                    take: 101,
                    orderBy: [{ position: 'asc' }, { id: 'asc' }],
                  },
                },
              },
            },
          });
          if (documents.length !== documentIds.length)
            throw new NotFoundException('Document not found');
          for (const documentId of documentIds) {
            const document = documents.find((row) => row.id === documentId)!;
            if (document.sections.length > 100)
              throw new ConflictException('Document section limit exceeded');
            for (const section of document.sections) {
              if (section.blocks.length > 100 || ++sections > 200)
                throw new ConflictException('Release section limit exceeded');
              sectionData.push({
                logicalKey: key(`document-section:${section.id}`),
                groupTitle: document.title,
                title: section.title,
                position: sections - 1,
                blocks: {
                  create: section.blocks.map((block, position) => {
                    textSize += Buffer.byteLength(block.text);
                    if (++blocks > 1000 || textSize > 4 * 1024 * 1024)
                      throw new ConflictException(
                        'Release content limit exceeded',
                      );
                    return {
                      logicalKey: key(`document-block:${block.id}`),
                      text: block.text,
                      kind: block.kind,
                      position,
                      footnoteLabel: block.footnoteLabel
                        ? `${key(document.id).slice(0, 16)}-${block.footnoteLabel}`
                        : null,
                      referenceLabel: block.referenceLabel
                        ? `${key(document.id).slice(0, 16)}-${block.referenceLabel}`
                        : null,
                    };
                  }),
                },
              });
            }
          }
          if (!blocks || !textSize)
            throw new ConflictException('Release must contain text');
          const credits = await tx.workCredit.findMany({
            where: { workId },
            orderBy: [{ position: 'asc' }, { id: 'asc' }],
            take: 31,
          });
          if (!credits.length || credits.length > 30)
            throw new ConflictException(
              'A release requires between one and thirty credits',
            );
          const edition = dto.editionId
            ? await tx.workEdition.findFirst({
                where: { id: dto.editionId, workId },
              })
            : undefined;
          if (dto.editionId && !edition)
            throw new NotFoundException('Edition not found');
          const version = await this.nextVersion(tx, userId, workId);
          const supplements = await this.prepareSupplements(
            tx,
            userId,
            workId,
            dto,
          );
          const assetIds = [
            ...new Set([
              ...(dto.assetIds ?? []),
              ...(metadata.coverAssetId ? [metadata.coverAssetId] : []),
              ...(dto.supplements ?? []).flatMap((item) =>
                item.assetId ? [item.assetId] : [],
              ),
            ]),
          ];
          if (
            (await tx.workAsset.count({
              where: { workId, id: { in: assetIds }, status: 'COMPLETED' },
            })) !== assetIds.length
          )
            throw new NotFoundException('Processed release asset not found');
          const related = await tx.relatedWork.findMany({
            where: {
              workId,
              id: { in: dto.relatedIds ?? [] },
              target: { releases: { some: { status: 'PUBLISHED' } } },
            },
            select: { targetWorkId: true, kind: true },
          });
          if (related.length !== (dto.relatedIds ?? []).length)
            throw new NotFoundException('Eligible related work not found');
          return tx.workRelease.create({
            data: {
              workId,
              version,
              title: work.title,
              subtitle: metadata.subtitle,
              synopsis: metadata.synopsis,
              language: metadata.language,
              medium: metadata.medium,
              form: metadata.form,
              genres: metadata.genres,
              topics: metadata.topics,
              warnings: metadata.warnings,
              ...(edition
                ? {
                    edition: {
                      label: edition.label,
                      language: edition.language,
                      format: edition.format,
                      publisher: edition.publisher,
                      publicationDate: edition.publicationDate,
                      isbn13: edition.isbn13,
                      doi: edition.doi,
                    },
                  }
                : {}),
              sections: { create: sectionData },
              credits: {
                create: credits.map((credit) => ({
                  creatorId: credit.creatorId,
                  displayName: credit.displayName,
                  role: credit.role,
                  position: credit.position,
                })),
              },
              supplements: { create: supplements },
              coverAssetId: metadata.coverAssetId,
              assets: { create: assetIds.map((assetId) => ({ assetId })) },
              relatedWorks: { create: related },
            },
          });
        },
        {
          isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
          timeout: 15000,
        },
      ),
    );
  }
  async prepareSupplements(
    tx: Prisma.TransactionClient,
    userId: string,
    workId: string,
    dto: CreateReleaseDto,
  ) {
    const selection = dto.supplements ?? [];
    if (
      new Set(selection.map((item) => `${item.kind}:${item.id}`)).size !==
      selection.length
    )
      throw new BadRequestException('Duplicate supplement selection');
    const rows: Prisma.ReleaseSupplementCreateWithoutReleaseInput[] = [];
    const named = new Map<string, { name: string; id: string }>();
    for (const item of selection.filter(
      (item) => item.kind !== 'RELATIONSHIP',
    )) {
      await this.ownedProject(userId, item.projectId, tx);
      if (
        !(await tx.workSource.findFirst({
          where: { workId, projectId: item.projectId },
          select: { id: true },
        }))
      )
        throw new NotFoundException('Supplement project is not linked to work');
      const where = { id: item.id, projectId: item.projectId };
      if (item.kind === 'MAP') {
        const map = await tx.projectMap.findFirst({
          where,
          include: {
            pins: { take: 1001, orderBy: { id: 'asc' } },
            regions: { take: 101, orderBy: { id: 'asc' } },
          },
        });
        if (!map || !item.assetId)
          throw new NotFoundException(
            'Map and explicit processed image are required',
          );
        if (map.pins.length > 1000 || map.regions.length > 100)
          throw new ConflictException('Map content limit exceeded');
        rows.push({
          kind: 'MAP',
          title: map.title,
          text: '',
          position: rows.length,
          data: {
            assetId: item.assetId,
            pins: map.pins.map((pin) => ({
              label: pin.label,
              x: pin.x,
              y: pin.y,
            })),
            regions: map.regions.map((region) => ({
              label: region.label,
              color: region.color,
              points: region.points as Prisma.InputJsonValue,
            })),
          },
        });
        continue;
      }
      const select = { name: true, summary: true, description: true } as const;
      let entity: {
        name: string;
        summary: string | null;
        description: string | null;
      } | null = null;
      let projection: Prisma.InputJsonValue | undefined;
      if (item.kind === 'CHARACTER')
        entity = await tx.character.findFirst({ where, select });
      if (item.kind === 'PLACE')
        entity = await tx.place.findFirst({ where, select });
      if (item.kind === 'FACTION')
        entity = await tx.faction.findFirst({ where, select });
      if (item.kind === 'ARTIFACT')
        entity = await tx.artifact.findFirst({ where, select });
      if (item.kind === 'TIMELINE_EVENT') {
        const event = await tx.timelineEvent.findFirst({
          where,
          select: {
            title: true,
            summary: true,
            description: true,
            start: true,
            end: true,
            dateLabel: true,
          },
        });
        if (!event) throw new NotFoundException('Event not found');
        projection = {
          start: event.start.toFixed(6),
          end: event.end?.toFixed(6) ?? null,
          dateLabel: event.dateLabel,
        };
        entity = {
          name: event.title,
          summary: [
            event.dateLabel,
            `Start: ${event.start.toFixed(6)}`,
            event.end ? `End: ${event.end.toFixed(6)}` : '',
            event.summary,
          ]
            .filter(Boolean)
            .join('\n'),
          description: event.description,
        };
      }
      if (!entity) throw new NotFoundException('Supplement not found');
      const supplementId = randomUUID();
      named.set(`${item.kind}:${item.id}`, {
        name: entity.name,
        id: supplementId,
      });
      rows.push({
        id: supplementId,
        data: projection,
        kind: item.kind,
        title: entity.name,
        text: [
          entity.summary,
          item.includeDescription ? entity.description : null,
        ]
          .filter(Boolean)
          .join('\n\n'),
        position: rows.length,
      });
    }
    for (const item of selection.filter(
      (item) => item.kind === 'RELATIONSHIP',
    )) {
      const relationship = await tx.relationship.findFirst({
        where: {
          id: item.id,
          projectId: item.projectId,
          project: { author: { userId } },
        },
      });
      if (!relationship) throw new NotFoundException('Relationship not found');
      const sourceId =
        relationship.sourceCharacterId ??
        relationship.sourcePlaceId ??
        relationship.sourceFactionId ??
        relationship.sourceArtifactId;
      const targetId =
        relationship.targetCharacterId ??
        relationship.targetPlaceId ??
        relationship.targetFactionId ??
        relationship.targetArtifactId;
      const source = named.get(`${relationship.sourceKind}:${sourceId}`),
        target = named.get(`${relationship.targetKind}:${targetId}`);
      if (!source || !target)
        throw new BadRequestException(
          'Release both relationship endpoints explicitly',
        );
      rows.push({
        kind: 'RELATIONSHIP',
        title: relationship.label,
        text: `${source.name} ${relationship.direction === 'SYMMETRIC' ? '↔' : '→'} ${target.name}${item.includeDescription && relationship.description ? `\n\n${relationship.description}` : ''}`,
        data: {
          sourceSupplementId: source.id,
          targetSupplementId: target.id,
          direction: relationship.direction,
        },
        position: rows.length,
      });
    }
    if (dto.includeBibliography) {
      const citations = await tx.researchCitation.findMany({
        where: {
          block: {
            section: {
              document: { workId, id: { in: dto.documentIds ?? [] } },
            },
          },
          source: { project: { author: { userId } } },
        },
        take: 101,
        include: { source: true },
      });
      if (citations.length > 100)
        throw new ConflictException('Release bibliography limit exceeded');
      for (const citation of citations)
        rows.push({
          kind: 'REFERENCE',
          title: citation.source.title,
          text: [
            citation.source.authors.join(', '),
            citation.source.publisher,
            citation.source.publicationDate,
            citation.source.identifier,
            citation.source.url,
            citation.locator,
          ]
            .filter(Boolean)
            .join('\n'),
          position: rows.length,
        });
    }
    if (
      rows.reduce((sum, row) => sum + Buffer.byteLength(row.text), 0) >
      1024 * 1024
    )
      throw new ConflictException('Release supplement size exceeded');
    return rows;
  }
  async supplements(releaseId: string, query: PaginationQueryDto) {
    await this.eligible(releaseId);
    return page(
      await this.db.releaseSupplement.findMany({
        where: { releaseId, release: { status: 'PUBLISHED' } },
        orderBy: [{ position: 'asc' }, { id: 'asc' }],
        ...pagination(query),
      }),
      query,
      (row) => row,
    );
  }
  async preview(
    userId: string,
    workId: string,
    id: string,
    query: PaginationQueryDto,
  ) {
    if (
      !(await this.db.workRelease.findFirst({
        where: { id, workId, work: { ownerUserId: userId } },
        select: { id: true },
      }))
    )
      throw new NotFoundException('Release not found');
    return page(
      await this.db.releaseSection.findMany({
        where: {
          releaseId: id,
          release: { workId, work: { ownerUserId: userId } },
        },
        select: {
          id: true,
          releaseId: true,
          groupTitle: true,
          title: true,
          position: true,
          blocks: {
            select: {
              id: true,
              sectionId: true,
              kind: true,
              text: true,
              position: true,
              footnoteLabel: true,
              referenceLabel: true,
            },
            orderBy: [{ position: 'asc' }, { id: 'asc' }],
            take: 1000,
          },
        },
        orderBy: [{ position: 'asc' }, { id: 'asc' }],
        ...pagination(query),
      }),
      query,
      (row) => row,
    );
  }
  async releases(userId: string, workId: string, query: PaginationQueryDto) {
    await this.ownedWork(userId, workId);
    return page(
      await this.db.workRelease.findMany({
        where: { workId },
        orderBy: [{ version: 'desc' }, { id: 'asc' }],
        ...pagination(query),
      }),
      query,
      (row) => row,
    );
  }
  async releaseDetail(userId: string, workId: string, id: string) {
    const row = await this.db.workRelease.findFirst({
      where: { id, workId, work: { ownerUserId: userId } },
      include: {
        credits: {
          take: 30,
          orderBy: [{ position: 'asc' }, { id: 'asc' }],
          include: { creator: { select: { public: true, handle: true } } },
        },
        assets: { take: 550, select: { assetId: true } },
        supplements: {
          take: 200,
          orderBy: [{ position: 'asc' }, { id: 'asc' }],
        },
        _count: { select: { sections: true, graphicPages: true } },
      },
    });
    if (!row) throw new NotFoundException('Release not found');
    const { _count, credits, ...release } = row;
    return {
      ...release,
      sectionCount: _count.sections,
      graphicPageCount: _count.graphicPages,
      credits: credits.map((credit) => ({
        displayName: credit.displayName,
        role: credit.role,
        position: credit.position,
        creatorHandle: credit.creator?.public ? credit.creator.handle : null,
      })),
    };
  }
  async deleteRelease(userId: string, workId: string, id: string) {
    await this.persist(() =>
      this.db.$transaction(
        async (tx) => {
          const release = await tx.workRelease.findFirst({
            where: { id, workId, work: { ownerUserId: userId } },
            select: { status: true },
          });
          if (!release) throw new NotFoundException('Release not found');
          if (release.status === 'PUBLISHED')
            throw new ConflictException(
              'Withdraw a release before deleting it',
            );
          await tx.workRelease.delete({
            where: {
              id,
              workId,
              status: { in: ['DRAFT', 'WITHDRAWN'] },
              work: { ownerUserId: userId },
            },
          });
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
      ),
    );
  }
  async transition(
    userId: string,
    workId: string,
    id: string,
    publish: boolean,
  ) {
    return this.persist(async () => {
      const changed = await this.db.workRelease.updateMany({
        where: {
          id,
          workId,
          work: { ownerUserId: userId },
          status: publish ? 'DRAFT' : 'PUBLISHED',
        },
        data: publish
          ? { status: 'PUBLISHED', publishedAt: new Date() }
          : { status: 'WITHDRAWN', withdrawnAt: new Date() },
      });
      if (!changed.count) {
        if (
          !(await this.db.workRelease.findFirst({
            where: { id, workId, work: { ownerUserId: userId } },
            select: { id: true },
          }))
        )
          throw new NotFoundException('Release not found');
        throw new ConflictException('Invalid release transition');
      }
      return this.db.workRelease.findUniqueOrThrow({ where: { id } });
    });
  }
  async eligible(releaseId: string, tx: Prisma.TransactionClient = this.db) {
    const row = await tx.workRelease.findFirst({
      where: { id: releaseId, status: 'PUBLISHED' },
    });
    if (!row) throw new NotFoundException('Published release not found');
    return row;
  }
  async catalog(query: CatalogQueryDto, creatorHandle?: string) {
    return page(
      await this.db.workRelease.findMany({
        where: {
          status: 'PUBLISHED',
          ...(query.medium ? { medium: query.medium } : {}),
          ...(query.language ? { language: query.language } : {}),
          ...(query.genre ? { genres: { has: query.genre } } : {}),
          ...(query.topic ? { topics: { has: query.topic } } : {}),
          ...(creatorHandle
            ? {
                credits: {
                  some: { creator: { handle: creatorHandle, public: true } },
                },
              }
            : {}),
          ...(query.q
            ? {
                OR: [
                  { title: contains(query.q) },
                  { synopsis: contains(query.q) },
                ],
              }
            : {}),
        },
        orderBy: [
          query.sort === 'title'
            ? { title: query.order ?? 'asc' }
            : { publishedAt: query.order ?? 'desc' },
          { id: 'asc' },
        ],
        ...pagination(query),
      }),
      query,
      (row) => row,
    );
  }
  async releaseCredits(releaseId: string) {
    await this.eligible(releaseId);
    const rows = await this.db.releaseCredit.findMany({
      where: { releaseId, release: { status: 'PUBLISHED' } },
      take: 30,
      orderBy: [{ position: 'asc' }, { id: 'asc' }],
      include: { creator: { select: { handle: true, public: true } } },
    });
    return rows.map((row) => ({
      displayName: row.displayName,
      role: row.role,
      position: row.position,
      creatorHandle: row.creator?.public ? row.creator.handle : null,
    }));
  }
  async publicWork(workId: string) {
    const release = await this.db.workRelease.findFirst({
      where: { workId, status: 'PUBLISHED' },
      orderBy: { version: 'desc' },
    });
    if (!release) throw new NotFoundException('Published work not found');
    return release;
  }
  async publicWorkReleases(workId: string, query: PaginationQueryDto) {
    await this.publicWork(workId);
    return page(
      await this.db.workRelease.findMany({
        where: { workId, status: 'PUBLISHED' },
        orderBy: [{ version: 'desc' }, { id: 'asc' }],
        ...pagination(query),
      }),
      query,
      (row) => row,
    );
  }
  async publicRelated(releaseId: string, query: PaginationQueryDto) {
    await this.eligible(releaseId);
    const rows = await this.db.releaseRelatedWork.findMany({
      where: { releaseId, release: { status: 'PUBLISHED' } },
      take: 20,
      orderBy: { id: 'asc' },
    });
    const targets = await this.db.workRelease.findMany({
      where: {
        workId: { in: rows.map((row) => row.targetWorkId) },
        status: 'PUBLISHED',
      },
      select: { workId: true, id: true, title: true, version: true },
      orderBy: { version: 'desc' },
      take: 2000,
    });
    const eligible = rows.flatMap((row) => {
      const target = targets.find(
        (target) => target.workId === row.targetWorkId,
      );
      return target
        ? [
            {
              targetWorkId: row.targetWorkId,
              kind: row.kind,
              releaseId: target.id,
              title: target.title,
            },
          ]
        : [];
    });
    return page(
      eligible.slice(
        query.offset ?? 0,
        (query.offset ?? 0) + (query.limit ?? 50) + 1,
      ),
      query,
      (row) => row,
    );
  }
  async publicSeries(id: string, query: PaginationQueryDto) {
    const series = await this.db.workSeries.findFirst({
      where: { id, public: true },
      select: seriesSelect,
    });
    if (!series) throw new NotFoundException('Series not found');
    return {
      ...series,
      members: page(
        await this.db.seriesMember.findMany({
          where: {
            seriesId: id,
            series: { public: true },
            work: { releases: { some: { status: 'PUBLISHED' } } },
          },
          select: { workId: true, position: true, label: true },
          orderBy: [{ position: 'asc' }, { id: 'asc' }],
          ...pagination(query),
        }),
        query,
        (row) => row,
      ),
    };
  }
  async sections(releaseId: string, query: PaginationQueryDto) {
    await this.eligible(releaseId);
    return page(
      await this.db.releaseSection.findMany({
        where: { releaseId, release: { status: 'PUBLISHED' } },
        select: {
          id: true,
          releaseId: true,
          groupTitle: true,
          title: true,
          position: true,
        },
        orderBy: [{ position: 'asc' }, { id: 'asc' }],
        ...pagination(query),
      }),
      query,
      (row) => row,
    );
  }
  async blocks(
    releaseId: string,
    sectionId: string,
    query: PaginationQueryDto,
  ) {
    if (
      !(await this.db.releaseSection.findFirst({
        where: { id: sectionId, releaseId, release: { status: 'PUBLISHED' } },
        select: { id: true },
      }))
    )
      throw new NotFoundException('Section not found');
    return page(
      await this.db.releaseBlock.findMany({
        where: {
          sectionId,
          section: { releaseId, release: { status: 'PUBLISHED' } },
        },
        select: {
          id: true,
          sectionId: true,
          kind: true,
          text: true,
          position: true,
          footnoteLabel: true,
          referenceLabel: true,
        },
        orderBy: [{ position: 'asc' }, { id: 'asc' }],
        ...pagination(query),
      }),
      query,
      (row) => row,
    );
  }
}
