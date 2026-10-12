import {
  BadRequestException,
  HttpException,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  createHmac,
  randomInt,
  randomUUID,
  timingSafeEqual,
} from 'node:crypto';
import * as argon2 from 'argon2';
import { Prisma } from '@rawan/database';
import { PrismaService } from '../database/prisma.service.js';
import { EmailMailer } from '../mail/email-mailer.js';
import type { EmailConfig } from '../mail/email-config.js';
import {
  PASSWORD_HASH_OPTIONS,
  passwordWork,
} from '../security/password-work.js';
import { PUBLIC_USER_SELECT } from '../users/public-user.js';
import { AuthService } from './auth.service.js';
import { assertSignupEmail } from './email-domains.js';
import { normalizeEmail } from './normalize-email.js';
import { assessSignupPassword } from '@rawan/types/password';
import type {
  EmailSignupDto,
  EmailVerificationDto,
  EmailChallengeResponse,
} from './email-signup.dto.js';

const TTL = 600,
  COOLDOWN = 30,
  MAX_SENDS = 5,
  MAX_ATTEMPTS = 5;
@Injectable()
export class EmailSignupService {
  private readonly config: EmailConfig;
  constructor(
    private readonly db: PrismaService,
    config: ConfigService,
    private readonly mailer: EmailMailer,
    private readonly auth: AuthService,
  ) {
    this.config = config.getOrThrow<EmailConfig>('EMAIL_CONFIG');
  }
  private assertReady() {
    this.mailer.assertReady();
    if (this.config.codeSecret.length < 32)
      throw new ServiceUnavailableException(
        'Email sign-up is not available yet.',
      );
  }
  private hash(id: string, email: string, code: string) {
    return createHmac('sha256', this.config.codeSecret)
      .update(`${id}\0${email}\0${code}`)
      .digest('hex');
  }
  private lock(tx: Prisma.TransactionClient, email: string) {
    return tx.$queryRaw`SELECT 1 AS locked FROM pg_advisory_xact_lock(hashtextextended(${email}, 73))`;
  }
  private challenge(id: string): EmailChallengeResponse {
    return { verificationId: id, expiresIn: TTL, resendAfter: COOLDOWN };
  }
  private async reserveDelivery(tx: Prisma.TransactionClient, now: Date) {
    await tx.$queryRaw`SELECT 1 AS locked FROM pg_advisory_xact_lock(9371, 73)`;
    const day = new Date(now.toISOString().slice(0, 10) + 'T00:00:00Z');
    const previous = await tx.emailDeliveryBudget.findUnique({
      where: { day },
    });
    if (previous && previous.sendCount >= 200)
      throw new HttpException(
        'Email sending is temporarily at capacity. Please try again tomorrow.',
        429,
      );
    const budget = await tx.emailDeliveryBudget.upsert({
      where: { day },
      create: { day, sendCount: 1 },
      update: { sendCount: { increment: 1 } },
    });
    if (budget.sendCount > 200)
      throw new HttpException(
        'Email sending is temporarily at capacity. Please try again tomorrow.',
        429,
      );
  }
  private invalid() {
    return new BadRequestException(
      'This code is incorrect or expired. Please try again or request a new code.',
    );
  }
  async start(dto: EmailSignupDto) {
    const email = normalizeEmail(dto.email);
    assertSignupEmail(email);
    const assessment = await assessSignupPassword(dto.password, email);
    if (assessment.error) throw new BadRequestException(assessment.error);
    this.assertReady();
    const passwordHash = await passwordWork(() =>
      argon2.hash(dto.password, PASSWORD_HASH_OPTIONS),
    );
    const name = (dto.name?.trim() || email.slice(0, email.indexOf('@'))).slice(
      0,
      100,
    );
    const id = randomUUID(),
      token = randomUUID(),
      code = randomInt(0, 100000000).toString().padStart(8, '0'),
      now = new Date();
    const reserved = await this.db.$transaction(async (tx) => {
      await this.lock(tx, email);
      const existingUser = await tx.user.findFirst({
        where: { email: { equals: email, mode: 'insensitive' } },
        select: { id: true },
      });
      if (existingUser) return false;
      const previous = await tx.emailSignupVerification.findUnique({
        where: { email },
      });
      this.checkBudget(previous, now);
      await this.reserveDelivery(tx, now);
      const freshWindow =
        !previous ||
        now.getTime() - previous.sendWindowStartedAt.getTime() >= 3600000;
      const data = {
        id,
        email,
        name,
        passwordHash,
        codeHash: this.hash(id, email, code),
        expiresAt: new Date(now.getTime() + TTL * 1000),
        attempts: 0,
        sendCount: freshWindow ? 1 : previous!.sendCount + 1,
        sendWindowStartedAt: freshWindow ? now : previous!.sendWindowStartedAt,
        lastSentAt: now,
        deliveredAt: null,
        deliveryToken: token,
        deliveryUntil: new Date(now.getTime() + 60000),
        consumedAt: null,
      };
      await tx.emailSignupVerification.upsert({
        where: { email },
        create: data,
        update: data,
      });
      return true;
    });
    // Same public response for an already registered address; no account linking or mail spam.
    if (reserved) await this.deliver(id, email, code, token);
    return this.challenge(id);
  }
  private checkBudget(
    previous: {
      lastSentAt: Date;
      sendWindowStartedAt: Date;
      sendCount: number;
      deliveryUntil: Date | null;
    } | null,
    now: Date,
  ) {
    if (
      previous &&
      ((previous.deliveryUntil && previous.deliveryUntil > now) ||
        now.getTime() - previous.lastSentAt.getTime() < COOLDOWN * 1000)
    )
      throw new HttpException(
        'Please wait 30 seconds before requesting another code.',
        429,
      );
    if (
      previous &&
      now.getTime() - previous.sendWindowStartedAt.getTime() < 3600000 &&
      previous.sendCount >= MAX_SENDS
    )
      throw new HttpException(
        'Too many verification emails. Please try again in an hour.',
        429,
      );
  }
  private async deliver(
    id: string,
    email: string,
    code: string,
    token: string,
  ) {
    try {
      await this.mailer.sendVerification(email, code);
      const completed = await this.db.emailSignupVerification.updateMany({
        where: { id, deliveryToken: token, consumedAt: null },
        data: {
          deliveredAt: new Date(),
          deliveryToken: null,
          deliveryUntil: null,
        },
      });
      if (!completed.count)
        throw new ServiceUnavailableException(
          'That verification request was replaced. Please try again.',
        );
    } catch {
      await this.db.emailSignupVerification.updateMany({
        where: { id, deliveryToken: token },
        data: {
          codeHash: null,
          passwordHash: null,
          deliveryToken: null,
          deliveryUntil: null,
        },
      });
      throw new ServiceUnavailableException(
        'Could not send your verification email. Please try again later.',
      );
    }
  }
  async resend(id: string) {
    this.assertReady();
    const token = randomUUID(),
      now = new Date();
    let code = randomInt(0, 100000000).toString().padStart(8, '0');
    const row = await this.db.emailSignupVerification.findUnique({
      where: { id },
      select: { email: true },
    });
    if (!row) return this.challenge(id);
    const email = await this.db.$transaction(async (tx) => {
      await this.lock(tx, row.email);
      const current = await tx.emailSignupVerification.findUnique({
        where: { id },
      });
      if (
        !current ||
        current.consumedAt ||
        !current.passwordHash ||
        current.attempts >= MAX_ATTEMPTS
      )
        return null;
      this.checkBudget(current, now);
      await this.reserveDelivery(tx, now);
      while (this.hash(id, current.email, code) === current.codeHash)
        code = randomInt(0, 100000000).toString().padStart(8, '0');
      const freshWindow =
        now.getTime() - current.sendWindowStartedAt.getTime() >= 3600000;
      await tx.emailSignupVerification.update({
        where: { id },
        data: {
          codeHash: this.hash(id, current.email, code),
          expiresAt: new Date(now.getTime() + TTL * 1000),
          attempts: 0,
          lastSentAt: now,
          sendCount: freshWindow ? 1 : current.sendCount + 1,
          sendWindowStartedAt: freshWindow ? now : current.sendWindowStartedAt,
          deliveredAt: null,
          deliveryToken: token,
          deliveryUntil: new Date(now.getTime() + 60000),
        },
      });
      return current.email;
    });
    if (email) await this.deliver(id, email, code, token);
    return this.challenge(id);
  }
  async verify(dto: EmailVerificationDto) {
    this.assertReady();
    const row = await this.db.emailSignupVerification.findUnique({
      where: { id: dto.verificationId },
      select: { email: true },
    });
    if (!row) throw this.invalid();
    let user;
    try {
      user = await this.db.$transaction(async (tx) => {
        await this.lock(tx, row.email);
        const current = await tx.emailSignupVerification.findUnique({
          where: { id: dto.verificationId },
        });
        const now = new Date();
        if (
          !current ||
          !current.passwordHash ||
          !current.codeHash ||
          !current.deliveredAt ||
          current.consumedAt ||
          current.expiresAt <= now ||
          current.attempts >= MAX_ATTEMPTS
        )
          return null;
        const expected = Buffer.from(current.codeHash, 'hex'),
          actual = Buffer.from(
            this.hash(current.id, current.email, dto.code),
            'hex',
          );
        if (
          expected.length !== actual.length ||
          !timingSafeEqual(expected, actual)
        ) {
          const attempts = current.attempts + 1;
          await tx.emailSignupVerification.update({
            where: { id: current.id },
            data: {
              attempts,
              ...(attempts >= MAX_ATTEMPTS
                ? { codeHash: null, passwordHash: null, consumedAt: now }
                : {}),
            },
          });
          return null;
        }
        const existing = await tx.user.findFirst({
          where: { email: { equals: current.email, mode: 'insensitive' } },
          select: { id: true },
        });
        await tx.emailSignupVerification.update({
          where: { id: current.id },
          data: { consumedAt: now, passwordHash: null, codeHash: null },
        });
        if (existing) return null;
        return tx.user.create({
          data: {
            email: current.email,
            name: current.name,
            password: current.passwordHash,
            emailVerifiedAt: now,
            role: 'AUTHOR',
            author: { create: { displayName: current.name } },
          },
          select: PUBLIC_USER_SELECT,
        });
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        ['P2002', 'P2034'].includes(error.code)
      )
        throw this.invalid();
      throw error;
    }
    if (!user) throw this.invalid();
    return this.auth.createToken(user);
  }
}
