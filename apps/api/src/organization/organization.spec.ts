import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@rawan/database';
import type { TagResourceKind } from '@rawan/types';
import { PrismaService } from '../database/prisma.service.js';
import { OrganizationAccess } from './organization-access.js';
import { NotesService } from './notes.service.js';
import { TagsService } from './tags.service.js';
import { resolveTagResource, resourceWhere } from './tag-resource.js';
describe('organization service rules', () => {
  const db = {
    project: { findFirst: vi.fn() },
    note: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    tag: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    tagAssignment: { create: vi.fn(), findMany: vi.fn(), delete: vi.fn() },
    scene: { findFirst: vi.fn() },
    timelineEvent: { findFirst: vi.fn() },
    plotPoint: { findFirst: vi.fn() },
    character: { findFirst: vi.fn() },
    place: { findFirst: vi.fn() },
    faction: { findFirst: vi.fn() },
    artifact: { findFirst: vi.fn() },
    $transaction: vi.fn(),
  };
  const prisma = db as unknown as PrismaService;
  const access = new OrganizationAccess(prisma);
  const notes = new NotesService(prisma, access);
  const tags = new TagsService(prisma, access);
  const note = {
    id: 'note',
    projectId: 'project',
    title: 'Research',
    content: 'exact plain text',
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  const tag = {
    id: 'tag',
    projectId: 'project',
    name: 'Magic',
    normalizedName: 'magic',
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  beforeEach(() => {
    vi.resetAllMocks();
    db.$transaction.mockImplementation(
      (callback: (tx: typeof db) => Promise<unknown>) => callback(db),
    );
  });
  const failure = (code: string) =>
    new Prisma.PrismaClientKnownRequestError('internal', {
      code,
      clientVersion: '7.10.0',
    });
  it.each(['P2003', 'P2025'])(
    'maps %s to a safe private-resource 404',
    async (code) => {
      await expect(
        access.persist(async () => {
          throw failure(code);
        }),
      ).rejects.toBeInstanceOf(NotFoundException);
    },
  );
  it('maps normalized/assignment uniqueness conflicts to 409', async () => {
    await expect(
      access.persist(async () => {
        throw failure('P2002');
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });
  it('retries confirmed commit conflicts without retrying arbitrary errors', async () => {
    const conflict = Object.assign(
      new Error('conflict', {
        cause: { kind: 'TransactionWriteConflict', originalCode: '40001' },
      }),
      { name: 'DriverAdapterError' },
    );
    db.$transaction
      .mockRejectedValueOnce(conflict)
      .mockResolvedValueOnce('saved');
    expect(await access.transaction(async () => 1)).toBe('saved');
    expect(db.$transaction).toHaveBeenCalledTimes(2);
    expect(db.$transaction).toHaveBeenLastCalledWith(expect.any(Function), {
      isolationLevel: 'Serializable',
    });
  });
  it('caps contention retries', async () => {
    db.$transaction.mockRejectedValue(failure('P2034'));
    await expect(access.transaction(async () => 1)).rejects.toBeInstanceOf(
      ConflictException,
    );
    expect(db.$transaction).toHaveBeenCalledTimes(3);
  });
  it('propagates infrastructure failures without retries', async () => {
    const error = new Error('connection unavailable');
    db.$transaction.mockRejectedValue(error);
    await expect(access.transaction(async () => 1)).rejects.toBe(error);
    expect(db.$transaction).toHaveBeenCalledTimes(1);
  });
  it('creates notes with an ownership-protected parent connect and unparsed content', async () => {
    db.note.create.mockResolvedValue(note);
    expect(
      (
        await notes.create('alice', 'project', {
          title: 'Research',
          content: note.content,
        })
      ).content,
    ).toBe(note.content);
    expect(db.note.create).toHaveBeenCalledWith({
      data: {
        title: 'Research',
        content: note.content,
        project: { connect: { id: 'project', author: { userId: 'alice' } } },
      },
    });
  });
  it('creates tags without trusting a client normalized key', async () => {
    db.tag.create.mockResolvedValue(tag);
    const result = await tags.create('alice', 'project', { name: 'Magic' });
    expect(result).not.toHaveProperty('normalizedName');
    expect(db.tag.create).toHaveBeenCalledWith({
      data: {
        name: 'Magic',
        project: { connect: { id: 'project', author: { userId: 'alice' } } },
      },
    });
  });
  it.each(['note', 'tag'] as const)(
    'hides another owner or missing %s',
    async (kind) => {
      await expect(access[kind]('alice', 'foreign')).rejects.toBeInstanceOf(
        NotFoundException,
      );
      expect(db[kind].findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            id: 'foreign',
            project: { author: { userId: 'alice' } },
          }),
        }),
      );
    },
  );
  it('scopes a note tag filter to both owner and requested project', async () => {
    db.project.findFirst.mockResolvedValue({ id: 'project' });
    await expect(
      notes.list('alice', 'project', { tagId: 'other-tag' }),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(db.tag.findFirst).toHaveBeenCalledWith({
      where: {
        id: 'other-tag',
        projectId: 'project',
        project: { author: { userId: 'alice' } },
      },
    });
    expect(db.note.findMany).not.toHaveBeenCalled();
  });
  it('returns bounded content-free notes ordered by update time and ID', async () => {
    db.project.findFirst.mockResolvedValue({ id: 'project' });
    db.note.findMany.mockResolvedValue([
      note,
      { ...note, id: 'two' },
      { ...note, id: 'three' },
    ]);
    const result = await notes.list('alice', 'project', {
      limit: 2,
      offset: 4,
    });
    expect(result.nextOffset).toBe(6);
    expect(result.items).toHaveLength(2);
    expect(result.items[0]).not.toHaveProperty('content');
    expect(db.note.findMany).toHaveBeenCalledTimes(1);
    expect(db.note.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        take: 3,
        skip: 4,
        orderBy: [{ updatedAt: 'desc' }, { id: 'asc' }],
        select: expect.not.objectContaining({ content: true }),
      }),
    );
  });
  it.each([
    'NOTE',
    'CHARACTER',
    'PLACE',
    'FACTION',
    'ARTIFACT',
    'TIMELINE_EVENT',
    'PLOT_POINT',
  ] as const)(
    'rejects %s outside the project before assignment',
    async (kind) => {
      db.tag.findFirst.mockResolvedValue(tag);
      await expect(
        tags.assign('alice', 'tag', {
          resourceKind: kind,
          resourceId: 'foreign',
        }),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(db.tagAssignment.create).not.toHaveBeenCalled();
      const name = {
        NOTE: 'note',
        CHARACTER: 'character',
        PLACE: 'place',
        FACTION: 'faction',
        ARTIFACT: 'artifact',
        TIMELINE_EVENT: 'timelineEvent',
        PLOT_POINT: 'plotPoint',
      }[kind] as keyof typeof db;
      const delegate = db[name] as { findFirst: ReturnType<typeof vi.fn> };
      expect(delegate.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            id: 'foreign',
            projectId: 'project',
          }),
        }),
      );
    },
  );
  it('proves a scene project through its manuscript hierarchy', async () => {
    db.tag.findFirst.mockResolvedValue(tag);
    await expect(
      tags.assign('alice', 'tag', {
        resourceKind: 'SCENE',
        resourceId: 'foreign',
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(db.scene.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          id: 'foreign',
          chapter: {
            book: {
              projectId: 'project',
              project: { author: { userId: 'alice' } },
            },
          },
        },
      }),
    );
    expect(db.tagAssignment.create).not.toHaveBeenCalled();
  });
  it('derives scene hierarchy IDs rather than accepting them from callers', async () => {
    db.scene.findFirst.mockResolvedValue({
      id: 'scene',
      chapterId: 'chapter',
      chapter: { bookId: 'book' },
    });
    expect(
      await resolveTagResource(prisma, 'alice', 'project', 'SCENE', 'scene'),
    ).toMatchObject({
      resourceKind: 'SCENE',
      sceneId: 'scene',
      bookId: 'book',
      chapterId: 'chapter',
      noteId: null,
      characterId: null,
    });
  });
  it('does not query target resources until the tag is owned', async () => {
    await expect(
      tags.assign('alice', 'foreign', {
        resourceKind: 'NOTE',
        resourceId: 'note',
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(db.note.findFirst).not.toHaveBeenCalled();
  });
  it.each(['USER', 'constructor', '__proto__'])(
    'rejects unsupported resource kind %s',
    (kind) => {
      expect(() => resourceWhere(kind as TagResourceKind, 'x')).toThrow(
        BadRequestException,
      );
    },
  );
  it('returns assignments for a tag with one bounded compact relation query', async () => {
    db.tag.findFirst.mockResolvedValue(tag);
    db.tagAssignment.findMany.mockResolvedValue([]);
    expect(
      await tags.assignments('alice', 'tag', {
        resourceKind: 'NOTE',
        limit: 2,
        offset: 3,
      }),
    ).toEqual({ items: [], nextOffset: null });
    expect(db.tagAssignment.findMany).toHaveBeenCalledTimes(1);
    const query = db.tagAssignment.findMany.mock.calls[0][0];
    expect(query).toMatchObject({
      where: {
        tagId: 'tag',
        projectId: 'project',
        resourceKind: 'NOTE',
        tag: { project: { author: { userId: 'alice' } } },
      },
      take: 3,
      skip: 3,
    });
    expect(query.include.note.select.content).toBeUndefined();
    expect(query.include.scene.select.content).toBeUndefined();
  });
  it('checks a resource before loading its tags', async () => {
    db.project.findFirst.mockResolvedValue({ id: 'project' });
    await expect(
      tags.forResource('alice', 'project', {
        resourceKind: 'NOTE',
        resourceId: 'foreign',
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(db.tagAssignment.findMany).not.toHaveBeenCalled();
  });
  it('scopes inverse queries to the project, typed ID, and current tag owner', async () => {
    db.project.findFirst.mockResolvedValue({ id: 'project' });
    db.note.findFirst.mockResolvedValue(note);
    db.tagAssignment.findMany.mockResolvedValue([]);
    await tags.forResource('alice', 'project', {
      resourceKind: 'NOTE',
      resourceId: 'note',
    });
    expect(db.tagAssignment.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          projectId: 'project',
          resourceKind: 'NOTE',
          noteId: 'note',
          tag: { project: { author: { userId: 'alice' } } },
        },
      }),
    );
  });
  it('removes only an assignment belonging to the supplied owned tag', async () => {
    await tags.unassign('alice', 'tag', 'assignment');
    expect(db.tagAssignment.delete).toHaveBeenCalledWith({
      where: {
        id: 'assignment',
        tagId: 'tag',
        tag: { project: { author: { userId: 'alice' } } },
      },
    });
  });
});
