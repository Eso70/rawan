import { ApiEndpoint } from '../contracts/api-endpoint.js';
import { ApiRelationshipDto } from '../contracts/response.dto.js';
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
import { RelationshipsService } from './relationships.service.js';
import {
  CreateRelationshipDto,
  UpdateRelationshipDto,
  RelationshipQueryDto,
} from './relationship.dto.js';

@Controller()
@UseGuards(JwtAuthGuard)
export class RelationshipsController {
  constructor(private readonly service: RelationshipsService) {}
  @ApiEndpoint({
    tag: 'Relationships',
    model: ApiRelationshipDto,
    page: true,
    description:
      'Owned project relationships. entityKind and entityId filters must be supplied together; typeKey is normalized to uppercase underscores. No cross-project endpoints or self-links.',
  })
  @Get('projects/:projectId/relationships')
  list(
    @CurrentUser() user: AuthenticatedUser,
    @Param('projectId') projectId: string,
    @Query() query: RelationshipQueryDto,
  ) {
    return this.service.list(user.userId, projectId, query);
  }
  @ApiEndpoint({
    tag: 'Relationships',
    model: ApiRelationshipDto,
    description:
      'Owned project relationships. entityKind and entityId filters must be supplied together; typeKey is normalized to uppercase underscores. No cross-project endpoints or self-links.',
  })
  @Post('projects/:projectId/relationships')
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Param('projectId') projectId: string,
    @Body() dto: CreateRelationshipDto,
  ) {
    return this.service.create(user.userId, projectId, dto);
  }
  @ApiEndpoint({
    tag: 'Relationships',
    model: ApiRelationshipDto,
    description:
      'Owned project relationships. entityKind and entityId filters must be supplied together; typeKey is normalized to uppercase underscores. No cross-project endpoints or self-links.',
  })
  @Get('relationships/:id')
  read(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.service.read(user.userId, id);
  }
  @ApiEndpoint({
    tag: 'Relationships',
    model: ApiRelationshipDto,
    description:
      'Owned project relationships. entityKind and entityId filters must be supplied together; typeKey is normalized to uppercase underscores. No cross-project endpoints or self-links.',
  })
  @Patch('relationships/:id')
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateRelationshipDto,
  ) {
    return this.service.update(user.userId, id, dto);
  }
  @ApiEndpoint({
    tag: 'Relationships',
    description:
      'Owned project relationships. entityKind and entityId filters must be supplied together; typeKey is normalized to uppercase underscores. No cross-project endpoints or self-links.',
  })
  @Delete('relationships/:id')
  @HttpCode(204)
  delete(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.service.delete(user.userId, id);
  }
}
