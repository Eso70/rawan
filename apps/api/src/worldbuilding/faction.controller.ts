import { ApiEndpoint } from '../contracts/api-endpoint.js';
import { ApiFactionDto } from '../contracts/response.dto.js';
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
import { FactionService } from './faction.service.js';
import { CreateFactionDto, UpdateFactionDto } from './faction.dto.js';

@Controller()
@UseGuards(JwtAuthGuard)
export class FactionController {
  constructor(private readonly service: FactionService) {}
  @ApiEndpoint({ tag: 'Worldbuilding', model: ApiFactionDto, page: true })
  @Get('projects/:projectId/factions')
  list(
    @CurrentUser() user: AuthenticatedUser,
    @Param('projectId') projectId: string,
    @Query() query: WorldQueryDto,
  ) {
    return this.service.list(user.userId, projectId, query);
  }
  @ApiEndpoint({ tag: 'Worldbuilding', model: ApiFactionDto })
  @Post('projects/:projectId/factions')
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Param('projectId') projectId: string,
    @Body() dto: CreateFactionDto,
  ) {
    return this.service.create(user.userId, projectId, dto);
  }
  @ApiEndpoint({ tag: 'Worldbuilding', model: ApiFactionDto })
  @Get('factions/:id')
  read(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.service.read(user.userId, id);
  }
  @ApiEndpoint({ tag: 'Worldbuilding', model: ApiFactionDto })
  @Patch('factions/:id')
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateFactionDto,
  ) {
    return this.service.update(user.userId, id, dto);
  }
  @ApiEndpoint({ tag: 'Worldbuilding' })
  @Delete('factions/:id')
  @HttpCode(204)
  delete(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.service.delete(user.userId, id);
  }
}
