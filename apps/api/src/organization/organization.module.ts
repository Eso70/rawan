import { Module } from '@nestjs/common';
import { OrganizationAccess } from './organization-access.js';
import { NotesService } from './notes.service.js';
import { TagsService } from './tags.service.js';
import { NotesController } from './notes.controller.js';
import { TagsController } from './tags.controller.js';
@Module({
  providers: [OrganizationAccess, NotesService, TagsService],
  controllers: [NotesController, TagsController],
})
export class OrganizationModule {}
