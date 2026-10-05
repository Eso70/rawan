import { ApiEndpoint } from '../contracts/api-endpoint.js';
import {
  AiGenerationSummaryDto,
  AiGenerationDetailDto,
} from '../contracts/response.dto.js';
import {
  Body,
  Controller,
  Get,
  Header,
  HttpCode,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import type { AuthenticatedUser } from '../auth/auth.types.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { AiService } from './ai.service.js';
import { CreateAiDto, AiListDto } from './ai.dto.js';
@Controller()
@UseGuards(JwtAuthGuard)
export class AiController {
  constructor(private readonly service: AiService) {}
  @ApiEndpoint({
    tag: 'AI',
    model: AiGenerationSummaryDto,
    description:
      'Proposal-only generation. AI is disabled by default; the current fake adapter is a development simulator. Context must belong to this project. Five pending, 30/hour and 200/day per user. Context is bounded and may be truncated; usage/cost may be null.',
  })
  @Post('projects/:projectId/ai/generations')
  @HttpCode(202)
  @Header('Cache-Control', 'no-store')
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Param('projectId') id: string,
    @Body() dto: CreateAiDto,
  ) {
    return this.service.create(user.userId, id, dto);
  }
  @ApiEndpoint({
    tag: 'AI',
    model: AiGenerationSummaryDto,
    page: true,
    description:
      'Proposal-only generation. AI is disabled by default; the current fake adapter is a development simulator. Context must belong to this project. Five pending, 30/hour and 200/day per user. Context is bounded and may be truncated; usage/cost may be null.',
  })
  @Get('projects/:projectId/ai/generations')
  @Header('Cache-Control', 'no-store')
  list(
    @CurrentUser() user: AuthenticatedUser,
    @Param('projectId') id: string,
    @Query() dto: AiListDto,
  ) {
    return this.service.list(user.userId, id, dto);
  }
  @ApiEndpoint({
    tag: 'AI',
    model: AiGenerationDetailDto,
    description:
      'Proposal-only generation. AI is disabled by default; the current fake adapter is a development simulator. Context must belong to this project. Five pending, 30/hour and 200/day per user. Context is bounded and may be truncated; usage/cost may be null.',
  })
  @Get('ai/generations/:id')
  @Header('Cache-Control', 'no-store')
  read(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.service.read(user.userId, id);
  }
}
