import { ValidationPipe, type INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import type { NestExpressApplication } from '@nestjs/platform-express';
import type { Server } from 'node:http';
import { httpSecurity } from '../security/http-security.js';
import {
  ApiExceptionFilter,
  validationException,
} from '../contracts/errors.js';
import { IdentifierPipe } from '../contracts/identifier.pipe.js';

export const API_PREFIX = 'api/v1';

export function configureApp(app: INestApplication): void {
  const config = app.get(ConfigService);
  const origins = config.getOrThrow<string[]>('CORS_ORIGINS');
  const server = app.getHttpServer() as Server;
  server.headersTimeout = 15000;
  server.requestTimeout = 60000;
  server.keepAliveTimeout = 5000;
  server.maxRequestsPerSocket = 100;
  app.use(helmet());
  (app as NestExpressApplication).set(
    'trust proxy',
    config.get<string[]>('HTTP_TRUSTED_PROXIES') ?? [],
  );
  app.use(
    httpSecurity(
      config.get<boolean>('HTTP_RATE_LIMIT_ENABLED') ??
        config.get('NODE_ENV') !== 'test',
    ),
  );
  // 1 MiB admits worst-case JSON escaping of the existing bounded manuscript DTOs.
  // Compressed bodies are rejected so decompression does not bypass this byte budget.
  (app as NestExpressApplication).useBodyParser('json', {
    limit: '1mb',
    inflate: false,
  });
  (app as NestExpressApplication).useBodyParser('urlencoded', {
    limit: '1mb',
    extended: false,
    parameterLimit: 100,
    inflate: false,
  });
  app.setGlobalPrefix(API_PREFIX);
  app.enableCors({
    origin: origins,
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Authorization', 'Content-Type'],
    exposedHeaders: ['X-Request-Id', 'Retry-After'],
    credentials: false,
  });
  app.useGlobalPipes(
    new IdentifierPipe(),
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
      forbidUnknownValues: true,
      transformOptions: { enableImplicitConversion: false },
      validationError: { target: false, value: false },
      exceptionFactory: validationException,
    }),
  );
  app.useGlobalFilters(new ApiExceptionFilter());
  app.enableShutdownHooks();
}
