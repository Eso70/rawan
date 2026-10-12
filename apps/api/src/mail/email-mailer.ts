import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import nodemailer from 'nodemailer';
import { readFile } from 'node:fs/promises';
import type { EmailConfig } from './email-config.js';
import { verificationEmail } from './verification-template.js';

@Injectable()
export class EmailMailer {
  private readonly config: EmailConfig;
  constructor(config: ConfigService) {
    this.config = config.getOrThrow<EmailConfig>('EMAIL_CONFIG');
  }
  assertReady() {
    if (!this.config.enabled)
      throw new ServiceUnavailableException(
        'Email sign-up is not available yet. Please use Google or try again later.',
      );
  }
  async sendVerification(email: string, code: string) {
    this.assertReady();
    const transport = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: { user: this.config.from, pass: this.config.appPassword },
      tls: { minVersion: 'TLSv1.2' },
      logger: false,
      debug: false,
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 15000,
      disableFileAccess: true,
      disableUrlAccess: true,
    });
    try {
      const message = verificationEmail(code, this.config.appOrigin);
      const result = await transport.sendMail({
        from: { name: 'Rawan', address: this.config.from },
        to: email,
        ...message,
        attachments: [
          {
            filename: 'rawan-logo.png',
            content: await readFile(
              new URL('../../assets/mail/logo.png', import.meta.url),
            ),
            cid: 'rawan-logo',
          },
        ],
      });
      if (!result.accepted.includes(email))
        throw Error('Recipient not accepted');
    } catch {
      throw new ServiceUnavailableException(
        'Could not send your verification email. Please try again later.',
      );
    } finally {
      transport.close();
    }
  }
}
