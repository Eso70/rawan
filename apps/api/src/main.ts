import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { ConfigService } from '@nestjs/config';
import { configureApp } from './config/configure-app.js';
import { configureOpenApi } from './contracts/openapi.js';
import { Logger, type INestApplication } from '@nestjs/common';

async function bootstrap() {
  let app: INestApplication | undefined;
  try {
    app = await NestFactory.create(AppModule, { abortOnError: false });
    configureApp(app);
    configureOpenApi(app);
    await app.listen(app.get(ConfigService).getOrThrow<number>('PORT'));
  } catch {
    try {
      await app?.close();
    } catch {
      Logger.error({ event: 'API_STARTUP_CLEANUP_FAILED' });
    }
    Logger.error({
      event: 'API_STARTUP_FAILED',
      message: 'Check API configuration and dependency readiness',
    });
    process.exitCode = 1;
  }
}
await bootstrap();
