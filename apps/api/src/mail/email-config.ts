export interface EmailConfig {
  enabled: boolean;
  from: string;
  appPassword: string;
  codeSecret: string;
  appOrigin: string;
}
export function validateEmailConfig(
  input: Record<string, unknown>,
): EmailConfig {
  const enabled = input.EMAIL_SIGNUP_ENABLED ?? 'false';
  if (!['true', 'false', true, false].includes(enabled as string | boolean))
    throw Error('EMAIL_SIGNUP_ENABLED must be true or false');
  const config: EmailConfig = {
    enabled: enabled === true || enabled === 'true',
    from:
      typeof input.EMAIL_FROM === 'string'
        ? input.EMAIL_FROM
        : 'rawanproject3@gmail.com',
    appPassword:
      typeof input.GMAIL_APP_PASSWORD === 'string'
        ? input.GMAIL_APP_PASSWORD.replaceAll(' ', '')
        : '',
    codeSecret:
      typeof input.EMAIL_CODE_SECRET === 'string'
        ? input.EMAIL_CODE_SECRET
        : '',
    appOrigin:
      typeof input.EMAIL_APP_ORIGIN === 'string'
        ? input.EMAIL_APP_ORIGIN
        : 'http://localhost:3000',
  };
  if (!/^[a-zA-Z0-9._+-]+@gmail\.com$/.test(config.from))
    throw Error('EMAIL_FROM must be the Gmail sending account');
  const origin = new URL(config.appOrigin);
  if (
    origin.origin !== config.appOrigin ||
    origin.username ||
    origin.password ||
    !['http:', 'https:'].includes(origin.protocol) ||
    (config.enabled &&
      input.NODE_ENV === 'production' &&
      origin.protocol !== 'https:')
  )
    throw Error(
      'EMAIL_APP_ORIGIN must be an exact origin; production requires HTTPS',
    );
  if (
    config.enabled &&
    (config.appPassword.length !== 16 || config.codeSecret.trim().length < 32)
  )
    throw Error(
      'Email signup requires GMAIL_APP_PASSWORD and a random EMAIL_CODE_SECRET',
    );
  return config;
}
