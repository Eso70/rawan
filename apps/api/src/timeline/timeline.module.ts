import { Module } from '@nestjs/common';
import { TimelineAccess } from './timeline-access.js';
import { TimelinesService } from './timelines.service.js';
import { ErasService } from './eras.service.js';
import { EventsService } from './events.service.js';
import { TimelinesController } from './timelines.controller.js';
import { ErasController } from './eras.controller.js';
import { EventsController } from './events.controller.js';
@Module({
  controllers: [TimelinesController, ErasController, EventsController],
  providers: [TimelineAccess, TimelinesService, ErasService, EventsService],
})
export class TimelineModule {}
