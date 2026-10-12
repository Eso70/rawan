import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@rawan/database';
import type { AuthenticatedUser } from '../auth/auth.types.js';
import { dtoValues } from '../contracts/dto-values.js';
import { PrismaService } from '../database/prisma.service.js';
import { PublicationService } from '../publication/publication.service.js';
import { PaginationQueryDto } from '../query/query.dto.js';
import { contains, page, pagination } from '../query/query.js';
import {
  AnnotationDto,
  BookmarkDto,
  CollectionDto,
  CollectionMemberDto,
  GraphicBookmarkDto,
  GraphicLocatorDto,
  GraphicProgressDto,
  LibraryDto,
  LibraryQueryDto,
  LocatorDto,
  ProgressDto,
  ReaderSearchDto,
  SaveLibraryDto,
} from './reader.dto.js';

const collectionSelect = {
  id: true,
  title: true,
  description: true,
  curatorLabel: true,
  public: true,
  editorial: true,
} as const;
const stateSelect = {
  id: true,
  workId: true,
  releaseId: true,
  sectionId: true,
  blockId: true,
  offset: true,
  locatorKind: true,
  graphicOffset: true,
  progression: true,
  furthest: true,
  revision: true,
  updatedAt: true,
  release: { select: { status: true } },
} as const;
const bookmarkSelect = {
  id: true,
  releaseId: true,
  sectionId: true,
  blockId: true,
  offset: true,
  label: true,
  createdAt: true,
} as const;
const annotationSelect = {
  id: true,
  releaseId: true,
  sectionId: true,
  blockId: true,
  startOffset: true,
  endOffset: true,
  quote: true,
  note: true,
  color: true,
  createdAt: true,
  updatedAt: true,
} as const;
const entrySelect = {
  id: true,
  workId: true,
  title: true,
  byline: true,
  status: true,
  favorite: true,
  addedAt: true,
  work: {
    select: {
      releases: {
        where: { status: 'PUBLISHED' as const },
        take: 1,
        orderBy: { version: 'desc' as const },
        select: { id: true },
      },
    },
  },
} as const;
const entryResponse = (
  row: Prisma.LibraryEntryGetPayload<{ select: typeof entrySelect }>,
) => {
  const { work, ...entry } = row;
  return { ...entry, availableReleaseId: work?.releases[0]?.id ?? null };
};
const stateResponse = (
  row: Prisma.ReadingStateGetPayload<{ select: typeof stateSelect }>,
) => {
  const { release, ...state } = row;
  return { ...state, available: release?.status === 'PUBLISHED' };
};

@Injectable()
export class ReaderService {
  constructor(
    private readonly db: PrismaService,
    private readonly publication: PublicationService,
  ) {}

