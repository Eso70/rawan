# Rawan backend

Rawan is intended to serve creators and readers across writing, literature, books, comics, fiction and nonfiction, research, libraries, publishing, discovery and reading. Its current backend V1 supports private creative work: authentication, owned projects/manuscripts/worldbuilding, relationships, timelines, plots, notes/tags, search, private media, background cleanup and proposal-only AI infrastructure. AI is disabled by default; its only adapter is an explicit development/test simulator.

Public publishing, reader libraries, reading progress and comics-specific structures require future backend work. Author/reader experience preferences do not provide those capabilities or change authorization roles. See the [product scope and backend capability audit](docs/product-scope-and-backend-capabilities.md) for existing functionality, frontend possibilities, future backend requirements and long-term directions.

## Structure

The root landing page can be previewed separately with `pnpm dev:website` at [http://127.0.0.1:3000](http://127.0.0.1:3000). See [website setup](apps/website/README.md). The hero and toolkit videos are local and do not require database services.

- apps/api: NestJS HTTP API.
- apps/website: landing page, Google sign-in, account preferences and author/reader dashboard shells.
- apps/worker: BullMQ consumer for media cleanup and optional AI generations.
- packages/backend: shared queue infrastructure, configuration, and storage.
- packages/database: PostgreSQL schema, migrations, and Prisma Client exports.
- packages/types: domain/public API types and a separate internal jobs contract.
- packages/utils: reserved for genuinely shared utilities.

The stack is TypeScript, ESM, pnpm workspaces, Turborepo, NestJS, PostgreSQL, Prisma 7.10.0, Redis, and BullMQ.

## Setup

Use Node.js 24 (see .nvmrc) or 26 and pnpm 11.8.0. Run commands from the repository root.

```sh
npm install --global pnpm@11.8.0
pnpm install --frozen-lockfile
```

Copy apps/api/.env.example to apps/api/.env and packages/database/.env.example to packages/database/.env only if the local files do not exist. Set the same PostgreSQL DATABASE_URL in both, configure REDIS_URL, and generate a random API JWT_SECRET. Worker development reuses API settings unless overridden by apps/worker/.env. Never commit credentials.

```sh
node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
pnpm db:validate
pnpm db:generate
pnpm db:deploy
pnpm dev
```

Start your locally installed PostgreSQL and Redis 6.2+ before these steps; Docker is not required. See [native local setup and environment reference](docs/local-development.md). The API defaults to http://localhost:3002/api/v1. Set CORS_ORIGINS to the exact origin of your future client. Configuration requirements and endpoint behavior are documented in [API documentation](apps/api/README.md).

## Commands

```sh
pnpm dev
pnpm lint
pnpm typecheck
pnpm build
pnpm test
pnpm test:e2e
pnpm format:check
pnpm format
pnpm db:validate
pnpm db:generate
pnpm db:deploy
pnpm db:migrate
pnpm db:studio
```

Use db:deploy to apply committed migrations. Use db:migrate only when deliberately changing the schema and creating a development migration. Client generation does not change the database. Database builds regenerate the ignored Prisma Client before compilation.

To start the development database over, stop the API and worker, then run `pnpm db:reset` from the repository root. Prisma shows the configured database and asks for confirmation. Confirming deletes all data in its configured database schema (including users and onboarding progress), reapplies the committed migrations, and regenerates the client. It uses `DATABASE_URL` from `packages/database/.env` or the process environment; check the target before confirming. Use this only for disposable development data. No seed data is created, and uploaded files or Redis jobs are not removed. Restart the development processes and sign in again afterward.

Oxlint covers the active backend packages, with strict TypeScript checking and shared lint configuration. Prettier is the single formatter. Turbo builds dependencies before checks; unit and HTTP tests build the API as needed and use isolated persistence. CI also runs isolated database, media, queue and fake-AI regressions, dependency audit and the checked-in V1 contract comparison.

Optional PostgreSQL checks:

```sh
pnpm --filter @rawan/api test:database
pnpm --filter @rawan/api test:domain:database
pnpm --filter @rawan/api test:world:database
pnpm --filter @rawan/api test:relationships:database
pnpm --filter @rawan/api test:timeline:database
pnpm --filter @rawan/api test:plot:database
pnpm --filter @rawan/api test:organization:database
pnpm --filter @rawan/api test:search:database
pnpm --filter @rawan/api test:media:database
```

All database smoke checks require an explicit loopback TEST_DATABASE_URL and refuse production mode. Auth and domain checks use disposable schemas; they never fall back to DATABASE_URL. Run the complete matrix with pnpm --filter @rawan/api test:database:all.

The relationship, timeline, plot, organization, search, and media PostgreSQL checks require an explicitly configured `TEST_DATABASE_URL` in `apps/api/.env` or the process environment and refuse production mode. They create and remove only random isolated schemas, and require `CREATE SCHEMA` permission. See their domain documentation for API contracts and test details.

Background work uses locally installed Redis 6.2+ and the existing worker. Configure `REDIS_URL` in `apps/api/.env`, then `pnpm dev` starts API, worker, and shared package watchers. Both processes must use the same queue prefix and media storage directory. See [worker setup and verification](docs/background-jobs.md). The existing Compose file remains an optional alternative.

Private media defaults to ignored `apps/api/.data/media`. Production requires an explicit absolute `MEDIA_LOCAL_PATH` on durable storage. Uploads default to 10 MiB. Retry deletion after a cleanup failure; operators can drain crash/direct-SQL cleanup records with `pnpm --filter @rawan/api media:cleanup --confirm`. See the media report for limits and lifecycle details.

## Domain documentation

- [Part 15 cleanup and Backend V1 freeze report](docs/backend-v1-report.md)

- [Stable backend v1 API, documentation access and OpenAPI export](docs/api.md)
- [Complete public route inventory](docs/api-route-inventory.md)
- [Part 13 contract audit and verification report](docs/api-contract-report.md)
- [Part 14 backend security and release-candidate audit](docs/backend-hardening-report.md)
- [Notes and tags](docs/organization-domain.md)
- [Search and query foundation](docs/search-domain.md)
- [Media and file storage](docs/media-domain.md)
- [Background jobs and worker](docs/background-jobs.md)
- [AI backend architecture, configuration and verification](docs/ai-backend.md)

- [Manuscripts](docs/manuscript-domain.md)
- [Worldbuilding](docs/worldbuilding-core.md)
- [Relationships](docs/world-relationships.md)
- [Timelines, eras, and events](docs/timeline-domain.md)
- [Plot and story structure](docs/plot-domain.md)

Root ignore rules protect local credentials, dependencies, generated code, builds, caches, and logs. Existing database migrations must be committed. No open-source license has been selected.
