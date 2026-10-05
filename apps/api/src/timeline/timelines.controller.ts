import { PaginationQueryDto } from '../query/query.dto.js';
import { ApiEndpoint } from '../contracts/api-endpoint.js';
import { ApiTimelineDto } from '../contracts/response.dto.js';
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Query,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import type { AuthenticatedUser } from '../auth/auth.types.js';
import { TimelinesService } from './timelines.service.js';
import { CreateTimelineDto, UpdateTimelineDto } from './timeline.dto.js';
@Controller()
@UseGuards(JwtAuthGuard)
export class TimelinesController {
  constructor(private readonly service: TimelinesService) {}
  @ApiEndpoint({ tag: 'Timelines', model: ApiTimelineDto, array: true })
  @Get('projects/:projectId/timelines')
  list(
    @CurrentUser() user: AuthenticatedUser,
    @Param('projectId') id: string,
    @Query() query: PaginationQueryDto,
  ) {
    return this.service.list(user.userId, id, query);
  }
  @ApiEndpoint({ tag: 'Timelines', model: ApiTimelineDto })
  @Post('projects/:projectId/timelines')
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Param('projectId') id: string,
    @Body() dto: CreateTimelineDto,
  ) {
    return this.service.create(user.userId, id, dto);
  }
  @ApiEndpoint({ tag: 'Timelines', model: ApiTimelineDto })
  @Get('timelines/:id')
  read(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.service.read(user.userId, id);
  }
  @ApiEndpoint({ tag: 'Timelines', model: ApiTimelineDto })
  @Patch('timelines/:id')
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateTimelineDto,
  ) {
    return this.service.update(user.userId, id, dto);
  }
  @ApiEndpoint({ tag: 'Timelines' })
  @Delete('timelines/:id')
  @HttpCode(204)
  delete(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.service.delete(user.userId, id);
  }
}
