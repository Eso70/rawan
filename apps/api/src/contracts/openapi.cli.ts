import 'reflect-metadata';
import { Module, type Type } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { PUBLIC_CONTROLLERS } from './controllers.js';
import { PrismaService } from '../database/prisma.service.js';
import { API_PREFIX } from '../config/configure-app.js';
import { createOpenApiDocument } from './openapi.js';
/** Controllers only: no AppModule, dotenv, database, storage, queue or worker lifecycle. */
export async function createContractApplication(docsEnabled = false) {
  const tokens = new Set<Type<unknown>>([PrismaService]);
  for (const controller of PUBLIC_CONTROLLERS)
    for (const token of (Reflect.getMetadata(
      'design:paramtypes',
      controller,
    ) as Type<unknown>[]) ?? [])
      tokens.add(token);
  @Module({
    controllers: PUBLIC_CONTROLLERS,
    providers: [
      ...Array.from(tokens, (provide) => ({ provide, useValue: {} })),
      {
        provide: ConfigService,
        useValue: new ConfigService({
          CORS_ORIGINS: [],
          OPENAPI_ENABLED: docsEnabled,
          MEDIA_MAX_FILE_SIZE: 10485760,
          MEDIA_LOCAL_PATH: 'unused-contract-storage',
        }),
      },
    ],
  })
  class ContractModule {}
  const app = await NestFactory.create(ContractModule, {
    logger: false,
    abortOnError: false,
  });
  app.setGlobalPrefix(API_PREFIX);
  return app;
}
export async function createOfflineOpenApi() {
  const app = await createContractApplication();
  try {
    return createOpenApiDocument(app);
  } finally {
    await app.close();
  }
}
export async function exportOpenApi() {
  const document = await createOfflineOpenApi();
  const root = fileURLToPath(
    new URL('../../.data/contracts/', import.meta.url),
  );
  await mkdir(root, { recursive: true });
  const sort = (value: unknown): unknown =>
    Array.isArray(value)
      ? value.map(sort)
      : value && typeof value === 'object'
        ? Object.fromEntries(
            Object.entries(value)
              .sort(([a], [b]) => a.localeCompare(b))
              .map(([k, v]) => [k, sort(v)]),
          )
        : value;
  await writeFile(
    root + 'openapi.json',
    JSON.stringify(sort(document), null, 2) + '\n',
  );
  console.log(
    'Generated apps/api/.data/contracts/openapi.json without database, Redis or provider calls',
  );
}
if (process.argv[1] === fileURLToPath(import.meta.url)) await exportOpenApi();
