import { ApiEndpoint } from '../contracts/api-endpoint.js';
import { ApiNoteSummaryDto, ApiNoteDto } from '../contracts/response.dto.js';
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
import { NotesService } from './notes.service.js';
import {
  CreateNoteDto,
  UpdateNoteDto,
  NoteQueryDto,
} from './organization.dto.js';
@Controller()
@UseGuards(JwtAuthGuard)
export class NotesController {
  constructor(private readonly service: NotesService) {}
  @ApiEndpoint({ tag: 'Notes', model: ApiNoteSummaryDto, page: true })
  @Get('projects/:projectId/notes')
  list(
    @CurrentUser() user: AuthenticatedUser,
    @Param('projectId') id: string,
    @Query() query: NoteQueryDto,
  ) {
    return this.service.list(user.userId, id, query);
  }
  @ApiEndpoint({ tag: 'Notes', model: ApiNoteDto })
  @Post('projects/:projectId/notes')
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Param('projectId') id: string,
    @Body() dto: CreateNoteDto,
  ) {
    return this.service.create(user.userId, id, dto);
  }
  @ApiEndpoint({ tag: 'Notes', model: ApiNoteDto })
  @Get('notes/:id')
  read(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.service.read(user.userId, id);
  }
  @ApiEndpoint({ tag: 'Notes', model: ApiNoteDto })
  @Patch('notes/:id')
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateNoteDto,
  ) {
    return this.service.update(user.userId, id, dto);
  }
  @ApiEndpoint({ tag: 'Notes' })
  @Delete('notes/:id')
  @HttpCode(204)
  delete(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.service.delete(user.userId, id);
  }
}
