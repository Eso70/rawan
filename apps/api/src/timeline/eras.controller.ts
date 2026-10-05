import { PaginationQueryDto } from '../query/query.dto.js';
import { ApiEndpoint } from '../contracts/api-endpoint.js';
import { ApiEraDto } from '../contracts/response.dto.js';
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
import { ErasService } from './eras.service.js';
import { CreateEraDto, UpdateEraDto } from './timeline.dto.js';
@Controller()
@UseGuards(JwtAuthGuard)
export class ErasController {
  constructor(private readonly service: ErasService) {}
  @ApiEndpoint({
    tag: 'Timelines',
    model: ApiEraDto,
    array: true,
    description:
      'Fictional start/end chronology uses exact decimal strings, not dates or JSON numbers. End cannot precede start.',
  })
  @Get('timelines/:timelineId/eras')
  list(
    @CurrentUser() user: AuthenticatedUser,
    @Param('timelineId') id: string,
    @Query() query: PaginationQueryDto,
  ) {
    return this.service.list(user.userId, id, query);
  }
  @ApiEndpoint({
    tag: 'Timelines',
    model: ApiEraDto,
    description:
      'Fictional start/end chronology uses exact decimal strings, not dates or JSON numbers. End cannot precede start.',
  })
  @Post('timelines/:timelineId/eras')
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Param('timelineId') id: string,
    @Body() dto: CreateEraDto,
  ) {
    return this.service.create(user.userId, id, dto);
  }
  @ApiEndpoint({
    tag: 'Timelines',
    model: ApiEraDto,
    description:
      'Fictional start/end chronology uses exact decimal strings, not dates or JSON numbers. End cannot precede start.',
  })
  @Get('eras/:id')
  read(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.service.read(user.userId, id);
  }
  @ApiEndpoint({
    tag: 'Timelines',
    model: ApiEraDto,
    description:
      'Fictional start/end chronology uses exact decimal strings, not dates or JSON numbers. End cannot precede start.',
  })
  @Patch('eras/:id')
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateEraDto,
  ) {
    return this.service.update(user.userId, id, dto);
  }
  @ApiEndpoint({
    tag: 'Timelines',
    description:
      'Fictional start/end chronology uses exact decimal strings, not dates or JSON numbers. End cannot precede start.',
  })
  @Delete('eras/:id')
  @HttpCode(204)
  delete(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.service.delete(user.userId, id);
  }
}
