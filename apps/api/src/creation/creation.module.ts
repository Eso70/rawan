import { Module } from '@nestjs/common';
import { PublicationModule } from '../publication/publication.module.js';
import { CreationController } from './creation.controller.js';
import { CreationService } from './creation.service.js';
@Module({
  imports: [PublicationModule],
  controllers: [CreationController],
  providers: [CreationService],
})
export class CreationModule {}
