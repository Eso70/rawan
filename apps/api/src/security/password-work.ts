import { HttpException } from '@nestjs/common';
/** No unbounded queue of native Argon2 tasks: at most two 64 MiB hashes/verifications per API process. */
let active = 0;
export const PASSWORD_HASH_OPTIONS = {
  type: 2,
  memoryCost: 65536,
  timeCost: 3,
  parallelism: 1,
} as const;
export async function passwordWork<T>(operation: () => Promise<T>): Promise<T> {
  if (active >= 2)
    throw new HttpException(
      'Authentication capacity reached; retry shortly',
      429,
    );
  active++;
  try {
    return await operation();
  } finally {
    active--;
  }
}
