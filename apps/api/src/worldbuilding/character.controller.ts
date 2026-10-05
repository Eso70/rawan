import { ApiEndpoint } from '../contracts/api-endpoint.js';
import { ApiCharacterDto } from '../contracts/response.dto.js';
import { WorldQueryDto } from '../query/query.dto.js';
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Query,
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
  @ApiEndpoint({ tag: 'Worldbuilding', model: ApiCharacterDto, page: true })
  @Get('projects/:projectId/characters')
  list(
    @CurrentUser() user: AuthenticatedUser,
    @Param('projectId') projectId: string,
    @Query() query: WorldQueryDto,
  ) {
    return this.service.list(user.userId, projectId, query);
  }
  @ApiEndpoint({ tag: 'Worldbuilding', model: ApiCharacterDto })
  @Post('projects/:projectId/characters')
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Param('projectId') projectId: string,
    @Body() dto: CreateCharacterDto,
  ) {
    return this.service.create(user.userId, projectId, dto);
  }
  @ApiEndpoint({ tag: 'Worldbuilding', model: ApiCharacterDto })
  @Get('characters/:id')
  read(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.service.read(user.userId, id);
  }
  @ApiEndpoint({ tag: 'Worldbuilding', model: ApiCharacterDto })
  @Patch('characters/:id')
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateCharacterDto,
  ) {
    return this.service.update(user.userId, id, dto);
  }
  @ApiEndpoint({ tag: 'Worldbuilding' })
  @Delete('characters/:id')
  @HttpCode(204)
  delete(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.service.delete(user.userId, id);
  }
}
