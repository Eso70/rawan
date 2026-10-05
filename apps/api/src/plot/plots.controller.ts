import { ApiEndpoint } from '../contracts/api-endpoint.js';
import { ApiPlotSummaryDto, ApiPlotDto } from '../contracts/response.dto.js';
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
import { PlotsService } from './plots.service.js';
import { CreatePlotDto, UpdatePlotDto, PlotPageQueryDto } from './plot.dto.js';
@Controller()
@UseGuards(JwtAuthGuard)
export class PlotsController {
  constructor(private readonly service: PlotsService) {}
  @ApiEndpoint({ tag: 'Plots', model: ApiPlotSummaryDto, page: true })
  @Get('projects/:parentId/plots')
  list(
    @CurrentUser() user: AuthenticatedUser,
    @Param('parentId') id: string,
    @Query() query: PlotPageQueryDto,
  ) {
    return this.service.list(user.userId, id, query);
  }
  @ApiEndpoint({ tag: 'Plots', model: ApiPlotDto })
  @Post('projects/:parentId/plots')
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Param('parentId') id: string,
    @Body() dto: CreatePlotDto,
  ) {
    return this.service.create(user.userId, id, dto);
  }
  @ApiEndpoint({ tag: 'Plots', model: ApiPlotDto })
  @Get('plots/:id')
  read(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.service.read(user.userId, id);
  }
  @ApiEndpoint({ tag: 'Plots', model: ApiPlotDto })
  @Patch('plots/:id')
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdatePlotDto,
  ) {
    return this.service.update(user.userId, id, dto);
  }
  @ApiEndpoint({ tag: 'Plots' })
  @Delete('plots/:id')
  @HttpCode(204)
  delete(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.service.delete(user.userId, id);
  }
}
