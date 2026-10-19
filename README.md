# Rawan backend

The [expanded backend](docs/backend-horizon-2.md) now implements the approved Horizon 2 scopes around works, releases, readers/libraries, creator identities, structured prose/research, preferences, maps/canvases, imported comics, processing and exports. The original manuscript APIs remain compatible; Horizon 3 stays deferred. This implementation adds no frontend changes.

**Rawan is a platform around the creation, organization, exploration, and experience of books and literary works.**

It serves creators and readers within one ecosystem centered on the work. Writing, research, worldbuilding, media, publishing, reading and libraries contribute to that purpose according to each work's needs.

All expanded-product recommendations use the [mandatory product horizons and feature register](docs/product-horizons.md): H1 is supported current scope, H2 requires additional backend/product work, and H3 remains long-term research. The register records support, gaps, frontend/data implications and ADR requirements; research diagrams are not implemented functionality.

Its original backend V1 supports authentication, owned projects/manuscripts/worldbuilding, relationships, timelines, plots, notes/tags, search, private media, background cleanup and proposal-only AI infrastructure. The expanded backend adds the work-centered creator and reader capabilities listed above. AI remains disabled by default, with a development/test simulator and an optional explicitly configured production text adapter.

The creative work is the connecting product concept, rather than a collection of separate tools. See the [work-centered product architecture](docs/work-centered-product-architecture.md) for the relationship between private projects, work identity, supporting content, releases and reader experiences.

Public release snapshots, reader libraries/progress and imported-comic structures are now supported by the backend. Author/reader experience preferences do not change authorization roles. See the [current implementation guide](docs/backend-horizon-2.md) for delivered behavior and limits; the [original capability audit](docs/product-scope-and-backend-capabilities.md) preserves the research baseline.

Rawan's two experiences are **Create** and **Experience**. The [backend bridge investigation](docs/create-and-experience-bridge.md) explains the product relationship; explicit immutable releases now connect private creative works to approved reader content without exposing drafts.

The [works, projects and content types investigation](docs/works-projects-and-content-types.md) explains the generic and prose-oriented parts of the current hierarchy, recommended UI terminology and an evolutionary path for broader literary formats.

Comic creation and reading are investigated separately in [comic product research](docs/comics-product-research.md) and [comic backend implications](docs/comics-backend-implications.md). Imported artwork, pages/scripts, authored panels/spreads and reader manifests are implemented in the backend; native drawing and advanced distribution remain deferred.

The [dedicated reader experience research](docs/reader-experience-research.md) covers calm prose presentation, personalization, responsive navigation, accessibility and the future backend required for reliable reading state.

The [library system research](docs/library-system-research.md) distinguishes My Library, creator Projects/Manuscripts, Discover and References, with browsing and performance recommendations for future development.

The [book and work identity gap analysis](docs/book-and-work-identity-gap-analysis.md) compares future metadata with current database/API support and separates source manuscripts, work identity, editions/releases and reader state.

The [discovery experience research](docs/discovery-experience-research.md) proposes literature- and creator-centered browsing, with explicit future boundaries for recommendations, trending and public search.

The [creator identity research](docs/creator-identity-research.md) distinguishes private accounts, public profiles and pen-name identities, including an evolutionary path for multiple identities without changing current project ownership.

The [optional worldbuilding and workspace research](docs/optional-worldbuilding-and-workspaces.md) proposes progressive disclosure and reversible tool arrangements, preserving a simple writing path without forcing worldbuilding onto every project.

The [expanded information architecture study](docs/expanded-information-architecture-study.md) compares long-term structures and recommends Create, My Library and Discover as a navigation hypothesis, with contextual reading and Account utility navigation.

The [visual identity across modes study](docs/visual-identity-across-modes.md) defines shared foundations and task-specific presentation for creation, writing, world organization, reading, library, discovery and comics without imposing one page template.

The [customization and preference scopes study](docs/customization-and-preference-scopes.md) separates creator, reader and global choices, with account/context/device/session ownership, precedence and future synchronization boundaries.

## Structure

The root landing page can be previewed separately with `pnpm dev:website` at [http://127.0.0.1:3000](http://127.0.0.1:3000). See [website setup](apps/website/README.md). The hero and toolkit videos are local and do not require database services.

- apps/api: NestJS HTTP API.
- apps/website: landing page, Google popup/email sign-in, verified email signup, empty authenticated workspace and reader dashboard shell.
- apps/worker: BullMQ consumer for media cleanup and optional AI generations, plus durable artwork/export processing.
- packages/backend: shared queue infrastructure, configuration, storage, text-provider adapter and artifact rendering.
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

Copy apps/api/.env.example to apps/api/.env.local and packages/database/.env.example to packages/database/.env.local only if the local files do not exist. Set the same PostgreSQL DATABASE_URL in both, configure REDIS_URL, and generate a random API JWT_SECRET. Worker development reuses API settings unless overridden by apps/worker/.env. Never commit credentials.

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

To start the development database over, stop the API and worker, then run `pnpm db:reset` from the repository root. Prisma shows the configured database and asks for confirmation. Confirming deletes all data in its configured database schema (including users and onboarding progress), reapplies the committed migrations, and regenerates the client. It uses `DATABASE_URL` from `packages/database/.env.local` or the process environment; check the target before confirming. Use this only for disposable development data. No seed data is created, and uploaded files or Redis jobs are not removed. Restart the development processes and sign in again afterward.

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

The relationship, timeline, plot, organization, search, and media PostgreSQL checks require an explicitly configured `TEST_DATABASE_URL` in `apps/api/.env.local` or the process environment and refuse production mode. They create and remove only random isolated schemas, and require `CREATE SCHEMA` permission. See their domain documentation for API contracts and test details.

Background work uses locally installed Redis 6.2+ and the existing worker. Configure `REDIS_URL` in `apps/api/.env.local`, then `pnpm dev` starts API, worker, and shared package watchers. Both processes must use the same queue prefix and media storage directory. See [worker setup and verification](docs/background-jobs.md). The existing Compose file remains an optional alternative.

Private media defaults to ignored `apps/api/.data/media`. Production requires an explicit absolute `MEDIA_LOCAL_PATH` on durable storage. Uploads default to 10 MiB. Retry deletion after a cleanup failure; operators can drain crash/direct-SQL cleanup records with `pnpm --filter @rawan/api media:cleanup --confirm`. See the media report for limits and lifecycle details.

## Domain documentation

- [Rawan frontend design system: tokens, components, page references and verification](docs/design-system/README.md)

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

## Frontend onboarding

The authenticated onboarding implementation and local/manual test instructions are documented in [Rawan onboarding](docs/onboarding-guide.md). [Parts 8–10 verification](docs/onboarding-finalization-parts-8-10.md) records final UX and QA results; no author or reader dashboard is included.
