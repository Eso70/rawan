import { ConflictException, NotFoundException } from '@nestjs/common';
import { Prisma } from '@rawan/database';
import { PrismaService } from '../database/prisma.service.js';
import { WorksService } from './works.service.js';

describe('private work ownership and source boundaries', () => {
  const row = {
    id: 'work',
    title: 'Work',
    description: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  const db = {
    work: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    book: { findFirst: vi.fn() },
    workSource: { create: vi.fn(), delete: vi.fn(), findMany: vi.fn() },
    $transaction: vi.fn(),
  };
  const service = new WorksService(db as unknown as PrismaService);
  beforeEach(() => {
    vi.resetAllMocks();
    db.$transaction.mockImplementation(
      (operation: (tx: typeof db) => Promise<unknown>) => operation(db),
    );
  });
  it('does not inspect a manuscript when the work is inaccessible', async () => {
    db.work.findFirst.mockResolvedValue(null);
    await expect(
      service.addSource('alice', 'foreign', {
        projectId: 'project',
        bookId: 'book',
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(db.book.findFirst).not.toHaveBeenCalled();
    expect(db.workSource.create).not.toHaveBeenCalled();
  });
  it('rejects an inaccessible or mismatched manuscript before creating a link', async () => {
    db.work.findFirst.mockResolvedValue(row);
    db.book.findFirst.mockResolvedValue(null);
    await expect(
      service.addSource('alice', 'work', {
        projectId: 'other',
        bookId: 'book',
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(db.book.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          id: 'book',
          projectId: 'other',
          project: { author: { userId: 'alice' } },
        },
      }),
    );
    expect(db.workSource.create).not.toHaveBeenCalled();
  });
  it('maps duplicate links to a conflict without leaking database details', async () => {
    db.work.findFirst.mockResolvedValue(row);
    db.book.findFirst.mockResolvedValue({ id: 'book' });
    db.workSource.create.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('private details', {
        code: 'P2002',
        clientVersion: '7.10.0',
      }),
    );
    await expect(
      service.addSource('alice', 'work', {
        projectId: 'project',
        bookId: 'book',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });
  it('scopes updates at the database mutation rather than relying on an earlier read', async () => {
    db.work.update.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('private details', {
        code: 'P2025',
        clientVersion: '7.10.0',
      }),
    );
    await expect(
      service.update('bob', 'work', { title: 'Changed' }),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(db.work.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'work', ownerUserId: 'bob' } }),
    );
  });
  it('unlinking cannot delete manuscript content', async () => {
    db.workSource.delete.mockResolvedValue({ id: 'link' });
    await service.removeSource('alice', 'work', 'link');
    expect(db.workSource.delete).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          id: 'link',
          workId: 'work',
          work: { ownerUserId: 'alice' },
          book: { project: { author: { userId: 'alice' } } },
        },
      }),
    );
    expect(db.work.delete).not.toHaveBeenCalled();
  });
  it('does not enumerate sources for a missing work', async () => {
    db.work.findFirst.mockResolvedValue(null);
    await expect(
      service.sources('alice', 'missing', {}),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(db.workSource.findMany).not.toHaveBeenCalled();
  });
});
