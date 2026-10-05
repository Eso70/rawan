# Part 15 Backend V1 cleanup and frontend readiness report

Date: 2026-10-05. Source of truth: current repository through Part 14. Scope excludes frontend implementation, production deployment, infrastructure installation/provisioning and unrelated upgrades. Existing work was preserved. Written plan: [backend-v1-cleanup-plan.md](backend-v1-cleanup-plan.md).

## 1. Plan executed

| Phase                      | Completed work                                                                                                                                                              |
| -------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0 — Inspection             | Reviewed workspace/root configuration, dependencies/lockfile, CI, docs, API/shared/worker code, public types, schema/migrations, environment examples, contracts and tests. |
| 1 — Inventory              | Classified proven obsolete code, safe test doubles, development fake, runtime infrastructure and future work.                                                               |
| 2 — Plan                   | Wrote the cleanup plan before implementation edits.                                                                                                                         |
| 3 — Dead code/dependencies | Removed three unused domain interfaces and unused direct source-map-support dependency.                                                                                     |
| 4 — Fakes                  | Preserved deterministic test infrastructure and explicit development fake; confirmed disabled default/production rejection.                                                 |
| 5 — Configuration          | Fixed missing Turbo HTTP-setting forwarding, example test-variable comments and stale environment docs.                                                                     |
| 6 — Architecture           | Narrowed two overly broad storage re-exports; retained shared ownership/storage/queue/AI infrastructure.                                                                    |
| 7–8 — Contract/OpenAPI     | Checked in the reviewed V1 baseline and extended the existing deterministic contract test to compare generation with it.                                                    |
| 9 — Tests                  | Reviewed skip/only/debug/network/sleep usage; preserved meaningful unit/HTTP/DB/worker coverage and ran it.                                                                 |
| 10 — Fresh setup           | Used a clean source copy, fresh dependency installation/generated outputs, a disposable local database, native PostgreSQL/Redis and actual built API/worker processes.      |
| 11 — Handoff               | Created frontend-focused integration documentation and corrected API/readme instructions.                                                                                   |
| 12 — Frontend plan         | Created thirteen development phases based on actual backend routes and limitations.                                                                                         |
| 13 — Verification          | Ran Prisma, install, lint/types/build, unit/HTTP/domain/media/queue/AI, contracts, formatting and dependency checks.                                                        |
| 14 — Report                | This report records actual results, compatibility and remaining work.                                                                                                       |

## 2. Cleanup inventory

| Classification   | Item                                                                                                   | Reason                                                                                                                                                              |
| ---------------- | ------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| REMOVED          | User, Author, Project interfaces with Date-based timestamps from public type root                      | No repository consumers; obsolete model-shaped declarations conflicted with the JSON API boundary. ApiUser/AuthResponse/ApiProject and all other HTTP types remain. |
| REMOVED          | Direct source-map-support dev dependency                                                               | No code/test/config reference; installed Nest CLI uses Node --enable-source-maps. Frozen install/build and fresh actual startup passed without it.                  |
| REFACTORED       | Two media storage re-export modules                                                                    | Export only used LocalStorageProvider, STORAGE_PROVIDER, StorageObjectMissing and StorageProvider instead of every backend symbol. Existing import paths remain.    |
| REFACTORED       | Turbo dev environment forwarding                                                                       | HTTP_RATE_LIMIT_ENABLED and HTTP_TRUSTED_PROXIES now survive explicit process configuration.                                                                        |
| REFACTORED       | Setup/error/current-backend docs and contract baseline                                                 | Native setup, final Part 14 error meanings, public JSON types and V1 review boundary are explicit.                                                                  |
| KEPT             | Eleven migrations, all active domain models/enums, shared ownership helpers, storage/queues/AI support | Current runtime/test usage; no proven obsolete database artifact or duplicate abstraction needing a rewrite.                                                        |
| TEST-ONLY        | Unit doubles, fault injection, disposable schema/storage/Redis fixtures, documentation DI stand-ins    | Preserve safe, meaningful verification without paid APIs or real author-data cleanup.                                                                               |
| DEVELOPMENT-ONLY | FakeAiProvider                                                                                         | Explicit opt-in simulator shared by API/worker integration; disabled default, rejected in production.                                                               |
| FUTURE WORK      | Real AI adapter, association pagination, load testing, production configuration                        | Kept as explicit later work, not invented deployment scaffolding.                                                                                                   |

No active route, service, DTO, legitimate job or meaningful test was deleted merely to reduce file count. Existing optional compose.dev.yml remains unchanged; no Docker file or deployment configuration was created.

