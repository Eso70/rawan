import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiEndpoint } from '../contracts/api-endpoint.js';
import { PaginationQueryDto } from '../query/query.dto.js';
import {
  CollectionResponse,
  PublicCollectionMemberResponse,
  ReaderSearchDto,
  ReaderSearchResponse,
} from './reader.dto.js';
import { ReaderService } from './reader.service.js';
@Controller('catalog')
export class ReaderCatalogController {
  constructor(private readonly service: ReaderService) {}
  @ApiEndpoint({
    tag: 'Catalog',
    public: true,
    model: CollectionResponse,
    page: true,
  })
  @Get('collections')
  collections(@Query() query: PaginationQueryDto) {
    return this.service.sharedCollections(query);
  }
  @ApiEndpoint({
    tag: 'Catalog',
    public: true,
    model: PublicCollectionMemberResponse,
    page: true,
  })
  @Get('collections/:id/members')
  members(@Param('id') id: string, @Query() query: PaginationQueryDto) {
    return this.service.sharedMembers(id, query);
  }
  @ApiEndpoint({
    tag: 'Catalog',
    public: true,
    model: ReaderSearchResponse,
    page: true,
  })
  @Get('releases/:id/search')
  search(@Param('id') id: string, @Query() query: ReaderSearchDto) {
    return this.service.search(id, query);
  }
}
