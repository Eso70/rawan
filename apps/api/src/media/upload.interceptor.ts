import {
  BadRequestException,
  CallHandler,
  ExecutionContext,
  HttpException,
  Inject,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage, type FileFilterCallback } from 'multer';
import type { Request } from 'express';
import { mkdtemp, readdir, rmdir, unlink } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { randomUUID } from 'node:crypto';
import { defer, lastValueFrom, type Observable } from 'rxjs';
import { MEDIA_MIMES } from './media.dto.js';
interface UploadRequest extends Request {
  rawanUploadDirectory: string;
}
@Injectable()
export class StagedUploadInterceptor extends FileInterceptor('file') {
  constructor(@Inject(ConfigService) config: ConfigService) {
    super({
      storage: diskStorage({
        destination: (request, _file, callback) =>
          callback(null, (request as UploadRequest).rawanUploadDirectory),
        filename: (_request, _file, callback) => callback(null, randomUUID()),
      }),
      limits: {
        fileSize: config.getOrThrow<number>('MEDIA_MAX_FILE_SIZE'),
        files: 1,
        fields: 0,
        parts: 1,
        fieldNameSize: 100,
        headerPairs: 32,
      },
      fileFilter: (
        _request: Request,
        file: Express.Multer.File,
        callback: FileFilterCallback,
      ) => {
        if (!MEDIA_MIMES.some((mime) => mime === file.mimetype))
          return callback(new BadRequestException('Unsupported file type'));
        if (file.originalname.length > 1024)
          return callback(new BadRequestException('Filename is too long'));
        callback(null, true);
      },
    });
  }
  override async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<unknown>> {
    const request = context.switchToHttp().getRequest<UploadRequest>();
    let directory: string;
    try {
      directory = await mkdtemp(join(tmpdir(), 'rawan-upload-'));
    } catch {
      throw new ServiceUnavailableException('Upload staging unavailable');
    }
    request.rawanUploadDirectory = directory;
    const cleanup = async () => {
      for (const name of await readdir(directory))
        await unlink(join(directory, name));
      await rmdir(directory);
    };
    try {
      const result = await super.intercept(context, next);
      return defer(async () => {
        try {
          return await lastValueFrom(result);
        } finally {
          await cleanup();
        }
      });
    } catch (error) {
      await cleanup();
      if (error instanceof HttpException) throw error;
      if (
        ['ENOSPC', 'EACCES', 'EIO', 'EMFILE'].includes(
          (error as NodeJS.ErrnoException).code ?? '',
        )
      )
        throw new ServiceUnavailableException('Upload staging unavailable');
      throw new BadRequestException('Invalid multipart upload');
    }
  }
}
