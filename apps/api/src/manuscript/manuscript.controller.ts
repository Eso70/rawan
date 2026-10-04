import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
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

  @Get('projects')
  listProjects(
    @CurrentUser() user: AuthenticatedUser,
    @Param() ids: ManuscriptIds,
  ) {
    return this.manuscript.listProjects(user.userId, ids);
  }

  @Get('projects/:projectId')
  getProject(
    @CurrentUser() user: AuthenticatedUser,
    @Param() ids: ManuscriptIds,
    @Param('projectId') id: string,
  ) {
    return this.manuscript.getProject(user.userId, ids, id);
  }

  @Post('projects')
  createProject(
    @CurrentUser() user: AuthenticatedUser,
    @Param() ids: ManuscriptIds,
    @Body() dto: CreateProjectDto,
  ) {
    return this.manuscript.createProject(user.userId, ids, dto);
  }

  @Patch('projects/:projectId')
  updateProject(
    @CurrentUser() user: AuthenticatedUser,
    @Param() ids: ManuscriptIds,
    @Param('projectId') id: string,
    @Body() dto: UpdateProjectDto,
  ) {
    return this.manuscript.updateProject(user.userId, ids, id, dto);
  }

  @Delete('projects/:projectId')
  @HttpCode(204)
  deleteProject(
    @CurrentUser() user: AuthenticatedUser,
    @Param() ids: ManuscriptIds,
    @Param('projectId') id: string,
  ) {
    return this.manuscript.deleteProject(user.userId, ids, id);
  }

  @Get('projects/:projectId/books')
  listBooks(
    @CurrentUser() user: AuthenticatedUser,
    @Param() ids: ManuscriptIds,
  ) {
    return this.manuscript.listBooks(user.userId, ids);
  }

  @Get('projects/:projectId/books/:bookId')
  getBook(
    @CurrentUser() user: AuthenticatedUser,
    @Param() ids: ManuscriptIds,
    @Param('bookId') id: string,
  ) {
    return this.manuscript.getBook(user.userId, ids, id);
  }

  @Post('projects/:projectId/books')
  createBook(
    @CurrentUser() user: AuthenticatedUser,
    @Param() ids: ManuscriptIds,
    @Body() dto: CreateBookDto,
  ) {
    return this.manuscript.createBook(user.userId, ids, dto);
  }

  @Patch('projects/:projectId/books/:bookId')
  updateBook(
    @CurrentUser() user: AuthenticatedUser,
    @Param() ids: ManuscriptIds,
    @Param('bookId') id: string,
    @Body() dto: UpdateBookDto,
  ) {
    return this.manuscript.updateBook(user.userId, ids, id, dto);
  }

  @Delete('projects/:projectId/books/:bookId')
  @HttpCode(204)
  deleteBook(
    @CurrentUser() user: AuthenticatedUser,
    @Param() ids: ManuscriptIds,
    @Param('bookId') id: string,
  ) {
    return this.manuscript.deleteBook(user.userId, ids, id);
  }

  @Get('projects/:projectId/books/:bookId/chapters')
  listChapters(
    @CurrentUser() user: AuthenticatedUser,
    @Param() ids: ManuscriptIds,
  ) {
    return this.manuscript.listChapters(user.userId, ids);
  }

  @Get('projects/:projectId/books/:bookId/chapters/:chapterId')
  getChapter(
    @CurrentUser() user: AuthenticatedUser,
    @Param() ids: ManuscriptIds,
    @Param('chapterId') id: string,
  ) {
    return this.manuscript.getChapter(user.userId, ids, id);
  }

  @Post('projects/:projectId/books/:bookId/chapters')
  createChapter(
    @CurrentUser() user: AuthenticatedUser,
    @Param() ids: ManuscriptIds,
    @Body() dto: CreateChapterDto,
  ) {
    return this.manuscript.createChapter(user.userId, ids, dto);
  }

  @Patch('projects/:projectId/books/:bookId/chapters/:chapterId')
  updateChapter(
    @CurrentUser() user: AuthenticatedUser,
    @Param() ids: ManuscriptIds,
    @Param('chapterId') id: string,
    @Body() dto: UpdateChapterDto,
  ) {
    return this.manuscript.updateChapter(user.userId, ids, id, dto);
  }

  @Delete('projects/:projectId/books/:bookId/chapters/:chapterId')
  @HttpCode(204)
  deleteChapter(
    @CurrentUser() user: AuthenticatedUser,
    @Param() ids: ManuscriptIds,
    @Param('chapterId') id: string,
  ) {
    return this.manuscript.deleteChapter(user.userId, ids, id);
  }

  @Get('projects/:projectId/books/:bookId/chapters/:chapterId/scenes')
  listScenes(
    @CurrentUser() user: AuthenticatedUser,
    @Param() ids: ManuscriptIds,
  ) {
    return this.manuscript.listScenes(user.userId, ids);
  }

  @Get('projects/:projectId/books/:bookId/chapters/:chapterId/scenes/:sceneId')
  getScene(
    @CurrentUser() user: AuthenticatedUser,
    @Param() ids: ManuscriptIds,
    @Param('sceneId') id: string,
  ) {
    return this.manuscript.getScene(user.userId, ids, id);
  }

  @Post('projects/:projectId/books/:bookId/chapters/:chapterId/scenes')
  createScene(
    @CurrentUser() user: AuthenticatedUser,
    @Param() ids: ManuscriptIds,
    @Body() dto: CreateSceneDto,
  ) {
    return this.manuscript.createScene(user.userId, ids, dto);
  }

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
