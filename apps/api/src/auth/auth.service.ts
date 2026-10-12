import {
  GoneException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { AuthResponse } from '@rawan/types';
import * as argon2 from 'argon2';
import { PrismaService } from '../database/prisma.service.js';
import { PUBLIC_USER_SELECT, toApiUser } from '../users/public-user.js';
import { ACCESS_TOKEN_TTL_SECONDS, type JwtPayload } from './auth.types.js';
import { RegisterDto } from './dto/register.dto.js';
import { LoginDto } from './dto/login.dto.js';
import { normalizeEmail } from './normalize-email.js';
import {
  passwordWork,
  PASSWORD_HASH_OPTIONS,
} from '../security/password-work.js';

let dummyHash: Promise<string> | undefined;

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto): Promise<AuthResponse> {
    void dto;
    throw new GoneException(
      'Direct registration has been retired. Request and verify an email signup code instead.',
    );
  }

  async login(dto: LoginDto): Promise<AuthResponse> {
    const user = await this.prisma.user.findFirst({
      where: {
        email: { equals: normalizeEmail(dto.email), mode: 'insensitive' },
      },
      select: { ...PUBLIC_USER_SELECT, password: true },
    });
    const matches = await passwordWork(async () => {
      const hash =
        user?.password ??
        (await (dummyHash ??= argon2
          .hash('non-account-password-for-timing-only', PASSWORD_HASH_OPTIONS)
          .catch((error) => {
            dummyHash = undefined;
            throw error;
          })));
      try {
        return await argon2.verify(hash, dto.password);
      } catch {
        return false;
      }
    });
    if (!user?.password || !matches) {
      throw new UnauthorizedException('Invalid email or password');
    }
    return this.createToken(user);
  }

  async createToken(
    user: Parameters<typeof toApiUser>[0],
  ): Promise<AuthResponse> {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };
    const accessToken = await this.jwtService.signAsync(payload);
    return {
      accessToken,
      tokenType: 'Bearer',
      expiresIn: ACCESS_TOKEN_TTL_SECONDS,
      user: toApiUser(user),
    };
  }
}
