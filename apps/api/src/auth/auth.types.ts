import type { UserRole } from '@rawan/types';

export interface JwtPayload {
  sub: string;
  email: string;
  role: UserRole;
}

export interface AuthenticatedUser {
  userId: string;
  email: string;
  role: UserRole;
}

export const ACCESS_TOKEN_TTL_SECONDS = 7 * 24 * 60 * 60;
