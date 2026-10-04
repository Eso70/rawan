import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Prisma } from '@rawan/database';
import * as argon2 from 'argon2';
import { PrismaService } from '../database/prisma.service.js';
import { AuthService } from './auth.service.js';

vi.mock('argon2', () => ({
  argon2id: 2,
  hash: vi.fn().mockResolvedValue('secure-hash'),
  verify: vi.fn().mockResolvedValue(true),
}));

describe('AuthService', () => {
  const record = {
    id: 'author-id',
    email: 'author@example.com',
    name: 'Author',
    role: 'AUTHOR',
    password: 'secure-hash',
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
  };
  const dto = {
    email: ' AUTHOR@Example.com ',
    name: ' Author ',
    password: 'a long password',
  };
  let service: AuthService;
  let findFirst: ReturnType<typeof vi.fn>;
  let create: ReturnType<typeof vi.fn>;
  let transaction: ReturnType<typeof vi.fn>;
  let signAsync: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(argon2.verify).mockResolvedValue(true);
    findFirst = vi.fn().mockResolvedValue(null);
    create = vi.fn().mockResolvedValue(record);
    transaction = vi
      .fn()
      .mockImplementation((callback) => callback({ user: { create } }));
    signAsync = vi.fn().mockResolvedValue('signed-token');
    service = new AuthService(
      {
        user: { findFirst },
        $transaction: transaction,
      } as unknown as PrismaService,
      { signAsync } as unknown as JwtService,
    );
  });

  it('normalizes email/name, hashes with Argon2id, and creates an AUTHOR/profile in one transaction', async () => {
    const result = await service.register({
      ...dto,
      role: 'ADMIN',
    } as typeof dto);
    expect(findFirst).toHaveBeenCalledWith({
      where: { email: { equals: 'author@example.com', mode: 'insensitive' } },
      select: { id: true },
    });
    expect(argon2.hash).toHaveBeenCalledWith(dto.password, {
      type: argon2.argon2id,
    });
    expect(transaction).toHaveBeenCalledOnce();
    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: {
          email: 'author@example.com',
          name: 'Author',
          password: 'secure-hash',
          role: 'AUTHOR',
          author: { create: { displayName: 'Author' } },
        },
      }),
    );
    expect(result).toMatchObject({
      accessToken: 'signed-token',
      tokenType: 'Bearer',
      expiresIn: 604800,
    });
    expect(result.user).not.toHaveProperty('password');
    expect(result.user.createdAt).toBe('2026-01-01T00:00:00.000Z');
    expect(signAsync).toHaveBeenCalledWith({
      sub: record.id,
      email: record.email,
      role: 'AUTHOR',
    });
  });

  it('returns 409 for an existing email before hashing or writing', async () => {
    findFirst.mockResolvedValue({ id: record.id });
    await expect(service.register(dto)).rejects.toBeInstanceOf(
      ConflictException,
    );
    expect(argon2.hash).not.toHaveBeenCalled();
    expect(transaction).not.toHaveBeenCalled();
  });

  it('maps a concurrent unique-constraint failure to 409', async () => {
    transaction.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('duplicate', {
        code: 'P2002',
        clientVersion: '7.10.0',
        meta: { target: ['email'] },
      }),
    );
    await expect(service.register(dto)).rejects.toBeInstanceOf(
      ConflictException,
    );
    expect(signAsync).not.toHaveBeenCalled();
  });

  it('propagates transaction failure without issuing a token', async () => {
    const failure = new Error('profile creation failed');
    transaction.mockRejectedValue(failure);
    await expect(service.register(dto)).rejects.toBe(failure);
    expect(signAsync).not.toHaveBeenCalled();
  });

  it('normalizes login and never returns the selected password hash', async () => {
    findFirst.mockResolvedValue(record);
    const result = await service.login(dto);
    expect(findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { email: { equals: 'author@example.com', mode: 'insensitive' } },
      }),
    );
    expect(argon2.verify).toHaveBeenCalledWith('secure-hash', dto.password);
    expect(result.user).not.toHaveProperty('password');
  });

  it.each(['missing', 'passwordless', 'wrong-password'])(
    'uses generic invalid credentials for %s',
    async (scenario) => {
      findFirst.mockResolvedValue(
        scenario === 'missing'
          ? null
          : {
              ...record,
              password: scenario === 'passwordless' ? null : record.password,
            },
      );
      vi.mocked(argon2.verify).mockResolvedValue(false);
      await expect(service.login(dto)).rejects.toThrow(
        new UnauthorizedException('Invalid email or password'),
      );
      expect(signAsync).not.toHaveBeenCalled();
    },
  );
});
