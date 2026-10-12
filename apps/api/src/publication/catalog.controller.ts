import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiEndpoint } from '../contracts/api-endpoint.js';
import { PaginationQueryDto } from '../query/query.dto.js';
import {
  BlockResponse,
  CatalogQueryDto,
  CreatorResponse,
  PublicCreditResponse,
  PublicRelatedResponse,
  PublicSeriesResponse,
  ReleaseResponse,
  SectionResponse,
  SupplementResponse,
} from './publication.dto.js';
import { PublicationService } from './publication.service.js';
@Controller('catalog')
export class CatalogController {
  @ApiEndpoint({ tag: 'Catalog', public: true, model: ReleaseResponse })
  @Get('works/:id')
  work(@Param('id') id: string) {
    return this.service.publicWork(id);
  }
  @ApiEndpoint({
    tag: 'Catalog',
    public: true,
    model: ReleaseResponse,
    page: true,
  })
  @Get('works/:id/releases')
  workReleases(@Param('id') id: string, @Query() query: PaginationQueryDto) {
    return this.service.publicWorkReleases(id, query);
  }
  @ApiEndpoint({
    tag: 'Catalog',
    public: true,
    model: PublicRelatedResponse,
    page: true,
  })
  @Get('releases/:id/related')
  related(@Param('id') id: string, @Query() query: PaginationQueryDto) {
    return this.service.publicRelated(id, query);
  }
  @ApiEndpoint({
    tag: 'Catalog',
    public: true,
    model: SupplementResponse,
    page: true,
  })
  @Get('releases/:id/supplements')
  supplements(@Param('id') id: string, @Query() query: PaginationQueryDto) {
    return this.service.supplements(id, query);
  }
  constructor(private readonly service: PublicationService) {}
  @ApiEndpoint({
    tag: 'Catalog',
    public: true,
    model: ReleaseResponse,
    page: true,
  })
  @Get('')
  catalog(@Query() query: CatalogQueryDto) {
    return this.service.catalog(query);
  }
  @ApiEndpoint({ tag: 'Catalog', public: true, model: CreatorResponse })
  @Get('creators/:handle')
  creator(@Param('handle') handle: string) {
    return this.service.publicCreator(handle);
  }
  @ApiEndpoint({
    tag: 'Catalog',
    public: true,
    model: ReleaseResponse,
    page: true,
  })
  @Get('creators/:handle/works')
  creatorWorks(
    @Param('handle') handle: string,
    @Query() query: CatalogQueryDto,
  ) {
    return this.service.catalog(query, handle);
  }
  @ApiEndpoint({ tag: 'Catalog', public: true, model: PublicSeriesResponse })
  @Get('series/:id')
  series(@Param('id') id: string, @Query() query: PaginationQueryDto) {
    return this.service.publicSeries(id, query);
  }
  @ApiEndpoint({ tag: 'Catalog', public: true, model: ReleaseResponse })
  @Get('releases/:id')
  release(@Param('id') id: string) {
    return this.service.eligible(id);
  }
  @ApiEndpoint({
    tag: 'Catalog',
    public: true,
    model: PublicCreditResponse,
    array: true,
  })
  @Get('releases/:id/credits')
  credits(@Param('id') id: string) {
    return this.service.releaseCredits(id);
  }
  @ApiEndpoint({
    tag: 'Catalog',
    public: true,
    model: SectionResponse,
    page: true,
  })
  @Get('releases/:id/sections')
  sections(@Param('id') id: string, @Query() query: PaginationQueryDto) {
    return this.service.sections(id, query);
  }
  @ApiEndpoint({
    tag: 'Catalog',
    public: true,
    model: BlockResponse,
    page: true,
  })
  @Get('releases/:releaseId/sections/:id/blocks')
  blocks(
    @Param('releaseId') releaseId: string,
    @Param('id') id: string,
    @Query() query: PaginationQueryDto,
  ) {
    return this.service.blocks(releaseId, id, query);
  }
}
