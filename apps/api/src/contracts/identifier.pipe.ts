import {
  BadRequestException,
  type ArgumentMetadata,
  type PipeTransform,
} from '@nestjs/common';
import { errorBody } from './errors.js';
export const IDENTIFIER_PATTERN = /^[a-zA-Z0-9_-]{1,128}$/;
export class IdentifierPipe implements PipeTransform {
  transform(value: unknown, metadata: ArgumentMetadata) {
    if (metadata.type !== 'param') return value;
    const fields =
      typeof value === 'string'
        ? [[metadata.data ?? 'id', value]]
        : Object.entries(value as Record<string, unknown>);
    for (const [field, id] of fields)
      if (typeof id !== 'string' || !IDENTIFIER_PATTERN.test(id))
        throw new BadRequestException({
          ...errorBody(400, ['Invalid resource identifier']),
          code: 'VALIDATION_ERROR',
          details: [
            {
              field,
              messages: [
                'Use an opaque identifier of 1–128 letters, digits, underscores or hyphens',
              ],
            },
          ],
        });
    return value;
  }
}
