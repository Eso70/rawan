import { assessSignupPassword } from '@rawan/types/password';
import { EmailSignupService } from './email-signup.service.js';
import { ConfigService } from '@nestjs/config';
import type { PrismaService } from '../database/prisma.service.js';
import type { EmailMailer } from '../mail/email-mailer.js';
import type { AuthService } from './auth.service.js';

describe('Signup password policy', () => {
  const email = 'sunlitwriter@gmail.com';
  it.each([
    'too short',
    ' '.repeat(20),
    'a'.repeat(129),
    email,
    email.toUpperCase(),
    'sunlitwriter123456789!',
    'Sunlit.Writer12345!',
    'Password123456789!',
    'P@ssw0rd123456789!',
    'aaaaaaaaaaaaaaaaaaaa',
    'abcdefghijklmno',
    '12345678901234567890',
  ])(
    'rejects a weak or identity-based signup password (%#)',
    async (password) => {
      expect((await assessSignupPassword(password, email)).error).toBeTruthy();
    },
  );
  it.each([
    'Sable sunlit orchard canoe 72!',
    'رواية جميلة في حديقة الصباح الباكر',
    'cedar otter lantern meadow',
  ])('accepts long unrelated passphrases (%#)', async (password) => {
    expect((await assessSignupPassword(password, email)).error).toBeNull();
  });
  it('rejects weak passwords before accessing storage or sending email', async () => {
    const transaction = vi.fn();
    const assertReady = vi.fn();
    const service = new EmailSignupService(
      { $transaction: transaction } as unknown as PrismaService,
      {
        getOrThrow: () => ({ codeSecret: 'test-only' }),
      } as unknown as ConfigService,
      { assertReady } as unknown as EmailMailer,
      {} as AuthService,
    );
    await expect(service.start({ email, password: email })).rejects.toThrow(
      'different from your email',
    );
    expect(transaction).not.toHaveBeenCalled();
    expect(assertReady).not.toHaveBeenCalled();
  });
});
