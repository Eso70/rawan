import {
  createOfflineOpenApi,
  createContractApplication,
} from '../../dist/contracts/openapi.cli.js';
import { publicRouteInventory } from '../../dist/contracts/openapi.js';
import { configureOpenApi } from '../../dist/contracts/openapi.js';
import { configureApp } from '../../dist/config/configure-app.js';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import request from 'supertest';
import type { SchemaObject, OpenAPIObject } from '@nestjs/swagger';
describe('V1 OpenAPI contract generated from compiled controllers and DTOs', () => {
  let document: OpenAPIObject;
  beforeAll(async () => {
    document = await createOfflineOpenApi();
  });
  const schema = (name: string) =>
    document.components!.schemas![name] as SchemaObject;
  it('covers every existing public operation once with stable IDs', () => {
    const inventory = publicRouteInventory();
    expect(inventory).toHaveLength(114);
    const operations = Object.values(document.paths).flatMap((path) =>
      Object.entries(path).filter(([key]) =>
        ['get', 'post', 'patch', 'delete'].includes(key),
      ),
    );
    expect(operations).toHaveLength(inventory.length);
    const ids = operations.map(([, op]) => op.operationId);
    expect(new Set(ids).size).toBe(ids.length);
    for (const entry of inventory) {
      expect(document.paths[entry.path]?.[entry.method as 'get']).toBeDefined();
    }
    const root = new URL('../', import.meta.url);
    const walk = (path: string): string[] =>
      readdirSync(path, { withFileTypes: true }).flatMap((e) =>
        e.isDirectory() ? walk(join(path, e.name)) : [join(path, e.name)],
      );

    const sourceControllers = walk(fileURLToPath(root))
      .filter((f) => f.endsWith('.controller.ts'))
      .map((f) => readFileSync(f, 'utf8').match(/export class (\w+)/)![1]);
    expect([...new Set(inventory.map((r) => r.controller))].sort()).toEqual(
      sourceControllers.sort(),
    );
  });
  it('has no unresolved schema references or leaked implementation contracts', () => {
    const visit = (value: unknown) => {
      if (!value || typeof value !== 'object') return;
      for (const [key, v] of Object.entries(value)) {
        if (key === '$ref') {
          expect(typeof v).toBe('string');
          expect(
            document.components!.schemas![String(v).split('/').at(-1)!],
          ).toBeDefined();
        } else visit(v);
      }
    };
    visit(document);
    for (const name of ['ApiUserDto', 'ApiMediaDto', 'AiGenerationDetailDto']) {
      const text = JSON.stringify(schema(name));
      for (const field of [
        'password',
        'storageKey',
        'storageProvider',
        'leaseToken',
        'instructions',
        'systemPrompt',
        'AI_API_KEY',
        'DATABASE_URL',
      ])
        expect(text).not.toContain(`"${field}"`);
    }
    expect(document.paths['/api/v1/jobs']).toBeUndefined();
  });
  it('documents public JWT and admin boundaries', () => {
    expect(document.components!.securitySchemes!.bearer).toMatchObject({
      type: 'http',
      scheme: 'bearer',
    });
    for (const path of [
      '/api/v1/auth/register',
      '/api/v1/auth/login',
      '/api/v1/health',
      '/api/v1/health/queues',
    ])
      expect(
        (document.paths[path].post ?? document.paths[path].get)!.security,
      ).toBeUndefined();
    expect(document.paths['/api/v1/users'].get).toMatchObject({
      security: [{ bearer: [] }],
      description: 'ADMIN role required.',
    });
    expect(document.paths['/api/v1/users'].get!.responses['403']).toBeDefined();
    expect(document.paths['/api/v1/projects'].get!.security).toEqual([
      { bearer: [] },
    ]);
  });
  it('derives validator limits/nullability/enums, including composed helpers', () => {
    expect(schema('RegisterDto').properties!.password).toMatchObject({
      minLength: 12,
      maxLength: 128,
      writeOnly: true,
    });
    expect(schema('LoginDto').properties!.password).toMatchObject({
      minLength: 1,
      maxLength: 128,
    });
    expect(schema('CreateEventDto').properties!.summary).toMatchObject({
      maxLength: 1000,
      nullable: true,
    });
    expect(schema('CreateEventDto').properties!.start).toMatchObject({
      type: 'string',
      pattern: expect.stringContaining('23'),
    });
    expect(schema('CreateAiDto').properties!.context).toMatchObject({
      type: 'array',
      maxItems: 8,
      items: { $ref: '#/components/schemas/AiContextDto' },
    });
    expect(schema('ReorderPlotPointsDto').properties!.items).toMatchObject({
      type: 'array',
      minItems: 1,
      maxItems: 200,
    });
    expect(schema('UpdateProjectDto').required ?? []).not.toContain('title');
    expect(schema('UpdateProjectDto').properties!.description).toMatchObject({
      nullable: true,
      maxLength: 10000,
    });
    const queries = document.paths['/api/v1/projects/{projectId}/characters']
      .get!.parameters as { name: string; schema: SchemaObject }[];
    expect(queries.find((p) => p.name === 'limit')?.schema).toMatchObject({
      type: 'integer',
      default: 50,
      maximum: 100,
      minimum: 1,
    });
    expect(queries.find((p) => p.name === 'sort')?.schema.enum).toEqual([
      'name',
      'createdAt',
      'updatedAt',
    ]);
  });
  it('preserves paging, summary/detail, timestamp and opaque ID contracts', () => {
    for (const path of [
      '/api/v1/projects/{projectId}/books',
      '/api/v1/projects/{projectId}/books/{bookId}/chapters',
      '/api/v1/projects/{projectId}/timelines',
      '/api/v1/timelines/{timelineId}/eras',
      '/api/v1/users',
    ]) {
      const operation = document.paths[path].get!;
      const parameters = operation.parameters as {
        name: string;
        schema: SchemaObject;
      }[];
      expect(parameters.find((p) => p.name === 'limit')?.schema).toMatchObject({
        default: 50,
        maximum: 100,
      });
      expect(parameters.find((p) => p.name === 'offset')?.schema).toMatchObject(
        { minimum: 0 },
      );
      expect(operation.responses['429']).toBeDefined();
      expect(operation.responses['200']).toMatchObject({
        headers: { 'X-Request-Id': expect.any(Object) },
        content: {
          'application/json': { schema: { type: 'array', maxItems: 100 } },
        },
      });
    }
    expect(schema('ApiPlotPointDto').properties!.entities).toMatchObject({
      maxItems: 1000,
    });
    expect(
      document.paths['/api/v1/projects'].get!.responses['200'],
    ).toMatchObject({
      content: {
        'application/json': {
          schema: {
            required: ['items', 'nextOffset'],
            properties: {
              nextOffset: { nullable: true },
              items: { type: 'array' },
            },
          },
        },
      },
    });
    expect(schema('ApiSceneSummaryDto').properties).not.toHaveProperty(
      'content',
    );
    expect(schema('ApiSceneDto').properties).toHaveProperty('content');
    expect(schema('AiGenerationSummaryDto').properties).not.toHaveProperty(
      'result',
    );
    expect(schema('ApiProjectDto').properties!.id).not.toHaveProperty('format');
    expect(schema('ApiProjectDto').properties!.createdAt).toMatchObject({
      format: 'date-time',
    });
    expect(schema('ApiErrorDto').properties!.code).toMatchObject({
      enum: expect.arrayContaining([
        'VALIDATION_ERROR',
        'UNAUTHORIZED',
        'CONFLICT',
      ]),
    });
  });
  it('documents multipart and binary contracts without a JSON download', () => {
    expect(
      document.paths['/api/v1/projects/{projectId}/media'].post!.requestBody,
    ).toMatchObject({
      content: {
        'multipart/form-data': {
          schema: {
            required: ['file'],
            properties: { file: { format: 'binary' } },
          },
        },
      },
    });
    const content = (
      document.paths['/api/v1/media/{id}/content'].get!.responses['200'] as {
        content: Record<string, unknown>;
      }
    ).content;
    expect(content).not.toHaveProperty('application/json');
    expect(content).toHaveProperty('application/pdf');
    expect(
      document.paths['/api/v1/projects/{projectId}/ai/generations'].post!
        .responses['202'],
    ).toBeDefined();
    expect(
      (schema('AiGenerationDetailDto').properties!.result as SchemaObject)
        .properties!.proposal,
    ).toMatchObject({ enum: [true] });
  });
  it('is deterministic and independent of database/Redis/provider environment', async () => {
    expect(await createOfflineOpenApi()).toEqual(document);
    const frozen = JSON.parse(
      readFileSync(
        new URL(
          '../../../../docs/contracts/backend-v1.openapi.json',
          import.meta.url,
        ),
        'utf8',
      ),
    ) as OpenAPIObject;
    expect(document).toEqual(frozen);
    expect(JSON.stringify(document)).not.toContain('postgresql://');
    expect(JSON.stringify(document)).not.toContain('redis://');
  });
  it.each([false, true])(
    'mounts documentation only on deliberate opt-in: %s',
    async (enabled) => {
      const app = await createContractApplication(enabled);
      try {
        configureApp(app);
        configureOpenApi(app);
        await app.listen(0, '127.0.0.1');
        const missing = await request(app.getHttpServer())
          .get('/api/v1/unknown-resource')
          .expect(404);
        expect(missing.body.code).toBe('NOT_FOUND');
        const json = await request(app.getHttpServer())
          .get('/api/docs/openapi.json')
          .expect(enabled ? 200 : 404);
        if (enabled) {
          expect(json.body.info.title).toBe('Rawan API');
          await request(app.getHttpServer()).get('/api/docs').expect(200);
        } else expect(json.body.info).toBeUndefined();
      } finally {
        await app.close();
      }
    },
  );
});
