# Rawan API foundation

Pagination, safe sorting, resource search, tag filtering, and project-wide search are documented in [search/query documentation](../../docs/search-domain.md). Part 9 changes Projects, Scenes, world entities, and Relationships from arrays to `{ items, nextOffset }` pages; scene list items omit content. The opt-in database check is `test:search:database`.

Notes, project tags, and assignments across eight resource kinds are documented in [organization domain documentation](../../docs/organization-domain.md), including both query directions and the opt-in `test:organization:database` check.

Plot planning, ordered points, atomic reorder, and scene/event/world entity associations are documented in [plot domain documentation](../../docs/plot-domain.md), including project boundaries, compact responses, and the opt-in `test:plot:database` check.

Timeline, era, event CRUD and world entity associations are documented in [timeline domain documentation](../../docs/timeline-domain.md), including exact fictional chronology strings, filtering, pagination, ownership, deletion semantics, and the opt-in `test:timeline:database` check.

NestJS API using PostgreSQL, Prisma 7.10.0 with the PostgreSQL adapter, Argon2id, and Passport JWT. The API also implements the author-owned Project → Book → Chapter → Scene hierarchy; see [manuscript domain documentation](../../docs/manuscript-domain.md) for its routes and database smoke check.

## Setup

From the monorepo root:

```sh
pnpm install
pnpm --filter @rawan/database validate
pnpm --filter @rawan/api... build
pnpm --filter @rawan/api dev
```

Copy `apps/api/.env.example` to `apps/api/.env` and supply your local database credentials and a random JWT secret. Existing local `.env` files are preserved. Development/test loads the API .env regardless of the working directory; process environment values take precedence. Production uses process environment only. See [native local setup](../../docs/local-development.md).

| Variable       | Requirement                                                                                         |
| -------------- | --------------------------------------------------------------------------------------------------- |
| `DATABASE_URL` | Required PostgreSQL URL including a database name                                                   |
| `JWT_SECRET`   | Required, at least 32 characters after excluding leading/trailing padding; generate a random secret |
| `NODE_ENV`     | `development`, `test`, or `production`; defaults to `development`                                   |
| `PORT`         | Integer 1–65535; defaults to `3002`                                                                 |
| `CORS_ORIGINS` | Comma-separated exact origins without paths, wildcards, or trailing slashes                         |

Development/test defaults allow no browser origins. Set CORS_ORIGINS explicitly when browser access is required. Production requires an explicit list of HTTPS origins. Bearer authentication does not use cookies, and CORS credentials are disabled. CORS controls browser access; it does not replace authentication.

Generate a secret without embedding it in source:

```sh
node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
```

For production, configure real secrets through the deployment environment and use `pnpm --filter @rawan/api start:prod` after building. Rotating the JWT secret invalidates existing tokens.

## Endpoints

All routes use `/api/v1`. Previous unprefixed routes are no longer served.

| Method | Path                    | Access          | Success                                           |
| ------ | ----------------------- | --------------- | ------------------------------------------------- |
| GET    | `/api/v1/health`        | Public          | 200, `{ "status": "ok", "service": "rawan-api" }` |
| POST   | `/api/v1/auth/register` | Public          | 201, authentication response                      |
| POST   | `/api/v1/auth/login`    | Public          | 200, authentication response                      |
| GET    | `/api/v1/users/me`      | AUTHOR or ADMIN | 200, public user                                  |
| GET    | `/api/v1/users`         | ADMIN           | 200, public user array                            |
| GET    | `/api/v1/users/:id`     | ADMIN           | 200, public user; 404 if absent                   |

The health endpoint is a liveness check, not a database readiness probe. The former Hello World route has been replaced. `/users/me` is declared before `/users/:id`.

Registration accepts only `email`, `password`, and `name`. Email is trimmed and lowercased (maximum 254 characters), name is trimmed (1–100 characters), and the password must be 12–128 characters with at least one non-whitespace character. Passwords are never trimmed or lowercased. Passphrases and Unicode are supported without arbitrary composition rules. Login permits existing passwords of 1–128 characters for compatibility with older accounts. Invalid input or unknown fields, including `role`, return 400.

```json
{
  "email": "author@example.com",
  "password": "a sufficiently long passphrase",
  "name": "Author Name"
}
```

