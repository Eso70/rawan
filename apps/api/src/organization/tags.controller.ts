import { ApiEndpoint } from '../contracts/api-endpoint.js';
import { ApiTagDto, ApiTagAssignmentDto } from '../contracts/response.dto.js';
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
import { TagsService } from './tags.service.js';
import {
  CreateTagDto,
  UpdateTagDto,
  TagQueryDto,
  AssignTagDto,
  TagAssignmentQueryDto,
  ResourceTagsQueryDto,
} from './organization.dto.js';
@Controller()
@UseGuards(JwtAuthGuard)
export class TagsController {
  constructor(private readonly service: TagsService) {}
  @ApiEndpoint({ tag: 'Tags', model: ApiTagDto, page: true })
  @Get('projects/:projectId/tags')
  list(
    @CurrentUser() user: AuthenticatedUser,
    @Param('projectId') id: string,
    @Query() query: TagQueryDto,
  ) {
    return this.service.list(user.userId, id, query);
  }
  @ApiEndpoint({ tag: 'Tags', model: ApiTagDto })
  @Post('projects/:projectId/tags')
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Param('projectId') id: string,
    @Body() dto: CreateTagDto,
  ) {
    return this.service.create(user.userId, id, dto);
  }
  @ApiEndpoint({ tag: 'Tags', model: ApiTagDto })
  @Get('tags/:id')
  read(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.service.read(user.userId, id);
  }
  @ApiEndpoint({ tag: 'Tags', model: ApiTagDto })
  @Patch('tags/:id')
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateTagDto,
  ) {
    return this.service.update(user.userId, id, dto);
  }
  @ApiEndpoint({ tag: 'Tags' })
  @Delete('tags/:id')
  @HttpCode(204)
  delete(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.service.delete(user.userId, id);
  }
  @ApiEndpoint({ tag: 'Tags', model: ApiTagAssignmentDto })
  @Post('tags/:tagId/assignments')
  assign(
    @CurrentUser() user: AuthenticatedUser,
    @Param('tagId') id: string,
    @Body() dto: AssignTagDto,
  ) {
    return this.service.assign(user.userId, id, dto);
  }
  @ApiEndpoint({ tag: 'Tags', model: ApiTagAssignmentDto, page: true })
  @Get('tags/:tagId/assignments')
  assignments(
    @CurrentUser() user: AuthenticatedUser,
    @Param('tagId') id: string,
    @Query() query: TagAssignmentQueryDto,
  ) {
    return this.service.assignments(user.userId, id, query);
  }
  @ApiEndpoint({ tag: 'Tags' })
  @Delete('tags/:tagId/assignments/:id')
  @HttpCode(204)
  unassign(
    @CurrentUser() user: AuthenticatedUser,
    @Param('tagId') tagId: string,
    @Param('id') id: string,
  ) {
    return this.service.unassign(user.userId, tagId, id);
  }
  @ApiEndpoint({ tag: 'Tags', model: ApiTagAssignmentDto, page: true })
  @Get('projects/:projectId/resource-tags')
  forResource(
    @CurrentUser() user: AuthenticatedUser,
    @Param('projectId') id: string,
    @Query() query: ResourceTagsQueryDto,
  ) {
    return this.service.forResource(user.userId, id, query);
  }
}
