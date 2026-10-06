import {
  ConflictException,
  Injectable,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OAuth2Client } from 'google-auth-library';
import { Prisma } from '@rawan/database';
import { PrismaService } from '../database/prisma.service.js';
import { PUBLIC_USER_SELECT } from '../users/public-user.js';
import { AuthService } from './auth.service.js';
import { GoogleLoginDto } from './dto/google-login.dto.js';
import { normalizeEmail } from './normalize-email.js';

@Injectable()
export class GoogleAuthService {
  private readonly google = new OAuth2Client();
  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
    private readonly auth: AuthService,
  ) {}

  async login(dto: GoogleLoginDto) {
    const audience = this.config.get<string>('GOOGLE_CLIENT_ID');
    if (!audience)
      throw new ServiceUnavailableException('Google sign-in is not configured');
    let identity;
    try {
      const ticket = await this.google.verifyIdToken({
        idToken: dto.idToken,
        audience,
      });
      identity = ticket.getPayload();
    } catch {
      throw new UnauthorizedException('Google identity could not be verified');
    }
    if (
      !identity?.sub ||
      !identity.email ||
      identity.email_verified !== true ||
      (identity as typeof identity & { nonce?: string }).nonce !== dto.nonce
    )
      throw new UnauthorizedException('Google identity could not be verified');
    const email = normalizeEmail(identity.email);
    let user = await this.prisma.user.findUnique({
      where: { googleSubject: identity.sub },
      select: PUBLIC_USER_SELECT,
    });
    if (!user) {
      // Never silently attach Google to an existing password or administrator account.
      const existing = await this.prisma.user.findFirst({
        where: { email: { equals: email, mode: 'insensitive' } },
        select: { id: true },
      });
      if (existing)
        throw new ConflictException(
          'This email already belongs to an account. Account linking is required.',
        );
      const name = (identity.name || email.split('@')[0]).trim().slice(0, 100);
      try {
        user = await this.prisma.user.create({
          data: {
            email,
            name,
            googleSubject: identity.sub,
            role: 'AUTHOR',
            author: { create: { displayName: name } },
          },
          select: PUBLIC_USER_SELECT,
        });
      } catch (error) {
        if (
          !(error instanceof Prisma.PrismaClientKnownRequestError) ||
          error.code !== 'P2002'
        )
          throw error;
        user = await this.prisma.user.findUnique({
          where: { googleSubject: identity.sub },
          select: PUBLIC_USER_SELECT,
        });
        if (!user) throw new ConflictException('Account linking is required.');
      }
    }
    return this.auth.createToken(user);
  }
}
