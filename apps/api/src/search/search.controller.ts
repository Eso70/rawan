import { ApiEndpoint } from '../contracts/api-endpoint.js';
import { ApiSearchResultDto } from '../contracts/response.dto.js';
import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import type { AuthenticatedUser } from '../auth/auth.types.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { SearchService } from './search.service.js';
import { SearchQueryDto } from './search.dto.js';
@Controller()
@UseGuards(JwtAuthGuard)
export class SearchController {
  constructor(private readonly service: SearchService) {}
  @ApiEndpoint({
    tag: 'Search',
    model: ApiSearchResultDto,
    page: true,
    description:
      'Literal project text search over twelve supported kinds; compact snippets. No vector or AI retrieval. q is required, trimmed, 2–200 characters.',
  })
  @Get('projects/:projectId/search')
  search(
    @CurrentUser() user: AuthenticatedUser,
    @Param('projectId') id: string,
    @Query() query: SearchQueryDto,
  ) {
    return this.service.search(user.userId, id, query);
  }
}
