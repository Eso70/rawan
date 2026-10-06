import { PaginationQueryDto } from '../query/query.dto.js';
import { ApiEndpoint } from '../contracts/api-endpoint.js';
import { ApiUserDto } from '../contracts/response.dto.js';
import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { OnboardingService } from './onboarding.service.js';
import {
  OnboardingResponseDto,
  UpdateOnboardingDto,
} from './onboarding.dto.js';
import { UsersService } from './users.service.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import type { AuthenticatedUser } from '../auth/auth.types.js';

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly onboarding: OnboardingService,
  ) {}

  @ApiEndpoint({
    tag: 'Users',
    model: OnboardingResponseDto,
    description: 'Current user onboarding progress only.',
  })
  @Get('me/onboarding')
  getOnboarding(@CurrentUser() user: AuthenticatedUser) {
    return this.onboarding.get(user.userId);
  }

  @ApiEndpoint({
    tag: 'Users',
    model: OnboardingResponseDto,
    description:
      'Save current user onboarding progress. Completion is one-way.',
  })
  @Patch('me/onboarding')
  updateOnboarding(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateOnboardingDto,
  ) {
    return this.onboarding.update(user.userId, dto);
  }

  @ApiEndpoint({ tag: 'Users', model: ApiUserDto, array: true, admin: true })
  @Get()
  @Roles('ADMIN')
  findAll(@Query() query: PaginationQueryDto) {
    return this.usersService.findAll(query);
  }

  @ApiEndpoint({ tag: 'Users', model: ApiUserDto })
  @Get('me')
  getMe(@CurrentUser() user: AuthenticatedUser) {
    return this.usersService.findById(user.userId);
  }

  @ApiEndpoint({ tag: 'Users', model: ApiUserDto, admin: true })
  @Get(':id')
  @Roles('ADMIN')
  findById(@Param('id') id: string) {
    return this.usersService.findById(id);
  }
}
