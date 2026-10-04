# Rawan engineering baseline

Audit and verification completed on 2026-10-04. This work prepares the existing monorepo for feature development without implementing product features.

## Existing dependencies and architecture

All requested backend libraries were already present in `apps/api`: `class-validator`, `class-transformer`, `helmet`, `@nestjs/config`, `@nestjs/passport`, `passport`, `passport-jwt`, `@nestjs/jwt`, `argon2`, `@prisma/adapter-pg`, `pg`, and the `@rawan/database` workspace dependency. Authentication JSON contracts use `@rawan/types`.

The API already uses NestJS, Vitest, Supertest, and Oxlint with TypeScript-aware linting. The frontends use Next.js 16.3.8, React 19.2.8, Tailwind CSS 4, and their existing ESLint configurations. Prisma CLI and Client are pinned to 7.10.0. PostgreSQL remains the database. TypeScript strict mode is enabled in every active package.

The database package owns schema, migrations, client generation, and exports. The types package holds existing domain types and public API contracts. JWT and authenticated-request types remain local to the API. The UI and utilities directories are empty reserved directories, with no fabricated package architecture. The worker remains a startup placeholder.

## Dependency changes

No new libraries or package versions were introduced. The lockfile's resolved package graph is unchanged; only workspace importer entries changed.

- Moved existing Oxlint 1.86.0, oxlint-tsgolint 7.0.2003, and Prettier 3.9.9 from API development dependencies to root development dependencies so workspaces can share the existing tools.
- Moved database `dotenv` to development dependencies because it is used by the Prisma CLI configuration, not the exported database runtime.
- Pinned `@prisma/adapter-pg` to exactly 7.10.0, matching the existing installed version and Prisma CLI/Client pins.
- Retained existing framework, compiler, driver, testing, and deployment dependencies conservatively; performed no mass upgrades.

Redis/ioredis, BullMQ, Kafka, Elasticsearch, OpenAI SDK, LangChain, Python/FastAPI, Socket.IO/WebSockets, Yjs, Tiptap, tldraw, React Flow, dnd-kit, Howler, storage/R2 SDKs, monitoring stacks, Playwright, and Cypress were not installed. None is needed by the current foundation.

## Bootstrap, authentication, and environment audit

Existing behavior was verified and retained:

- Global ValidationPipe transforms explicit DTO classes, whitelists fields, rejects extra fields, and avoids implicit type coercion.
- Helmet, exact-origin CORS, `/api/v1`, and graceful shutdown hooks are configured. Bearer authentication uses no cookies; CORS credentials are disabled.
- Startup validates PostgreSQL `DATABASE_URL`, a non-padding JWT secret of at least 32 characters, environment mode, port, and frontend origins. Production requires explicit HTTPS origins.
- Environment examples match current requirements. Local environment files and secrets were preserved and remain ignored.
- Registration normalizes email/name, validates email and reasonable lengths, hashes passwords with Argon2id, forces AUTHOR, and creates the Author profile transactionally.
- Password hashes are excluded from public serialization. Duplicate registration returns 409, including concurrent unique-constraint failures. Invalid credentials receive the same generic 401 response.
- HS256 JWTs use the configured secret. Protected requests load the current account and role, so deletion and demotion apply to existing tokens.
- Role guards protect admin user routes. API documentation now describes server-derived ownership and scoped queries for future modules; no ownership features were implemented.
- Public health remains `GET /api/v1/health`, returning only status and a fixed service label. It is a liveness check, not a readiness probe.
- Nest's built-in logging and standard response/exception behavior remain in place. No response wrapper or observability framework was added. Application code does not intentionally log passwords, tokens, request bodies, or connection strings.

No bootstrap or authentication rewrite was necessary because the current implementation already satisfies the requested baseline.

## Tooling and developer setup

