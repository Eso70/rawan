import { Module } from '@nestjs/common';
import { PublicationModule } from '../publication/publication.module.js';
import { GraphicsCatalogController } from './graphics-catalog.controller.js';
import { GraphicsController } from './graphics.controller.js';
import { GraphicsService } from './graphics.service.js';
@Module({
  imports: [PublicationModule],
  controllers: [GraphicsController, GraphicsCatalogController],
  providers: [GraphicsService],
})
export class GraphicsModule {}
