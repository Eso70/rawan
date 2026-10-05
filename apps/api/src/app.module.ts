import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller.js';
import { DatabaseModule } from './database/database.module.js';
import { UsersModule } from './users/users.module.js';
import { AuthModule } from './auth/auth.module.js';
import { WorldbuildingModule } from './worldbuilding/worldbuilding.module.js';
import { RelationshipsModule } from './relationships/relationships.module.js';
import { ManuscriptModule } from './manuscript/manuscript.module.js';
import { TimelineModule } from './timeline/timeline.module.js';
import { PlotModule } from './plot/plot.module.js';
import { OrganizationModule } from './organization/organization.module.js';
import { SearchModule } from './search/search.module.js';
import { MediaModule } from './media/media.module.js';
import { JobsModule } from './jobs/jobs.module.js';
import { AiModule } from './ai/ai.module.js';
import { fileURLToPath } from 'node:url';
import { validateEnvironment } from './config/environment.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      ignoreEnvFile: process.env.NODE_ENV === 'production',
      envFilePath: fileURLToPath(new URL('../.env', import.meta.url)),
      validate: validateEnvironment,
    }),
    DatabaseModule,
    UsersModule,
    AuthModule,
    ManuscriptModule,
    WorldbuildingModule,
    RelationshipsModule,
    TimelineModule,
    PlotModule,
    OrganizationModule,
    SearchModule,
    MediaModule,
    JobsModule,
    AiModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