- Added root `format` and `format:check`, using the existing Prettier formatter with centralized configuration and generated/local-file exclusions. API single quotes and frontend double quotes are preserved.
- Centralized Oxlint configuration and made explicit `any` and floating promises errors. Added lint commands for the worker and handwritten database/types code; root lint now covers all six active packages.
- Turbo lint inputs include the root Oxlint configuration, preventing stale lint cache results after rule changes.
- Added root `test`, which builds the API and dependencies before unit tests. Added root `test:e2e`. Test results are not cached. Unit tests do not trigger unrelated frontend builds.
- Added database package `studio` and root `db:studio`.
- CI now checks formatting and uses the root unit-test command. Existing lint, typecheck, build, Prisma validation, and isolated HTTP tests remain.
- Updated README setup, package responsibilities, current website status, formatting commands, and test behavior. Existing root dev/build/typecheck and migration commands remain intact.

Fresh setup: install the pinned pnpm version, run frozen installation, copy the two environment examples without overwriting existing files, configure local PostgreSQL and a random JWT secret, validate/generate Prisma, deploy committed migrations, then run `pnpm dev`. Database builds also regenerate the client automatically. No schemas or migrations were changed.

## Verification results

| Check                                       | Result                                                                                                                                   |
| ------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm install --frozen-lockfile`            | Passed before and after dependency relocation                                                                                            |
| `pnpm db:validate`                          | Passed                                                                                                                                   |
| `pnpm db:generate`                          | Passed; Prisma Client 7.10.0                                                                                                             |
| `pnpm --filter @rawan/database build`       | Passed                                                                                                                                   |
| `pnpm lint`                                 | Passed across six packages; no reported warnings/errors                                                                                  |
| `pnpm typecheck`                            | Passed across six packages                                                                                                               |
| `pnpm build`                                | Passed across six packages                                                                                                               |
| `pnpm test`                                 | 29 unit tests passed across four files                                                                                                   |
| `pnpm test:e2e`                             | 27 HTTP tests passed                                                                                                                     |
| `pnpm --filter @rawan/api test:database`    | Passed against the configured local development PostgreSQL; temporary accounts cleaned up                                                |
| `prisma migrate status` in database package | Existing migration applied; schema up to date                                                                                            |
| `pnpm format:check`                         | Passed                                                                                                                                   |
| `pnpm dev`                                  | Website, author starter, worker, and API started; API compiled with zero errors and health returned OK; test processes stopped afterward |
| `pnpm db:studio --help`                     | Resolved the Studio CLI correctly; interactive Studio was not launched                                                                   |
| `git diff --check`                          | Passed                                                                                                                                   |

Checks ran locally on Node 26.3.1 and pnpm 11.8.0. CI configuration was updated but has not been pushed or run remotely as part of this task. No external-service limitation prevented verification.

## Files changed

New: `.oxlintrc.json`, `.prettierrc.json`, `.prettierignore`, and this report.

Functional/tooling/documentation changes: root `package.json`, `turbo.json`, `pnpm-lock.yaml`, `README.md`, `.github/workflows/ci.yml`, `apps/api/package.json`, `apps/api/README.md`, `apps/worker/package.json`, `packages/database/package.json`, `packages/database/prisma.config.ts`, and `packages/types/package.json`.

Removed local copies of shared configuration: `apps/api/.oxlintrc.json` and `apps/api/.prettierrc`.

Formatting only: `pnpm-workspace.yaml`, `apps/api/nest-cli.json`, `apps/api/tsconfig.json`, `apps/api/tsconfig.build.json`, `apps/app/package.json`, `apps/website/package.json`, `apps/worker/src/index.ts`, `apps/worker/tsconfig.json`, `packages/database/src/index.ts`, `packages/database/tsconfig.json`, `packages/types/src/index.ts`, and `packages/types/tsconfig.json`. Some differences are line-ending normalization. No frontend page or product behavior changed.

## Remaining technical debt

- Authentication has no abuse/rate limiting yet. Decide and configure protection before exposing public auth endpoints broadly; no future dependency was added for it here.
- Legacy mixed-case email records and users without Author profiles are supported or documented, but no backfill/data rewrite was performed. Historical case-insensitive duplicate accounts need review before a future normalization migration.
- Existing compiler and Node type-package versions differ across workspaces, and the installation reports the existing ESLint 9 deprecation warning. Their checks pass; coordinated upgrades should be a separate task.
- No open-source license has been selected. Deployment/readiness/operational policies remain separate work; the health endpoint intentionally reports liveness only.

No projects, books, scenes, characters, maps, AI, collaboration, jobs, author workspace, OAuth, or refresh-token features were implemented.
