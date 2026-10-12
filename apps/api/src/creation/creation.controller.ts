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
  CanvasEdgeDto,
  CanvasNodeDto,
  CitationDto,
  MapDto,
  PinDto,
  PreferenceDto,
  RegionDto,
  ReplaceDocumentDto,
  ResearchDto,
  SavedViewDto,
  TitleDto,
} from './creation.dto.js';
import {
  CanvasResponse,
  CitationResponse,
  DocumentResponse,
  EdgeResponse,
  EffectivePreferenceResponse,
  MapResponse,
  NodeResponse,
  PinResponse,
  PreferenceResponse,
  RegionResponse,
  ResearchResponse,
  SavedViewResponse,
} from './creation.responses.js';
import { CreationService } from './creation.service.js';
@Controller()
@UseGuards(JwtAuthGuard)
export class CreationController {
  constructor(private readonly service: CreationService) {}
  @ApiEndpoint({ tag: 'Creation', model: DocumentResponse, page: true })
  @Get('works/:workId/documents')
  documents(
    @CurrentUser() user: AuthenticatedUser,
    @Param('workId') workId: string,
    @Query() query: PaginationQueryDto,
  ) {
    return this.service.documents(user.userId, workId, query);
  }
  @ApiEndpoint({ tag: 'Creation', model: DocumentResponse })
  @Post('works/:workId/documents')
  createDocument(
    @CurrentUser() user: AuthenticatedUser,
    @Param('workId') workId: string,
    @Body() dto: TitleDto,
  ) {
    return this.service.createDocument(user.userId, workId, dto);
  }
  @ApiEndpoint({ tag: 'Creation', model: DocumentResponse })
  @Get('works/:workId/documents/:id')
  document(
    @CurrentUser() user: AuthenticatedUser,
    @Param('workId') workId: string,
    @Param('id') id: string,
  ) {
    return this.service.document(user.userId, workId, id);
  }
  @ApiEndpoint({ tag: 'Creation', model: DocumentResponse })
  @Patch('works/:workId/documents/:id')
  replaceDocument(
    @CurrentUser() user: AuthenticatedUser,
    @Param('workId') workId: string,
    @Param('id') id: string,
    @Body() dto: ReplaceDocumentDto,
  ) {
    return this.service.replaceDocument(user.userId, workId, id, dto);
  }
  @ApiEndpoint({ tag: 'Creation' })
  @Delete('works/:workId/documents/:id')
  @HttpCode(204)
  deleteDocument(
    @CurrentUser() user: AuthenticatedUser,
    @Param('workId') workId: string,
    @Param('id') id: string,
  ) {
    return this.service.deleteDocument(user.userId, workId, id);
  }
  @ApiEndpoint({ tag: 'Creation', model: ResearchResponse, page: true })
  @Get('projects/:projectId/research-sources')
  research(
    @CurrentUser() user: AuthenticatedUser,
    @Param('projectId') projectId: string,
    @Query() query: PaginationQueryDto,
  ) {
    return this.service.research(user.userId, projectId, query);
  }
  @ApiEndpoint({ tag: 'Creation', model: ResearchResponse })
  @Post('projects/:projectId/research-sources')
  createResearch(
    @CurrentUser() user: AuthenticatedUser,
    @Param('projectId') projectId: string,
    @Body() dto: ResearchDto,
  ) {
    return this.service.saveResearch(user.userId, projectId, dto);
  }
  @ApiEndpoint({ tag: 'Creation', model: ResearchResponse })
  @Patch('projects/:projectId/research-sources/:id')
  updateResearch(
    @CurrentUser() user: AuthenticatedUser,
    @Param('projectId') projectId: string,
    @Param('id') id: string,
    @Body() dto: ResearchDto,
  ) {
    return this.service.saveResearch(user.userId, projectId, dto, id);
  }
  @ApiEndpoint({ tag: 'Creation' })
  @Delete('projects/:projectId/research-sources/:id')
  @HttpCode(204)
  deleteResearch(
    @CurrentUser() user: AuthenticatedUser,
    @Param('projectId') projectId: string,
    @Param('id') id: string,
  ) {
    return this.service.deleteResearch(user.userId, projectId, id);
  }
  @ApiEndpoint({ tag: 'Creation', model: SavedViewResponse, page: true })
  @Get('projects/:projectId/saved-views')
  views(
    @CurrentUser() user: AuthenticatedUser,
    @Param('projectId') projectId: string,
    @Query() query: PaginationQueryDto,
  ) {
    return this.service.views(user.userId, projectId, query);
  }
  @ApiEndpoint({ tag: 'Creation', model: SavedViewResponse })
  @Post('projects/:projectId/saved-views')
  createView(
    @CurrentUser() user: AuthenticatedUser,
    @Param('projectId') projectId: string,
    @Body() dto: SavedViewDto,
  ) {
    return this.service.saveView(user.userId, projectId, dto);
  }
  @ApiEndpoint({ tag: 'Creation', model: SavedViewResponse })
  @Patch('projects/:projectId/saved-views/:id')
  updateView(
    @CurrentUser() user: AuthenticatedUser,
    @Param('projectId') projectId: string,
    @Param('id') id: string,
    @Body() dto: SavedViewDto,
  ) {
    return this.service.saveView(user.userId, projectId, dto, id);
  }
  @ApiEndpoint({ tag: 'Creation' })
  @Delete('projects/:projectId/saved-views/:id')
  @HttpCode(204)
  deleteView(
    @CurrentUser() user: AuthenticatedUser,
    @Param('projectId') projectId: string,
    @Param('id') id: string,
  ) {
    return this.service.deleteView(user.userId, projectId, id);
  }
  @ApiEndpoint({ tag: 'Creation', model: MapResponse, page: true })
  @Get('projects/:projectId/maps')
  maps(
    @CurrentUser() user: AuthenticatedUser,
    @Param('projectId') projectId: string,
    @Query() query: PaginationQueryDto,
  ) {
    return this.service.maps(user.userId, projectId, query);
  }
  @ApiEndpoint({ tag: 'Creation', model: MapResponse })
  @Post('projects/:projectId/maps')
  createMap(
    @CurrentUser() user: AuthenticatedUser,
    @Param('projectId') projectId: string,
    @Body() dto: MapDto,
  ) {
    return this.service.saveMap(user.userId, projectId, dto);
  }
  @ApiEndpoint({ tag: 'Creation', model: MapResponse })
  @Patch('projects/:projectId/maps/:id')
  updateMap(
    @CurrentUser() user: AuthenticatedUser,
    @Param('projectId') projectId: string,
    @Param('id') id: string,
    @Body() dto: MapDto,
  ) {
    return this.service.saveMap(user.userId, projectId, dto, id);
  }
  @ApiEndpoint({ tag: 'Creation' })
  @Delete('projects/:projectId/maps/:id')
  @HttpCode(204)
  deleteMap(
    @CurrentUser() user: AuthenticatedUser,
    @Param('projectId') projectId: string,
    @Param('id') id: string,
  ) {
    return this.service.deleteMap(user.userId, projectId, id);
  }
  @ApiEndpoint({ tag: 'Creation', model: CanvasResponse, page: true })
  @Get('projects/:projectId/canvases')
  canvases(
    @CurrentUser() user: AuthenticatedUser,
    @Param('projectId') projectId: string,
    @Query() query: PaginationQueryDto,
  ) {
    return this.service.canvases(user.userId, projectId, query);
  }
  @ApiEndpoint({ tag: 'Creation', model: CanvasResponse })
  @Post('projects/:projectId/canvases')
  createCanvas(
    @CurrentUser() user: AuthenticatedUser,
    @Param('projectId') projectId: string,
    @Body() dto: TitleDto,
  ) {
    return this.service.saveCanvas(user.userId, projectId, dto);
  }
  @ApiEndpoint({ tag: 'Creation', model: CanvasResponse })
  @Patch('projects/:projectId/canvases/:id')
  updateCanvas(
    @CurrentUser() user: AuthenticatedUser,
    @Param('projectId') projectId: string,
    @Param('id') id: string,
    @Body() dto: TitleDto,
  ) {
    return this.service.saveCanvas(user.userId, projectId, dto, id);
  }
  @ApiEndpoint({ tag: 'Creation' })
  @Delete('projects/:projectId/canvases/:id')
  @HttpCode(204)
  deleteCanvas(
    @CurrentUser() user: AuthenticatedUser,
    @Param('projectId') projectId: string,
    @Param('id') id: string,
  ) {
    return this.service.deleteCanvas(user.userId, projectId, id);
  }
  @ApiEndpoint({ tag: 'Creation', model: MapResponse })
  @Get('projects/:projectId/maps/:id')
  map(
    @CurrentUser() user: AuthenticatedUser,
    @Param('projectId') projectId: string,
    @Param('id') id: string,
  ) {
    return this.service.map(user.userId, projectId, id);
  }
  @ApiEndpoint({ tag: 'Creation', model: CanvasResponse })
  @Get('projects/:projectId/canvases/:id')
  canvas(
    @CurrentUser() user: AuthenticatedUser,
    @Param('projectId') projectId: string,
    @Param('id') id: string,
  ) {
    return this.service.canvas(user.userId, projectId, id);
  }
  @ApiEndpoint({ tag: 'Creation', model: CitationResponse, page: true })
  @Get('projects/:projectId/research-sources/:sourceId/citations')
  citations(
    @CurrentUser() user: AuthenticatedUser,
    @Param('projectId') projectId: string,
    @Param('sourceId') sourceId: string,
    @Query() query: PaginationQueryDto,
  ) {
    return this.service.citations(user.userId, projectId, sourceId, query);
  }
  @ApiEndpoint({ tag: 'Creation', model: CitationResponse })
  @Post('projects/:projectId/research-sources/:sourceId/citations')
  addCitation(
    @CurrentUser() user: AuthenticatedUser,
    @Param('projectId') projectId: string,
    @Param('sourceId') sourceId: string,
    @Body() dto: CitationDto,
  ) {
    return this.service.addCitation(user.userId, projectId, sourceId, dto);
  }
  @ApiEndpoint({ tag: 'Creation' })
  @Delete('projects/:projectId/research-sources/:sourceId/citations/:id')
  @HttpCode(204)
  deleteCitation(
    @CurrentUser() user: AuthenticatedUser,
    @Param('projectId') projectId: string,
    @Param('sourceId') sourceId: string,
    @Param('id') id: string,
  ) {
    return this.service.deleteCitation(user.userId, projectId, sourceId, id);
  }
  @ApiEndpoint({ tag: 'Creation', model: PreferenceResponse, page: true })
  @Get('preferences')
  preferences(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: PaginationQueryDto,
  ) {
    return this.service.preferences(user.userId, query);
  }
  @ApiEndpoint({ tag: 'Creation', model: PreferenceResponse })
  @Post('preferences')
  savePreference(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: PreferenceDto,
  ) {
    return this.service.savePreference(user.userId, dto);
  }
  @ApiEndpoint({ tag: 'Creation' })
  @Delete('preferences/:id')
  @HttpCode(204)
  deletePreference(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    return this.service.deletePreference(user.userId, id);
  }
  @ApiEndpoint({ tag: 'Creation', model: EffectivePreferenceResponse })
  @Get('preferences/:scope/:contextId/effective')
  effectivePreferences(
    @CurrentUser() user: AuthenticatedUser,
    @Param('scope') scope: string,
    @Param('contextId') contextId: string,
  ) {
    return this.service.effectivePreferences(user.userId, scope, contextId);
  }
  @ApiEndpoint({ tag: 'Creation', model: PinResponse })
  @Post('projects/:projectId/maps/:mapId/pins')
  createPin(
    @CurrentUser() user: AuthenticatedUser,
    @Param('projectId') projectId: string,
    @Param('mapId') mapId: string,
    @Body() dto: PinDto,
  ) {
    return this.service.savePin(user.userId, projectId, mapId, dto);
  }
  @ApiEndpoint({ tag: 'Creation', model: PinResponse })
  @Patch('projects/:projectId/maps/:mapId/pins/:id')
  updatePin(
    @CurrentUser() user: AuthenticatedUser,
    @Param('projectId') projectId: string,
    @Param('mapId') mapId: string,
    @Param('id') id: string,
    @Body() dto: PinDto,
  ) {
    return this.service.savePin(user.userId, projectId, mapId, dto, id);
  }
  @ApiEndpoint({ tag: 'Creation' })
  @Delete('projects/:projectId/maps/:mapId/pins/:id')
  @HttpCode(204)
  deletePin(
    @CurrentUser() user: AuthenticatedUser,
    @Param('projectId') projectId: string,
    @Param('mapId') mapId: string,
    @Param('id') id: string,
  ) {
    return this.service.deletePin(user.userId, projectId, mapId, id);
  }
  @ApiEndpoint({ tag: 'Creation', model: RegionResponse })
  @Post('projects/:projectId/maps/:mapId/regions')
  createRegion(
    @CurrentUser() user: AuthenticatedUser,
    @Param('projectId') projectId: string,
    @Param('mapId') mapId: string,
    @Body() dto: RegionDto,
  ) {
    return this.service.saveRegion(user.userId, projectId, mapId, dto);
  }
  @ApiEndpoint({ tag: 'Creation', model: RegionResponse })
  @Patch('projects/:projectId/maps/:mapId/regions/:id')
  updateRegion(
    @CurrentUser() user: AuthenticatedUser,
    @Param('projectId') projectId: string,
    @Param('mapId') mapId: string,
    @Param('id') id: string,
    @Body() dto: RegionDto,
  ) {
    return this.service.saveRegion(user.userId, projectId, mapId, dto, id);
  }
  @ApiEndpoint({ tag: 'Creation' })
  @Delete('projects/:projectId/maps/:mapId/regions/:id')
  @HttpCode(204)
  deleteRegion(
    @CurrentUser() user: AuthenticatedUser,
    @Param('projectId') projectId: string,
    @Param('mapId') mapId: string,
    @Param('id') id: string,
  ) {
    return this.service.deleteRegion(user.userId, projectId, mapId, id);
  }
  @ApiEndpoint({ tag: 'Creation', model: NodeResponse })
  @Post('projects/:projectId/canvases/:canvasId/nodes')
  createNode(
    @CurrentUser() user: AuthenticatedUser,
    @Param('projectId') projectId: string,
    @Param('canvasId') canvasId: string,
    @Body() dto: CanvasNodeDto,
  ) {
    return this.service.saveNode(user.userId, projectId, canvasId, dto);
  }
  @ApiEndpoint({ tag: 'Creation', model: NodeResponse })
  @Patch('projects/:projectId/canvases/:canvasId/nodes/:id')
  updateNode(
    @CurrentUser() user: AuthenticatedUser,
    @Param('projectId') projectId: string,
    @Param('canvasId') canvasId: string,
    @Param('id') id: string,
    @Body() dto: CanvasNodeDto,
  ) {
    return this.service.saveNode(user.userId, projectId, canvasId, dto, id);
  }
  @ApiEndpoint({ tag: 'Creation' })
  @Delete('projects/:projectId/canvases/:canvasId/nodes/:id')
  @HttpCode(204)
  deleteNode(
    @CurrentUser() user: AuthenticatedUser,
    @Param('projectId') projectId: string,
    @Param('canvasId') canvasId: string,
    @Param('id') id: string,
  ) {
    return this.service.deleteNode(user.userId, projectId, canvasId, id);
  }
  @ApiEndpoint({ tag: 'Creation', model: EdgeResponse })
  @Post('projects/:projectId/canvases/:canvasId/edges')
  addEdge(
    @CurrentUser() user: AuthenticatedUser,
    @Param('projectId') projectId: string,
    @Param('canvasId') canvasId: string,
    @Body() dto: CanvasEdgeDto,
  ) {
    return this.service.addEdge(user.userId, projectId, canvasId, dto);
  }
  @ApiEndpoint({ tag: 'Creation' })
  @Delete('projects/:projectId/canvases/:canvasId/edges/:id')
  @HttpCode(204)
  deleteEdge(
    @CurrentUser() user: AuthenticatedUser,
    @Param('projectId') projectId: string,
    @Param('canvasId') canvasId: string,
    @Param('id') id: string,
  ) {
    return this.service.deleteEdge(user.userId, projectId, canvasId, id);
  }
}
