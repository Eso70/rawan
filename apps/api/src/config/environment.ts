export interface Environment {
  NODE_ENV: 'development' | 'test' | 'production';
  DATABASE_URL: string;
  JWT_SECRET: string;
  PORT: number;
  CORS_ORIGINS: string[];
}

export function validateEnvironment(
  input: Record<string, unknown>,
): Environment {
  const errors: string[] = [];
  const nodeEnv = input.NODE_ENV ?? 'development';
  if (
    typeof nodeEnv !== 'string' ||
    !['development', 'test', 'production'].includes(nodeEnv)
  ) {
    errors.push('NODE_ENV must be development, test, or production');
  }

  const databaseUrl =
    typeof input.DATABASE_URL === 'string' ? input.DATABASE_URL : '';
  try {
    const url = new URL(databaseUrl);
    if (
      !['postgresql:', 'postgres:'].includes(url.protocol) ||
      !url.hostname ||
      url.pathname.length < 2
    ) {
      throw new Error();
    }
  } catch {
    errors.push(
      'DATABASE_URL must be a PostgreSQL connection URL with a database name',
    );
  }

  const jwtSecret =
    typeof input.JWT_SECRET === 'string' ? input.JWT_SECRET : '';
  if (jwtSecret.trim().length < 32) {
    errors.push('JWT_SECRET must contain at least 32 non-padding characters');
  }

  const portValue = input.PORT ?? '3002';
  const port = Number(portValue);
  if (
    (typeof portValue !== 'string' && typeof portValue !== 'number') ||
    !/^\d+$/.test(`${portValue as string | number}`) ||
    !Number.isInteger(port) ||
    port < 1 ||
    port > 65535
  ) {
    errors.push('PORT must be an integer between 1 and 65535');
  }

  const originsValue = input.CORS_ORIGINS;
  const origins =
    typeof originsValue === 'string' && originsValue.trim()
      ? originsValue.split(',').map((origin) => origin.trim())
      : nodeEnv === 'production'
        ? []
        : ['http://localhost:3000', 'http://localhost:3001'];
  if (nodeEnv === 'production' && origins.length === 0) {
    errors.push(
      'CORS_ORIGINS must explicitly list frontend origins in production',
    );
  }
  for (const origin of origins) {
    try {
      const url = new URL(origin);
      if (
        !['http:', 'https:'].includes(url.protocol) ||
        url.origin !== origin ||
        url.username ||
        url.password ||
        url.hostname.includes('*')
      ) {
        throw new Error();
      }
      if (nodeEnv === 'production' && url.protocol !== 'https:')
        throw new Error();
    } catch {
      errors.push(
        'CORS_ORIGINS must contain exact HTTP(S) origins without paths or wildcards; production requires HTTPS',
      );
    }
  }

  if (errors.length)
    throw new Error(`Invalid API environment: ${errors.join('; ')}`);
  return {
    ...input,
    NODE_ENV: nodeEnv as Environment['NODE_ENV'],
    DATABASE_URL: databaseUrl,
    JWT_SECRET: jwtSecret,
    PORT: port,
    CORS_ORIGINS: [...new Set(origins)],
  };
}
