import { ApiEndpoint } from '../contracts/api-endpoint.js';
import { ApiArtifactDto } from '../contracts/response.dto.js';
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
import { ArtifactService } from './artifact.service.js';
import { CreateArtifactDto, UpdateArtifactDto } from './artifact.dto.js';

@Controller()
@UseGuards(JwtAuthGuard)
export class ArtifactController {
  constructor(private readonly service: ArtifactService) {}
  @ApiEndpoint({ tag: 'Worldbuilding', model: ApiArtifactDto, page: true })
  @Get('projects/:projectId/artifacts')
  list(
    @CurrentUser() user: AuthenticatedUser,
    @Param('projectId') projectId: string,
    @Query() query: WorldQueryDto,
  ) {
    return this.service.list(user.userId, projectId, query);
  }
  @ApiEndpoint({ tag: 'Worldbuilding', model: ApiArtifactDto })
  @Post('projects/:projectId/artifacts')
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Param('projectId') projectId: string,
    @Body() dto: CreateArtifactDto,
  ) {
    return this.service.create(user.userId, projectId, dto);
  }
  @ApiEndpoint({ tag: 'Worldbuilding', model: ApiArtifactDto })
  @Get('artifacts/:id')
  read(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.service.read(user.userId, id);
  }
  @ApiEndpoint({ tag: 'Worldbuilding', model: ApiArtifactDto })
  @Patch('artifacts/:id')
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateArtifactDto,
  ) {
    return this.service.update(user.userId, id, dto);
  }
  @ApiEndpoint({ tag: 'Worldbuilding' })
  @Delete('artifacts/:id')
  @HttpCode(204)
  delete(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.service.delete(user.userId, id);
  }
}
