import { Module } from '@nestjs/common';
import { WorksController } from './works.controller.js';
import { WorksService } from './works.service.js';

@Module({ controllers: [WorksController], providers: [WorksService] })
export class WorksModule {}
