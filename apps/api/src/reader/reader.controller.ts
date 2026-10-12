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
import type { AuthenticatedUser } from '../auth/auth.types.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { ApiEndpoint } from '../contracts/api-endpoint.js';
import { PaginationQueryDto } from '../query/query.dto.js';
import {
  AnnotationDto,
  AnnotationResponse,
  BookmarkDto,
  BookmarkResponse,
  CollectionDto,
  CollectionMemberDto,
  CollectionMemberResponse,
  CollectionResponse,
  GraphicBookmarkDto,
  GraphicProgressDto,
  LibraryDto,
  LibraryQueryDto,
  LibraryResponse,
  ProgressDto,
  ProgressResponse,
  ResumeResponse,
  SaveLibraryDto,
} from './reader.dto.js';
import { ReaderService } from './reader.service.js';
@Controller('reader')
@UseGuards(JwtAuthGuard)
export class ReaderController {
  @ApiEndpoint({ tag: 'Reader', model: ResumeResponse })
  @Get('progress/:workId/resume/:releaseId')
  resume(
    @CurrentUser() user: AuthenticatedUser,
    @Param('workId') workId: string,
    @Param('releaseId') releaseId: string,
  ) {
    return this.service.resume(user.userId, workId, releaseId);
  }
  @ApiEndpoint({ tag: 'Reader', model: ProgressResponse })
  @Post('graphic-progress')
  graphicProgress(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: GraphicProgressDto,
  ) {
    return this.service.graphicProgress(user.userId, dto);
  }
  @ApiEndpoint({ tag: 'Reader', model: BookmarkResponse })
  @Post('graphic-bookmarks')
  graphicBookmark(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: GraphicBookmarkDto,
  ) {
    return this.service.graphicBookmark(user.userId, dto);
  }
  constructor(private readonly service: ReaderService) {}
  @ApiEndpoint({ tag: 'Reader', model: LibraryResponse, page: true })
  @Get('library')
  library(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: LibraryQueryDto,
  ) {
    return this.service.library(user.userId, query);
  }
  @ApiEndpoint({ tag: 'Reader', model: LibraryResponse })
  @Post('library')
  saveLibrary(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: SaveLibraryDto,
  ) {
    return this.service.saveLibrary(user.userId, dto);
  }
  @ApiEndpoint({ tag: 'Reader', model: LibraryResponse })
  @Patch('library/:id')
  updateLibrary(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: LibraryDto,
  ) {
    return this.service.updateLibrary(user.userId, id, dto);
  }
  @ApiEndpoint({ tag: 'Reader' })
  @Delete('library/:id')
  @HttpCode(204)
  deleteLibrary(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    return this.service.deleteLibrary(user.userId, id);
  }
  @ApiEndpoint({ tag: 'Reader', model: CollectionResponse, page: true })
  @Get('collections')
  collections(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: PaginationQueryDto,
  ) {
    return this.service.collections(user.userId, query);
  }
  @ApiEndpoint({ tag: 'Reader', model: CollectionResponse })
  @Post('collections')
  createCollection(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CollectionDto,
  ) {
    return this.service.saveCollection(user, dto);
  }
  @ApiEndpoint({ tag: 'Reader', model: CollectionResponse })
  @Patch('collections/:id')
  updateCollection(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: CollectionDto,
  ) {
    return this.service.saveCollection(user, dto, id);
  }
  @ApiEndpoint({ tag: 'Reader' })
  @Delete('collections/:id')
  @HttpCode(204)
  deleteCollection(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    return this.service.deleteCollection(user.userId, id);
  }
  @ApiEndpoint({ tag: 'Reader', model: CollectionMemberResponse, page: true })
  @Get('collections/:id/members')
  members(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Query() query: PaginationQueryDto,
  ) {
    return this.service.members(user.userId, id, query);
  }
  @ApiEndpoint({ tag: 'Reader', model: CollectionMemberResponse })
  @Post('collections/:id/members')
  addMember(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: CollectionMemberDto,
  ) {
    return this.service.addMember(user.userId, id, dto);
  }
  @ApiEndpoint({ tag: 'Reader' })
  @Delete('collections/:collectionId/members/:id')
  @HttpCode(204)
  deleteMember(
    @CurrentUser() user: AuthenticatedUser,
    @Param('collectionId') collectionId: string,
    @Param('id') id: string,
  ) {
    return this.service.deleteMember(user.userId, collectionId, id);
  }
  @ApiEndpoint({ tag: 'Reader', model: ProgressResponse })
  @Post('progress')
  progress(@CurrentUser() user: AuthenticatedUser, @Body() dto: ProgressDto) {
    return this.service.progress(user.userId, dto);
  }
  @ApiEndpoint({ tag: 'Reader', model: ProgressResponse, page: true })
  @Get('history')
  history(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: PaginationQueryDto,
  ) {
    return this.service.history(user.userId, query);
  }
  @ApiEndpoint({ tag: 'Reader', model: ProgressResponse })
  @Get('progress/:workId')
  state(
    @CurrentUser() user: AuthenticatedUser,
    @Param('workId') workId: string,
  ) {
    return this.service.state(user.userId, workId);
  }
  @ApiEndpoint({ tag: 'Reader' })
  @Delete('history/:id')
  @HttpCode(204)
  deleteState(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.service.deleteState(user.userId, id);
  }
  @ApiEndpoint({ tag: 'Reader', model: BookmarkResponse, page: true })
  @Get('releases/:releaseId/bookmarks')
  bookmarks(
    @CurrentUser() user: AuthenticatedUser,
    @Param('releaseId') releaseId: string,
    @Query() query: PaginationQueryDto,
  ) {
    return this.service.bookmarks(user.userId, releaseId, query);
  }
  @ApiEndpoint({ tag: 'Reader', model: BookmarkResponse })
  @Post('bookmarks')
  bookmark(@CurrentUser() user: AuthenticatedUser, @Body() dto: BookmarkDto) {
    return this.service.bookmark(user.userId, dto);
  }
  @ApiEndpoint({ tag: 'Reader' })
  @Delete('bookmarks/:id')
  @HttpCode(204)
  deletebookmark(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    return this.service.deleteBookmark(user.userId, id);
  }
  @ApiEndpoint({ tag: 'Reader', model: AnnotationResponse, page: true })
  @Get('releases/:releaseId/annotations')
  annotations(
    @CurrentUser() user: AuthenticatedUser,
    @Param('releaseId') releaseId: string,
    @Query() query: PaginationQueryDto,
  ) {
    return this.service.annotations(user.userId, releaseId, query);
  }
  @ApiEndpoint({ tag: 'Reader', model: AnnotationResponse })
  @Post('annotations')
  annotation(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: AnnotationDto,
  ) {
    return this.service.annotation(user.userId, dto);
  }
  @ApiEndpoint({ tag: 'Reader' })
  @Delete('annotations/:id')
  @HttpCode(204)
  deleteannotation(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    return this.service.deleteAnnotation(user.userId, id);
  }
  @ApiEndpoint({ tag: 'Reader', model: AnnotationResponse })
  @Patch('annotations/:id')
  updateAnnotation(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: AnnotationDto,
  ) {
    return this.service.annotation(user.userId, dto, id);
  }
}
