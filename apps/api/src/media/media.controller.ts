import { ApiEndpoint } from '../contracts/api-endpoint.js';
import {
  ApiMediaDto,
  ApiMediaAttachmentDto,
} from '../contracts/response.dto.js';
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Header,
  Param,
  Post,
  Query,
  StreamableFile,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { createReadStream } from 'node:fs';
import type { AuthenticatedUser } from '../auth/auth.types.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { PaginationQueryDto } from '../query/query.dto.js';
import { MediaService } from './media.service.js';
import { MediaAttachmentsService } from './media-attachments.service.js';
import {
  AttachMediaDto,
  MediaQueryDto,
  MediaResourceQueryDto,
} from './media.dto.js';
import { StagedUploadInterceptor } from './upload.interceptor.js';
import { UploadProjectGuard } from './upload-project.guard.js';
import { errorBody } from '../contracts/errors.js';
import { ApiBody, ApiConsumes, ApiResponse } from '@nestjs/swagger';
import { MEDIA_MIMES } from './media.dto.js';
export function disposition(filename: string) {
  const fallback = filename.replace(/[^ -~]|["\\;]/g, '_');
  const encoded = encodeURIComponent(filename).replace(
    /[!'()*]/g,
    (char) => '%' + char.charCodeAt(0).toString(16).toUpperCase(),
  );
  return `attachment; filename="${fallback}"; filename*=UTF-8''${encoded}`;
}
@Controller()
@UseGuards(JwtAuthGuard)
export class MediaController {
  constructor(
    private readonly media: MediaService,
    private readonly attachments: MediaAttachmentsService,
  ) {}
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    required: true,
    description:
      'Exactly one file field; no metadata fields. JPEG, PNG, WebP, PDF or UTF-8 plain text. Default maximum 10 MiB; server configuration can lower or raise it up to 100 MiB. Original filename is sanitized and content signatures are checked.',
    schema: {
      type: 'object',
      required: ['file'],
      additionalProperties: false,
      properties: { file: { type: 'string', format: 'binary' } },
    },
  })
  @ApiEndpoint({ tag: 'Media', model: ApiMediaDto })
  @Post('projects/:projectId/media')
  @UseGuards(UploadProjectGuard)
  @UseInterceptors(StagedUploadInterceptor)
  upload(
    @CurrentUser() user: AuthenticatedUser,
    @Param('projectId') projectId: string,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.media.upload(
      user.userId,
      projectId,
      this.media.requireFile(
        file
          ? {
              originalFilename: file.originalname,
              mimeType: file.mimetype,
              open: () => createReadStream(file.path),
            }
          : undefined,
      ),
    );
  }
  @ApiEndpoint({ tag: 'Media', model: ApiMediaDto, page: true })
  @Get('projects/:projectId/media')
  list(
    @CurrentUser() user: AuthenticatedUser,
    @Param('projectId') projectId: string,
    @Query() query: MediaQueryDto,
  ) {
    return this.media.list(user.userId, projectId, query);
  }
  @ApiEndpoint({ tag: 'Media', model: ApiMediaDto })
  @Get('media/:id')
  read(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.media.read(user.userId, id);
  }
  @ApiResponse({
    status: 200,
    description:
      'Private attachment download; Content-Disposition, Content-Length, nosniff and private/no-store headers. If streaming fails after headers, the response is terminated.',
    content: Object.fromEntries(
      MEDIA_MIMES.map((type) => [
        type,
        { schema: { type: 'string', format: 'binary' } },
      ]),
    ),
  })
  @ApiEndpoint({ tag: 'Media' })
  @Get('media/:id/content')
  @Header('Cache-Control', 'private, no-store')
  async content(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    const object = await this.media.content(user.userId, id);
    return new StreamableFile(object.stream, {
      type: object.media.mimeType,
      length: object.sizeBytes,
      disposition: disposition(object.media.originalFilename),
    })
      .setErrorHandler((_error, response) => {
        if (response.destroyed) return;
        if (response.headersSent) {
          response.end();
          return;
        }
        response.statusCode = 503;
        if (
          'removeHeader' in response &&
          typeof response.removeHeader === 'function'
        )
          response.removeHeader('Content-Length');
        if ('setHeader' in response && typeof response.setHeader === 'function')
          response.setHeader('Content-Type', 'application/json');
        response.send(JSON.stringify(errorBody(503, 'Media download failed')));
      })
      .setErrorLogger(() => {});
  }
  @ApiEndpoint({ tag: 'Media' })
  @Delete('media/:id')
  @HttpCode(204)
  delete(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.media.delete(user.userId, id);
  }
  @ApiEndpoint({ tag: 'Media', model: ApiMediaAttachmentDto })
  @Post('media/:id/attachments')
  attach(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: AttachMediaDto,
  ) {
    return this.attachments.attach(user.userId, id, dto);
  }
  @ApiEndpoint({ tag: 'Media', model: ApiMediaAttachmentDto, page: true })
  @Get('media/:id/attachments')
  listAttachments(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Query() query: PaginationQueryDto,
  ) {
    return this.attachments.list(user.userId, id, query);
  }
  @ApiEndpoint({ tag: 'Media' })
  @Delete('media/:mediaId/attachments/:id')
  @HttpCode(204)
  remove(
    @CurrentUser() user: AuthenticatedUser,
    @Param('mediaId') mediaId: string,
    @Param('id') id: string,
  ) {
    return this.attachments.remove(user.userId, mediaId, id);
  }
  @ApiEndpoint({ tag: 'Media', model: ApiMediaAttachmentDto, page: true })
  @Get('projects/:projectId/media-attachments')
  forResource(
    @CurrentUser() user: AuthenticatedUser,
    @Param('projectId') projectId: string,
    @Query() query: MediaResourceQueryDto,
  ) {
    return this.attachments.forResource(user.userId, projectId, query);
  }
}
