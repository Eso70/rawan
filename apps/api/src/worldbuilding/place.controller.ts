import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import type { AuthenticatedUser } from '../auth/auth.types.js';
import { PlaceService } from './place.service.js';
import { CreatePlaceDto, UpdatePlaceDto } from './place.dto.js';

@Controller()
@UseGuards(JwtAuthGuard)
export class PlaceController {
  constructor(private readonly service: PlaceService) {}
  @Get('projects/:projectId/places')
  list(
    @CurrentUser() user: AuthenticatedUser,
    @Param('projectId') projectId: string,
  ) {
    return this.service.list(user.userId, projectId);
  }
  @Post('projects/:projectId/places')
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Param('projectId') projectId: string,
    @Body() dto: CreatePlaceDto,
  ) {
    return this.service.create(user.userId, projectId, dto);
  }
  @Get('places/:id')
  read(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.service.read(user.userId, id);
  }
  @Patch('places/:id')
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdatePlaceDto,
  ) {
    return this.service.update(user.userId, id, dto);
  }
  @Delete('places/:id')
  @HttpCode(204)
  delete(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.service.delete(user.userId, id);
  }
}
