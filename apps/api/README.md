# Rawan API foundation

NestJS API using PostgreSQL, Prisma 7.10.0 with the PostgreSQL adapter, Argon2id, and Passport JWT. The API also implements the author-owned Project → Book → Chapter → Scene hierarchy; see [manuscript domain documentation](../../docs/manuscript-domain.md) for its routes and database smoke check.

## Setup

From the monorepo root:

```sh
pnpm install
pnpm --filter @rawan/database validate
pnpm --filter @rawan/api... build
pnpm --filter @rawan/api dev
```

Copy `apps/api/.env.example` to `apps/api/.env` and supply your local database credentials and a random JWT secret. Existing local `.env` files are preserved. The API loads its own `.env` regardless of the working directory; process environment values take precedence.

| Variable | Requirement |
| --- | --- |
| `DATABASE_URL` | Required PostgreSQL URL including a database name |
| `JWT_SECRET` | Required, at least 32 characters after excluding leading/trailing padding; generate a random secret |
| `NODE_ENV` | `development`, `test`, or `production`; defaults to `development` |
| `PORT` | Integer 1–65535; defaults to `3002` |
| `CORS_ORIGINS` | Comma-separated exact origins without paths, wildcards, or trailing slashes |

Development/test defaults allow `http://localhost:3000` and `http://localhost:3001` for the future website and app. Production requires an explicit list of HTTPS origins. Bearer authentication does not use cookies, and CORS credentials are disabled. CORS controls browser access; it does not replace authentication.

Generate a secret without embedding it in source:

```sh
node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
```

For production, configure real secrets through the deployment environment and use `pnpm --filter @rawan/api start:prod` after building. Rotating the JWT secret invalidates existing tokens. Frontend ports must be configured independently; their source is unchanged.

## Endpoints

All routes use `/api/v1`. Previous unprefixed routes are no longer served.

| Method | Path | Access | Success |
| --- | --- | --- | --- |
| GET | `/api/v1/health` | Public | 200, `{ "status": "ok", "service": "rawan-api" }` |
| POST | `/api/v1/auth/register` | Public | 201, authentication response |
| POST | `/api/v1/auth/login` | Public | 200, authentication response |
| GET | `/api/v1/users/me` | AUTHOR or ADMIN | 200, public user |
| GET | `/api/v1/users` | ADMIN | 200, public user array |
| GET | `/api/v1/users/:id` | ADMIN | 200, public user; 404 if absent |

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

Use `Authorization: Bearer <JWT>`. Tokens expire after seven days and use HS256. Protected requests look up the current user and role, so deleted accounts receive 401 and role changes apply immediately. AUTHOR access to admin routes returns 403. Public users are selected and explicitly serialized without passwords/hashes. Shared `ApiUser` and `AuthResponse` types describe the JSON contract in `@rawan/types`; the existing `User` domain type retains Date fields.

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
```

Unit tests cover registration, password hashing, duplicate races, transaction failure, login, safe user queries, and startup environment rules. HTTP tests automatically build the API and its dependencies, then exercise the compiled production Nest application with isolated persistence, real Argon2 hashing, JWT signatures, DTO validation, route ordering, role checks, safe serialization, CORS, Helmet, account deletion, and role changes. They do not require or modify a live database. These tests validate the application wiring; the database transaction itself is provided by Prisma/PostgreSQL.

`test:database` is an opt-in smoke check against the configured PostgreSQL database. It creates accounts with random test emails, verifies real profile creation, concurrent duplicate registration, login, live role changes, deletion, and transaction rollback, and cleans up those accounts in a finally block. Existing accounts are untouched. Use a development/test database for this command.
