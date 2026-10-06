import { ConfigService } from '@nestjs/config';
import { GoogleAuthService } from './google-auth.service.js';
import { PrismaService } from '../database/prisma.service.js';
import { AuthService } from './auth.service.js';

const verify = vi.hoisted(() => vi.fn());
vi.mock('google-auth-library', () => ({
  OAuth2Client: class {
    verifyIdToken = verify;
  },
}));

describe('Google authentication', () => {
  const identity = {
    sub: 'google-stable-subject',
    email: ' AUTHOR@EXAMPLE.COM ',
    name: 'Author',
    email_verified: true,
    nonce: 'expected-nonce',
  };
  const record = {
    id: 'author',
    email: 'author@example.com',
    name: 'Author',
    role: 'AUTHOR',
  };
  let findUnique: ReturnType<typeof vi.fn>;
  let findFirst: ReturnType<typeof vi.fn>;
  let create: ReturnType<typeof vi.fn>;
  let createToken: ReturnType<typeof vi.fn>;
  let service: GoogleAuthService;
  const dto = { idToken: 'signed-google-token', nonce: 'expected-nonce' };
  beforeEach(() => {
    vi.resetAllMocks();
    verify.mockResolvedValue({ getPayload: () => identity });
    findUnique = vi.fn().mockResolvedValue(null);
    findFirst = vi.fn().mockResolvedValue(null);
    create = vi.fn().mockResolvedValue(record);
    createToken = vi.fn().mockResolvedValue({ accessToken: 'rawan-token' });
    service = new GoogleAuthService(
      new ConfigService({ GOOGLE_CLIENT_ID: 'client-id' }),
      { user: { findUnique, findFirst, create } } as unknown as PrismaService,
      { createToken } as unknown as AuthService,
    );
  });
  it('verifies the configured audience and atomically creates an author with no password', async () => {
    await expect(service.login(dto)).resolves.toEqual({
      accessToken: 'rawan-token',
    });
    expect(verify).toHaveBeenCalledWith({
      idToken: dto.idToken,
      audience: 'client-id',
    });
    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: {
          email: 'author@example.com',
          name: 'Author',
          googleSubject: identity.sub,
          role: 'AUTHOR',
          author: { create: { displayName: 'Author' } },
        },
      }),
    );
  });
  it('uses the stable Google subject for returning users, including changed emails', async () => {
    findUnique.mockResolvedValue(record);
    await service.login(dto);
    expect(findUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { googleSubject: identity.sub } }),
    );
    expect(create).not.toHaveBeenCalled();
    expect(createToken).toHaveBeenCalledWith(record);
  });
  it('rejects invalid signatures without accessing the database', async () => {
    verify.mockRejectedValue(new Error('invalid signature'));
    await expect(service.login(dto)).rejects.toMatchObject({ status: 401 });
    expect(findUnique).not.toHaveBeenCalled();
  });
  it.each([
    { email_verified: false },
    { nonce: 'wrong-nonce' },
    { sub: '' },
    { email: '' },
  ])('rejects invalid identity claims %j', async (changes) => {
    verify.mockResolvedValue({
      getPayload: () => ({ ...identity, ...changes }),
    });
    await expect(service.login(dto)).rejects.toMatchObject({ status: 401 });
    expect(createToken).not.toHaveBeenCalled();
  });
  it('never links or signs in an existing password/admin account by email alone', async () => {
    findFirst.mockResolvedValue({ id: 'existing-admin' });
    await expect(service.login(dto)).rejects.toMatchObject({ status: 409 });
    expect(create).not.toHaveBeenCalled();
    expect(createToken).not.toHaveBeenCalled();
  });
  it('fails closed when Google is not configured', async () => {
    service = new GoogleAuthService(
      new ConfigService({}),
      {} as PrismaService,
      {} as AuthService,
    );
    await expect(service.login(dto)).rejects.toMatchObject({ status: 503 });
    expect(verify).not.toHaveBeenCalled();
  });
});
