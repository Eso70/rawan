import { ConfigService } from '@nestjs/config';
import { EmailMailer } from './email-mailer.js';
import nodemailer from 'nodemailer';
import { verificationEmail } from './verification-template.js';
import { assertSignupEmail } from '../auth/email-domains.js';
const sendMail = vi.hoisted(() => vi.fn());
vi.mock('nodemailer', () => ({
  default: { createTransport: vi.fn(() => ({ sendMail, close: vi.fn() })) },
}));
describe('Gmail verification mail', () => {
  const settings = {
    enabled: true,
    from: 'rawanproject3@gmail.com',
    appPassword: 'test-password-16',
    codeSecret: 'test-secret',
    appOrigin: 'http://localhost:3000',
  };
  beforeEach(() => {
    vi.clearAllMocks();
    sendMail.mockResolvedValue({ accepted: ['reader@gmail.com'] });
  });
  it('uses TLS, inline local brand and no debugging or remote attachments', async () => {
    const mailer = new EmailMailer(
      new ConfigService({ EMAIL_CONFIG: settings }),
    );
    await mailer.sendVerification('reader@gmail.com', '00237533');
    expect(nodemailer.createTransport).toHaveBeenCalledWith(
      expect.objectContaining({
        host: 'smtp.gmail.com',
        port: 465,
        secure: true,
        logger: false,
        debug: false,
        disableUrlAccess: true,
        disableFileAccess: true,
      }),
    );
    expect(sendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'reader@gmail.com',
        from: { name: 'Rawan', address: settings.from },
        text: expect.stringContaining('00237533'),
        attachments: [
          expect.objectContaining({
            content: expect.any(Buffer),
            cid: 'rawan-logo',
          }),
        ],
      }),
    );
  });
  it('does not attempt any delivery before enabling mail', async () => {
    const mailer = new EmailMailer(
      new ConfigService({ EMAIL_CONFIG: { ...settings, enabled: false } }),
    );
    await expect(
      mailer.sendVerification('reader@gmail.com', '12345678'),
    ).rejects.toThrow('not available');
    expect(nodemailer.createTransport).not.toHaveBeenCalled();
  });
  it('does not expose SMTP provider exceptions', async () => {
    sendMail.mockRejectedValue(
      Error('SMTP private-password-and-server-details'),
    );
    const mailer = new EmailMailer(
      new ConfigService({ EMAIL_CONFIG: settings }),
    );
    await expect(
      mailer.sendVerification('reader@gmail.com', '12345678'),
    ).rejects.toThrow(
      'Could not send your verification email. Please try again later.',
    );
  });
  it('rejects nonnumeric codes and injectible origin paths', () => {
    expect(() =>
      verificationEmail('<script>', 'http://localhost:3000'),
    ).toThrow();
    expect(() =>
      verificationEmail('12345678', 'https://example.com/path'),
    ).toThrow();
    const email = verificationEmail('00237533', 'http://localhost:3000');
    expect(email.html).toContain('Welcome to Rawan');
    expect(email.html).toContain('00237533');
    expect(email.text).toContain('10 minutes');
  });
  it.each([
    'gmail.com',
    'googlemail.com',
    'yahoo.com',
    'ymail.com',
    'rocketmail.com',
    'outlook.com',
    'hotmail.com',
    'live.com',
    'msn.com',
  ])('accepts only the approved exact domain %s', (domain) => {
    expect(() => assertSignupEmail('person@' + domain)).not.toThrow();
  });
  it.each([
    'yahoo.co.uk',
    'gmail.com.evil.com',
    'sub.gmail.com',
    'gmail.co',
    'outlook.com.evil.com',
    'example.com',
    'mailinator.com',
  ])('rejects unapproved domains %s', (domain) => {
    expect(() => assertSignupEmail('person@' + domain)).toThrow();
  });
});
