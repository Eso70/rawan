import { ConflictException } from '@nestjs/common';
// Preserve complete detail responses; never silently truncate association arrays.
export const MAX_DETAIL_ASSOCIATIONS = 1000;
export function requireBoundedDetails(
  ...collections: readonly unknown[][]
): void {
  if (collections.some((rows) => rows.length > MAX_DETAIL_ASSOCIATIONS))
    throw new ConflictException(
      'Detail association limit reached; remove associations before reading this resource',
    );
}
