import { applyDecorators, type Type } from '@nestjs/common';
import {
  PATH_METADATA,
  METHOD_METADATA,
  HTTP_CODE_METADATA,
} from '@nestjs/common/constants';
import {
  ApiBearerAuth,
  ApiExtraModels,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
  getSchemaPath,
} from '@nestjs/swagger';
import { ApiErrorDto } from './response.dto.js';
export function ApiEndpoint(options: {
  tag: string;
  model?: Type<unknown>;
  page?: boolean;
  array?: boolean;
  public?: boolean;
  admin?: boolean;
  description?: string;
}): MethodDecorator {
  return (target, key, descriptor) => {
    const method = descriptor.value as Function;
    const path = Reflect.getMetadata(PATH_METADATA, method) as string;
    const verb = Reflect.getMetadata(METHOD_METADATA, method) as number;
    const status =
      (Reflect.getMetadata(HTTP_CODE_METADATA, method) as number | undefined) ??
      (verb === 1 ? 201 : 200);
    const decorators: MethodDecorator[] = [
      ApiTags(options.tag),
      ApiOperation({
        summary: String(key).replace(/([a-z])([A-Z])/g, '$1 $2'),
        description:
          options.description ??
          (options.admin
            ? 'ADMIN role required.'
            : options.public
              ? 'Public endpoint.'
              : 'Private resources are scoped to the authenticated author; inaccessible resources return 404.'),
      }),
    ];
    if (!options.public) decorators.push(ApiBearerAuth('bearer'));
    for (const match of (path ?? '').matchAll(/:([a-zA-Z0-9_]+)/g))
      decorators.push(
        ApiParam({
          name: match[1],
          required: true,
          schema: {
            type: 'string',
            minLength: 1,
            maxLength: 128,
            pattern: '^[a-zA-Z0-9_-]+$',
          },
          description:
            'Opaque resource ID; manuscript/worldbuilding IDs are CUID strings. Do not interpret IDs as UUIDs.',
        }),
      );
    const response = options.model
      ? { $ref: getSchemaPath(options.model) }
      : undefined;
    if (options.model) decorators.push(ApiExtraModels(options.model));
    const schema = options.page
      ? {
          type: 'object' as const,
          required: ['items', 'nextOffset'],
          additionalProperties: false,
          properties: {
            items: { type: 'array' as const, items: response },
            nextOffset: {
              type: 'integer' as const,
              nullable: true,
              minimum: 0,
            },
          },
        }
      : options.array
        ? {
            type: 'array' as const,
            items: response,
            maxItems: String(key) === 'reorder' ? 200 : 100,
          }
        : response;
    decorators.push(
      ApiResponse({
        status,
        headers: {
          'X-Request-Id': {
            description: 'Server-generated request correlation ID.',
            schema: { type: 'string', format: 'uuid' },
          },
        },
        description:
          status === 204
            ? 'Deleted; empty response body.'
            : status === 202
              ? 'Accepted durably. Poll the generation detail until COMPLETED or FAILED. Results are proposals; no canonical author data is modified.'
              : 'Success.',
        ...(status === 204 ? {} : schema ? { schema } : {}),
      }),
    );
    const errors = new Set([500]);
    if (!options.public || options.tag === 'Auth') errors.add(429);
    if (verb !== 0) {
      errors.add(413);
      errors.add(415);
    }
    if (options.tag === 'Auth') {
      errors.add(400);
      if (String(key) === 'register') errors.add(409);
      else errors.add(401);
    } else if (!options.public) {
      errors.add(400);
      errors.add(401);
      errors.add(404);
      if (verb !== 0) errors.add(409);
    }
    if (options.admin) errors.add(403);
    if (options.tag === 'Timelines' || options.tag === 'Plots') errors.add(409);
    if (options.tag === 'Projects' && verb === 1) errors.add(403);
    if (['Media', 'AI', 'Jobs'].includes(options.tag) || verb === 3)
      errors.add(503);
    if (options.tag === 'Media' && verb === 1) errors.add(413);
    if (options.tag === 'AI' && verb === 1) errors.add(429);
    decorators.push(ApiExtraModels(ApiErrorDto));
    for (const error of errors)
      decorators.push(
        ApiResponse({
          status: error,
          headers: {
            'X-Request-Id': {
              description: 'Server-generated request correlation ID.',
              schema: { type: 'string', format: 'uuid' },
            },
            ...(error === 429
              ? {
                  'Retry-After': {
                    description:
                      'Seconds until the HTTP request budget resets, when available.',
                    schema: { type: 'integer', minimum: 1 },
                  },
                }
              : {}),
          },
          description:
            error === 404
              ? 'Not found or inaccessible private resource.'
              : 'Standard safe API error.',
          type: ApiErrorDto,
        }),
      );
    applyDecorators(...decorators)(target, key, descriptor);
  };
}
