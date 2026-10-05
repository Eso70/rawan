import { PaginationQueryDto } from '../query/query.dto.js';
import { ApiEndpoint } from '../contracts/api-endpoint.js';
import {
  ApiProjectDto,
  ApiBookDto,
  ApiChapterDto,
  ApiSceneSummaryDto,
  ApiSceneDto,
} from '../contracts/response.dto.js';
import { ProjectQueryDto, SceneQueryDto } from '../query/query.dto.js';
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
import { ManuscriptService, type ManuscriptIds } from './manuscript.service.js';
import {
  CreateProjectDto,
  UpdateProjectDto,
  CreateBookDto,
  UpdateBookDto,
  CreateChapterDto,
  UpdateChapterDto,
  CreateSceneDto,
  UpdateSceneDto,
} from './manuscript.dto.js';

@Controller()
@UseGuards(JwtAuthGuard)
export class ManuscriptController {
  constructor(private readonly manuscript: ManuscriptService) {}

  @ApiEndpoint({ tag: 'Projects', model: ApiProjectDto, page: true })
  @Get('projects')
  listProjects(
    @CurrentUser() user: AuthenticatedUser,
    @Param() ids: ManuscriptIds,
    @Query() query: ProjectQueryDto,
  ) {
    return this.manuscript.listProjects(user.userId, ids, query);
  }

  @ApiEndpoint({ tag: 'Projects', model: ApiProjectDto })
  @Get('projects/:projectId')
  getProject(
    @CurrentUser() user: AuthenticatedUser,
    @Param() ids: ManuscriptIds,
    @Param('projectId') id: string,
  ) {
    return this.manuscript.getProject(user.userId, ids, id);
  }

  @ApiEndpoint({ tag: 'Projects', model: ApiProjectDto })
  @Post('projects')
  createProject(
    @CurrentUser() user: AuthenticatedUser,
    @Param() ids: ManuscriptIds,
    @Body() dto: CreateProjectDto,
  ) {
    return this.manuscript.createProject(user.userId, ids, dto);
  }

  @ApiEndpoint({ tag: 'Projects', model: ApiProjectDto })
  @Patch('projects/:projectId')
  updateProject(
    @CurrentUser() user: AuthenticatedUser,
    @Param() ids: ManuscriptIds,
    @Param('projectId') id: string,
    @Body() dto: UpdateProjectDto,
  ) {
    return this.manuscript.updateProject(user.userId, ids, id, dto);
  }

  @ApiEndpoint({ tag: 'Projects' })
  @Delete('projects/:projectId')
  @HttpCode(204)
  deleteProject(
    @CurrentUser() user: AuthenticatedUser,
    @Param() ids: ManuscriptIds,
    @Param('projectId') id: string,
  ) {
    return this.manuscript.deleteProject(user.userId, ids, id);
  }

  @ApiEndpoint({ tag: 'Books', model: ApiBookDto, array: true })
  @Get('projects/:projectId/books')
  listBooks(
    @CurrentUser() user: AuthenticatedUser,
    @Param() ids: ManuscriptIds,
    @Query() query: PaginationQueryDto,
  ) {
    return this.manuscript.listBooks(user.userId, ids, query);
  }

  @ApiEndpoint({ tag: 'Books', model: ApiBookDto })
  @Get('projects/:projectId/books/:bookId')
  getBook(
    @CurrentUser() user: AuthenticatedUser,
    @Param() ids: ManuscriptIds,
    @Param('bookId') id: string,
  ) {
    return this.manuscript.getBook(user.userId, ids, id);
  }

  @ApiEndpoint({ tag: 'Books', model: ApiBookDto })
  @Post('projects/:projectId/books')
  createBook(
    @CurrentUser() user: AuthenticatedUser,
    @Param() ids: ManuscriptIds,
    @Body() dto: CreateBookDto,
  ) {
    return this.manuscript.createBook(user.userId, ids, dto);
  }

  @ApiEndpoint({ tag: 'Books', model: ApiBookDto })
  @Patch('projects/:projectId/books/:bookId')
  updateBook(
    @CurrentUser() user: AuthenticatedUser,
    @Param() ids: ManuscriptIds,
    @Param('bookId') id: string,
    @Body() dto: UpdateBookDto,
  ) {
    return this.manuscript.updateBook(user.userId, ids, id, dto);
  }