The final root formatting check also found three existing design-reference Markdown/JSON files outside the backend docs. Prettier formatting was applied without choosing a design or changing reference content; the reference directory was preserved and no frontend asset/code was created.

## 3. Dead code

Removed only the three obsolete Date/model-shaped public interfaces after confirming no imports, mapper references or tests depended on them. No unreferenced runtime module/DTO was proven safe to remove. Separate domain mappers and access helpers reflect different hierarchy/association semantics, so a broad consolidation was not justified. Storage wrappers remain as narrow import boundaries for existing API/tests rather than duplicating the implementation.

## 4. Dependencies

Removed source-map-support from API development dependencies and updated the lockfile; pnpm removed three packages from installation. No Nest/Prisma/TypeScript/BullMQ or other version upgrade was requested or performed.

Manual classification by workspace:

| Workspace      | Runtime packages retained                                                                                                                                                           | Development/tooling packages retained                                                                                         |
| -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| Root           | None                                                                                                                                                                                | Turbo workspace orchestration; Oxlint and type-aware plugin; Prettier                                                         |
| API            | Nest modules/config/JWT/Passport/Swagger/platform, Prisma adapter and workspace packages, Argon2, validation/transform, file-type/Helmet/Multer, passport/passport-jwt, pg and RxJS | Nest CLI/schematics/testing, TypeScript, relevant Node/Express/Multer/Passport/pg/Supertest types, Supertest, Vitest/coverage |
| Worker         | Workspace backend/database/types, PostgreSQL adapter/pg, dotenv                                                                                                                     | tsx watch, TypeScript, Node types, Vitest                                                                                     |
| Shared backend | Workspace database/types, BullMQ and ioredis                                                                                                                                        | TypeScript, Node types, Vitest                                                                                                |
| Database       | Prisma Client                                                                                                                                                                       | Prisma CLI, dotenv for CLI configuration, TypeScript, Node types                                                              |
| Public types   | No external runtime dependency                                                                                                                                                      | TypeScript                                                                                                                    |

Packages that appear unused to a simplistic import scan remain where justified: @nestjs/schematics is the configured Nest CLI collection; passport is required by Passport integration; RxJS is both framework infrastructure and directly used by upload interception; pg satisfies PostgreSQL adapters and real test SQL; @types packages serve compilation; coverage/watch tools are explicit optional scripts; oxlint-tsgolint supplies type-aware linting. Scoped Part 14 security overrides remain. Full and production audits report zero known vulnerabilities.

## 5. Mocks and fakes

| Item                                                   | Classification                                     | Decision                                                                                                                                                                                     |
| ------------------------------------------------------ | -------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| FakeAiProvider in shared backend                       | DEVELOPMENT-ONLY; also used in TEST-ONLY workflows | Keep explicit runtime development opt-in and actual worker integration; no production fallback. Moving it into API test-only files would break the intentional shared development simulator. |
| Mock Prisma/delegates/auth/hash/queue/storage fixtures | TEST-ONLY                                          | Keep for targeted failure/authorization/validation units and HTTP contracts.                                                                                                                 |
| Offline OpenAPI DI stand-ins                           | TEST-ONLY/documentation support                    | Keep; controllers-only generation cannot connect to live infrastructure and is not normal application startup.                                                                               |
| Temporary real local storage instances                 | TEST-ONLY directories with real provider           | Keep; integration verifies actual byte/signature/path behavior with checked cleanup.                                                                                                         |
| LocalStorageProvider                                   | RUNTIME                                            | Real configured filesystem implementation used by API and worker, not a fake.                                                                                                                |
| Native dummy authentication hash                       | RUNTIME                                            | Security timing protection for missing/passwordless accounts, not a hardcoded fake user.                                                                                                     |
| BullMQ maintenance and AI processors                   | RUNTIME                                            | Legitimate cleanup and generation jobs; no placeholder/no-op runtime job found.                                                                                                              |

No real AI provider adapter currently exists to preserve. Tests never require a paid API key. AI_API_KEY remains a rejection guard, not unused credential plumbing. No sample-user seed or insecure automatic ADMIN startup path was found.

## 6. Configuration

No actual local secret file was changed or printed. API/worker/database naming is consistent: DATABASE_URL, REDIS_URL, QUEUE_PREFIX, MEDIA_* and AI_*; shared validators enforce storage/queue/AI rules. Worker development inherits API configuration unless explicitly overridden; production uses process configuration. Added missing HTTP process pass-through to Turbo. Test example comments now describe every database suite's explicit loopback TEST_DATABASE_URL requirement; Redis example no longer implies Compose is needed.

Complete variable classification, defaults and setup: [local-development.md](local-development.md). No obsolete runtime variable was proven removable. Derived AI_CONFIG is internal; AI_API_KEY intentionally rejects unsupported nonempty credentials.

