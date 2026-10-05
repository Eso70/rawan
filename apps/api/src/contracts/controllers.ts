import { AiController } from '../ai/ai.controller.js';
import { AppController } from '../app.controller.js';
import { AuthController } from '../auth/auth.controller.js';
import { JobsController } from '../jobs/jobs.controller.js';
import { ManuscriptController } from '../manuscript/manuscript.controller.js';
import { MediaController } from '../media/media.controller.js';
import { NotesController } from '../organization/notes.controller.js';
import { TagsController } from '../organization/tags.controller.js';
import { PlotPointsController } from '../plot/plot-points.controller.js';
import { PlotsController } from '../plot/plots.controller.js';
import { RelationshipsController } from '../relationships/relationships.controller.js';
import { SearchController } from '../search/search.controller.js';
import { ErasController } from '../timeline/eras.controller.js';
import { EventsController } from '../timeline/events.controller.js';
import { TimelinesController } from '../timeline/timelines.controller.js';
import { UsersController } from '../users/users.controller.js';
import { ArtifactController } from '../worldbuilding/artifact.controller.js';
import { CharacterController } from '../worldbuilding/character.controller.js';
import { FactionController } from '../worldbuilding/faction.controller.js';
import { PlaceController } from '../worldbuilding/place.controller.js';
export const PUBLIC_CONTROLLERS = [
  AiController,
  AppController,
  AuthController,
  JobsController,
  ManuscriptController,
  MediaController,
  NotesController,
  TagsController,
  PlotPointsController,
  PlotsController,
  RelationshipsController,
  SearchController,
  ErasController,
  EventsController,
  TimelinesController,
  UsersController,
  ArtifactController,
  CharacterController,
  FactionController,
  PlaceController,
];