  @ApiEndpoint({ tag: 'Books' })
  @Delete('projects/:projectId/books/:bookId')
  @HttpCode(204)
  deleteBook(
    @CurrentUser() user: AuthenticatedUser,
    @Param() ids: ManuscriptIds,
    @Param('bookId') id: string,
  ) {
    return this.manuscript.deleteBook(user.userId, ids, id);
  }

  @ApiEndpoint({ tag: 'Chapters', model: ApiChapterDto, array: true })
  @Get('projects/:projectId/books/:bookId/chapters')
  listChapters(
    @CurrentUser() user: AuthenticatedUser,
    @Param() ids: ManuscriptIds,
    @Query() query: PaginationQueryDto,
  ) {
    return this.manuscript.listChapters(user.userId, ids, query);
  }

  @ApiEndpoint({ tag: 'Chapters', model: ApiChapterDto })
  @Get('projects/:projectId/books/:bookId/chapters/:chapterId')
  getChapter(
    @CurrentUser() user: AuthenticatedUser,
    @Param() ids: ManuscriptIds,
    @Param('chapterId') id: string,
  ) {
    return this.manuscript.getChapter(user.userId, ids, id);
  }

  @ApiEndpoint({ tag: 'Chapters', model: ApiChapterDto })
  @Post('projects/:projectId/books/:bookId/chapters')
  createChapter(
    @CurrentUser() user: AuthenticatedUser,
    @Param() ids: ManuscriptIds,
    @Body() dto: CreateChapterDto,
  ) {
    return this.manuscript.createChapter(user.userId, ids, dto);
  }

  @ApiEndpoint({ tag: 'Chapters', model: ApiChapterDto })
  @Patch('projects/:projectId/books/:bookId/chapters/:chapterId')
  updateChapter(
    @CurrentUser() user: AuthenticatedUser,
    @Param() ids: ManuscriptIds,
    @Param('chapterId') id: string,
    @Body() dto: UpdateChapterDto,
  ) {
    return this.manuscript.updateChapter(user.userId, ids, id, dto);
  }

  @ApiEndpoint({ tag: 'Chapters' })
  @Delete('projects/:projectId/books/:bookId/chapters/:chapterId')
  @HttpCode(204)
  deleteChapter(
    @CurrentUser() user: AuthenticatedUser,
    @Param() ids: ManuscriptIds,
    @Param('chapterId') id: string,
  ) {
    return this.manuscript.deleteChapter(user.userId, ids, id);
  }

  @ApiEndpoint({ tag: 'Scenes', model: ApiSceneSummaryDto, page: true })
  @Get('projects/:projectId/books/:bookId/chapters/:chapterId/scenes')
  listScenes(
    @CurrentUser() user: AuthenticatedUser,
    @Param() ids: ManuscriptIds,
    @Query() query: SceneQueryDto,
  ) {
    return this.manuscript.listScenes(user.userId, ids, query);
  }

  @ApiEndpoint({ tag: 'Scenes', model: ApiSceneDto })
  @Get('projects/:projectId/books/:bookId/chapters/:chapterId/scenes/:sceneId')
  getScene(
    @CurrentUser() user: AuthenticatedUser,
    @Param() ids: ManuscriptIds,
    @Param('sceneId') id: string,
  ) {
    return this.manuscript.getScene(user.userId, ids, id);
  }

  @ApiEndpoint({ tag: 'Scenes', model: ApiSceneDto })
  @Post('projects/:projectId/books/:bookId/chapters/:chapterId/scenes')
  createScene(
    @CurrentUser() user: AuthenticatedUser,
    @Param() ids: ManuscriptIds,
    @Body() dto: CreateSceneDto,
  ) {
    return this.manuscript.createScene(user.userId, ids, dto);
  }

  @ApiEndpoint({ tag: 'Scenes', model: ApiSceneDto })
  @Patch(
    'projects/:projectId/books/:bookId/chapters/:chapterId/scenes/:sceneId',
  )
  updateScene(
    @CurrentUser() user: AuthenticatedUser,
    @Param() ids: ManuscriptIds,
    @Param('sceneId') id: string,
    @Body() dto: UpdateSceneDto,
  ) {
    return this.manuscript.updateScene(user.userId, ids, id, dto);
  }

  @ApiEndpoint({ tag: 'Scenes' })
  @Delete(
    'projects/:projectId/books/:bookId/chapters/:chapterId/scenes/:sceneId',
  )
  @HttpCode(204)
  deleteScene(
    @CurrentUser() user: AuthenticatedUser,
    @Param() ids: ManuscriptIds,
    @Param('sceneId') id: string,
  ) {
    return this.manuscript.deleteScene(user.userId, ids, id);
  }
}
