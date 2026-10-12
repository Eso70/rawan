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
  CreateReleaseDto,
  CreatorDto,
  CreatorResponse,
  CreditDto,
  CreditResponse,
  EditionDto,
  EditionResponse,
  MetadataDto,
  MetadataResponse,
  PreviewSectionResponse,
  PrivateReleaseResponse,
  RelatedDto,
  RelatedResponse,
  ReleaseResponse,
  SeriesDto,
  SeriesMemberDto,
  SeriesMemberResponse,
  SeriesResponse,
} from './publication.dto.js';
import { PublicationService } from './publication.service.js';
@Controller()
@UseGuards(JwtAuthGuard)
export class PublicationController {
  @ApiEndpoint({ tag: 'Publication', model: PrivateReleaseResponse })
  @Get('works/:workId/releases/:id')
  releaseDetail(
    @CurrentUser() user: AuthenticatedUser,
    @Param('workId') workId: string,
    @Param('id') id: string,
  ) {
    return this.service.releaseDetail(user.userId, workId, id);
  }
  @ApiEndpoint({ tag: 'Publication' })
  @Delete('works/:workId/releases/:id')
  @HttpCode(204)
  deleteRelease(
    @CurrentUser() user: AuthenticatedUser,
    @Param('workId') workId: string,
    @Param('id') id: string,
  ) {
    return this.service.deleteRelease(user.userId, workId, id);
  }
  @ApiEndpoint({
    tag: 'Publication',
    model: PreviewSectionResponse,
    page: true,
  })
  @Get('works/:workId/releases/:id/preview')
  preview(
    @CurrentUser() user: AuthenticatedUser,
    @Param('workId') workId: string,
    @Param('id') id: string,
    @Query() query: PaginationQueryDto,
  ) {
    return this.service.preview(user.userId, workId, id, query);
  }
  constructor(private readonly service: PublicationService) {}
  @ApiEndpoint({ tag: 'Publication', model: MetadataResponse })
  @Get('works/:workId/metadata')
  metadata(
    @CurrentUser() user: AuthenticatedUser,
    @Param('workId') workId: string,
  ) {
    return this.service.metadata(user.userId, workId);
  }
  @ApiEndpoint({ tag: 'Publication', model: MetadataResponse })
  @Patch('works/:workId/metadata')
  setMetadata(
    @CurrentUser() user: AuthenticatedUser,
    @Param('workId') workId: string,
    @Body() dto: MetadataDto,
  ) {
    return this.service.setMetadata(user.userId, workId, dto);
  }
  @ApiEndpoint({ tag: 'Publication', model: CreatorResponse, page: true })
  @Get('creator-identities')
  creators(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: PaginationQueryDto,
  ) {
    return this.service.creators(user.userId, query);
  }
  @ApiEndpoint({ tag: 'Publication', model: CreatorResponse })
  @Post('creator-identities')
  createCreator(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreatorDto,
  ) {
    return this.service.saveCreator(user.userId, dto);
  }
  @ApiEndpoint({ tag: 'Publication', model: CreatorResponse })
  @Patch('creator-identities/:id')
  updateCreator(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: CreatorDto,
  ) {
    return this.service.saveCreator(user.userId, dto, id);
  }
  @ApiEndpoint({ tag: 'Publication' })
  @Delete('creator-identities/:id')
  @HttpCode(204)
  deleteCreator(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    return this.service.deleteCreator(user.userId, id);
  }
  @ApiEndpoint({ tag: 'Publication', model: SeriesResponse, page: true })
  @Get('work-series')
  series(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: PaginationQueryDto,
  ) {
    return this.service.series(user.userId, query);
  }
  @ApiEndpoint({ tag: 'Publication', model: SeriesResponse })
  @Post('work-series')
  createSeries(@CurrentUser() user: AuthenticatedUser, @Body() dto: SeriesDto) {
    return this.service.saveSeries(user.userId, dto);
  }
  @ApiEndpoint({ tag: 'Publication', model: SeriesResponse })
  @Patch('work-series/:id')
  updateSeries(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: SeriesDto,
  ) {
    return this.service.saveSeries(user.userId, dto, id);
  }
  @ApiEndpoint({ tag: 'Publication' })
  @Delete('work-series/:id')
  @HttpCode(204)
  deleteSeries(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    return this.service.deleteSeries(user.userId, id);
  }
  @ApiEndpoint({ tag: 'Publication', model: CreditResponse, page: true })
  @Get('works/:workId/credits')
  credits(
    @CurrentUser() user: AuthenticatedUser,
    @Param('workId') workId: string,
    @Query() query: PaginationQueryDto,
  ) {
    return this.service.credits(user.userId, workId, query);
  }
  @ApiEndpoint({ tag: 'Publication', model: CreditResponse })
  @Post('works/:workId/credits')
  addCredit(
    @CurrentUser() user: AuthenticatedUser,
    @Param('workId') workId: string,
    @Body() dto: CreditDto,
  ) {
    return this.service.addCredit(user.userId, workId, dto);
  }
  @ApiEndpoint({ tag: 'Publication' })
  @Delete('works/:workId/credits/:id')
  @HttpCode(204)
  deleteCredit(
    @CurrentUser() user: AuthenticatedUser,
    @Param('workId') workId: string,
    @Param('id') id: string,
  ) {
    return this.service.deleteCredit(user.userId, workId, id);
  }
  @ApiEndpoint({ tag: 'Publication', model: EditionResponse, page: true })
  @Get('works/:workId/editions')
  editions(
    @CurrentUser() user: AuthenticatedUser,
    @Param('workId') workId: string,
    @Query() query: PaginationQueryDto,
  ) {
    return this.service.editions(user.userId, workId, query);
  }
  @ApiEndpoint({ tag: 'Publication', model: EditionResponse })
  @Post('works/:workId/editions')
  addEdition(
    @CurrentUser() user: AuthenticatedUser,
    @Param('workId') workId: string,
    @Body() dto: EditionDto,
  ) {
    return this.service.addEdition(user.userId, workId, dto);
  }
  @ApiEndpoint({ tag: 'Publication' })
  @Delete('works/:workId/editions/:id')
  @HttpCode(204)
  deleteEdition(
    @CurrentUser() user: AuthenticatedUser,
    @Param('workId') workId: string,
    @Param('id') id: string,
  ) {
    return this.service.deleteEdition(user.userId, workId, id);
  }
  @ApiEndpoint({ tag: 'Publication', model: RelatedResponse, page: true })
  @Get('works/:workId/related')
  relations(
    @CurrentUser() user: AuthenticatedUser,
    @Param('workId') workId: string,
    @Query() query: PaginationQueryDto,
  ) {
    return this.service.relations(user.userId, workId, query);
  }
  @ApiEndpoint({ tag: 'Publication', model: RelatedResponse })
  @Post('works/:workId/related')
  addRelation(
    @CurrentUser() user: AuthenticatedUser,
    @Param('workId') workId: string,
    @Body() dto: RelatedDto,
  ) {
    return this.service.addRelation(user.userId, workId, dto);
  }
  @ApiEndpoint({ tag: 'Publication' })
  @Delete('works/:workId/related/:id')
  @HttpCode(204)
  deleteRelation(
    @CurrentUser() user: AuthenticatedUser,
    @Param('workId') workId: string,
    @Param('id') id: string,
  ) {
    return this.service.deleteRelation(user.userId, workId, id);
  }
  @ApiEndpoint({ tag: 'Publication', model: SeriesMemberResponse, page: true })
  @Get('work-series/:id/members')
  members(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Query() query: PaginationQueryDto,
  ) {
    return this.service.seriesMembers(user.userId, id, query);
  }
  @ApiEndpoint({ tag: 'Publication', model: SeriesMemberResponse })
  @Post('work-series/:id/members')
  addMember(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: SeriesMemberDto,
  ) {
    return this.service.addMember(user.userId, id, dto);
  }
  @ApiEndpoint({ tag: 'Publication' })
  @Delete('work-series/:seriesId/members/:id')
  @HttpCode(204)
  deleteMember(
    @CurrentUser() user: AuthenticatedUser,
    @Param('seriesId') seriesId: string,
    @Param('id') id: string,
  ) {
    return this.service.deleteMember(user.userId, seriesId, id);
  }
  @ApiEndpoint({ tag: 'Publication', model: ReleaseResponse, page: true })
  @Get('works/:workId/releases')
  releases(
    @CurrentUser() user: AuthenticatedUser,
    @Param('workId') workId: string,
    @Query() query: PaginationQueryDto,
  ) {
    return this.service.releases(user.userId, workId, query);
  }
  @ApiEndpoint({ tag: 'Publication', model: ReleaseResponse })
  @Post('works/:workId/releases')
  createRelease(
    @CurrentUser() user: AuthenticatedUser,
    @Param('workId') workId: string,
    @Body() dto: CreateReleaseDto,
  ) {
    return this.service.createRelease(user.userId, workId, dto);
  }
  @ApiEndpoint({ tag: 'Publication', model: ReleaseResponse })
  @Post('works/:workId/releases/:id/publish')
  publish(
    @CurrentUser() user: AuthenticatedUser,
    @Param('workId') workId: string,
    @Param('id') id: string,
  ) {
    return this.service.transition(user.userId, workId, id, true);
  }
  @ApiEndpoint({ tag: 'Publication', model: ReleaseResponse })
  @Post('works/:workId/releases/:id/withdraw')
  withdraw(
    @CurrentUser() user: AuthenticatedUser,
    @Param('workId') workId: string,
    @Param('id') id: string,
  ) {
    return this.service.transition(user.userId, workId, id, false);
  }
}
