import { ConfigService } from '@nestjs/config';
import { AiService } from './ai.service.js';
import { PrismaService } from '../database/prisma.service.js';
import { validateAiConfig } from '@rawan/backend';
describe('AI disabled configuration', () => {
  it('selects only public summary columns when listing generations', async () => {
    const findMany = vi.fn().mockResolvedValue([]);
    const service = new AiService(
      {
        project: { findFirst: vi.fn().mockResolvedValue({ id: 'owned' }) },
        aiGeneration: { findMany },
      } as unknown as PrismaService,
      new ConfigService({ AI_CONFIG: validateAiConfig({}) }),
    );
    expect(
      await service.list('user', 'owned', { limit: 20, offset: 2 }),
    ).toEqual({ items: [], nextOffset: null });
    const query = findMany.mock.calls[0][0];
    expect(query).toMatchObject({
      take: 21,
      skip: 2,
      where: { projectId: 'owned', requestedByUserId: 'user' },
    });
    for (const field of [
      'instructions',
      'inputText',
      'context',
      'result',
      'leaseToken',
    ])
      expect(query.select).not.toHaveProperty(field);
    await service.onApplicationShutdown();
  });
  it('returns a safe unavailable error for an owned project', async () => {
    const db = {
      project: { findFirst: vi.fn().mockResolvedValue({ id: 'owned' }) },
    } as unknown as PrismaService;
    const service = new AiService(
      db,
      new ConfigService({ AI_CONFIG: validateAiConfig({}) }),
    );
    await expect(
      service.create('user', 'owned', {
        task: 'BRAINSTORM',
        instructions: 'ideas',
      }),
    ).rejects.toMatchObject({ status: 503, message: 'AI is not enabled' });
    await service.onApplicationShutdown();
  });
  it('checks ownership even when AI is disabled', async () => {
    const db = {
      project: { findFirst: vi.fn().mockResolvedValue(null) },
    } as unknown as PrismaService;
    const service = new AiService(
      db,
      new ConfigService({ AI_CONFIG: validateAiConfig({}) }),
    );
    await expect(
      service.create('user', 'foreign', {
        task: 'BRAINSTORM',
        instructions: 'ideas',
      }),
    ).rejects.toMatchObject({ status: 404 });
  });
});
