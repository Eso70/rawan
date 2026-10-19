import { BadRequestException, ConflictException } from '@nestjs/common';
import { Prisma } from '@rawan/database';
import type { PrismaService } from '../database/prisma.service.js';
import type { SetupState } from '@rawan/types/onboarding';
import type { UpdateSetupDto } from './setup.dto.js';

const select = {
  setupVersion: true,
  setupStatus: true,
  setupRequired: true,
  setupRevision: true,
  setupStep: true,
  preferredName: true,
  purpose: true,
  creativeInterests: true,
  readingFormats: true,
  readingGenres: true,
  readingTopics: true,
  interfaceLanguage: true,
  discoverySource: true,
  discoveryOther: true,
  preferredStart: true,
  setupCompletedAt: true,
} as const;
type Row = Prisma.UserOnboardingGetPayload<{ select: typeof select }>;
function response(row: Row | null): SetupState {
  return {
    version: 1,
    status: (row?.setupStatus ?? 'not_started') as SetupState['status'],
    required: row?.setupRequired ?? false,
    revision: row?.setupRevision ?? 0,
    step: (row?.setupStep ?? 'welcome') as SetupState['step'],
    draft: {
      preferredName: row?.preferredName ?? '',
      purpose: (row?.purpose ?? null) as SetupState['draft']['purpose'],
      creativeInterests: row?.creativeInterests ?? [],
      readingFormats: row?.readingFormats ?? [],
      readingGenres: row?.readingGenres ?? [],
      readingTopics: row?.readingTopics ?? [],
      interfaceLanguage: 'en',
      discoverySource: row?.discoverySource ?? null,
      discoveryOther: row?.discoveryOther ?? '',
      preferredStart: (row?.preferredStart ??
        null) as SetupState['draft']['preferredStart'],
    },
    completedAt: row?.setupCompletedAt?.toISOString() ?? null,
  };
}
export async function getSetup(
  prisma: PrismaService,
  userId: string,
): Promise<SetupState> {
  return response(
    await prisma.userOnboarding.findUnique({ where: { userId }, select }),
  );
}
export async function saveSetup(
  prisma: PrismaService,
  userId: string,
  dto: UpdateSetupDto,
): Promise<SetupState> {
  try {
    return await prisma.$transaction(
      async (tx) => {
        const previous = await tx.userOnboarding.findUnique({
          where: { userId },
          select,
        });
        if (previous?.setupStatus === 'completed' && dto.complete)
          return response(previous);
        if ((previous?.setupRevision ?? 0) !== dto.expectedRevision)
          throw new ConflictException(
            'Setup changed in another tab. Reload before retrying.',
          );
        if (previous?.setupStatus === 'completed')
          throw new ConflictException(
            'Setup has already finished. Reload to continue.',
          );
        const { expectedRevision, complete, step, ...answers } = dto;
        void expectedRevision;
        if (
          answers.preferredName &&
          /[\p{Cc}\p{Cf}]/u.test(answers.preferredName)
        )
          throw new BadRequestException(
            'Please remove invisible characters from your name.',
          );
        if (answers.discoveryOther && /[\p{Cc}]/u.test(answers.discoveryOther))
          throw new BadRequestException(
            'Please remove control characters from your note.',
          );
        const purpose =
          answers.purpose !== undefined ? answers.purpose : previous?.purpose;
        if (complete && previous?.setupRequired && !purpose)
          throw new BadRequestException('Choose what brings you to Rawan.');
        const data = {
          ...answers,
          setupStep: step ?? previous?.setupStep ?? 'welcome',
          setupStatus: complete ? 'completed' : 'in_progress',
          ...(complete
            ? { setupCompletedAt: previous?.setupCompletedAt ?? new Date() }
            : {}),
          setupRevision: { increment: 1 },
        };
        const { setupRevision, ...createData } = data;
        void setupRevision;
        const row = await tx.userOnboarding.upsert({
          where: { userId },
          create: { userId, ...createData, setupRevision: 1 },
          update: data,
          select,
        });
        return response(row);
      },
      { isolationLevel: 'Serializable' },
    );
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      ['P2034', 'P2002'].includes(error.code)
    )
      throw new ConflictException(
        'Setup changed in another tab. Reload before retrying.',
      );
    throw error;
  }
}
