import { GoneException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
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

  it('never creates an unverified account through retired direct registration', async () => {
    await expect(service.register(dto)).rejects.toBeInstanceOf(GoneException);
    expect(transaction).not.toHaveBeenCalled();
    expect(signAsync).not.toHaveBeenCalled();
    expect(argon2.hash).not.toHaveBeenCalled();
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
