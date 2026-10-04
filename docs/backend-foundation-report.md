# Backend foundation completion report

Completed in the existing Rawan monorepo. Prisma remains at 7.10.0 with PostgreSQL and the existing adapter. No schema or migration changes, frontend feature changes, OAuth, Redis, or new writing/worldbuilding domains were introduced. Local secrets were preserved.

## Files created

- `apps/api/.env.example`
- `apps/api/src/auth/dto/register.dto.ts`
- `apps/api/src/auth/dto/login.dto.ts`
- `apps/api/src/auth/auth.types.ts`
- `apps/api/src/auth/normalize-email.ts`
- `apps/api/src/auth/decorators/current-user.decorator.ts`
- `apps/api/src/auth/auth.service.spec.ts`
- `apps/api/src/config/configure-app.ts`
- `apps/api/src/config/environment.ts`
- `apps/api/src/config/environment.spec.ts`
- `apps/api/src/users/public-user.ts`
- `apps/api/src/users/users.service.spec.ts`
- `apps/api/test/database-smoke.mjs`
- `docs/backend-foundation-report.md`

## Files modified

- API bootstrap/health: `apps/api/src/main.ts`, `src/app.module.ts`, `src/app.controller.ts`, `src/app.controller.spec.ts`.
- API authentication: `apps/api/src/auth/auth.controller.ts`, `auth.module.ts`, `auth.service.ts`, `strategies/jwt.provider.ts`, `decorators/roles.decorator.ts`, `guards/roles.guard.ts`.
- API users: `apps/api/src/users/users.controller.ts`, `users.service.ts`.
- API tests/tooling/docs: `apps/api/test/app.e2e-spec.ts`, `vitest.config.ts`, `vitest.config.e2e.ts`, `package.json`, `README.md`.
- Formatting only: `apps/api/src/auth/guards/jwt-auth.guard.ts`, `src/database/database.module.ts`, `src/database/prisma.service.ts`, `src/users/users.module.ts`.
- Database exports/build: `packages/database/package.json`, `packages/database/src/index.ts`.
- Shared contracts/exports: `packages/types/src/index.ts`, `packages/types/package.json`.
- Workspace dependency resolution: `pnpm-lock.yaml`.
- Renamed `packages/database/prisma7.config.ts` to conventional `packages/database/prisma.config.ts`.
- Prisma-generated client and build artifacts were regenerated, not manually edited.

Removed obsolete `apps/api/src/app.service.ts`, duplicate `src/auth/strategies/jwt/jwt.ts`, and unused always-allow `src/auth/guards/jwt-auth/jwt-auth.guard.ts`.

## Architectural and security changes

Registration validates DTOs, normalizes email/name, hashes with Argon2id, explicitly fixes the role to AUTHOR, and creates User plus Author atomically. Duplicate checks and uniqueness races return 409. Login returns generic invalid-credentials errors and supports older shorter passwords. Safe auth responses include a token, its type/lifetime, and a public user.

Reusable JWT/authenticated-user types and CurrentUser replace duplicated request types. JWT verification permits HS256 and looks up the current database user/role on every protected request. Deleted accounts and role changes take effect immediately. User methods select safe fields and explicitly serialize them; shared ApiUser uses ISO timestamp strings.

Global validation rejects unknown fields without implicit type coercion. Registration passwords require 12–128 characters and a non-whitespace character; names require 1–100 trimmed characters. Startup validates PostgreSQL configuration, JWT secret length, port, environment, and CORS origins. Production requires explicit HTTPS frontend origins. Helmet supplies security headers. Production startup now uses the correct ESM output path, and database builds regenerate Prisma before compilation. The obsolete tsconfig-paths plugin/peer mismatch was removed.

## Final endpoints

| Method | Endpoint | Access |
| --- | --- | --- |
| GET | `/api/v1/health` | Public liveness |
| POST | `/api/v1/auth/register` | Public; 201 |
| POST | `/api/v1/auth/login` | Public; 200 |
| GET | `/api/v1/users/me` | Authenticated AUTHOR/ADMIN |
| GET | `/api/v1/users` | ADMIN |
| GET | `/api/v1/users/:id` | ADMIN; missing user returns 404 |

All endpoints consistently use `/api/v1`; old unprefixed routes are retired. API default port is 3002; an existing PORT setting still takes precedence. The API README contains setup, request/response contracts, and environment details.

## Verification results

| Command/check | Result |
| --- | --- |
| `pnpm --filter @rawan/database validate` | Passed |
| Prisma generation via database builds | Passed; client 7.10.0 |
| `pnpm --filter @rawan/database build` | Passed |
| `pnpm --filter @rawan/types build` | Passed |
| `pnpm --filter @rawan/api build` | Passed |
| `pnpm --filter @rawan/api test` | Passed: 29 unit tests |
| `pnpm --filter @rawan/api test:e2e` | Passed: 27 HTTP tests; final compiled-app rerun also passed |
| `pnpm --filter @rawan/api test:database` | Passed against local PostgreSQL; temporary accounts removed |
| `pnpm --filter @rawan/api lint` | Passed without warnings |
| `pnpm --filter @rawan/api exec tsc --noEmit` | Passed, including tests |
| `pnpm peers check` | Passed; no peer dependency issues |
| `pnpm build` | Passed: all six workspace packages |

HTTP tests use real Nest, validation, Passport/JWT, and Argon2 with isolated persistence. The separate live database smoke check verifies actual profiles, concurrent registration, login, role changes, deletion/cascade behavior, and PostgreSQL transaction rollback. Only random temporary test accounts were written and all were cleaned up.

## Remaining attention

A read-only audit found **one pre-existing AUTHOR account without an Author profile**, and **zero duplicate normalized-email groups**. The legacy account was left untouched; a targeted profile backfill is needed if that account should participate in author workflows. New registrations always create profiles atomically.

Before production, supply real deployment secrets and explicit HTTPS CORS_ORIGINS. Clients must use the new `/api/v1` URLs. There are no remaining build/test/lint failures.

Implementation references: [NestJS validation](https://docs.nestjs.com/techniques/validation), [NestJS CORS](https://docs.nestjs.com/security/cors), and [Prisma transactions](https://www.prisma.io/docs/orm/fundamentals/transactions).
