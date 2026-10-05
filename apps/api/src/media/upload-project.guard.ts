import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { IdentifierPipe } from '../contracts/identifier.pipe.js';
import type { Request } from 'express';
import type { AuthenticatedUser } from '../auth/auth.types.js';
import { MediaService } from './media.service.js';
@Injectable()
export class UploadProjectGuard implements CanActivate {
  constructor(private readonly media: MediaService) {}
  async canActivate(context: ExecutionContext) {
    const request = context
      .switchToHttp()
      .getRequest<Request & { user: AuthenticatedUser }>();
    new IdentifierPipe().transform(String(request.params.projectId), {
      type: 'param',
      data: 'projectId',
    });
    await this.media.project(
      request.user.userId,
      String(request.params.projectId),
    );
    return true;
  }
}
