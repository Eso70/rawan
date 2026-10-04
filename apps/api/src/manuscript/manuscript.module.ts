import { Module } from '@nestjs/common';
import { ManuscriptController } from './manuscript.controller.js';
import { ManuscriptService } from './manuscript.service.js';

@Module({ controllers: [ManuscriptController], providers: [ManuscriptService] })
export class ManuscriptModule {}
