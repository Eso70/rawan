import { ApiEndpoint } from '../contracts/api-endpoint.js';
import {
  ApiPlotPointSummaryDto,
  ApiPlotPointDto,
  ApiPlotPointSceneDto,
  ApiPlotPointEventDto,
  ApiPlotPointEntityDto,
} from '../contracts/response.dto.js';
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
import { PlotPointsService } from './plot-points.service.js';
import {
  CreatePlotPointDto,
  UpdatePlotPointDto,
  PlotPointQueryDto,
  ReorderPlotPointsDto,
  AttachPlotPointSceneDto,
  AttachPlotPointEventDto,
  AttachPlotPointEntityDto,
} from './plot.dto.js';
@Controller()
@UseGuards(JwtAuthGuard)
export class PlotPointsController {
  constructor(private readonly service: PlotPointsService) {}
  @ApiEndpoint({ tag: 'Plots', model: ApiPlotPointSummaryDto, page: true })
  @Get('plots/:parentId/points')
  list(
    @CurrentUser() user: AuthenticatedUser,
    @Param('parentId') id: string,
    @Query() query: PlotPointQueryDto,
  ) {
    return this.service.list(user.userId, id, query);
  }
  @ApiEndpoint({ tag: 'Plots', model: ApiPlotPointDto })
  @Post('plots/:parentId/points')
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Param('parentId') id: string,
    @Body() dto: CreatePlotPointDto,
  ) {
    return this.service.create(user.userId, id, dto);
  }
  @ApiEndpoint({ tag: 'Plots', model: ApiPlotPointDto })
  @Get('plot-points/:id')
  read(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.service.read(user.userId, id);
  }
  @ApiEndpoint({ tag: 'Plots', model: ApiPlotPointDto })
  @Patch('plot-points/:id')
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdatePlotPointDto,
  ) {
    return this.service.update(user.userId, id, dto);
  }
  @ApiEndpoint({ tag: 'Plots' })
  @Delete('plot-points/:id')
  @HttpCode(204)
  delete(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.service.delete(user.userId, id);
  }
  @ApiEndpoint({ tag: 'Plots', model: ApiPlotPointSummaryDto, array: true })
  @Patch('plots/:plotId/points/reorder')
  reorder(
    @CurrentUser() user: AuthenticatedUser,
    @Param('plotId') id: string,
    @Body() dto: ReorderPlotPointsDto,
  ) {
    return this.service.reorder(user.userId, id, dto);
  }
  @ApiEndpoint({ tag: 'Plots', model: ApiPlotPointSceneDto })
  @Post('plot-points/:pointId/scenes')
  attachScene(
    @CurrentUser() user: AuthenticatedUser,
    @Param('pointId') id: string,
    @Body() dto: AttachPlotPointSceneDto,
  ) {
    return this.service.attachScene(user.userId, id, dto);
  }
  @ApiEndpoint({ tag: 'Plots' })
  @Delete('plot-points/:pointId/scenes/:id')
  @HttpCode(204)
  detachScene(
    @CurrentUser() user: AuthenticatedUser,
    @Param('pointId') pointId: string,
    @Param('id') id: string,
  ) {
    return this.service.detachScene(user.userId, pointId, id);
  }
  @ApiEndpoint({ tag: 'Plots', model: ApiPlotPointEventDto })
  @Post('plot-points/:pointId/events')
  attachEvent(
    @CurrentUser() user: AuthenticatedUser,
    @Param('pointId') id: string,
    @Body() dto: AttachPlotPointEventDto,
  ) {
    return this.service.attachEvent(user.userId, id, dto);
  }
  @ApiEndpoint({ tag: 'Plots' })
  @Delete('plot-points/:pointId/events/:id')
  @HttpCode(204)
  detachEvent(
    @CurrentUser() user: AuthenticatedUser,
    @Param('pointId') pointId: string,
    @Param('id') id: string,
  ) {
    return this.service.detachEvent(user.userId, pointId, id);
  }
  @ApiEndpoint({ tag: 'Plots', model: ApiPlotPointEntityDto })
  @Post('plot-points/:pointId/entities')
  attachEntity(
    @CurrentUser() user: AuthenticatedUser,
    @Param('pointId') id: string,
    @Body() dto: AttachPlotPointEntityDto,
  ) {
    return this.service.attachEntity(user.userId, id, dto);
  }
  @ApiEndpoint({ tag: 'Plots' })
  @Delete('plot-points/:pointId/entities/:id')
  @HttpCode(204)
  detachEntity(
    @CurrentUser() user: AuthenticatedUser,
    @Param('pointId') pointId: string,
    @Param('id') id: string,
  ) {
    return this.service.detachEntity(user.userId, pointId, id);
  }
}
