import {
  BadRequestException,
  Catch,
  HttpException,
  type ArgumentsHost,
  type ExceptionFilter,
} from '@nestjs/common';
import type { Response } from 'express';
import type { ValidationError } from 'class-validator';
import type { ApiError, ApiErrorCode, ApiValidationDetail } from '@rawan/types';
const categories: Record<number, [ApiErrorCode, string]> = {
  400: ['BAD_REQUEST', 'Bad Request'],
  401: ['UNAUTHORIZED', 'Unauthorized'],
  403: ['FORBIDDEN', 'Forbidden'],
  404: ['NOT_FOUND', 'Not Found'],
  409: ['CONFLICT', 'Conflict'],
  413: ['PAYLOAD_TOO_LARGE', 'Payload Too Large'],
  415: ['UNSUPPORTED_MEDIA_TYPE', 'Unsupported Media Type'],
  429: ['RATE_LIMITED', 'Too Many Requests'],
  503: ['SERVICE_UNAVAILABLE', 'Service Unavailable'],
  500: ['INTERNAL_ERROR', 'Internal Server Error'],
};
export function errorBody(
  statusCode: number,
  message?: string | string[],
): ApiError {
  const [code, error] = categories[statusCode] ?? [
    'INTERNAL_ERROR',
    'Request Failed',
  ];
  return {
    statusCode,
    code,
    error,
    message: message ?? (statusCode === 500 ? 'Internal server error' : error),
  };
}
export function validationException(errors: ValidationError[]) {
  const details: ApiValidationDetail[] = [];
  const visit = (rows: ValidationError[], parent = '') => {
    for (const row of rows) {
      const field = parent ? `${parent}.${row.property}` : row.property;
      if (row.constraints)
        details.push({ field, messages: Object.values(row.constraints) });
      if (row.children?.length) visit(row.children, field);
    }
  };
  visit(errors);
  return new BadRequestException({
    ...errorBody(
      400,
      details.flatMap((d) => d.messages),
    ),
    code: 'VALIDATION_ERROR',
    details,
  });
}
@Catch()
export class ApiExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse<Response>();
    if (response.headersSent) {
      response.end();
      return;
    }
    const parserType =
      exception && typeof exception === 'object' && 'type' in exception
        ? exception.type
        : undefined;
    const parserStatus =
      parserType === 'entity.too.large'
        ? 413
        : parserType === 'entity.parse.failed' ||
            parserType === 'request.aborted' ||
            parserType === 'parameters.too.many'
          ? 400
          : parserType === 'encoding.unsupported' ||
              parserType === 'charset.unsupported'
            ? 415
            : undefined;
    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : (parserStatus ?? 500);
    const raw =
      exception instanceof HttpException ? exception.getResponse() : undefined;
    let body = errorBody(status);
    if (status === 500) body = errorBody(500);
    else if (typeof raw === 'string') body = errorBody(status, raw);
    else if (raw && typeof raw === 'object') {
      const value = raw as Record<string, unknown>;
      if (
        typeof value.message === 'string' ||
        (Array.isArray(value.message) &&
          value.message.every((m) => typeof m === 'string'))
      )
        body = errorBody(status, value.message as string | string[]);
      if (value.code === 'VALIDATION_ERROR' && Array.isArray(value.details))
        body = {
          ...body,
          code: 'VALIDATION_ERROR',
          details: value.details as ApiValidationDetail[],
        };
    }
    // Non-HTTP exceptions never expose stack, SQL, credentials or filesystem/provider details.
    response.status(status).json(body);
  }
}