  async library(userId: string, query: LibraryQueryDto) {
    return page(
      await this.db.libraryEntry.findMany({
        where: {
          userId,
          ...(query.status ? { status: query.status } : {}),
          ...(query.favorite ? { favorite: query.favorite === 'true' } : {}),
          ...(query.q
            ? {
                OR: [
                  { title: contains(query.q) },
                  { byline: contains(query.q) },
                ],
              }
            : {}),
        },
        select: entrySelect,
        orderBy: [{ addedAt: 'desc' }, { id: 'asc' }],
        ...pagination(query),
      }),
      query,
      entryResponse,
    );
  }
  async saveLibrary(userId: string, dto: SaveLibraryDto) {
    return this.publication.persist(() =>
      this.db.$transaction(async (tx) => {
        const release = await this.publication.eligible(dto.releaseId, tx);
        const credits = await tx.releaseCredit.findMany({
          where: { releaseId: release.id, role: 'AUTHOR' },
          take: 30,
          orderBy: [{ position: 'asc' }, { id: 'asc' }],
          select: { displayName: true },
        });
        return entryResponse(
          await tx.libraryEntry.upsert({
            where: { userId_workId: { userId, workId: release.workId } },
            create: {
              userId,
              workId: release.workId,
              title: release.title,
              byline: credits.map((row) => row.displayName).join(', '),
              status: dto.status,
              favorite: dto.favorite,
            },
            update: { status: dto.status, favorite: dto.favorite },
            select: entrySelect,
          }),
        );
      }),
    );
  }
  async updateLibrary(userId: string, id: string, dto: LibraryDto) {
    return this.publication.persist(async () =>
      entryResponse(
        await this.db.libraryEntry.update({
          where: { id, userId },
          data: dto,
          select: entrySelect,
        }),
      ),
    );
  }
  async deleteLibrary(userId: string, id: string) {
    await this.publication.persist(() =>
      this.db.libraryEntry.delete({ where: { id, userId } }),
    );
  }
  async collections(userId: string, query: PaginationQueryDto) {
    return page(
      await this.db.libraryCollection.findMany({
        where: { userId },
        select: collectionSelect,
        orderBy: { id: 'asc' },
        ...pagination(query),
      }),
      query,
      (row) => row,
    );
  }
  async saveCollection(
    user: AuthenticatedUser,
    dto: CollectionDto,
    id?: string,
  ) {
    if (dto.editorial && user.role !== 'ADMIN')
      throw new ForbiddenException('Editorial collections require ADMIN');
    return this.publication.persist(() =>
      id
        ? this.db.libraryCollection.update({
            where: { id, userId: user.userId },
            data: dto,
            select: collectionSelect,
          })
        : this.db.libraryCollection.create({
            data: { userId: user.userId, ...dtoValues(dto) },
            select: collectionSelect,
          }),
    );
  }
  async deleteCollection(userId: string, id: string) {
    await this.publication.persist(() =>
      this.db.libraryCollection.delete({ where: { id, userId } }),
    );
  }
  async addMember(
    userId: string,
    collectionId: string,
    dto: CollectionMemberDto,
  ) {
    return this.publication.persist(() =>
      this.db.$transaction(async (tx) => {
        if (
          !(await tx.libraryCollection.findFirst({
            where: { id: collectionId, userId },
            select: { id: true },
          })) ||
          !(await tx.libraryEntry.findFirst({
            where: { id: dto.entryId, userId },
            select: { id: true },
          }))
        )
          throw new NotFoundException('Collection or library entry not found');
        return tx.collectionMember.create({
          data: { collectionId, ...dtoValues(dto) },
        });
      }),
    );
  }
  async members(
    userId: string,
    collectionId: string,
    query: PaginationQueryDto,
  ) {
    if (
      !(await this.db.libraryCollection.findFirst({
        where: { id: collectionId, userId },
        select: { id: true },
      }))
    )
      throw new NotFoundException('Collection not found');
    return page(
      await this.db.collectionMember.findMany({
        where: { collectionId, collection: { userId } },
        orderBy: [{ position: 'asc' }, { id: 'asc' }],
        ...pagination(query),
      }),
      query,
      (row) => row,
    );
  }
  async deleteMember(userId: string, collectionId: string, id: string) {
    await this.publication.persist(() =>
      this.db.collectionMember.delete({
        where: { id, collectionId, collection: { userId } },
      }),
    );
  }
  async sharedCollections(query: PaginationQueryDto) {
    return page(
      await this.db.libraryCollection.findMany({
        where: { public: true },
        select: collectionSelect,
        orderBy: [{ editorial: 'desc' }, { id: 'asc' }],
        ...pagination(query),
      }),
      query,
      (row) => row,
    );
  }
  async sharedMembers(collectionId: string, query: PaginationQueryDto) {
    if (
      !(await this.db.libraryCollection.findFirst({
        where: { id: collectionId, public: true },
        select: { id: true },
      }))
    )
      throw new NotFoundException('Collection not found');
    return page(
      await this.db.collectionMember.findMany({
        where: {
          collectionId,
          collection: { public: true },
          entry: { work: { releases: { some: { status: 'PUBLISHED' } } } },
        },
        select: {
          position: true,
          entry: {
            select: {
              workId: true,
              work: {
                select: {
                  releases: {
                    where: { status: 'PUBLISHED' },
                    take: 1,
                    orderBy: { version: 'desc' },
                    select: { id: true, title: true },
                  },
                },
              },
            },
          },
        },
        orderBy: [{ position: 'asc' }, { id: 'asc' }],
        ...pagination(query),
      }),
      query,
      (row) => ({
        position: row.position,
        workId: row.entry.workId,
        releaseId: row.entry.work!.releases[0].id,
        title: row.entry.work!.releases[0].title,
      }),
    );
  }
  async locator(dto: LocatorDto, tx: Prisma.TransactionClient = this.db) {
    const release = await this.publication.eligible(dto.releaseId, tx);
    const block = await tx.releaseBlock.findFirst({
      where: {
        id: dto.blockId,
        sectionId: dto.sectionId,
        section: { releaseId: dto.releaseId, release: { status: 'PUBLISHED' } },
      },
      select: { id: true, text: true },
    });
    if (!block) throw new NotFoundException('Reading location not found');
    if (dto.offset > block.text.length)
      throw new BadRequestException('Reading offset exceeds content');
    return { release, block };
  }
  async progress(userId: string, dto: ProgressDto) {
    return this.publication.persist(() =>
      this.db.$transaction(
        async (tx) => {
          const { release } = await this.locator(dto, tx);
          const sections = await tx.releaseSection.findMany({
            where: { releaseId: dto.releaseId },
            orderBy: [{ position: 'asc' }, { id: 'asc' }],
            select: {
              blocks: {
                orderBy: [{ position: 'asc' }, { id: 'asc' }],
                select: { id: true, text: true },
              },
            },
          });
          const blocks = sections.flatMap((section) => section.blocks);
          const at = blocks.findIndex((block) => block.id === dto.blockId);
          const total = blocks.reduce(
            (sum, block) => sum + block.text.length,
            0,
          );
          const progression = total
            ? (blocks
                .slice(0, at)
                .reduce((sum, block) => sum + block.text.length, 0) +
                dto.offset) /
              total
            : 0;
          const previous = await tx.readingState.findUnique({
            where: { userId_workId: { userId, workId: release.workId } },
          });
          if ((previous?.revision ?? 0) !== dto.expectedRevision)
            throw new ConflictException(
              'Reading state changed; reload before retrying',
            );
          const data = {
            releaseId: dto.releaseId,
            sectionId: dto.sectionId,
            blockId: dto.blockId,
            offset: dto.offset,
            locatorKind: 'PROSE',
            graphicOffset: null,
            progression,
            furthest: Math.max(
              previous?.releaseId === dto.releaseId ? previous.furthest : 0,
              progression,
            ),
            revision: dto.expectedRevision + 1,
          };
          const row = previous
            ? await tx.readingState.update({
                where: {
                  id: previous.id,
                  userId,
                  revision: dto.expectedRevision,
                },
                data,
                select: stateSelect,
              })
            : await tx.readingState.create({
                data: { userId, workId: release.workId, ...data },
                select: stateSelect,
              });
          return stateResponse(row);
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
      ),
    );
  }
  async history(userId: string, query: PaginationQueryDto) {
    return page(
      await this.db.readingState.findMany({
        where: { userId },
        select: stateSelect,
        orderBy: [{ updatedAt: 'desc' }, { id: 'asc' }],
        ...pagination(query),
      }),
      query,
      stateResponse,
    );
  }
  async graphicLocator(tx: Prisma.TransactionClient, dto: GraphicLocatorDto) {
    const release = await this.publication.eligible(dto.releaseId, tx);
    const page = await tx.releaseGraphicPage.findFirst({
      where: {
        id: dto.pageId,
        releaseId: dto.releaseId,
        release: { status: 'PUBLISHED' },
      },
    });
    if (!page) throw new NotFoundException('Graphic page not found');
    const panels = page.panels as { position: number }[];
    if (
      dto.panelPosition !== 0 &&
      !panels.some((panel) => panel.position === dto.panelPosition)
    )
      throw new BadRequestException('Guided panel not found');
    return { release, page, panels };
  }
  async graphicProgress(userId: string, dto: GraphicProgressDto) {
    return this.publication.persist(() =>
      this.db.$transaction(
        async (tx) => {
          const { release, page, panels } = await this.graphicLocator(tx, dto);
          const count = await tx.releaseGraphicPage.count({
            where: { releaseId: dto.releaseId },
          });
          const panelIndex = panels.findIndex(
            (panel) => panel.position === dto.panelPosition,
          );
          const fraction = dto.pageProgress;
          const progression = Math.min(
            1,
            (page.position +
              (panels.length
                ? (Math.max(0, panelIndex) + fraction) / panels.length
                : fraction)) /
              count,
          );
          const previous = await tx.readingState.findUnique({
            where: { userId_workId: { userId, workId: release.workId } },
          });
          if ((previous?.revision ?? 0) !== dto.expectedRevision)
            throw new ConflictException(
              'Reading state changed; reload before retrying',
            );
          const data = {
            releaseId: dto.releaseId,
            sectionId: 'graphic',
            blockId: dto.pageId,
            offset: dto.panelPosition,
            locatorKind: 'GRAPHIC',
            graphicOffset: fraction,
            progression,
            furthest: Math.max(
              previous?.releaseId === dto.releaseId ? previous.furthest : 0,
              progression,
            ),
            revision: dto.expectedRevision + 1,
          };
          return stateResponse(
            previous
              ? await tx.readingState.update({
                  where: { id: previous.id, revision: dto.expectedRevision },
                  data,
                  select: stateSelect,
                })
              : await tx.readingState.create({
                  data: { userId, workId: release.workId, ...data },
                  select: stateSelect,
                }),
          );
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
      ),
    );
  }
  async graphicBookmark(userId: string, dto: GraphicBookmarkDto) {
    return this.publication.persist(() =>
      this.db.$transaction(async (tx) => {
        await this.graphicLocator(tx, dto);
        return tx.readerBookmark.create({
          data: {
            userId,
            releaseId: dto.releaseId,
            sectionId: 'graphic',
            blockId: dto.pageId,
            offset: dto.panelPosition,
            label: dto.label,
          },
          select: bookmarkSelect,
        });
      }),
    );
  }
  async state(userId: string, workId: string) {
    const row = await this.db.readingState.findUnique({
      where: { userId_workId: { userId, workId } },
      select: stateSelect,
    });
    if (!row) throw new NotFoundException('Reading state not found');
    return stateResponse(row);
  }
  async resume(userId: string, workId: string, releaseId: string) {
    const release = await this.publication.eligible(releaseId);
    if (release.workId !== workId)
      throw new NotFoundException('Release not found for work');
    const previous = await this.db.readingState.findUnique({
      where: { userId_workId: { userId, workId } },
    });
    if (release.medium === 'GRAPHIC') {
      const old =
        previous?.locatorKind === 'GRAPHIC'
          ? await this.db.releaseGraphicPage.findFirst({
              where: {
                id: previous.blockId,
                releaseId: previous.releaseId ?? 'missing',
              },
              select: { logicalKey: true },
            })
          : null;
      const matched = old
        ? await this.db.releaseGraphicPage.findFirst({
            where: { releaseId, logicalKey: old.logicalKey },
            select: { id: true, panels: true },
          })
        : null;
      const target =
        matched ??
        (await this.db.releaseGraphicPage.findFirst({
          where: { releaseId },
          orderBy: [{ position: 'asc' }, { id: 'asc' }],
          select: { id: true, panels: true },
        }));
      if (!target) throw new NotFoundException('Released page not found');
      const panels = target.panels as { position: number }[];
      const offset =
        matched && panels.some((panel) => panel.position === previous?.offset)
          ? previous!.offset
          : 0;
      return {
        releaseId,
        locatorKind: 'GRAPHIC',
        sectionId: 'graphic',
        blockId: target.id,
        offset,
        graphicOffset: matched ? (previous?.graphicOffset ?? 0) : 0,
        mapped: Boolean(matched),
        revision: previous?.revision ?? 0,
      };
    }
    const old =
      previous?.locatorKind === 'PROSE'
        ? await this.db.releaseBlock.findFirst({
            where: {
              id: previous.blockId,
              section: { releaseId: previous.releaseId ?? 'missing' },
            },
            select: {
              logicalKey: true,
              section: { select: { logicalKey: true } },
            },
          })
        : null;
    const matched = old
      ? await this.db.releaseBlock.findFirst({
          where: {
            logicalKey: old.logicalKey,
            section: { releaseId, logicalKey: old.section.logicalKey },
          },
          select: { id: true, sectionId: true, text: true },
        })
      : null;
    const target =
      matched ??
      (await this.db.releaseBlock.findFirst({
        where: { section: { releaseId } },
        orderBy: [
          { section: { position: 'asc' } },
          { position: 'asc' },
          { id: 'asc' },
        ],
        select: { id: true, sectionId: true, text: true },
      }));
    if (!target) throw new NotFoundException('Released block not found');
    return {
      releaseId,
      locatorKind: 'PROSE',
      sectionId: target.sectionId,
      blockId: target.id,
      offset: matched ? Math.min(previous?.offset ?? 0, target.text.length) : 0,
      graphicOffset: null,
      mapped: Boolean(matched),
      revision: previous?.revision ?? 0,
    };
  }
  async deleteState(userId: string, id: string) {
    await this.publication.persist(() =>
      this.db.readingState.delete({ where: { id, userId } }),
    );
  }
  async bookmarks(
    userId: string,
    releaseId: string,
    query: PaginationQueryDto,
  ) {
    await this.publication.eligible(releaseId);
    return page(
      await this.db.readerBookmark.findMany({
        where: { userId, releaseId },
        select: bookmarkSelect,
        orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
        ...pagination(query),
      }),
      query,
      (row) => row,
    );
  }
  async bookmark(userId: string, dto: BookmarkDto) {
    return this.publication.persist(() =>
      this.db.$transaction(async (tx) => {
        await this.locator(dto, tx);
        return tx.readerBookmark.create({
          data: { userId, ...dtoValues(dto) },
          select: bookmarkSelect,
        });
      }),
    );
  }
  async deleteBookmark(userId: string, id: string) {
    await this.publication.persist(() =>
      this.db.readerBookmark.delete({ where: { id, userId } }),
    );
  }
  async annotations(
    userId: string,
    releaseId: string,
    query: PaginationQueryDto,
  ) {
    await this.publication.eligible(releaseId);
    return page(
      await this.db.readerAnnotation.findMany({
        where: { userId, releaseId },
        select: annotationSelect,
        orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
        ...pagination(query),
      }),
      query,
      (row) => row,
    );
  }
  async annotation(userId: string, dto: AnnotationDto, id?: string) {
    return this.publication.persist(() =>
      this.db.$transaction(async (tx) => {
        const { block } = await this.locator(
          { ...dtoValues(dto), offset: dto.endOffset },
          tx,
        );
        if (
          dto.startOffset >= dto.endOffset ||
          dto.endOffset - dto.startOffset > 4000
        )
          throw new BadRequestException('Invalid annotation range');
        const data = {
          ...dtoValues(dto),
          quote: block.text.slice(dto.startOffset, dto.endOffset),
        };
        return id
          ? tx.readerAnnotation.update({
              where: { id, userId, releaseId: dto.releaseId },
              data,
              select: annotationSelect,
            })
          : tx.readerAnnotation.create({
              data: { userId, ...data },
              select: annotationSelect,
            });
      }),
    );
  }
  async deleteAnnotation(userId: string, id: string) {
    await this.publication.persist(() =>
      this.db.readerAnnotation.delete({ where: { id, userId } }),
    );
  }
  async search(releaseId: string, query: ReaderSearchDto) {
    await this.publication.eligible(releaseId);
    const rows = await this.db.releaseBlock.findMany({
      where: {
        section: { releaseId, release: { status: 'PUBLISHED' } },
        text: contains(query.q),
      },
      select: { id: true, sectionId: true, text: true },
      orderBy: [
        { section: { position: 'asc' } },
        { position: 'asc' },
        { id: 'asc' },
      ],
      ...pagination(query),
    });
    return page(rows, query, (row) => {
      const start = Math.max(
        0,
        row.text.toLocaleLowerCase().indexOf(query.q.toLocaleLowerCase()) - 80,
      );
      return {
        sectionId: row.sectionId,
        blockId: row.id,
        snippet: row.text.slice(start, start + 240),
      };
    });
  }
}
