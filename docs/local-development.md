# Native local backend setup

Docker is not required. Use Node 24 (the repository .nvmrc pins 24.21.0) or supported Node 26, and pnpm 11.8.0 from packageManager. Install PostgreSQL and Redis locally using the installer/package manager appropriate to your OS. PostgreSQL 17 is the CI baseline; PostgreSQL 18.4 was also exercised locally. Redis must be 6.2 or newer; integration verification used Redis 8.0.6. Legacy Windows Redis 5 is unsuitable. WSL with a current Redis is an option on Windows. This document does not configure a VPS or production services.

## Services and environment

Start PostgreSQL and Redis using their installed service controls; those commands depend on the OS/install method. Redis should be reachable at your configured loopback port. In a local PostgreSQL administrator session, create a development role/database and a separate test database, choosing your own password:

```sql
CREATE ROLE rawan LOGIN PASSWORD 'YOUR_LOCAL_PASSWORD';
CREATE DATABASE rawan OWNER rawan;
CREATE DATABASE rawan_test OWNER rawan;
```

Do not run creation commands against existing databases. Tests need CREATE SCHEMA on the test database, not administrative credentials. The role owns the development database so committed migration DDL can run. URL-encode credential characters in connection URLs.

From the root:

```sh
npm install --global pnpm@11.8.0
pnpm install --frozen-lockfile
```

Copy apps/api/.env.example to apps/api/.env and packages/database/.env.example to packages/database/.env only when missing. Set the same development DATABASE_URL in both. Generate JWT_SECRET with `node -e "console.log(require('node:crypto').randomBytes(48).toString('hex'))"`. Put it only in the ignored local environment file. Set REDIS_URL to the local compatible Redis. Keep AI_PROVIDER=disabled for ordinary development. Set CORS_ORIGINS to your eventual frontend's exact origin when known. Do not guess/install a frontend during backend setup.

The worker needs no separate environment file if it shares API settings. apps/worker/.env.example is an optional override template: copying it creates independent overrides, so keep its queue/storage/AI values aligned with API. Explicit process values take precedence. Development worker loads worker then API local files without overwriting earlier values; production loads process environment only. Relative media paths resolve from apps/api for both processes.

## Generate, migrate, build and run

```sh
pnpm db:validate
pnpm db:generate
pnpm db:deploy
pnpm build
pnpm dev
```

db:generate creates ignored client code without altering database state; db:deploy applies committed migrations, including on a fresh database. db:migrate is only for deliberately creating a new migration. The eleven historical migrations remain intact. Client generation is also part of database builds. No generated Prisma output should be committed.

For a clean development database, stop the API and worker and run `pnpm db:reset` from the repository root. It runs Prisma's interactive reset, reapplies all committed migrations and then regenerates the client. Verify the database/schema shown in the confirmation prompt: this deletes its users, projects, onboarding progress and other database records. The target comes from the database package's `.env` or an overriding process `DATABASE_URL`, so keep it aligned with the API. It does not seed users, remove uploaded files or clear Redis jobs. Restart the API/worker and sign in again after resetting. Never use this command against data you need to retain.

pnpm dev starts API, worker and shared watchers after dependency builds. Alternatively, after pnpm build use separate terminals with `pnpm --filter @rawan/api dev` and `pnpm --filter @rawan/worker dev`. Built process commands are `pnpm --filter @rawan/api start:prod` (the script name alone does not set NODE_ENV) and `pnpm --filter @rawan/worker start`. API is http://localhost:3002/api/v1; liveness `/health`, queue readiness `/health/queues`, development docs http://localhost:3002/api/docs. Readiness cannot guarantee a worker is consuming. Stop development processes normally with Ctrl+C.

Redis is required for the worker. An API-only development session can set REDIS_URL empty and disable scheduling; AI then stays disabled. This is not the full queue-capable workflow. No seed runs on startup, no sample ADMIN is created and production never depends on sample users.

## Configuration inventory

