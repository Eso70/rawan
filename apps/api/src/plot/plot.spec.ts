import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@rawan/database';
import { PrismaService } from '../database/prisma.service.js';
import { isTransactionWriteConflict } from '../database/transaction-errors.js';
import { PlotAccess, nextPosition } from './plot-access.js';
import { PlotsService } from './plots.service.js';
import { PlotPointsService } from './plot-points.service.js';

const known = (code: string) =>
  new Prisma.PrismaClientKnownRequestError('failure', {
    code,
    clientVersion: '7.10.0',
  });
const adapter = (code = '40001', kind = 'TransactionWriteConflict') =>
  Object.assign(
    new Error('adapter conflict', { cause: { originalCode: code, kind } }),
    { name: 'DriverAdapterError' },
  );
describe('plot business rules and boundaries', () => {
  const db = {
    project: { findFirst: vi.fn() },
    plot: { findFirst: vi.fn(), aggregate: vi.fn(), create: vi.fn() },
    plotPoint: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
      aggregate: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    scene: { findFirst: vi.fn() },
    timelineEvent: { findFirst: vi.fn() },
    character: { findFirst: vi.fn() },
    place: { findFirst: vi.fn() },
    faction: { findFirst: vi.fn() },
    artifact: { findFirst: vi.fn() },
    plotPointScene: { create: vi.fn(), delete: vi.fn() },
    plotPointEvent: { create: vi.fn(), delete: vi.fn() },
    plotPointEntity: { create: vi.fn(), delete: vi.fn() },
    $transaction: vi.fn(),
  };
  const prisma = db as unknown as PrismaService;
  const access = new PlotAccess(prisma);
  const points = new PlotPointsService(prisma, access);
  const plots = new PlotsService(prisma, access);
  const row = {
    id: 'point',
    projectId: 'project',
    plotId: 'plot',
    title: 'Beat',
    description: null,
    position: 0,
    status: 'PLANNED',
    createdAt: new Date(),
    updatedAt: new Date(),
    scenes: [],
    events: [],
    entities: [],
  };
  beforeEach(() => {
    vi.resetAllMocks();
    db.$transaction.mockImplementation(
      (callback: (tx: typeof db) => Promise<unknown>) => callback(db),
    );
  });
  it.each([
    [null, 0],
    [0, 1],
    [100, 101],
  ])('assigns next position after %s', (max, result) =>
    expect(nextPosition(max)).toBe(result),
  );
  it('rejects automatic integer overflow', () =>
    expect(() => nextPosition(2147483647)).toThrow(ConflictException));
  it.each([known('P2034'), adapter(), adapter('40P01')])(
    'retries confirmed statement or commit conflicts',
    async (error) => {
      db.$transaction
        .mockRejectedValueOnce(error)
        .mockResolvedValueOnce('saved');
      expect(await access.transaction(async () => 1)).toBe('saved');
      expect(db.$transaction).toHaveBeenCalledTimes(2);
      expect(db.$transaction).toHaveBeenLastCalledWith(expect.any(Function), {
        isolationLevel: 'Serializable',
      });
    },
  );
  it('caps commit retries at three and returns 409', async () => {
    db.$transaction.mockRejectedValue(adapter());
    await expect(access.transaction(async () => 1)).rejects.toBeInstanceOf(
      ConflictException,
    );
    expect(db.$transaction).toHaveBeenCalledTimes(3);
  });
  it.each([
    new Error('connection lost'),
    adapter('23503', 'ForeignKeyConstraintViolation'),
    { cause: { kind: 'TransactionWriteConflict', originalCode: '40001' } },
    known('P2039'),
  ])('does not classify unrelated errors as retryable', (error) =>
    expect(isTransactionWriteConflict(error)).toBe(false),
  );
  it('does not retry infrastructure errors', async () => {
    const error = new Error('unavailable');
    db.$transaction.mockRejectedValue(error);
    await expect(access.transaction(async () => 1)).rejects.toBe(error);
    expect(db.$transaction).toHaveBeenCalledTimes(1);
  });
  it.each(['P2003', 'P2025'])(
    'maps %s to hidden missing resource',
    async (code) => {
      await expect(
        access.persist(async () => {
          throw known(code);
        }),
      ).rejects.toBeInstanceOf(NotFoundException);
    },
  );
  it('maps duplicate links to 409', async () => {
    await expect(
      access.persist(async () => {
        throw known('P2002');
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });
  it.each(['project', 'plot', 'point'] as const)(
    'rejects inaccessible %s with owner scope',
    async (method) => {
      await expect(access[method]('alice', 'foreign')).rejects.toBeInstanceOf(
        NotFoundException,
      );
      const delegate = method === 'point' ? db.plotPoint : db[method];
      expect(delegate.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            id: 'foreign',
            [method === 'project'
              ? 'author'
              : method === 'plot'
                ? 'project'
                : 'plot']:
              method === 'project'
                ? { userId: 'alice' }
                : method === 'plot'
                  ? { author: { userId: 'alice' } }
                  : { project: { author: { userId: 'alice' } } },
          }),
        }),
      );
    },
  );
  it.each([null, 8])(
    'creates point at next position with an owned parent',
    async (max) => {
      db.plot.findFirst.mockResolvedValue({ id: 'plot', projectId: 'project' });
      db.plotPoint.aggregate.mockResolvedValue({ _max: { position: max } });
      db.plotPoint.create.mockResolvedValue({
        ...row,
        position: nextPosition(max),
      });
      expect(
        (await points.create('alice', 'plot', { title: 'Beat' })).position,
      ).toBe(nextPosition(max));
      expect(db.plotPoint.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            projectId: 'project',
            plotId: 'plot',
            position: nextPosition(max),
          }),
        }),
      );
    },
  );
  it('respects explicit zero position without aggregating', async () => {
    db.plot.findFirst.mockResolvedValue({ id: 'plot', projectId: 'project' });
    db.plotPoint.create.mockResolvedValue(row);
    await points.create('alice', 'plot', { title: 'Beat', position: 0 });
    expect(db.plotPoint.aggregate).not.toHaveBeenCalled();
  });
  it('cannot create points before ownership is established', async () => {
    await expect(
      points.create('alice', 'foreign', { title: 'Beat' }),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(db.plotPoint.create).not.toHaveBeenCalled();
  });
  it('appends plots with custom category after project ownership check', async () => {
    db.project.findFirst.mockResolvedValue({ id: 'project' });
    db.plot.aggregate.mockResolvedValue({ _max: { position: 4 } });
    db.plot.create.mockResolvedValue({
      ...row,
      category: 'Mystery',
      position: 5,
    });
    expect(
      (
        await plots.create('alice', 'project', {
          title: 'Mystery',
          category: 'Mystery',
        })
      ).position,
    ).toBe(5);
    expect(db.plot.create).toHaveBeenCalledWith({
      data: {
        projectId: 'project',
        title: 'Mystery',
        description: undefined,
        category: 'Mystery',
        position: 5,
      },
    });
  });
  it.each([
    { items: [] },
    {
      items: [
        { id: 'a', position: 0 },
        { id: 'a', position: 1 },
      ],
    },
    {
      items: [
        { id: 'a', position: 0 },
        { id: 'b', position: 0 },
      ],
    },
  ])(
    'rejects empty or duplicate reorders before mutation',
    async ({ items }) => {
      await expect(
        points.reorder('alice', 'plot', { items }),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(db.$transaction).not.toHaveBeenCalled();
    },
  );
  it('rejects any point outside the plot before all writes', async () => {
    db.plot.findFirst.mockResolvedValue({ id: 'plot', projectId: 'project' });
    db.plotPoint.findMany.mockResolvedValue([{ id: 'a' }]);
    await expect(
      points.reorder('alice', 'plot', {
        items: [
          { id: 'a', position: 0 },
          { id: 'foreign', position: 1 },
        ],
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(db.plotPoint.update).not.toHaveBeenCalled();
    expect(db.plotPoint.findMany).toHaveBeenCalledWith({
      where: {
        id: { in: ['a', 'foreign'] },
        plotId: 'plot',
        plot: { project: { author: { userId: 'alice' } } },
      },
      select: { id: true },
    });
  });
  it('reorders atomically with every write still scoped to its plot and owner', async () => {
    db.plot.findFirst.mockResolvedValue({ id: 'plot' });
    db.plotPoint.findMany.mockResolvedValue([{ id: 'a' }, { id: 'b' }]);
    db.plotPoint.update.mockImplementation(
      async ({
        where,
        data,
      }: {
        where: { id: string };
        data: { position: number };
      }) => ({ ...row, id: where.id, position: data.position }),
    );
    const result = await points.reorder('alice', 'plot', {
      items: [
        { id: 'a', position: 1 },
        { id: 'b', position: 0 },
      ],
    });
    expect(result.map((x) => x.id)).toEqual(['b', 'a']);
    expect(db.$transaction).toHaveBeenCalledTimes(1);
    expect(db.plotPoint.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          id: 'a',
          plotId: 'plot',
          plot: { project: { author: { userId: 'alice' } } },
        },
      }),
    );
  });
  it('returns a compact bounded ordered page without relation queries', async () => {
    db.plot.findFirst.mockResolvedValue({ id: 'plot' });
    db.plotPoint.findMany.mockResolvedValue([
      row,
      { ...row, id: 'two' },
      { ...row, id: 'three' },
    ]);
    const result = await points.list('alice', 'plot', { limit: 2, offset: 4 });
    expect(result.nextOffset).toBe(6);
    expect(result.items).toHaveLength(2);
    expect(result.items[0]).not.toHaveProperty('description');
    expect(db.plotPoint.findMany).toHaveBeenCalledTimes(1);
    expect(db.plotPoint.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        take: 3,
        skip: 4,
        orderBy: [{ position: 'asc' }, { id: 'asc' }],
      }),
    );
    expect(db.scene.findFirst).not.toHaveBeenCalled();
  });
  it('checks scene project through the complete manuscript hierarchy', async () => {
    db.plotPoint.findFirst.mockResolvedValue({
      id: 'point',
      projectId: 'project',
      plotId: 'plot',
    });
    await expect(
      points.attachScene('alice', 'point', { sceneId: 'foreign' }),
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
    expect(db.plotPointScene.create).not.toHaveBeenCalled();
  });
  it('checks event project separately from owner', async () => {
    db.plotPoint.findFirst.mockResolvedValue({
      id: 'point',
      projectId: 'project',
      plotId: 'plot',
    });
    await expect(
      points.attachEvent('alice', 'point', { eventId: 'foreign' }),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(db.timelineEvent.findFirst).toHaveBeenCalledWith({
      where: {
        id: 'foreign',
        projectId: 'project',
        timeline: { project: { author: { userId: 'alice' } } },
      },
      select: { id: true },
    });
    expect(db.plotPointEvent.create).not.toHaveBeenCalled();
  });
  it.each(['CHARACTER', 'PLACE', 'FACTION', 'ARTIFACT'] as const)(
    'rejects a %s from another project before attachment',
    async (kind) => {
      db.plotPoint.findFirst.mockResolvedValue({
        id: 'point',
        projectId: 'project',
        plotId: 'plot',
      });
      await expect(
        points.attachEntity('alice', 'point', { kind, entityId: 'foreign' }),
      ).rejects.toBeInstanceOf(NotFoundException);
      const delegate =
        db[
          kind.toLowerCase() as 'character' | 'place' | 'faction' | 'artifact'
        ];
      expect(delegate.findFirst).toHaveBeenCalledWith({
        where: {
          id: 'foreign',
          projectId: 'project',
          project: { author: { userId: 'alice' } },
        },
        select: { id: true },
      });
      expect(db.plotPointEntity.create).not.toHaveBeenCalled();
    },
  );
  it.each(['Scene', 'Event', 'Entity'] as const)(
    'scopes %s removal to association, point and owner',
    async (kind) => {
      await points[`detach${kind}`]('alice', 'point', 'link');
      expect(db[`plotPoint${kind}`].delete).toHaveBeenCalledWith({
        where: {
          id: 'link',
          pointId: 'point',
          point: { plot: { project: { author: { userId: 'alice' } } } },
        },
      });
    },
  );
});
