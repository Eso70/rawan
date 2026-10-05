import { fileURLToPath } from 'node:url';
import { isIP } from 'node:net';
import {
  validateQueueConfig,
  validateStorageConfig,
  validateAiConfig,
  type AiConfig,
} from '@rawan/backend';
export interface Environment {
  OPENAPI_ENABLED: boolean;
  HTTP_RATE_LIMIT_ENABLED: boolean;
  HTTP_TRUSTED_PROXIES: string[];
  AI_CONFIG: AiConfig;
  NODE_ENV: 'development' | 'test' | 'production';
  DATABASE_URL: string;
  JWT_SECRET: string;
  PORT: number;
  CORS_ORIGINS: string[];
  MEDIA_STORAGE_DRIVER: 'local';
  MEDIA_LOCAL_PATH: string;
  MEDIA_MAX_FILE_SIZE: number;
  REDIS_URL?: string;
  QUEUE_PREFIX: string;
  MEDIA_CLEANUP_INTERVAL_MS: number;
  MEDIA_CLEANUP_SCHEDULE_ENABLED: boolean;
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
  if (
    nodeEnv === 'production' &&
    (/replace|change.?me|example|development|test.?secret|test.only.secret|your.?secret/i.test(
      jwtSecret,
    ) ||
      new Set(jwtSecret).size < 12)
  )
    errors.push(
      'JWT_SECRET must be a randomly generated production secret, not a default/example or repeated pattern',
    );

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
      : [];
  if (nodeEnv === 'production' && origins.length === 0) {
    errors.push(
      'CORS_ORIGINS must explicitly list allowed browser origins in production',
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

  let storage;
  try {
    storage = validateStorageConfig(
      input,
      fileURLToPath(new URL('../../', import.meta.url)),
    );
  } catch (error) {
    errors.push((error as Error).message);
  }
  let queue;
  let ai;
  try {
    ai = validateAiConfig(input);
  } catch (error) {
    errors.push((error as Error).message);
  }
  try {
    queue = validateQueueConfig(input);
  } catch (error) {
    errors.push((error as Error).message);
  }
  const scheduleValue = input.MEDIA_CLEANUP_SCHEDULE_ENABLED ?? 'true';
  const docsValue = input.OPENAPI_ENABLED ?? nodeEnv === 'development';
  const rateValue = input.HTTP_RATE_LIMIT_ENABLED ?? nodeEnv !== 'test';
  const proxyValue = input.HTTP_TRUSTED_PROXIES ?? '';
  const proxies =
    typeof proxyValue === 'string'
      ? proxyValue
          .split(',')
          .map((v) => v.trim())
          .filter(Boolean)
      : [];
  if (
    typeof proxyValue !== 'string' ||
    proxies.length > 20 ||
    proxies.some((value) => {
      const parts = value.split('/');
      const version = isIP(parts[0]);
      return (
        !version ||
        parts.length > 2 ||
        (parts.length === 2 &&
          (!/^\d+$/.test(parts[1]) ||
            Number(parts[1]) < 1 ||
            Number(parts[1]) > (version === 4 ? 32 : 128)))
      );
    })
  )
    errors.push(
      'HTTP_TRUSTED_PROXIES must list at most 20 explicit proxy IP addresses or non-global CIDRs',
    );
  if (!['true', 'false', true, false].includes(rateValue as string | boolean))
    errors.push('HTTP_RATE_LIMIT_ENABLED must be true or false');
  if (nodeEnv === 'production' && rateValue !== true && rateValue !== 'true')
    errors.push('HTTP_RATE_LIMIT_ENABLED cannot be disabled in production');
  if (!['true', 'false', true, false].includes(docsValue as string | boolean))
    errors.push('OPENAPI_ENABLED must be true or false');
  if (
    !['true', 'false', true, false].includes(scheduleValue as string | boolean)
  )
    errors.push('MEDIA_CLEANUP_SCHEDULE_ENABLED must be true or false');
  if (errors.length || !queue || !storage || !ai)
    throw new Error(`Invalid API environment: ${errors.join('; ')}`);
  return {
    ...input,
    AI_CONFIG: ai,
    OPENAPI_ENABLED: docsValue === true || docsValue === 'true',
    HTTP_RATE_LIMIT_ENABLED: rateValue === true || rateValue === 'true',
    HTTP_TRUSTED_PROXIES: proxies,
    NODE_ENV: nodeEnv as Environment['NODE_ENV'],
    DATABASE_URL: databaseUrl,
    JWT_SECRET: jwtSecret,
    PORT: port,
    CORS_ORIGINS: [...new Set(origins)],
    MEDIA_STORAGE_DRIVER: storage.driver,
    MEDIA_LOCAL_PATH: storage.localPath,
    MEDIA_MAX_FILE_SIZE: storage.maxFileSize,
    REDIS_URL: queue.redisUrl,
    QUEUE_PREFIX: queue.prefix,
    MEDIA_CLEANUP_INTERVAL_MS: queue.cleanupIntervalMs,
    MEDIA_CLEANUP_SCHEDULE_ENABLED:
      scheduleValue === true || scheduleValue === 'true',
  };
}
