import { validateEmailConfig } from './email-config.js';
describe('email sending configuration', () => {
  const enabled = {
    EMAIL_SIGNUP_ENABLED: 'true',
    EMAIL_FROM: 'rawanproject3@gmail.com',
    GMAIL_APP_PASSWORD: 'abcd efgh ijkl mnop',
    EMAIL_CODE_SECRET: 'test-verification-pepper-with-more-than-32-characters',
  };
  it('keeps mail disabled without secrets by default', () => {
    expect(validateEmailConfig({}).enabled).toBe(false);
  });
  it('accepts the sender/app password only when sending is explicitly enabled', () => {
    expect(validateEmailConfig(enabled)).toMatchObject({
      enabled: true,
      appPassword: 'abcdefghijklmnop',
    });
  });
  it.each([
    { GMAIL_APP_PASSWORD: '' },
    { EMAIL_CODE_SECRET: '' },
    { EMAIL_FROM: 'other@example.com' },
    { EMAIL_APP_ORIGIN: 'https://example.com/path' },
  ])('rejects incomplete or unsafe configuration %s', (value) => {
    expect(() => validateEmailConfig({ ...enabled, ...value })).toThrow();
  });
  it('requires an HTTPS app origin when production sending is enabled', () => {
    expect(() =>
      validateEmailConfig({ ...enabled, NODE_ENV: 'production' }),
    ).toThrow();
    expect(
      validateEmailConfig({
        ...enabled,
        NODE_ENV: 'production',
        EMAIL_APP_ORIGIN: 'https://rawan.example',
      }).enabled,
    ).toBe(true);
  });
});
