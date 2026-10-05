import { BadRequestException } from '@nestjs/common';
import { errorBody, validationException } from './errors.js';
import { IdentifierPipe } from './identifier.pipe.js';
describe('Stable API boundaries', () => {
  it.each([
    [400, 'BAD_REQUEST'],
    [401, 'UNAUTHORIZED'],
    [403, 'FORBIDDEN'],
    [404, 'NOT_FOUND'],
    [409, 'CONFLICT'],
    [413, 'PAYLOAD_TOO_LARGE'],
    [429, 'RATE_LIMITED'],
    [503, 'SERVICE_UNAVAILABLE'],
    [500, 'INTERNAL_ERROR'],
  ])('maps %i to a stable code', (status, code) =>
    expect(errorBody(status as number).code).toBe(code),
  );
  it('keeps nested validation details without values', () => {
    const exception = validationException([
      {
        property: 'context',
        children: [
          {
            property: '0',
            children: [
              {
                property: 'id',
                value: 'private',
                constraints: { matches: 'invalid identifier' },
              },
            ],
          },
        ],
      },
    ]);
    expect(exception.getResponse()).toMatchObject({
      code: 'VALIDATION_ERROR',
      message: ['invalid identifier'],
      details: [{ field: 'context.0.id', messages: ['invalid identifier'] }],
    });
    expect(JSON.stringify(exception.getResponse())).not.toContain('private');
  });
  it('accepts opaque IDs and validates all nested path parameters', () => {
    const pipe = new IdentifierPipe();
    expect(
      pipe.transform({ projectId: 'c123', id: 'uuid-like' }, { type: 'param' }),
    ).toEqual({ projectId: 'c123', id: 'uuid-like' });
    for (const id of ['a/b', 'a b', 'x'.repeat(129), ''])
      expect(() => pipe.transform(id, { type: 'param', data: 'id' })).toThrow(
        BadRequestException,
      );
    expect(pipe.transform('not an id', { type: 'body' })).toBe('not an id');
  });
});
