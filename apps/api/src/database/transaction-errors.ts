import { Prisma } from '@rawan/database';

// Prisma 7's PostgreSQL adapter can expose COMMIT conflicts directly rather
// than wrapping them as P2034. Retry only confirmed serialization/deadlock errors.
export function isTransactionWriteConflict(error: unknown): boolean {
  if (error instanceof Prisma.PrismaClientKnownRequestError)
    return error.code === 'P2034';
  if (!(error instanceof Error) || error.name !== 'DriverAdapterError')
    return false;
  const cause = error.cause;
  return (
    typeof cause === 'object' &&
    cause !== null &&
    'kind' in cause &&
    cause.kind === 'TransactionWriteConflict' &&
    'originalCode' in cause &&
    (cause.originalCode === '40001' || cause.originalCode === '40P01')
  );
}
