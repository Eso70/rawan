import { ApiEndpoint } from './contracts/api-endpoint.js';
import { ApiHealthDto } from './contracts/response.dto.js';
import { Controller, Get } from '@nestjs/common';

@Controller('health')
export class AppController {
  @ApiEndpoint({
    tag: 'Health',
    model: ApiHealthDto,
    public: true,
    description:
      'Liveness only: process can answer HTTP. Does not test database, Redis or storage.',
  })
  @Get()
  getHealth() {
    return { status: 'ok', service: 'rawan-api' };
  }
}
