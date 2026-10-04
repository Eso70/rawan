import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import type { AuthenticatedUser } from '../auth/auth.types.js';
import { CharacterService } from './character.service.js';
import { CreateCharacterDto, UpdateCharacterDto } from './character.dto.js';

@Controller()
@UseGuards(JwtAuthGuard)
export class CharacterController {
  constructor(private readonly service: CharacterService) {}
  @Get('projects/:projectId/characters')
  list(
    @CurrentUser() user: AuthenticatedUser,
    @Param('projectId') projectId: string,
  ) {
    return this.service.list(user.userId, projectId);
  }
  @Post('projects/:projectId/characters')
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Param('projectId') projectId: string,
    @Body() dto: CreateCharacterDto,
  ) {
    return this.service.create(user.userId, projectId, dto);
  }
  @Get('characters/:id')
  read(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.service.read(user.userId, id);
  }
  @Patch('characters/:id')
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateCharacterDto,
  ) {
    return this.service.update(user.userId, id, dto);
  }
  @Delete('characters/:id')
  @HttpCode(204)
  delete(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.service.delete(user.userId, id);
  }
}
