import type { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  DocumentBuilder,
  SwaggerModule,
  type OpenAPIObject,
} from '@nestjs/swagger';
import { PUBLIC_CONTROLLERS } from './controllers.js';
import { PATH_METADATA, METHOD_METADATA } from '@nestjs/common/constants';
/** Used by tests to detect undocumented additions independently of documentation decorators. */
export function publicRouteInventory() {
  const verbs = [
    'get',
    'post',
    'put',
    'delete',
    'patch',
    'all',
    'options',
    'head',
  ];
  return PUBLIC_CONTROLLERS.flatMap((controller) =>
    Object.getOwnPropertyNames(controller.prototype).flatMap((name) => {
      const fn = Object.getOwnPropertyDescriptor(controller.prototype, name)
        ?.value as unknown;
      if (typeof fn !== 'function') return [];
      const method = Reflect.getMetadata(METHOD_METADATA, fn) as
        number | undefined;
      if (method === undefined) return [];
      const prefix = Reflect.getMetadata(PATH_METADATA, controller) as string;
      const route = Reflect.getMetadata(PATH_METADATA, fn) as string;
      return [
        {
          method: verbs[method],
          path: (
            '/api/v1/' + [prefix, route].filter((p) => p && p !== '/').join('/')
          ).replace(/:([a-zA-Z0-9_]+)/g, '{$1}'),
          controller: controller.name,
        },
      ];
    }),
  );
}
export function createOpenApiDocument(app: INestApplication): OpenAPIObject {
  const document = SwaggerModule.createDocument(
    app,
    new DocumentBuilder()
      .setTitle('Rawan API')
      .setVersion('1.0.0')
      .setDescription(
        'Author-owned writing backend. Private resources are scoped to the authenticated author and return 404 when inaccessible. Dates are ISO 8601; fictional chronology is an exact decimal string. AI outputs are proposals only. See docs/api.md for v1 conventions.',
      )
      .addBearerAuth(
        { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
        'bearer',
      )
      .build(),
    {
      autoTagControllers: false,
      operationIdFactory: (controller, method) =>
        `${controller.replace(/Controller$/, '')}_${method}`,
    },
  );
  for (const schema of Object.values(document.components?.schemas ?? {}))
    if ('properties' in schema && schema.properties)
      schema.additionalProperties = false;
  return document;
}
export function configureOpenApi(app: INestApplication) {
  if (!app.get(ConfigService).get<boolean>('OPENAPI_ENABLED')) return;
  SwaggerModule.setup('api/docs', app, () => createOpenApiDocument(app), {
    jsonDocumentUrl: 'api/docs/openapi.json',
    raw: ['json'],
    swaggerOptions: { persistAuthorization: false, validatorUrl: null },
  });
}
