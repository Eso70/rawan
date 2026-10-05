import { Module } from '@nestjs/common';
import { PlotAccess } from './plot-access.js';
import { PlotsService } from './plots.service.js';
import { PlotPointsService } from './plot-points.service.js';
import { PlotsController } from './plots.controller.js';
import { PlotPointsController } from './plot-points.controller.js';
@Module({
  providers: [PlotAccess, PlotsService, PlotPointsService],
  controllers: [PlotsController, PlotPointsController],
})
export class PlotModule {}
