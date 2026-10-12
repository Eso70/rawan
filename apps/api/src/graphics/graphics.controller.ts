import {
  Body,
  Controller,
  Delete,
  Get,
  Header,
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
import { ReleaseResponse } from '../publication/publication.dto.js';
import { PaginationQueryDto } from '../query/query.dto.js';
import {
  AppearanceDto,
  AppearanceResponse,
  AssetResponse,
  ComicDto,
  ComicPageDto,
  ComicPageResponse,
  ComicResponse,
  ExportDto,
  ExportResponse,
  GraphicPageResponse,
  GraphicReleaseDto,
  ImportAssetDto,
  PanelResponse,
  PanelsDto,
  ScriptDto,
  ScriptResponse,
  UpdateComicPageDto,
} from './graphics.dto.js';
import { GraphicsService } from './graphics.service.js';
@Controller()
@UseGuards(JwtAuthGuard)
export class GraphicsController {
  @ApiEndpoint({ tag: 'Graphics', model: GraphicPageResponse, page: true })
  @Get('works/:workId/releases/:id/graphic-pages')
  previewPages(
    @CurrentUser() user: AuthenticatedUser,
    @Param('workId') workId: string,
    @Param('id') id: string,
    @Query() query: PaginationQueryDto,
  ) {
    return this.service.previewPages(user.userId, workId, id, query);
  }
  constructor(private readonly service: GraphicsService) {}
  @ApiEndpoint({ tag: 'Graphics', model: AssetResponse, page: true })
  @Get('works/:workId/assets')
  assets(
    @CurrentUser() user: AuthenticatedUser,
    @Param('workId') workId: string,
    @Query() query: PaginationQueryDto,
  ) {
    return this.service.assets(user.userId, workId, query);
  }
  @ApiEndpoint({ tag: 'Graphics', model: AssetResponse })
  @Get('works/:workId/assets/:id')
  asset(
    @CurrentUser() user: AuthenticatedUser,
    @Param('workId') workId: string,
    @Param('id') id: string,
  ) {
    return this.service.asset(user.userId, workId, id);
  }
  @ApiEndpoint({ tag: 'Graphics', model: AssetResponse })
  @Post('works/:workId/assets')
  importAsset(
    @CurrentUser() user: AuthenticatedUser,
    @Param('workId') workId: string,
    @Body() dto: ImportAssetDto,
  ) {
    return this.service.importAsset(user.userId, workId, dto);
  }
  @ApiEndpoint({ tag: 'Graphics' })
  @Delete('works/:workId/assets/:id')
  @HttpCode(204)
  deleteAsset(
    @CurrentUser() user: AuthenticatedUser,
    @Param('workId') workId: string,
    @Param('id') id: string,
  ) {
    return this.service.deleteAsset(user.userId, workId, id);
  }
  @ApiEndpoint({ tag: 'Graphics', binary: ['image/webp'] })
  @Get('works/:workId/assets/:id/files/:role')
  @Header('Cache-Control', 'private, no-store')
  assetFile(
    @CurrentUser() user: AuthenticatedUser,
    @Param('workId') workId: string,
    @Param('id') id: string,
    @Param('role') role: string,
  ) {
    return this.service.assetFile(user.userId, workId, id, role);
  }
  @ApiEndpoint({ tag: 'Graphics', model: ComicResponse, page: true })
  @Get('works/:workId/comics')
  comics(
    @CurrentUser() user: AuthenticatedUser,
    @Param('workId') workId: string,
    @Query() query: PaginationQueryDto,
  ) {
    return this.service.comics(user.userId, workId, query);
  }
  @ApiEndpoint({ tag: 'Graphics', model: ComicResponse })
  @Post('works/:workId/comics')
  createComic(
    @CurrentUser() user: AuthenticatedUser,
    @Param('workId') workId: string,
    @Body() dto: ComicDto,
  ) {
    return this.service.saveComic(user.userId, workId, dto);
  }
  @ApiEndpoint({ tag: 'Graphics', model: ComicResponse })
  @Patch('works/:workId/comics/:id')
  updateComic(
    @CurrentUser() user: AuthenticatedUser,
    @Param('workId') workId: string,
    @Param('id') id: string,
    @Body() dto: ComicDto,
  ) {
    return this.service.saveComic(user.userId, workId, dto, id);
  }
  @ApiEndpoint({ tag: 'Graphics' })
  @Delete('works/:workId/comics/:id')
  @HttpCode(204)
  deleteComic(
    @CurrentUser() user: AuthenticatedUser,
    @Param('workId') workId: string,
    @Param('id') id: string,
  ) {
    return this.service.deleteComic(user.userId, workId, id);
  }
  @ApiEndpoint({ tag: 'Graphics', model: ComicPageResponse, page: true })
  @Get('works/:workId/comics/:comicId/pages')
  pages(
    @CurrentUser() user: AuthenticatedUser,
    @Param('workId') workId: string,
    @Param('comicId') comicId: string,
    @Query() query: PaginationQueryDto,
  ) {
    return this.service.pages(user.userId, workId, comicId, query);
  }
  @ApiEndpoint({ tag: 'Graphics', model: ComicPageResponse })
  @Post('works/:workId/comics/:comicId/pages')
  createPage(
    @CurrentUser() user: AuthenticatedUser,
    @Param('workId') workId: string,
    @Param('comicId') comicId: string,
    @Body() dto: ComicPageDto,
  ) {
    return this.service.savePage(user.userId, workId, comicId, dto);
  }
  @ApiEndpoint({ tag: 'Graphics', model: ComicPageResponse })
  @Get('works/:workId/comics/:comicId/pages/:id')
  page(
    @CurrentUser() user: AuthenticatedUser,
    @Param('workId') workId: string,
    @Param('comicId') comicId: string,
    @Param('id') id: string,
  ) {
    return this.service.page(user.userId, workId, comicId, id);
  }
  @ApiEndpoint({ tag: 'Graphics', model: ComicPageResponse })
  @Patch('works/:workId/comics/:comicId/pages/:id')
  updatePage(
    @CurrentUser() user: AuthenticatedUser,
    @Param('workId') workId: string,
    @Param('comicId') comicId: string,
    @Param('id') id: string,
    @Body() dto: UpdateComicPageDto,
  ) {
    return this.service.savePage(user.userId, workId, comicId, dto, id);
  }
  @ApiEndpoint({ tag: 'Graphics' })
  @Delete('works/:workId/comics/:comicId/pages/:id')
  @HttpCode(204)
  deletePage(
    @CurrentUser() user: AuthenticatedUser,
    @Param('workId') workId: string,
    @Param('comicId') comicId: string,
    @Param('id') id: string,
  ) {
    return this.service.deletePage(user.userId, workId, comicId, id);
  }
  @ApiEndpoint({ tag: 'Graphics', model: PanelResponse, array: true })
  @Patch('works/:workId/comics/:comicId/pages/:id/panels')
  panels(
    @CurrentUser() user: AuthenticatedUser,
    @Param('workId') workId: string,
    @Param('comicId') comicId: string,
    @Param('id') id: string,
    @Body() dto: PanelsDto,
  ) {
    return this.service.panels(user.userId, workId, comicId, id, dto);
  }
  @ApiEndpoint({ tag: 'Graphics', model: ScriptResponse })
  @Post('works/:workId/comics/:comicId/pages/:pageId/scripts')
  script(
    @CurrentUser() user: AuthenticatedUser,
    @Param('workId') workId: string,
    @Param('comicId') comicId: string,
    @Param('pageId') pageId: string,
    @Body() dto: ScriptDto,
  ) {
    return this.service.script(user.userId, workId, comicId, pageId, dto);
  }
  @ApiEndpoint({ tag: 'Graphics' })
  @Delete('works/:workId/comics/:comicId/pages/:pageId/scripts/:id')
  @HttpCode(204)
  deletescript(
    @CurrentUser() user: AuthenticatedUser,
    @Param('workId') workId: string,
    @Param('comicId') comicId: string,
    @Param('pageId') pageId: string,
    @Param('id') id: string,
  ) {
    return this.service.deleteScript(user.userId, workId, comicId, pageId, id);
  }
  @ApiEndpoint({ tag: 'Graphics', model: AppearanceResponse })
  @Post('works/:workId/comics/:comicId/pages/:pageId/appearances')
  appearance(
    @CurrentUser() user: AuthenticatedUser,
    @Param('workId') workId: string,
    @Param('comicId') comicId: string,
    @Param('pageId') pageId: string,
    @Body() dto: AppearanceDto,
  ) {
    return this.service.appearance(user.userId, workId, comicId, pageId, dto);
  }
  @ApiEndpoint({ tag: 'Graphics' })
  @Delete('works/:workId/comics/:comicId/pages/:pageId/appearances/:id')
  @HttpCode(204)
  deleteappearance(
    @CurrentUser() user: AuthenticatedUser,
    @Param('workId') workId: string,
    @Param('comicId') comicId: string,
    @Param('pageId') pageId: string,
    @Param('id') id: string,
  ) {
    return this.service.deleteAppearance(
      user.userId,
      workId,
      comicId,
      pageId,
      id,
    );
  }
  @ApiEndpoint({ tag: 'Graphics', model: ReleaseResponse })
  @Post('works/:workId/graphic-releases')
  graphicRelease(
    @CurrentUser() user: AuthenticatedUser,
    @Param('workId') workId: string,
    @Body() dto: GraphicReleaseDto,
  ) {
    return this.service.graphicRelease(user.userId, workId, dto);
  }
  @ApiEndpoint({ tag: 'Graphics', model: ExportResponse, page: true })
  @Get('works/:workId/exports')
  exports(
    @CurrentUser() user: AuthenticatedUser,
    @Param('workId') workId: string,
    @Query() query: PaginationQueryDto,
  ) {
    return this.service.exports(user.userId, workId, query);
  }
  @ApiEndpoint({ tag: 'Graphics', model: ExportResponse })
  @Post('works/:workId/exports')
  createExport(
    @CurrentUser() user: AuthenticatedUser,
    @Param('workId') workId: string,
    @Body() dto: ExportDto,
  ) {
    return this.service.createExport(user.userId, workId, dto);
  }
  @ApiEndpoint({ tag: 'Graphics', model: ExportResponse })
  @Get('works/:workId/exports/:id')
  export(
    @CurrentUser() user: AuthenticatedUser,
    @Param('workId') workId: string,
    @Param('id') id: string,
  ) {
    return this.service.export(user.userId, workId, id);
  }
  @ApiEndpoint({ tag: 'Graphics' })
  @Delete('works/:workId/exports/:id')
  @HttpCode(204)
  deleteExport(
    @CurrentUser() user: AuthenticatedUser,
    @Param('workId') workId: string,
    @Param('id') id: string,
  ) {
    return this.service.deleteExport(user.userId, workId, id);
  }
  @ApiEndpoint({
    tag: 'Graphics',
    binary: ['text/plain', 'text/html', 'application/epub+zip'],
  })
  @Get('works/:workId/exports/:id/file')
  @Header('Cache-Control', 'private, no-store')
  exportFile(
    @CurrentUser() user: AuthenticatedUser,
    @Param('workId') workId: string,
    @Param('id') id: string,
  ) {
    return this.service.exportFile(user.userId, workId, id);
  }
}
