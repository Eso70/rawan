import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthModule } from '../auth/auth.module.js';
import { STORAGE_PROVIDER } from './storage/storage-provider.js';
import { LocalStorageProvider } from './storage/local-storage.js';
import { MediaCleanupService } from './media-cleanup.service.js';
import { MediaService } from './media.service.js';
import { MediaAttachmentsService } from './media-attachments.service.js';
import { MediaController } from './media.controller.js';
import { StagedUploadInterceptor } from './upload.interceptor.js';
import { UploadProjectGuard } from './upload-project.guard.js';
@Global()
@Module({
  imports: [AuthModule],
  controllers: [MediaController],
  providers: [
    {
      provide: STORAGE_PROVIDER,
      inject: [ConfigService],
      useFactory: (config: ConfigService) =>
        new LocalStorageProvider(config.getOrThrow<string>('MEDIA_LOCAL_PATH')),
    },
    MediaService,
    MediaCleanupService,
    MediaAttachmentsService,
    StagedUploadInterceptor,
    UploadProjectGuard,
  ],
  exports: [MediaCleanupService],
})
export class MediaModule {}
