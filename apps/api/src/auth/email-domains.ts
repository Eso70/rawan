import { BadRequestException } from '@nestjs/common';
export const EMAIL_SIGNUP_DOMAINS = new Set([
  'gmail.com',
  'googlemail.com',
  'yahoo.com',
  'ymail.com',
  'rocketmail.com',
  'outlook.com',
  'hotmail.com',
  'live.com',
  'msn.com',
]);
export function assertSignupEmail(email: string) {
  const domain = email.slice(email.lastIndexOf('@') + 1).toLowerCase();
  if (!EMAIL_SIGNUP_DOMAINS.has(domain))
    throw new BadRequestException(
      `Email sign-up accepts only: ${[...EMAIL_SIGNUP_DOMAINS].join(', ')}.`,
    );
}
