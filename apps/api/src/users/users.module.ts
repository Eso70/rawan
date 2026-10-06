import { Module } from '@nestjs/common';
import { UsersService } from './users.service.js';
import { UsersController } from './users.controller.js';
import { OnboardingService } from './onboarding.service.js';

@Module({
  providers: [UsersService, OnboardingService],
  controllers: [UsersController],
})
export class UsersModule {}
