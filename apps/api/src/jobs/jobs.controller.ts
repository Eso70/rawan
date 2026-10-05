import { ApiEndpoint } from '../contracts/api-endpoint.js';
import { ApiQueueReadinessDto } from '../contracts/response.dto.js';
import { Controller, Get } from '@nestjs/common';
import { JobsService } from './jobs.service.js';
@Controller('health/queues')
export class JobsController {
  constructor(private readonly jobs: JobsService) {}
  @ApiEndpoint({
    tag: 'Jobs',
    model: ApiQueueReadinessDto,
    public: true,
    description:
      'Queue readiness: ready or disabled in development; Redis outages return 503. No public maintenance-job enqueue or polling API exists.',
  })
  @Get()
  readiness() {
    return this.jobs.readiness();
  }
}