| Name                           | Used by / classification               | Default or rule                                                                     |
| ------------------------------ | -------------------------------------- | ----------------------------------------------------------------------------------- |
| NODE_ENV                       | API/worker, optional                   | development; development/test/production only                                       |
| DATABASE_URL                   | API/worker/Prisma CLI, required        | PostgreSQL URL; CLI loads packages/database/.env                                    |
| JWT_SECRET                     | API, required                          | Random local secret, at least 32 non-padding characters; stronger production checks |
| PORT                           | API, optional                          | 3002, integer 1–65535                                                               |
| CORS_ORIGINS                   | API, optional locally                  | Exact comma-separated origins, empty means no browser origin allowed                |
| OPENAPI_ENABLED                | API, optional                          | true in development, false in test/production; explicit true exposes docs           |
| HTTP_RATE_LIMIT_ENABLED        | API, optional                          | true outside tests; must be true in production                                      |
| HTTP_TRUSTED_PROXIES           | API, optional                          | Empty; at most 20 explicit proxy IP/non-global CIDR entries                         |
| REDIS_URL                      | API optional locally / worker required | Compatible Redis URL, database 0–15                                                 |
| QUEUE_PREFIX                   | API/worker, optional                   | rawan-NODE_ENV; identical in both processes                                         |
| MEDIA_STORAGE_DRIVER           | API/worker, optional                   | local only; this is real filesystem storage                                         |
| MEDIA_LOCAL_PATH               | API/worker, optional locally           | .data/media under apps/api; identical resolved directory                            |
| MEDIA_MAX_FILE_SIZE            | API/worker storage config, optional    | 10485760 bytes; maximum 104857600                                                   |
| MEDIA_CLEANUP_INTERVAL_MS      | API/worker, optional                   | 60000; range 10000–3600000                                                          |
| MEDIA_CLEANUP_SCHEDULE_ENABLED | API, optional                          | true; tests disable queue side effects                                              |
| WORKER_CONCURRENCY             | Worker, optional                       | 2; range 1–10                                                                       |
| AI_PROVIDER                    | API/worker, optional                   | disabled; fake explicitly development/test only                                     |
| AI_MODEL                       | API/worker, optional                   | fake-v1; no real model implemented                                                  |
| AI_REQUEST_TIMEOUT_MS          | API/worker, optional                   | 15000; range 1000–60000                                                             |
| AI_WORKER_CONCURRENCY          | API/worker, optional                   | 1; range 1–4                                                                        |
| AI_API_KEY                     | Validation guard, unsupported          | Nonempty rejected; no adapter/key fallback                                          |
| TEST_DATABASE_URL              | Database/integration tests only        | Explicit loopback PostgreSQL test URL; no DATABASE_URL fallback                     |
| TEST_REDIS_URL                 | Queue/AI integrations only             | Explicit loopback Redis; random namespaces                                          |

No obsolete runtime variable was proven removable. Derived AI_CONFIG is internal configuration, not an environment input. Turbo forwards both HTTP security settings as well as the other development process settings.

## Checks

```sh
pnpm lint
pnpm typecheck
pnpm test
pnpm test:e2e
pnpm format:check
pnpm api:openapi
pnpm --filter @rawan/api test:database:all
pnpm --filter @rawan/api test:jobs:integration
pnpm --filter @rawan/api test:ai:integration
pnpm audit
```

Set TEST_DATABASE_URL and TEST_REDIS_URL explicitly in local API environment or process configuration before infrastructure suites. Never use production mode. Disposable migrated schemas, checked Redis prefixes, temporary storage and deterministic fake AI preserve real author data. Infrastructure suites run in separate processes; importing multiple scripts into one process can retain another suite's environment settings. Paid AI calls are not required or made. Do not run a Nest rebuild concurrently with tests using compiled output.

The fresh-source verification and actual versions/results are recorded in [Backend V1 report](backend-v1-report.md). Future VPS/PM2/Caddy/TLS/backups are separate work.
