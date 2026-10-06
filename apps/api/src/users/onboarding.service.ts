import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import {
  OnboardingResponseDto,
  UpdateOnboardingDto,
} from './onboarding.dto.js';

const select = {
  storyType: true,
  phase: true,
  step: true,
  completedAt: true,
  skipped: true,
  draftName: true,
  draftText: true,
  draftImage: true,
  draftRole: true,
} as const;
const defaults = {
  storyType: null,
  phase: 'choice',
  step: 0,
  completedAt: null,
  skipped: false,
  draftName: 'The Mirewalker',
  draftText: '',
  draftImage: 'mirewalker',
  draftRole: 'Wanderer',
};
@Injectable()
export class OnboardingService {
  constructor(private readonly prisma: PrismaService) {}
  async get(userId: string): Promise<OnboardingResponseDto> {
    const state = await this.prisma.userOnboarding.findUnique({
      where: { userId },
      select,
    });
    return state
      ? { ...state, completedAt: state.completedAt?.toISOString() ?? null }
      : { ...defaults };
  }
  async update(
    userId: string,
    dto: UpdateOnboardingDto,
  ): Promise<OnboardingResponseDto> {
    const { complete, ...changes } = dto;
    // Completion is one-way. Replaying the tutorial never makes an account new again.
    const previous = complete
      ? await this.prisma.userOnboarding.findUnique({
          where: { userId },
          select: { completedAt: true },
        })
      : null;
    const data = {
      ...changes,
      ...(complete ? { completedAt: previous?.completedAt ?? new Date() } : {}),
    };
    const state = await this.prisma.userOnboarding.upsert({
      where: { userId },
      create: { userId, ...data },
      update: data,
      select,
    });
    return { ...state, completedAt: state.completedAt?.toISOString() ?? null };
  }
}
