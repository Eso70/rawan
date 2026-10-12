import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
  PayloadTooLargeException,
  ServiceUnavailableException,
  StreamableFile,
} from '@nestjs/common';
import {
  ARTIFACT_LIMIT,
  bounded,
  readBounded,
  STORAGE_PROVIDER,
  type StorageProvider,
} from '@rawan/backend';
import { Prisma } from '@rawan/database';
import { createHash, randomUUID } from 'node:crypto';
import { Readable } from 'node:stream';
import { dtoValues } from '../contracts/dto-values.js';
import { PrismaService } from '../database/prisma.service.js';
import { PublicationService } from '../publication/publication.service.js';
import { PaginationQueryDto } from '../query/query.dto.js';
import { page, pagination } from '../query/query.js';
import {
  AppearanceDto,
  ComicDto,
  ComicPageDto,
  ExportDto,
  GraphicReleaseDto,
  ImportAssetDto,
  PanelsDto,
  ScriptDto,
  UpdateComicPageDto,
} from './graphics.dto.js';

const assetSelect = {
  id: true,
  workId: true,
  status: true,
  attempts: true,
  errorCode: true,
  blobs: {
    where: { ready: true, role: { not: 'ORIGINAL' } },
    select: {
      role: true,
      width: true,
      height: true,
      mimeType: true,
      sizeBytes: true,
    },
  },
} as const;
const assetResponse = (
  row: Prisma.WorkAssetGetPayload<{ select: typeof assetSelect }>,
) => {
  const { blobs, ...asset } = row;
  return { ...asset, renditions: blobs };
};
const exportSelect = {
  id: true,
  workId: true,
  format: true,
  sourceReleaseId: true,
  status: true,
  attempts: true,
  errorCode: true,
  createdAt: true,
  completedAt: true,
} as const;
const hash = (value: string) =>
  createHash('sha256').update(value).digest('hex');

@Injectable()
export class GraphicsService {
  constructor(
    private readonly db: PrismaService,
    private readonly publication: PublicationService,
    @Inject(STORAGE_PROVIDER) private readonly storage: StorageProvider,
  ) {}

