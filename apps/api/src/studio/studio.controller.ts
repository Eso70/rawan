import { Controller, Get, Header } from '@nestjs/common';
import { StudioBackgroundResponseDto } from './studio-background.dto.js';
import { ApiEndpoint } from '../contracts/api-endpoint.js';
import { studioBackground } from './studio-background.js';

@Controller('studio')
export class StudioController {
  @ApiEndpoint({
    tag: 'Studio',
    model: StudioBackgroundResponseDto,
    public: true,
    description:
      'Automatic public atmosphere selected by server UTC season and hour. Accepts no user choice and exposes no account information.',
  })
  @Get('background')
  @Header('Cache-Control', 'no-store')
  getBackground() {
    return studioBackground();
  }
}
