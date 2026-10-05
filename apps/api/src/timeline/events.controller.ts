import { ApiEndpoint } from '../contracts/api-endpoint.js';
import {
  ApiEventSummaryDto,
  ApiTimelineEventDto,
  ApiEventEntityDto,
} from '../contracts/response.dto.js';
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
import { EventsService } from './events.service.js';
import {
  CreateEventDto,
  UpdateEventDto,
  EventQueryDto,
  AttachEventEntityDto,
} from './timeline.dto.js';
@Controller()
@UseGuards(JwtAuthGuard)
export class EventsController {
  constructor(private readonly service: EventsService) {}
  @ApiEndpoint({
    tag: 'Timelines',
    model: ApiEventSummaryDto,
    page: true,
    description:
      'Owned fictional chronology. entityKind/entityId filters are paired; from/to are inclusive exact decimal strings. Associated resources must belong to the same project.',
  })
  @Get('timelines/:timelineId/events')
  list(
    @CurrentUser() user: AuthenticatedUser,
    @Param('timelineId') id: string,
    @Query() query: EventQueryDto,
  ) {
    return this.service.list(user.userId, id, query);
  }
  @ApiEndpoint({
    tag: 'Timelines',
    model: ApiTimelineEventDto,
    description:
      'Owned fictional chronology. entityKind/entityId filters are paired; from/to are inclusive exact decimal strings. Associated resources must belong to the same project.',
  })
  @Post('timelines/:timelineId/events')
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Param('timelineId') id: string,
    @Body() dto: CreateEventDto,
  ) {
    return this.service.create(user.userId, id, dto);
  }
  @ApiEndpoint({
    tag: 'Timelines',
    model: ApiTimelineEventDto,
    description:
      'Owned fictional chronology. entityKind/entityId filters are paired; from/to are inclusive exact decimal strings. Associated resources must belong to the same project.',
  })
  @Get('events/:id')
  read(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.service.read(user.userId, id);
  }
  @ApiEndpoint({
    tag: 'Timelines',
    model: ApiTimelineEventDto,
    description:
      'Owned fictional chronology. entityKind/entityId filters are paired; from/to are inclusive exact decimal strings. Associated resources must belong to the same project.',
  })
  @Patch('events/:id')
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateEventDto,
  ) {
    return this.service.update(user.userId, id, dto);
  }
  @ApiEndpoint({
    tag: 'Timelines',
    description:
      'Owned fictional chronology. entityKind/entityId filters are paired; from/to are inclusive exact decimal strings. Associated resources must belong to the same project.',
  })
  @Delete('events/:id')
  @HttpCode(204)
  delete(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.service.delete(user.userId, id);
  }
  @ApiEndpoint({
    tag: 'Timelines',
    model: ApiEventEntityDto,
    description:
      'Owned fictional chronology. entityKind/entityId filters are paired; from/to are inclusive exact decimal strings. Associated resources must belong to the same project.',
  })
  @Post('events/:id/entities')
  attach(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: AttachEventEntityDto,
  ) {
    return this.service.attach(user.userId, id, dto);
  }
  @ApiEndpoint({
    tag: 'Timelines',
    description:
      'Owned fictional chronology. entityKind/entityId filters are paired; from/to are inclusive exact decimal strings. Associated resources must belong to the same project.',
  })
  @Delete('events/:eventId/entities/:id')
  @HttpCode(204)
  detach(
    @CurrentUser() user: AuthenticatedUser,
    @Param('eventId') eventId: string,
    @Param('id') id: string,
  ) {
    return this.service.detach(user.userId, eventId, id);
  }
}
