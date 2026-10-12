import { Module } from '@nestjs/common';
import { PublicationModule } from '../publication/publication.module.js';
import { ReaderCatalogController } from './reader-catalog.controller.js';
import { ReaderController } from './reader.controller.js';
import { ReaderService } from './reader.service.js';
@Module({
  imports: [PublicationModule],
  controllers: [ReaderController, ReaderCatalogController],
  providers: [ReaderService],
})
export class ReaderModule {}
