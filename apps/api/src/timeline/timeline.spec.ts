import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@rawan/database';
import { PrismaService } from '../database/prisma.service.js';
import { TimelineAccess, validateRange } from './timeline-access.js';
import { EventsService } from './events.service.js';
import { ErasService } from './eras.service.js';

const failure = (code: string) =>
  new Prisma.PrismaClientKnownRequestError('database failure', {
    code,
    clientVersion: '7.10.0',
  });
describe('timeline domain safety', () => {
  const db = {
    project: { findFirst: vi.fn() },
    timeline: { findFirst: vi.fn() },
    era: { findFirst: vi.fn(), update: vi.fn(), delete: vi.fn() },
    timelineEvent: {
      findFirst: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
      findMany: vi.fn(),
    },
    character: { findFirst: vi.fn() },
    place: { findFirst: vi.fn() },
    faction: { findFirst: vi.fn() },
    artifact: { findFirst: vi.fn() },
    $transaction: vi.fn(),
  };
  const prisma = db as unknown as PrismaService;
  const access = new TimelineAccess(prisma);
  beforeEach(() => {
    vi.resetAllMocks();
    db.$transaction.mockImplementation(
      (callback: (tx: typeof db) => Promise<unknown>) => callback(db),
    );
  });
  it.each([
    ['-120', '0'],
    ['0', '0'],
    ['9007199254740993.000001', '9007199254740993.000002'],
    ['999999999999999999999999.999998', '999999999999999999999999.999999'],
  ])('compares %s to %s without floating point loss', (start, end) => {
    expect(() => validateRange(start, end)).not.toThrow();
    if (start !== end)
      expect(() => validateRange(end, start)).toThrow(BadRequestException);
  });
  it('permits open bounds and instantaneous events', () => {
    expect(() => validateRange(null, '-100')).not.toThrow();
    expect(() => validateRange('100', undefined)).not.toThrow();
  });
  it.each(['P2003', 'P2025'])(
    'hides missing/raced resources for %s',
    async (code) => {
      await expect(
        access.persist(async () => {
          throw failure(code);
        }),
      ).rejects.toBeInstanceOf(NotFoundException);
    },
  );
  it('maps duplicate attachment to conflict', async () => {
    await expect(
      access.persist(async () => {
        throw failure('P2002');
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });
  it('retries serialization conflicts and retains serializable isolation', async () => {
    db.$transaction
      .mockRejectedValueOnce(failure('P2034'))
      .mockResolvedValueOnce('saved');
    expect(await access.transaction(async () => 'saved')).toBe('saved');
    expect(db.$transaction).toHaveBeenCalledTimes(2);
    expect(db.$transaction).toHaveBeenLastCalledWith(expect.any(Function), {
      isolationLevel: 'Serializable',
    });
  });
  it('bounds retries and returns conflict after contention', async () => {
    db.$transaction.mockRejectedValue(failure('P2034'));
    await expect(access.transaction(async () => 1)).rejects.toBeInstanceOf(
      ConflictException,
    );
    expect(db.$transaction).toHaveBeenCalledTimes(3);
  });
  it('does not retry programming or infrastructure errors', async () => {
    const error = new Error('unavailable');
    db.$transaction.mockRejectedValue(error);
    await expect(access.transaction(async () => 1)).rejects.toBe(error);
    expect(db.$transaction).toHaveBeenCalledTimes(1);
  });
  it.each(['project', 'timeline', 'era', 'event'] as const)(
    'rejects missing or inaccessible %s',
    async (resource) => {
      await expect(access[resource]('alice', 'foreign')).rejects.toBeInstanceOf(
        NotFoundException,
      );
      const delegate = resource === 'event' ? db.timelineEvent : db[resource];
      expect(delegate.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            id: 'foreign',
            [resource === 'project'
              ? 'author'
              : resource === 'timeline'
                ? 'project'
                : 'timeline']:
              resource === 'project'
                ? { userId: 'alice' }
                : resource === 'timeline'
                  ? { author: { userId: 'alice' } }
                  : { project: { author: { userId: 'alice' } } },
          }),
        }),
      );
    },
  );
  it('scopes era validation to both owner and timeline', async () => {
    await expect(
      access.eraInTimeline('alice', 'timeline-a', 'era-b'),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(db.era.findFirst).toHaveBeenCalledWith({
      where: {
        id: 'era-b',
        timelineId: 'timeline-a',
        timeline: { project: { author: { userId: 'alice' } } },
      },
      select: { id: true },
    });
  });
  it.each(['CHARACTER', 'PLACE', 'FACTION', 'ARTIFACT'] as const)(
    'scopes %s to project and owner',
    async (kind) => {
      await expect(
        access.entity('alice', 'project-a', { kind, id: 'foreign' }),
      ).rejects.toBeInstanceOf(NotFoundException);
      const delegate =
        db[
          kind.toLowerCase() as 'character' | 'place' | 'faction' | 'artifact'
        ];
      expect(delegate.findFirst).toHaveBeenCalledWith({
        where: {
          id: 'foreign',
          projectId: 'project-a',
          project: { author: { userId: 'alice' } },
        },
        select: { id: true },
      });
    },
  );
  it.each([{ start: '11' }, { end: '-1' }])(
    'validates partial event update against persisted opposite boundary',
    async (patch) => {
      db.timelineEvent.findFirst.mockResolvedValue({
        id: 'e',
        start: new Prisma.Decimal(0),
        end: new Prisma.Decimal(10),
      });
      await expect(
        new EventsService(prisma, access).update('alice', 'e', patch),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(db.timelineEvent.update).not.toHaveBeenCalled();
    },
  );
  it('validates partial era update against persisted boundary', async () => {
    db.era.findFirst.mockResolvedValue({
      id: 'era',
      start: new Prisma.Decimal(0),
      end: new Prisma.Decimal(10),
    });
    await expect(
      new ErasService(prisma, access).update('alice', 'era', { start: '11' }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(db.era.update).not.toHaveBeenCalled();
  });
  it('detaches era events and deletes era in one transaction', async () => {
    db.era.findFirst.mockResolvedValue({ id: 'era', timelineId: 'timeline' });
    await new ErasService(prisma, access).delete('alice', 'era');
    expect(db.$transaction).toHaveBeenCalledTimes(1);
    expect(db.timelineEvent.updateMany).toHaveBeenCalledWith({
      where: {
        eraId: 'era',
        timelineId: 'timeline',
        timeline: { project: { author: { userId: 'alice' } } },
      },
      data: { eraId: null },
    });
    expect(
      db.timelineEvent.updateMany.mock.invocationCallOrder[0],
    ).toBeLessThan(db.era.delete.mock.invocationCallOrder[0]);
  });
  it('rejects incomplete entity filter before querying events', async () => {
    db.timeline.findFirst.mockResolvedValue({ id: 't', projectId: 'p' });
    await expect(
      new EventsService(prisma, access).list('alice', 't', {
        entityKind: 'PLACE',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(db.timelineEvent.findMany).not.toHaveBeenCalled();
  });
  it('loads a compact bounded page with deterministic order in one event query', async () => {
    db.timeline.findFirst.mockResolvedValue({ id: 't', projectId: 'p' });
    db.timelineEvent.findMany.mockResolvedValue([]);
    expect(
      await new EventsService(prisma, access).list('alice', 't', {
        limit: 2,
        offset: 4,
        from: '-1',
        to: '1',
      }),
    ).toEqual({ items: [], nextOffset: null });
    expect(db.timelineEvent.findMany).toHaveBeenCalledTimes(1);
    const query = db.timelineEvent.findMany.mock.calls[0][0];
    expect(query).toMatchObject({
      take: 3,
      skip: 4,
      orderBy: [{ start: 'asc' }, { position: 'asc' }, { id: 'asc' }],
      where: { start: { gte: '-1', lte: '1' } },
    });
    expect(query.select.description).toBeUndefined();
    expect(query.select.entities).toBeUndefined();
  });
});
