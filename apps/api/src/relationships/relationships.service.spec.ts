import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@rawan/database';
import type { WorldEntityKind } from '@rawan/types';
import { PrismaService } from '../database/prisma.service.js';
import { RelationshipsService } from './relationships.service.js';

const kinds: WorldEntityKind[] = ['CHARACTER', 'PLACE', 'FACTION', 'ARTIFACT'];
const failure = (code: string) =>
  new Prisma.PrismaClientKnownRequestError('test', {
    code,
    clientVersion: '7.10.0',
  });
const record = {
  id: 'link',
  projectId: 'project',
  sourceKind: 'CHARACTER',
  targetKind: 'PLACE',
  sourceCharacter: { id: 'source', name: 'Arin' },
  targetPlace: { id: 'target', name: 'Valen' },
  typeKey: 'BORN_IN',
  label: 'born in',
  direction: 'DIRECTIONAL',
  description: null,
  createdAt: new Date('2026-10-05'),
  updatedAt: new Date('2026-10-05'),
};
const input = {
  source: { kind: 'CHARACTER' as const, id: 'source' },
  target: { kind: 'PLACE' as const, id: 'target' },
  typeKey: 'BORN_IN',
  label: 'born in',
};

describe('RelationshipsService rules', () => {
  const project = { findFirst: vi.fn() };
  const character = { findFirst: vi.fn() };
  const place = { findFirst: vi.fn() };
  const faction = { findFirst: vi.fn() };
  const artifact = { findFirst: vi.fn() };
  const relationship = {
    findFirst: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  };
  const transaction = vi.fn();
  const db = {
    project,
    character,
    place,
    faction,
    artifact,
    relationship,
    $transaction: transaction,
  };
  let service: RelationshipsService;
  beforeEach(() => {
    vi.resetAllMocks();
    for (const delegate of [project, character, place, faction, artifact])
      delegate.findFirst.mockResolvedValue({ id: 'owned' });
    relationship.findFirst.mockResolvedValue(record);
    relationship.findMany.mockResolvedValue([record]);
    relationship.create.mockResolvedValue(record);
    relationship.update.mockResolvedValue(record);
    relationship.delete.mockResolvedValue(record);
    transaction.mockImplementation((callback) => callback(db));
    service = new RelationshipsService(db as unknown as PrismaService);
  });

  it.each(kinds.flatMap((source) => kinds.map((target) => [source, target])))(
    'creates %s → %s through owned same-project endpoints',
    async (sourceKind, targetKind) => {
      const result = await service.create('alice', 'project', {
        ...input,
        source: { kind: sourceKind, id: 'source' },
        target: { kind: targetKind, id: 'target' },
      });
      expect(result.createdAt).toBe('2026-10-05T00:00:00.000Z');
      expect(result).not.toHaveProperty('sourceCharacterId');
      for (const delegate of [character, place, faction, artifact]) {
        for (const [query] of delegate.findFirst.mock.calls)
          expect(query.where).toMatchObject({
            projectId: 'project',
            project: { author: { userId: 'alice' } },
          });
      }
    },
  );
  it('lists project/type and both incoming and outgoing entity links', async () => {
    await service.list('alice', 'project', {
      entityKind: 'PLACE',
      entityId: 'target',
      typeKey: 'BORN_IN',
    });
    expect(relationship.findMany.mock.calls[0][0].where).toEqual({
      projectId: 'project',
      typeKey: 'BORN_IN',
      project: { author: { userId: 'alice' } },
      OR: [{ sourcePlaceId: 'target' }, { targetPlaceId: 'target' }],
    });
  });
  it('rejects incomplete entity filters', async () => {
    await expect(
      service.list('alice', 'project', { entityKind: 'PLACE' }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(relationship.findMany).not.toHaveBeenCalled();
  });
  it('rejects another author’s project before endpoint access or writes', async () => {
    project.findFirst.mockResolvedValue(null);
    await expect(
      service.create('bob', 'project', input),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(character.findFirst).not.toHaveBeenCalled();
    expect(relationship.create).not.toHaveBeenCalled();
  });
  it.each(['source', 'target'])(
    'rejects missing/foreign/cross-project %s',
    async (side) => {
      (side === 'source' ? character : place).findFirst.mockResolvedValue(null);
      await expect(
        service.create('alice', 'project', input),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(relationship.create).not.toHaveBeenCalled();
    },
  );
  it('rejects self-edges before a database write', async () => {
    await expect(
      service.create('alice', 'project', { ...input, target: input.source }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(relationship.create).not.toHaveBeenCalled();
  });
  it('canonicalizes symmetric endpoints without generating reverse rows', async () => {
    await service.create('alice', 'project', {
      ...input,
      source: input.target,
      target: input.source,
      direction: 'SYMMETRIC',
    });
    expect(relationship.create).toHaveBeenCalledOnce();
    expect(relationship.create.mock.calls[0][0].data).toMatchObject({
      sourceKind: 'CHARACTER',
      targetKind: 'PLACE',
      direction: 'SYMMETRIC',
    });
  });
  it.each(['P2003', 'P2025'])(
    'maps vanished references (%s) to safe 404',
    async (code) => {
      relationship.create.mockRejectedValue(failure(code));
      await expect(
        service.create('alice', 'project', input),
      ).rejects.toBeInstanceOf(NotFoundException);
    },
  );
  it('maps a unique race to 409', async () => {
    relationship.create.mockRejectedValue(failure('P2002'));
    await expect(
      service.create('alice', 'project', input),
    ).rejects.toBeInstanceOf(ConflictException);
  });
  it('reads with ownership filtering and returns 404 for inaccessible links', async () => {
    relationship.findFirst.mockResolvedValue(null);
    await expect(service.read('bob', 'link')).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(relationship.findFirst.mock.calls[0][0].where).toEqual({
      id: 'link',
      project: { author: { userId: 'bob' } },
    });
  });
  it('merges allowed partial changes and clears notes within a serializable transaction', async () => {
    await service.update('alice', 'link', { label: 'home', description: null });
    expect(transaction.mock.calls[0][1]).toEqual({
      isolationLevel: 'Serializable',
    });
    expect(relationship.update.mock.calls[0][0]).toMatchObject({
      where: { id: 'link', project: { author: { userId: 'alice' } } },
      data: {
        label: 'home',
        description: null,
        sourceCharacterId: 'source',
        targetPlaceId: 'target',
        direction: 'DIRECTIONAL',
      },
    });
  });
  it('retries serialization conflicts and rereads the latest relationship', async () => {
    transaction.mockRejectedValueOnce(failure('P2034'));
    await service.update('alice', 'link', { label: 'home' });
    expect(transaction).toHaveBeenCalledTimes(2);
  });
  it('bounds conflict retries and returns 409', async () => {
    transaction.mockRejectedValue(failure('P2034'));
    await expect(
      service.update('alice', 'link', { label: 'home' }),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(transaction).toHaveBeenCalledTimes(3);
  });
  it('rejects a foreign update before writing', async () => {
    relationship.findFirst.mockResolvedValue(null);
    await expect(
      service.update('bob', 'link', { label: 'stolen' }),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(relationship.update).not.toHaveBeenCalled();
  });
  it('deletes with ownership filtering and maps absent links to 404', async () => {
    await service.delete('alice', 'link');
    expect(relationship.delete.mock.calls[0][0].where).toEqual({
      id: 'link',
      project: { author: { userId: 'alice' } },
    });
    relationship.delete.mockRejectedValue(failure('P2025'));
    await expect(service.delete('bob', 'link')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