  async assets(userId: string, workId: string, query: PaginationQueryDto) {
    await this.publication.ownedWork(userId, workId);
    return page(
      await this.db.workAsset.findMany({
        where: { workId },
        select: assetSelect,
        orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
        ...pagination(query),
      }),
      query,
      assetResponse,
    );
  }
  async asset(userId: string, workId: string, id: string) {
    const row = await this.db.workAsset.findFirst({
      where: { id, workId, work: { ownerUserId: userId } },
      select: assetSelect,
    });
    if (!row) throw new NotFoundException('Asset not found');
    return assetResponse(row);
  }
  async importAsset(userId: string, workId: string, dto: ImportAssetDto) {
    await this.publication.ownedWork(userId, workId);
    const media = await this.db.media.findFirst({
      where: {
        id: dto.mediaId,
        project: { author: { userId } },
        mimeType: { in: ['image/png', 'image/jpeg', 'image/webp'] },
      },
      select: { sizeBytes: true, storageKey: true, mimeType: true },
    });
    if (!media) throw new NotFoundException('Image not found');
    if (media.sizeBytes > ARTIFACT_LIMIT)
      throw new PayloadTooLargeException('Artwork exceeds 10 MiB');
    let bytes: Buffer;
    try {
      bytes = await bounded(
        readBounded(
          (await bounded(this.storage.read(media.storageKey), 10000)).stream,
        ),
        10000,
      );
    } catch {
      throw new ServiceUnavailableException('Image storage unavailable');
    }
    const id = randomUUID(),
      storageKey = randomUUID();
    await this.publication.persist(() =>
      this.db.$transaction(
        async (tx) => {
          await this.publication.ownedWork(userId, workId, tx);
          const aggregate = await tx.artifactBlob.aggregate({
            where: { asset: { workId }, role: 'ORIGINAL' },
            _sum: { sizeBytes: true },
            _count: { id: true },
          });
          if (
            aggregate._count.id >= 500 ||
            (aggregate._sum.sizeBytes ?? 0) + bytes.length > 512 * 1024 * 1024
          )
            throw new ConflictException('Work artwork quota exceeded');
          await tx.workAsset.create({
            data: {
              id,
              workId,
              blobs: {
                create: {
                  id: storageKey,
                  storageKey,
                  role: 'ORIGINAL',
                  mimeType: media.mimeType,
                  sizeBytes: bytes.length,
                },
              },
            },
          });
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
      ),
    );
    try {
      await bounded(
        this.storage.put(storageKey, Readable.from([bytes])),
        30000,
      );
      await this.db.$transaction(async (tx) => {
        await tx.workAsset.update({
          where: { id, workId, work: { ownerUserId: userId } },
          data: { originalReady: true },
        });
        await tx.artifactBlob.updateMany({
          where: { id: storageKey, assetId: id },
          data: { ready: true },
        });
      });
    } catch {
      await this.db.workAsset.deleteMany({
        where: { id, workId, originalReady: false },
      });
      throw new ServiceUnavailableException('Artwork import failed');
    }
    return this.asset(userId, workId, id);
  }
  async deleteAsset(userId: string, workId: string, id: string) {
    await this.publication.persist(() =>
      this.db.$transaction(
        async (tx) => {
          const asset = await tx.workAsset.findFirst({
            where: { id, workId, work: { ownerUserId: userId } },
            select: { id: true },
          });
          if (!asset) throw new NotFoundException('Asset not found');
          if (
            (await tx.releaseAsset.count({ where: { assetId: id } })) ||
            (await tx.comicPage.count({ where: { assetId: id } })) ||
            (await tx.workMetadata.count({ where: { coverAssetId: id } })) ||
            (await tx.creatorIdentity.count({ where: { avatarAssetId: id } }))
          )
            throw new ConflictException(
              'Asset is referenced by content; remove references first',
            );
          await tx.workAsset.delete({ where: { id } });
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
      ),
    );
  }
  async streamBlob(
    blob: { storageKey: string; mimeType: string },
    filename?: string,
  ) {
    try {
      const output = await bounded(this.storage.read(blob.storageKey), 10000);
      return new StreamableFile(output.stream, {
        type: blob.mimeType,
        length: output.sizeBytes,
        ...(filename
          ? { disposition: `attachment; filename="${filename}"` }
          : {}),
      });
    } catch {
      throw new ServiceUnavailableException('Artifact storage unavailable');
    }
  }
  async assetFile(userId: string, workId: string, id: string, role: string) {
    this.role(role);
    const blob = await this.db.artifactBlob.findFirst({
      where: {
        assetId: id,
        role,
        ready: true,
        asset: { workId, status: 'COMPLETED', work: { ownerUserId: userId } },
      },
      select: { storageKey: true, mimeType: true },
    });
    if (!blob) throw new NotFoundException('Rendition not found');
    return this.streamBlob(blob);
  }
  role(role: string) {
    if (!['FULL', 'DISPLAY', 'THUMBNAIL'].includes(role))
      throw new BadRequestException('Unsupported rendition');
  }
  async avatar(handle: string, role: string) {
    this.role(role);
    const creator = await this.db.creatorIdentity.findFirst({
      where: { handle, public: true },
      select: { avatarAssetId: true, ownerUserId: true },
    });
    if (!creator?.avatarAssetId)
      throw new NotFoundException('Avatar not found');
    const blob = await this.db.artifactBlob.findFirst({
      where: {
        assetId: creator.avatarAssetId,
        role,
        ready: true,
        asset: {
          status: 'COMPLETED',
          work: { ownerUserId: creator.ownerUserId },
        },
      },
      select: { storageKey: true, mimeType: true },
    });
    if (!blob) throw new NotFoundException('Avatar not found');
    return this.streamBlob(blob);
  }
  async publicAsset(releaseId: string, assetId: string, role: string) {
    this.role(role);
    const blob = await this.db.artifactBlob.findFirst({
      where: {
        assetId,
        role,
        ready: true,
        asset: {
          status: 'COMPLETED',
          releaseAssets: {
            some: { releaseId, release: { status: 'PUBLISHED' } },
          },
        },
      },
      select: { storageKey: true, mimeType: true },
    });
    if (!blob) throw new NotFoundException('Published rendition not found');
    return this.streamBlob(blob);
  }
  async publicRenditions(releaseId: string, assetId: string) {
    if (
      !(await this.db.releaseAsset.findFirst({
        where: { releaseId, assetId, release: { status: 'PUBLISHED' } },
        select: { id: true },
      }))
    )
      throw new NotFoundException('Published asset not found');
    return this.db.artifactBlob.findMany({
      where: {
        assetId,
        ready: true,
        role: { not: 'ORIGINAL' },
        asset: { status: 'COMPLETED' },
      },
      select: {
        role: true,
        width: true,
        height: true,
        mimeType: true,
        sizeBytes: true,
      },
      take: 3,
      orderBy: { role: 'asc' },
    });
  }
  async comics(userId: string, workId: string, query: PaginationQueryDto) {
    await this.publication.ownedWork(userId, workId);
    return page(
      await this.db.comicDocument.findMany({
        where: { workId },
        orderBy: { id: 'asc' },
        ...pagination(query),
      }),
      query,
      (row) => row,
    );
  }
  async releasedAssets(releaseId: string, query: PaginationQueryDto) {
    await this.publication.eligible(releaseId);
    return page(
      await this.db.releaseAsset.findMany({
        where: { releaseId, release: { status: 'PUBLISHED' } },
        select: { assetId: true },
        orderBy: { id: 'asc' },
        ...pagination(query),
      }),
      query,
      (row) => row,
    );
  }
  async saveComic(userId: string, workId: string, dto: ComicDto, id?: string) {
    return this.publication.persist(() =>
      this.db.$transaction(async (tx) => {
        await this.publication.ownedWork(userId, workId, tx);
        return id
          ? tx.comicDocument.update({
              where: { id, workId },
              data: { ...dtoValues(dto), revision: { increment: 1 } },
            })
          : tx.comicDocument.create({ data: { workId, ...dtoValues(dto) } });
      }),
    );
  }
  async deleteComic(userId: string, workId: string, id: string) {
    await this.publication.persist(() =>
      this.db.comicDocument.delete({
        where: { id, workId, work: { ownerUserId: userId } },
      }),
    );
  }
  async ownedComic(
    tx: Prisma.TransactionClient,
    userId: string,
    workId: string,
    comicId: string,
  ) {
    const comic = await tx.comicDocument.findFirst({
      where: { id: comicId, workId, work: { ownerUserId: userId } },
    });
    if (!comic) throw new NotFoundException('Comic not found');
    return comic;
  }
  async ownedPage(
    tx: Prisma.TransactionClient,
    userId: string,
    workId: string,
    comicId: string,
    id: string,
  ) {
    const row = await tx.comicPage.findFirst({
      where: { id, comicId, comic: { workId, work: { ownerUserId: userId } } },
    });
    if (!row) throw new NotFoundException('Comic page not found');
    return row;
  }
  async pages(
    userId: string,
    workId: string,
    comicId: string,
    query: PaginationQueryDto,
  ) {
    await this.ownedComic(this.db, userId, workId, comicId);
    return page(
      await this.db.comicPage.findMany({
        where: { comicId },
        orderBy: [{ position: 'asc' }, { id: 'asc' }],
        ...pagination(query),
      }),
      query,
      (row) => row,
    );
  }
  async page(userId: string, workId: string, comicId: string, id: string) {
    const row = await this.db.comicPage.findFirst({
      where: { id, comicId, comic: { workId, work: { ownerUserId: userId } } },
      include: {
        panels: { take: 100, orderBy: [{ position: 'asc' }, { id: 'asc' }] },
        scripts: { take: 100, orderBy: [{ position: 'asc' }, { id: 'asc' }] },
        appearances: { take: 100, orderBy: { id: 'asc' } },
      },
    });
    if (!row) throw new NotFoundException('Comic page not found');
    return row;
  }
  async savePage(
    userId: string,
    workId: string,
    comicId: string,
    dto: ComicPageDto | UpdateComicPageDto,
    id?: string,
  ) {
    return this.publication.persist(() =>
      this.db.$transaction(
        async (tx) => {
          const comic = await this.ownedComic(tx, userId, workId, comicId);
          if (
            !(await tx.workAsset.findFirst({
              where: { id: dto.assetId, workId, status: 'COMPLETED' },
              select: { id: true },
            }))
          )
            throw new NotFoundException('Processed artwork not found');
          if (comic.layout === 'VERTICAL' && dto.spreadGroup)
            throw new BadRequestException(
              'Vertical segments cannot belong to spreads',
            );
          if (!id && (await tx.comicPage.count({ where: { comicId } })) >= 500)
            throw new ConflictException('Comic page limit exceeded');
          const data = {
            assetId: dto.assetId,
            position: dto.position,
            altText: dto.altText,
            transcript: dto.transcript,
            spreadGroup: dto.spreadGroup ?? null,
          };
          if (!id) return tx.comicPage.create({ data: { comicId, ...data } });
          const old = await this.ownedPage(tx, userId, workId, comicId, id);
          const expectedRevision = (dto as UpdateComicPageDto).expectedRevision;
          if (old.revision !== expectedRevision)
            throw new ConflictException(
              'Comic page changed; reload before retrying',
            );
          if (old.assetId !== dto.assetId)
            await tx.comicPanel.deleteMany({ where: { pageId: id } });
          return tx.comicPage.update({
            where: { id, revision: expectedRevision },
            data: { ...data, revision: { increment: 1 } },
          });
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
      ),
    );
  }
  async deletePage(
    userId: string,
    workId: string,
    comicId: string,
    id: string,
  ) {
    await this.publication.persist(() =>
      this.db.comicPage.delete({
        where: {
          id,
          comicId,
          comic: { workId, work: { ownerUserId: userId } },
        },
      }),
    );
  }
  async panels(
    userId: string,
    workId: string,
    comicId: string,
    id: string,
    dto: PanelsDto,
  ) {
    if (
      dto.panels.some(
        (panel) => panel.x + panel.width > 1 || panel.y + panel.height > 1,
      ) ||
      new Set(dto.panels.map((panel) => panel.position)).size !==
        dto.panels.length
    )
      throw new BadRequestException('Invalid panel geometry or order');
    return this.publication.persist(() =>
      this.db.$transaction(
        async (tx) => {
          const old = await this.ownedPage(tx, userId, workId, comicId, id);
          if (old.revision !== dto.expectedRevision)
            throw new ConflictException(
              'Comic page changed; reload before retrying',
            );
          await tx.comicPage.update({
            where: { id, revision: dto.expectedRevision },
            data: { revision: { increment: 1 } },
          });
          await tx.comicPanel.deleteMany({ where: { pageId: id } });
          await tx.comicPanel.createMany({
            data: dto.panels.map((panel) => ({
              ...dtoValues(panel),
              pageId: id,
            })),
          });
          return tx.comicPanel.findMany({
            where: { pageId: id },
            orderBy: [{ position: 'asc' }, { id: 'asc' }],
          });
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
      ),
    );
  }
  async script(
    userId: string,
    workId: string,
    comicId: string,
    pageId: string,
    dto: ScriptDto,
  ) {
    return this.publication.persist(() =>
      this.db.$transaction(
        async (tx) => {
          await this.ownedPage(tx, userId, workId, comicId, pageId);
          if ((await tx.comicScript.count({ where: { pageId } })) >= 100)
            throw new ConflictException('Script component limit reached');
          return tx.comicScript.create({ data: { pageId, ...dtoValues(dto) } });
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
      ),
    );
  }
  async appearance(
    userId: string,
    workId: string,
    comicId: string,
    pageId: string,
    dto: AppearanceDto,
  ) {
    return this.publication.persist(() =>
      this.db.$transaction(
        async (tx) => {
          await this.ownedPage(tx, userId, workId, comicId, pageId);
          await this.publication.ownedProject(userId, dto.projectId, tx);
          const where = { id: dto.entityId, projectId: dto.projectId };
          const found =
            dto.kind === 'CHARACTER'
              ? await tx.character.findFirst({ where, select: { id: true } })
              : await tx.place.findFirst({ where, select: { id: true } });
          if (!found)
            throw new NotFoundException('Appearance entity not found');
          if ((await tx.comicAppearance.count({ where: { pageId } })) >= 100)
            throw new ConflictException('Appearance limit reached');
          return tx.comicAppearance.create({
            data: { pageId, ...dtoValues(dto) },
          });
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
      ),
    );
  }
  async deleteScript(
    userId: string,
    workId: string,
    comicId: string,
    pageId: string,
    id: string,
  ) {
    await this.publication.persist(() =>
      this.db.comicScript.delete({
        where: {
          id,
          pageId,
          page: { comicId, comic: { workId, work: { ownerUserId: userId } } },
        },
      }),
    );
  }
  async deleteAppearance(
    userId: string,
    workId: string,
    comicId: string,
    pageId: string,
    id: string,
  ) {
    await this.publication.persist(() =>
      this.db.comicAppearance.delete({
        where: {
          id,
          pageId,
          page: { comicId, comic: { workId, work: { ownerUserId: userId } } },
        },
      }),
    );
  }
  async graphicRelease(userId: string, workId: string, dto: GraphicReleaseDto) {
    return this.publication.persist(() =>
      this.db.$transaction(
        async (tx) => {
          const work = await this.publication.ownedWork(userId, workId, tx);
          if ((await tx.workRelease.count({ where: { workId } })) >= 100)
            throw new ConflictException('Work release quota exceeded');
          const metadata = await tx.workMetadata.findUnique({
            where: { workId },
          });
          if (!metadata || metadata.medium !== 'GRAPHIC')
            throw new ConflictException('Configure GRAPHIC metadata first');
          const comic = await this.ownedComic(tx, userId, workId, dto.comicId);
          const pages = await tx.comicPage.findMany({
            where: { comicId: comic.id },
            take: 501,
            orderBy: [{ position: 'asc' }, { id: 'asc' }],
            include: {
              asset: { select: { status: true } },
              panels: {
                take: 101,
                orderBy: [{ position: 'asc' }, { id: 'asc' }],
              },
            },
          });
          if (
            !pages.length ||
            pages.length > 500 ||
            pages.some(
              (page) =>
                page.asset.status !== 'COMPLETED' || page.panels.length > 100,
            )
          )
            throw new ConflictException(
              'Graphic release requires one to five hundred processed pages',
            );
          if (
            pages.reduce(
              (sum, page) =>
                sum +
                Buffer.byteLength(page.transcript) +
                Buffer.byteLength(page.altText),
              0,
            ) >
            4 * 1024 * 1024
          )
            throw new ConflictException('Graphic transcript limit exceeded');
          const spreads = new Map<string, number[]>();
          for (const [i, page] of pages.entries())
            if (page.spreadGroup)
              spreads.set(page.spreadGroup, [
                ...(spreads.get(page.spreadGroup) ?? []),
                i,
              ]);
          if (
            [...spreads.values()].some(
              (indices) =>
                comic.layout === 'VERTICAL' ||
                indices.length !== 2 ||
                indices[1] !== indices[0] + 1,
            )
          )
            throw new BadRequestException(
              'Spreads require exactly two consecutive pages',
            );
          const credits = await tx.workCredit.findMany({
            where: { workId },
            take: 31,
            orderBy: [{ position: 'asc' }, { id: 'asc' }],
          });
          if (!credits.length || credits.length > 30)
            throw new ConflictException('A release requires credits');
          const edition = dto.editionId
            ? await tx.workEdition.findFirst({
                where: { id: dto.editionId, workId },
              })
            : null;
          if (dto.editionId && !edition)
            throw new NotFoundException('Edition not found');
          const version = await this.publication.nextVersion(
            tx,
            userId,
            workId,
          );
          const assetIds = [
            ...new Set([
              ...pages.map((page) => page.assetId),
              ...(metadata.coverAssetId ? [metadata.coverAssetId] : []),
              ...(dto.assetIds ?? []),
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
            throw new ConflictException('Processed artwork not available');
          const supplements = await this.publication.prepareSupplements(
            tx,
            userId,
            workId,
            dto,
          );
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
              medium: 'GRAPHIC',
              form: metadata.form,
              genres: metadata.genres,
              topics: metadata.topics,
              warnings: metadata.warnings,
              coverAssetId: metadata.coverAssetId,
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
              graphicLayout: comic.layout,
              readingDirection: comic.direction,
              credits: {
                create: credits.map((credit) => ({
                  creatorId: credit.creatorId,
                  displayName: credit.displayName,
                  role: credit.role,
                  position: credit.position,
                })),
              },
              assets: { create: assetIds.map((assetId) => ({ assetId })) },
              supplements: { create: supplements },
              relatedWorks: { create: related },
              graphicPages: {
                create: pages.map((page, position) => ({
                  logicalKey: hash(`graphic-page:${page.id}`),
                  assetId: page.assetId,
                  position,
                  altText: page.altText,
                  transcript: page.transcript,
                  spreadGroup: page.spreadGroup,
                  panels: page.panels.map((panel) => ({
                    position: panel.position,
                    x: panel.x,
                    y: panel.y,
                    width: panel.width,
                    height: panel.height,
                    altText: panel.altText,
                  })),
                })),
              },
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
  async graphicPages(releaseId: string, query: PaginationQueryDto) {
    await this.publication.eligible(releaseId);
    return page(
      await this.db.releaseGraphicPage.findMany({
        where: { releaseId, release: { status: 'PUBLISHED' } },
        select: {
          id: true,
          releaseId: true,
          assetId: true,
          position: true,
          altText: true,
          transcript: true,
          spreadGroup: true,
          panels: true,
        },
        orderBy: [{ position: 'asc' }, { id: 'asc' }],
        ...pagination(query),
      }),
      query,
      (row) => row,
    );
  }
  async previewPages(
    userId: string,
    workId: string,
    releaseId: string,
    query: PaginationQueryDto,
  ) {
    if (
      !(await this.db.workRelease.findFirst({
        where: { id: releaseId, workId, work: { ownerUserId: userId } },
        select: { id: true },
      }))
    )
      throw new NotFoundException('Release not found');
    return page(
      await this.db.releaseGraphicPage.findMany({
        where: {
          releaseId,
          release: { workId, work: { ownerUserId: userId } },
        },
        select: {
          id: true,
          releaseId: true,
          assetId: true,
          position: true,
          altText: true,
          transcript: true,
          spreadGroup: true,
          panels: true,
        },
        orderBy: [{ position: 'asc' }, { id: 'asc' }],
        ...pagination(query),
      }),
      query,
      (row) => row,
    );
  }
  async exports(userId: string, workId: string, query: PaginationQueryDto) {
    await this.publication.ownedWork(userId, workId);
    return page(
      await this.db.exportJob.findMany({
        where: { workId },
        select: exportSelect,
        orderBy: [{ createdAt: 'desc' }, { id: 'asc' }],
        ...pagination(query),
      }),
      query,
      (row) => row,
    );
  }
  async export(userId: string, workId: string, id: string) {
    const row = await this.db.exportJob.findFirst({
      where: { id, workId, work: { ownerUserId: userId } },
      select: exportSelect,
    });
    if (!row) throw new NotFoundException('Export not found');
    return row;
  }
  async createExport(userId: string, workId: string, dto: ExportDto) {
    return this.publication.persist(() =>
      this.db.$transaction(
        async (tx) => {
          const release = await tx.workRelease.findFirst({
            where: { id: dto.releaseId, workId, work: { ownerUserId: userId } },
            include: {
              credits: {
                take: 30,
                where: { role: 'AUTHOR' },
                orderBy: [{ position: 'asc' }, { id: 'asc' }],
              },
              sections: {
                take: 201,
                orderBy: [{ position: 'asc' }, { id: 'asc' }],
                include: {
                  blocks: {
                    take: 1001,
                    orderBy: [{ position: 'asc' }, { id: 'asc' }],
                  },
                },
              },
            },
          });
          if (!release) throw new NotFoundException('Release not found');
          if (release.medium !== 'PROSE' || !release.sections.length)
            throw new ConflictException(
              'Prose export requires a prose release snapshot',
            );
          if ((await tx.exportJob.count({ where: { workId } })) >= 100)
            throw new ConflictException(
              'Export quota exceeded; remove previous exports',
            );
          const snapshot = {
            title: release.title,
            language: release.language,
            authors: release.credits.map((credit) => credit.displayName),
            sections: release.sections.map((section) => ({
              title: section.title,
              blocks: section.blocks.map((block) => ({
                kind: block.kind,
                text: block.text,
                footnoteLabel: block.footnoteLabel,
                referenceLabel: block.referenceLabel,
              })),
            })),
          };
          return tx.exportJob.create({
            data: {
              workId,
              sourceReleaseId: release.id,
              format: dto.format,
              snapshot,
            },
            select: exportSelect,
          });
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
      ),
    );
  }
  async deleteExport(userId: string, workId: string, id: string) {
    await this.publication.persist(() =>
      this.db.exportJob.delete({
        where: { id, workId, work: { ownerUserId: userId } },
      }),
    );
  }
  async exportFile(userId: string, workId: string, id: string) {
    const job = await this.export(userId, workId, id);
    if (job.status !== 'COMPLETED')
      throw new ConflictException('Export is not ready');
    const blob = await this.db.artifactBlob.findFirst({
      where: {
        exportId: id,
        ready: true,
        export: { workId, work: { ownerUserId: userId } },
      },
      select: { storageKey: true, mimeType: true },
    });
    if (!blob) throw new NotFoundException('Export result not found');
    return this.streamBlob(blob, `rawan-${id}.${job.format.toLowerCase()}`);
  }
}