## 7. Database

No schema semantics changed, no new migration was created and no historical migration was rewritten/deleted/squashed. All eleven migrations remain current on the existing local development database and were successfully applied using db:deploy to the fresh disposable database. The Prisma client is consistently ignored and generated during setup/build; no stale client was committed.

## 8. API contract

**No HTTP API contract changed in Part 15.** Routes, operation IDs, statuses, response shapes, error codes, enum/validation/paging constraints and Part 14 abuse limits remain. The cleanup removes three unused TypeScript exports from @rawan/types; this is an intentional source-package cleanup for the unreleased backend, not an HTTP change. Future consumers must use Api* JSON contracts rather than the removed Date-based models.

Backend V1 is frozen at [contracts/backend-v1.openapi.json](contracts/backend-v1.openapi.json). Current controller/DTO generation must equal that baseline in the existing unit test. Intentional changes require explicit compatibility/version review; never automatically regenerate the baseline simply to silence a drift failure. The generated ignored .data output remains operational, while source plus reviewed baseline define the contract boundary.

## 9. OpenAPI

pnpm api:openapi passed offline generation: **113 operations, 60 paths, 81 schemas**. Auth/current user, projects, full manuscript hierarchy, all world entities, relationships, timelines/eras/events, plots/points, notes/tags, search, media, queue readiness and AI are represented. There is no public generic jobs endpoint. Contract tests passed schema reference/privacy checks, validator metadata, binary/multipart handling, opt-in docs, deterministic generation and the frozen baseline comparison.

Corrected documentation clarity without changing generated constraints: fictional chronology supports up to 24 integer digits (the pattern allows a leading digit plus 23), not the prior prose's 23; error table now includes actual body limits/unsupported encodings and HTTP/password/AI 429 categories. No hand-written replacement schemas or client SDK were generated.

## 10. Test cleanup

No intentional .skip, .only or .todo test declaration was found. A broad textual match on test.only.secret is a production signing-key rejection regex, not a skipped test. No obsolete duplicate security test was removed. Auth, cross-author and same-author cross-project isolation, storage authorization, AI context boundaries and real job idempotency tests remain. Existing short waits are bounded polling or race coordination around controlled fault/lock scenarios; no blind timeout increase or blanket sleep replacement was made.

An early HTTP run during simultaneous fresh builds/database work hit three 10-second setup-hook timeouts. Vitest marked those bodies skipped because setup failed, not because source declared skips. The subsequent full run passed all 147 with the same assertions/timeouts. The first fresh API readiness attempt also timed out under concurrent verification; an instrumented clean-copy retry passed the identical startup window without application changes. These observations do not establish a general operating-system performance diagnosis. No failure was hidden to obtain green output.

## 11. Actual tests and checks

| Actual command/check                           | Result                                                                                                                      |
| ---------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| pnpm install --frozen-lockfile                 | Passed after dependency removal; passed in fresh source copy                                                                |
| pnpm typecheck                                 | Passed all active packages                                                                                                  |
| pnpm lint                                      | Passed all five packages, zero warnings/errors                                                                              |
| pnpm test                                      | Passed **379**: API 290, shared backend 58, worker 31                                                                       |
| Compiled API Vitest e2e runner                 | Passed **147** across eight suites                                                                                          |
| node apps/api/test/database-regression.mjs     | Passed all ten auth/domain/media/hardening suites                                                                           |
| Media included in DB matrix                    | Passed **108** real HTTP requests                                                                                           |
| Hardening DB included in matrix                | Passed 16 paging checks and five isolated query plans                                                                       |
| node apps/api/test/jobs-integration.mjs        | Passed PostgreSQL/Redis/HTTP/storage/worker startup, delivery, retries, idempotency, restart, shutdown and outage isolation |
| node apps/api/test/ai-integration.mjs          | Passed **61** HTTP checks and actual fake-AI worker/queue scenarios                                                         |
| Prisma format/validate/generate/migrate status | Passed; 11 migrations current                                                                                               |
| pnpm api:openapi plus frozen comparison        | Passed, full contract unchanged                                                                                             |
| pnpm format:check; git diff --check            | Passed                                                                                                                      |
| pnpm audit; pnpm audit --prod                  | Passed, zero known vulnerabilities                                                                                          |

Counts are suite assertions and may overlap; they are not claimed as unique additive coverage. Infrastructure commands explicitly used a loopback TEST_DATABASE_URL and temporary Redis 8.0.6 on a separate port, with random schemas/prefixes and temporary storage. No paid calls, production connection, unrelated Redis flush or real media writes were used. The existing pg transaction adapter deprecation warning remains documented debt, not suppressed. Local checks do not attest that GitHub Actions ran remotely.