Public registration explicitly creates an AUTHOR and corresponding Author profile with the supplied display name in one transaction. An existing email or a concurrent uniqueness conflict returns 409. Login accepts only `email` and `password`, and unknown accounts, passwordless accounts, and wrong passwords receive the same generic 401 message.

Both auth endpoints return:

```json
{
  "accessToken": "<JWT>",
  "tokenType": "Bearer",
  "expiresIn": 604800,
  "user": {
    "id": "<user-id>",
    "email": "author@example.com",
    "name": "Author Name",
    "role": "AUTHOR",
    "createdAt": "<ISO-8601 timestamp>",
    "updatedAt": "<ISO-8601 timestamp>"
  }
}
```

Use `Authorization: Bearer <JWT>`. Tokens expire after seven days and use HS256. Protected requests look up the current user and role, so deleted accounts receive 401 and role changes apply immediately. AUTHOR access to admin routes returns 403. Public users are selected and explicitly serialized without passwords/hashes. Shared `ApiUser` and `AuthResponse` types describe the JSON contract in `@rawan/types`. All frontend contracts use JSON timestamp strings.

Author-owned modules must derive ownership from `CurrentUser().userId` and scope database queries to that user's Author profile. A role check alone does not establish ownership; never trust an owner ID submitted by the client. Manuscript, worldbuilding, and relationship queries enforce author ownership.

The bootstrap uses Nest's built-in logging, Helmet, a strict global ValidationPipe, the `/api/v1` prefix, and shutdown hooks that disconnect Prisma. The application does not intentionally log request bodies, passwords, JWTs, or connection strings. The global exception filter returns the stable statusCode/code/error/message/details error contract; unhandled failures return generic 500. Successful responses have no generic envelope. See [API documentation](../../docs/api.md) for request limits, paging and integration rules.

Case-insensitive authentication lookups support older mixed-case emails without changing existing data. Existing users are not automatically given missing Author profiles. This change does not rewrite accounts or migrations.

## Prisma and builds

The conventional `packages/database/prisma.config.ts` replaces `prisma7.config.ts`. Prisma remains pinned to 7.10.0. Database builds regenerate the client before compiling, and package exports explicitly identify ESM and type declaration entry points. The existing schema and migrations are unchanged. No Prisma 8 upgrade is required.

```sh
pnpm --filter @rawan/database validate
pnpm --filter @rawan/database generate
pnpm --filter @rawan/database build
pnpm --filter @rawan/types build
pnpm --filter @rawan/api build
pnpm build
```

The API build requires its shared packages to be built first; `pnpm --filter @rawan/api... build` handles that order. Production starts at `dist/main.js`.

## Tests

```sh
pnpm --filter @rawan/api test
pnpm --filter @rawan/api test:e2e
pnpm --filter @rawan/api test:database
pnpm --filter @rawan/api lint
pnpm --filter @rawan/api exec tsc --noEmit
pnpm test
pnpm test:e2e
pnpm format:check
```

Root test commands build required packages automatically. Root Oxlint and Prettier configuration provide lint and formatting; the API retains its established single-quote style.

Unit tests cover registration, password hashing, duplicate races, transaction failure, login, safe user queries, and startup environment rules. HTTP tests automatically build the API and its dependencies, then exercise the compiled production Nest application with isolated persistence, real Argon2 hashing, JWT signatures, DTO validation, route ordering, role checks, safe serialization, CORS, Helmet, account deletion, and role changes. They do not require or modify a live database. These tests validate the application wiring; the database transaction itself is provided by Prisma/PostgreSQL.

`test:database` is an opt-in smoke check against the configured PostgreSQL database. It creates accounts with random test emails, verifies real profile creation, concurrent duplicate registration, login, live role changes, deletion, and transaction rollback, and cleans up those accounts in a finally block. Existing accounts are untouched. Use a development/test database for this command.

## Background queues

The API owns one managed BullMQ maintenance producer. Configure REDIS_URL and the same QUEUE_PREFIX/MEDIA_LOCAL_PATH as the worker. Redis is required in production; development API queues are disabled when REDIS_URL is absent. Stale media cleanup runs through the worker while normal CRUD/deletion remains synchronous.

GET /api/v1/health remains liveness. GET /api/v1/health/queues returns disabled/ready or safe 503; it does not assert worker presence. No public arbitrary-job enqueue/status endpoints exist.

See [queue architecture, setup and verification](../../docs/background-jobs.md) for operator commands, configuration, retention, tests and failure semantics.
