import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Prisma } from '@rawan/database';
import type { AuthResponse } from '@rawan/types';
import * as argon2 from 'argon2';
import { PrismaService } from '../database/prisma.service.js';
import { PUBLIC_USER_SELECT, toApiUser } from '../users/public-user.js';
import { ACCESS_TOKEN_TTL_SECONDS, type JwtPayload } from './auth.types.js';
import { RegisterDto } from './dto/register.dto.js';
import { LoginDto } from './dto/login.dto.js';
import { normalizeEmail } from './normalize-email.js';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto): Promise<AuthResponse> {
    const email = normalizeEmail(dto.email);
    // Case-insensitive lookup also supports accounts created before normalization.
    const existing = await this.prisma.user.findFirst({
      where: { email: { equals: email, mode: 'insensitive' } },
      select: { id: true },
    });
    if (existing) throw new ConflictException('Email already exists');

    const password = await argon2.hash(dto.password, { type: argon2.argon2id });
    const name = dto.name.trim();
    let user;
    try {
      user = await this.prisma.$transaction((tx) =>
        tx.user.create({
          data: {
            email,
            name,
            password,
            role: 'AUTHOR',
            author: { create: { displayName: name } },
          },
          select: PUBLIC_USER_SELECT,
        }),
      );
    } catch (error) {
      // The unique constraint handles simultaneous registrations of the same email.
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('Email already exists');
      }
      throw error;
    }
    return this.createToken(user);
  }

  async login(dto: LoginDto): Promise<AuthResponse> {
    const user = await this.prisma.user.findFirst({
      where: {
        email: { equals: normalizeEmail(dto.email), mode: 'insensitive' },
      },
      select: { ...PUBLIC_USER_SELECT, password: true },
    });
    if (
      !user?.password ||
      !(await argon2.verify(user.password, dto.password))
    ) {
      throw new UnauthorizedException('Invalid email or password');
    }
    return this.createToken(user);
  }

  private async createToken(
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
