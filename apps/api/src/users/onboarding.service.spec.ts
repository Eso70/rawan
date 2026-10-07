import { OnboardingService } from './onboarding.service.js';
import { PrismaService } from '../database/prisma.service.js';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { UpdateOnboardingDto } from './onboarding.dto.js';

describe('Account onboarding', () => {
  const state = {
    experience: 'reader',
    interests: ['fantasy'],
    goal: 'stories',
    storyType: 'fiction',
    phase: 'tour',
    step: 2,
    completedAt: null,
    skipped: false,
    draftName: 'Mire',
    draftText: 'A first line.',
    draftImage: 'mirewalker',
    draftRole: 'Wanderer',
  };
  let findUnique: ReturnType<typeof vi.fn>;
  let upsert: ReturnType<typeof vi.fn>;
  let service: OnboardingService;
  beforeEach(() => {
    findUnique = vi.fn().mockResolvedValue(null);
    upsert = vi.fn().mockResolvedValue(state);
    service = new OnboardingService({
      userOnboarding: { findUnique, upsert },
    } as unknown as PrismaService);
  });
  it('returns a new-user default without creating a row', async () => {
    expect(await service.get('current-user')).toMatchObject({
      phase: 'choice',
      step: 0,
      completedAt: null,
    });
    expect(findUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: 'current-user' } }),
    );
    expect(upsert).not.toHaveBeenCalled();
  });
  it('scopes all writes to the authenticated account', async () => {
    await service.update('current-user', {
      phase: 'tour',
      step: 2,
      draftName: 'Mire',
    });
    expect(upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: 'current-user' },
        create: {
          userId: 'current-user',
          phase: 'tour',
          step: 2,
          draftName: 'Mire',
        },
        update: { phase: 'tour', step: 2, draftName: 'Mire' },
      }),
    );
  });
  it('preserves completion when replaying and when completion is repeated', async () => {
    const date = new Date('2026-10-07T00:00:00Z');
    findUnique.mockResolvedValue({ completedAt: date });
    await service.update('current-user', { complete: true });
    expect(upsert).toHaveBeenCalledWith(
      expect.objectContaining({ update: { completedAt: date } }),
    );
    await service.update('current-user', { phase: 'choice', step: 0 });
    expect(upsert.mock.calls[1][0].update).not.toHaveProperty('completedAt');
  });
  it.each([
    { experience: 'ADMIN' },
    { experience: null },
    { interests: ['unknown'] },
    { interests: ['fantasy', 'fantasy'] },
    { interests: null },
    { goal: 'unknown' },
    { complete: false },
    { complete: null },
    { phase: null },
    { phase: 'unknown' },
    { step: 5 },
    { step: -1 },
    { step: '2' },
    { draftImage: 'https://external.example/image' },
    { draftText: 'x'.repeat(5001) },
    { userId: 'other-user' },
  ])('rejects malformed or unauthorized fields %j', async (dto) => {
    const errors = await validate(plainToInstance(UpdateOnboardingDto, dto), {
      whitelist: true,
      forbidNonWhitelisted: true,
    });
    expect(errors.length).toBeGreaterThan(0);
  });
  it('stores reader preferences without modifying authorization roles', async () => {
    await service.update('current-user', {
      experience: 'reader',
      interests: ['fantasy'],
      goal: 'stories',
    });
    expect(upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: 'current-user' },
        update: {
          experience: 'reader',
          interests: ['fantasy'],
          goal: 'stories',
        },
      }),
    );
    expect(upsert.mock.calls[0][0].update).not.toHaveProperty('role');
  });
});
