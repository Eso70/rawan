import { Module } from '@nestjs/common';
import { CatalogController } from './catalog.controller.js';
import { PublicationController } from './publication.controller.js';
import { PublicationService } from './publication.service.js';
@Module({
  controllers: [PublicationController, CatalogController],
  providers: [PublicationService],
  exports: [PublicationService],
})
export class PublicationModule {}
