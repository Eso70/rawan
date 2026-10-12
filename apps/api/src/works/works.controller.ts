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
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import type { AuthenticatedUser } from '../auth/auth.types.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { ApiEndpoint } from '../contracts/api-endpoint.js';
import { ProjectQueryDto, PaginationQueryDto } from '../query/query.dto.js';
import { WorksService } from './works.service.js';
import {
  AddWorkSourceDto,
  ApiWorkDto,
  ApiWorkSourceDto,
  CreateWorkDto,
  UpdateWorkDto,
} from './works.dto.js';

@Controller('works')
@UseGuards(JwtAuthGuard)
export class WorksController {
  constructor(private readonly works: WorksService) {}

  @ApiEndpoint({
    tag: 'Works',
    model: ApiWorkDto,
    page: true,
    description:
      'Private work identities owned by the current account. No published content or reader access.',
  })
  @Get()
  list(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: ProjectQueryDto,
  ) {
    return this.works.list(user.userId, query);
  }

  @ApiEndpoint({ tag: 'Works', model: ApiWorkDto })
  @Post()
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateWorkDto) {
    return this.works.create(user.userId, dto);
  }

  @ApiEndpoint({ tag: 'Works', model: ApiWorkDto })
  @Get(':workId')
  read(@CurrentUser() user: AuthenticatedUser, @Param('workId') id: string) {
    return this.works.read(user.userId, id);
  }

  @ApiEndpoint({ tag: 'Works', model: ApiWorkDto })
  @Patch(':workId')
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('workId') id: string,
    @Body() dto: UpdateWorkDto,
  ) {
    return this.works.update(user.userId, id, dto);
  }

  @ApiEndpoint({ tag: 'Works' })
  @Delete(':workId')
  @HttpCode(204)
  remove(@CurrentUser() user: AuthenticatedUser, @Param('workId') id: string) {
    return this.works.remove(user.userId, id);
  }

  @ApiEndpoint({ tag: 'Works', model: ApiWorkSourceDto, page: true })
  @Get(':workId/sources')
  sources(
    @CurrentUser() user: AuthenticatedUser,
    @Param('workId') id: string,
    @Query() query: PaginationQueryDto,
  ) {
    return this.works.sources(user.userId, id, query);
  }

  @ApiEndpoint({
    tag: 'Works',
    model: ApiWorkSourceDto,
    description:
      'Link an existing manuscript in an owned project to an owned private work. No content is copied or published. Both resources must belong to the current account.',
  })
  @Post(':workId/sources')
  addSource(
    @CurrentUser() user: AuthenticatedUser,
    @Param('workId') id: string,
    @Body() dto: AddWorkSourceDto,
  ) {
    return this.works.addSource(user.userId, id, dto);
  }

  @ApiEndpoint({
    tag: 'Works',
    description:
      'Remove only the owned work source association; preserve the manuscript and its project.',
  })
  @Delete(':workId/sources/:id')
  @HttpCode(204)
  removeSource(
    @CurrentUser() user: AuthenticatedUser,
    @Param('workId') workId: string,
    @Param('id') id: string,
  ) {
    return this.works.removeSource(user.userId, workId, id);
  }
}
