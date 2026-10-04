import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { CharacterService } from './character.service.js';
import { CharacterController } from './character.controller.js';
import { PlaceService } from './place.service.js';
import { PlaceController } from './place.controller.js';
import { FactionService } from './faction.service.js';
import { FactionController } from './faction.controller.js';
import { ArtifactService } from './artifact.service.js';
import { ArtifactController } from './artifact.controller.js';
@Module({
  imports: [AuthModule],
  controllers: [
    CharacterController,
    PlaceController,
    FactionController,
    ArtifactController,
  ],
  providers: [CharacterService, PlaceService, FactionService, ArtifactService],
})
export class WorldbuildingModule {}