## 12. Build results

pnpm build passed database, public types, shared backend, API and worker. The fresh source copy independently passed its build without existing node_modules, dist, Turbo cache or generated Prisma client. Database build regenerates the client. Removal of source-map-support did not prevent real API startup. No assertion weakening, TypeScript escape, lint disabling or removed database constraint was used.

## 13. Fresh local setup

Verified on Node 26.3.1/pnpm 11.8.0, locally installed PostgreSQL 18.4 and existing native Redis 8.0.6 through WSL, without Docker. CI's PostgreSQL baseline is 17; Redis minimum remains 6.2. No service was installed or production infrastructure provisioned.

A temporary clean copy of current source excluded ignored environments/dependencies/generated/build outputs. Ran frozen install, db:validate, db:generate, db:deploy and pnpm build with a new random disposable local database. Started the actual built API with a random local secret/port and temporary storage; health, registration, bearer current user, queue readiness and live OpenAPI passed. Started the actual worker with matching configuration and AI disabled; WORKER_READY was observed. Separate real integration suites verify job processing and fake AI. Temporary processes/database/source/storage were cleaned; temporary Redis is stopped after verification.

Recommended normal flow is native services → environment examples/local credentials → frozen install → validate/generate → committed migrations → build → pnpm dev. Existing services/credentials are not overwritten. [Local setup](local-development.md) contains exact repository scripts, optional API-only mode and test configuration. Future production PM2/Caddy/VPS work remains intentionally separate.

## 14. API integration reference

[API documentation](api.md), the [route inventory](api-route-inventory.md) and the [frozen contract](contracts/backend-v1.openapi.json) describe the current backend's authentication, request limits, paging and public schemas.

## 16. Remaining backend debt

**BLOCKER:** None identified for frontend development after final verification. No known unresolved critical correctness/high-security finding.

**BEFORE DEPLOYMENT:** Future VPS/PM2/Caddy/TLS/DNS, local private PostgreSQL/Redis configuration and least-privilege credentials, durable media, backups/restore and monitoring, ingress proxy/aggregate limits and production load measurement. No such work was performed here. Handle Prisma adapter transaction compatibility before adopting pg 9. A real AI provider needs implementation and privacy/security review before enabling real production AI; the UI must handle unavailable capability meanwhile.

**POST-V1:** Embedded association pagination, advanced search/index measurements and richer telemetry; optional frontend visualization/collaboration proposals only when actually requested. Process-local HTTP limits are explicitly documented, not represented as distributed quotas. Very large details above 1000 associations return 409 and are not silently truncated.

## 17. Final cleanliness review

No unresolved TODO/FIXME/HACK/TEMP marker was found in active application/shared code or tests. Remaining meaningful keyword matches are classified:

| Remaining category/location                              | Why acceptable                                                                                                      |
| -------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| shared AI config/provider and API AI route descriptions  | Explicit fake development simulator; disabled default, production rejection, honest unavailable capability          |
| Unit/HTTP fixtures and integration fault handlers        | Test-only doubles needed for safe failure/ownership coverage                                                        |
| OpenAPI controller-only application                      | Documentation-only DI stand-ins avoid environment/infrastructure dependencies                                       |
| auth.service dummyHash                                   | Runtime security timing defense, not demo auth                                                                      |
| worker index console.log                                 | Structured operational metadata, no full user/token/prompt/connection data                                          |
| jobs/media/OpenAPI CLI console.log                       | Intentional bounded CLI result/progress output, not request debug logging                                           |
| ATTEMPTS_EXHAUSTED matches containing TEMP               | Actual safe AI failure category, not temporary code                                                                 |
| temporary storage/schema/prefix and bounded wait helpers | Safety isolation and race/retry polling, not production placeholder data                                            |
| Historical plan/report docs                              | Preserve implementation/audit history; current setup/handoff takes precedence over historical observations          |
| Empty frontend/utils placeholders                        | Intentional reserved directories, no executable frontend or fake backend                                            |
| Existing optional Compose and CI service images          | Retained prior optional test/development infrastructure; native local setup does not require it, no new Docker work |

No debug body/secret/prompt logging, hardcoded runtime author/sample project, demo HTTP route, obsolete no-op job or automatic unsafe seed was found. Scope-limited secret checks/config handling do not claim exhaustive credential attestation.

## 18. Backend V1 verdict

**RAWAN BACKEND V1 READY FOR FRONTEND DEVELOPMENT**

The current HTTP boundary is frozen and verified. Frontend development can proceed from the handoff and user's future design; production deployment and real AI remain explicit later work.
