import { Controller, Get, Header, Param, Query } from '@nestjs/common';
import { ApiEndpoint } from '../contracts/api-endpoint.js';
import { ReleaseAssetResponse } from '../publication/publication.dto.js';
import { PaginationQueryDto } from '../query/query.dto.js';
import { AssetRenditionResponse, GraphicPageResponse } from './graphics.dto.js';
import { GraphicsService } from './graphics.service.js';
@Controller('catalog')
export class GraphicsCatalogController {
  @ApiEndpoint({
    tag: 'Catalog',
    public: true,
    model: ReleaseAssetResponse,
    page: true,
  })
  @Get('releases/:id/assets')
  assets(@Param('id') id: string, @Query() query: PaginationQueryDto) {
    return this.service.releasedAssets(id, query);
  }
  constructor(private readonly service: GraphicsService) {}
  @ApiEndpoint({
    tag: 'Catalog',
    public: true,
    model: GraphicPageResponse,
    page: true,
  })
  @Get('releases/:id/graphic-pages')
  pages(@Param('id') id: string, @Query() query: PaginationQueryDto) {
    return this.service.graphicPages(id, query);
  }
  @ApiEndpoint({
    tag: 'Catalog',
    public: true,
    model: AssetRenditionResponse,
    array: true,
  })
  @Get('releases/:releaseId/assets/:assetId')
  renditions(
    @Param('releaseId') releaseId: string,
    @Param('assetId') assetId: string,
  ) {
    return this.service.publicRenditions(releaseId, assetId);
  }
  @ApiEndpoint({ tag: 'Catalog', public: true, binary: ['image/webp'] })
  @Get('releases/:releaseId/assets/:assetId/:role')
  @Header('Cache-Control', 'private, no-store')
  file(
    @Param('releaseId') releaseId: string,
    @Param('assetId') assetId: string,
    @Param('role') role: string,
  ) {
    return this.service.publicAsset(releaseId, assetId, role);
  }
  @ApiEndpoint({ tag: 'Catalog', public: true, binary: ['image/webp'] })
  @Get('creators/:handle/avatar/:role')
  @Header('Cache-Control', 'private, no-store')
  avatar(@Param('handle') handle: string, @Param('role') role: string) {
    return this.service.avatar(handle, role);
  }
}
