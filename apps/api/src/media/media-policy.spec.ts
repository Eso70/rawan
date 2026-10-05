import { describe, expect, it, vi } from 'vitest';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import type { PrismaService } from '../database/prisma.service.js';
import { MediaCleanupService } from './media-cleanup.service.js';
import { attachmentWhere } from './media-attachments.service.js';
import { AttachMediaDto, MediaQueryDto } from './media.dto.js';
import { disposition } from './media.controller.js';

describe('Media security policy', () => {
  it.each(['SCENE', 'constructor', '__proto__'])(
    'rejects unsupported resource %s',
    (kind) => {
      expect(() => attachmentWhere(kind as 'NOTE', 'id')).toThrow(
        'Unsupported media resource kind',
      );
    },
  );
  it('encodes header metacharacters and Unicode without injecting headers', () => {
    const value = disposition('portrait";\r\nX-Test: yes العربية.png');
    expect(value).not.toMatch(/[\r\n]/);
    expect(value).toContain('%0D%0A');
    expect(value).toContain('filename*=UTF-8');
  });
  it.each([
    { resourceKind: 'NOTE', resourceId: 'id', role: null },
    { resourceKind: 'NOTE', resourceId: 'id', role: '../escape' },
    { resourceKind: 'SCENE', resourceId: 'id' },
    { resourceKind: 'NOTE', resourceId: ' ' },
  ])('rejects invalid attachment input %#', async (input) => {
    expect(
      (await validate(plainToInstance(AttachMediaDto, input))).length,
    ).toBeGreaterThan(0);
  });
  it.each([
    { limit: 101 },
    { offset: -1 },
    { sort: 'storageKey' },
    { mimeType: 'text/html' },
  ])('rejects invalid list input %#', async (input) => {
    expect(
      (await validate(plainToInstance(MediaQueryDto, input))).length,
    ).toBeGreaterThan(0);
  });
});

describe('Durable media cleanup', () => {
  const record = {
    id: 'id',
    projectId: 'project',
    ownerUserId: 'owner',
    storageProvider: 'local',
    storageKey: 'key',
    createdAt: new Date(),
  };
  function fixture(failure = false) {
    const deleteMany = vi.fn(async () => ({ count: 1 }));
    const findMany = vi.fn(async () => [record]);
    const prisma = {
      mediaCleanup: { deleteMany, findMany },
    } as unknown as PrismaService;
    const remove = vi.fn(async () => {
      if (failure) throw Error('private storage path');
    });
    const service = new MediaCleanupService(prisma, {
      id: 'local',
      delete: remove,
      put: vi.fn(),
      read: vi.fn(),
    });
    return { service, deleteMany, findMany, remove };
  }
  it('removes durable intent only after successful storage deletion', async () => {
    const f = fixture();
    await f.service.flush(record);
    expect(f.remove).toHaveBeenCalledWith('key');
    expect(f.deleteMany).toHaveBeenCalledWith({
      where: { id: 'id', storageKey: 'key' },
    });
  });
  it('retains the intent and hides filesystem errors when deletion fails', async () => {
    const f = fixture(true);
    await expect(f.service.flush(record)).rejects.toThrow(
      'Media cleanup pending',
    );
    expect(f.deleteMany).not.toHaveBeenCalled();
  });
  it('does not discard records belonging to an unavailable provider', async () => {
    const f = fixture();
    await expect(
      f.service.flush({ ...record, storageProvider: 'other' }),
    ).rejects.toThrow('Media cleanup pending');
    expect(f.remove).not.toHaveBeenCalled();
    expect(f.deleteMany).not.toHaveBeenCalled();
  });
  it('bounds operator reconciliation and skips recent upload intents', async () => {
    const f = fixture();
    const start = Date.now();
    expect(await f.service.reconcile()).toBe(1);
    const query = f.findMany.mock.calls[0] as unknown as [
      { where: { createdAt: { lt: Date } }; take: number },
    ];
    expect(query[0].take).toBe(100);
    expect(query[0].where.createdAt.lt.getTime()).toBeLessThanOrEqual(
      start - 3600000 + 10,
    );
  });
});
