# Part 13 — backend v1 contract freeze

Implemented and verified on 2026-10-05. The backend remains backend-only. Both frontend directories retain only `.gitkeep`; no SDK, UI, new product feature or Part 14 work was added. Existing uncommitted work from earlier phases was preserved.

## 1. Plan executed

The [plan](api-contract-plan.md) was written before implementation. Phases 0–2 inspected controllers/services/validators/mappers/guards, shared types, Prisma, worker/config/scripts and inventoried actual endpoints. Phases 3–6 standardized safe errors and bounded route IDs, installed compatible Swagger, added validator-derived request metadata and public response DTOs, then annotated every operation and documented conventions. Phases 7–8 added contract/HTTP/schema tests and reviewed exposure boundaries. Phases 9–10 ran repository, database and queue regressions, generated deterministic OpenAPI, and delivered the reference/inventory/report.

## 2. API audit

The audit found 113 operations across 60 paths and 20 controllers. Existing plural/nested routing and ownership checks were sound; cosmetic renames were unnecessary. No OpenAPI implementation existed. Nest error variations lacked stable codes/field detail; queue outage JSON had a separate shape; route IDs were unbounded; download stream failures bypassed normal JSON errors. Request validators and success mappers already covered most contract requirements and were retained.

Unpaginated ordered collections are intentional compatibility decisions rather than silently rewritten APIs. There is no public Author CRUD or generic maintenance job polling endpoint. Schema checks against actual media HTTP responses discovered a missing parent-deletion 503 response; documentation now includes it.

## 3. API versioning

Existing `/api/v1` remains the only product API prefix. OpenAPI info version is `1.0.0`. Documentation is separately mounted at `/api/docs`. No existing product path or method was changed. Breaking future success/ownership changes require a deliberate version or migration decision; compatible additions can stay in v1.

## 4. OpenAPI

Development documentation is `/api/docs`; JSON is `/api/docs/openapi.json`. `OPENAPI_ENABLED` defaults true only in development, false in test/production, with strict explicit boolean opt-in. Enabled production docs are publicly accessible by deliberate configuration. Swagger token persistence is disabled. HTTP bearer JWT uses security scheme `bearer`; protected methods declare it and public auth/health/readiness methods do not.

`pnpm api:openapi` exports ignored `apps/api/.data/contracts/openapi.json`. A controllers-only Nest application extracts metadata without AppModule, dotenv, database/Redis connections, storage initialization, worker startup, or provider calls. It closes after extraction. JSON key ordering is deterministic, and CI generates it after build. The generated contract has 60 paths, 113 operations and 81 schemas. Request source remains authoritative; generated JSON is not committed.

## 5. Routes

The [complete route inventory](api-route-inventory.md) records every method/path, access requirement, body/query DTO, success status and response shape. Domains include auth/users, manuscript hierarchy, four world entity kinds, relationships, timelines/eras/events/entities, plots/points/associations/reorder, notes/tags/assignments, project search, media/attachments, AI and public health/readiness. Parameter names such as `parentId` are preserved. [API reference](api.md) supplies ownership/error conventions and domain semantics alongside the per-operation OpenAPI schemas.

## 6. Request contracts

Every request/query DTO now uses `DocumentDto`, which translates its actual flattened class-validator metadata into supported Swagger property decorators, including inherited/composed validators. It carries length/numeric/array limits, patterns, enums, required versus optional, and nullability. Nested references/context/reorder use explicit class types; the original validators remain responsible for input safety. No separate hand-maintained request-schema registry or CLI plugin was added.

Existing global transform/whitelist/forbid settings remain strict. Pagination conversion stays explicit. Passwords are write-only in schemas. Reorder uniqueness and paired relationship/event filters are described; chronology retains its exact string regex and domain range validation. Route ID validation is centralized, with early reuse in the upload guard before ownership lookup or file staging.

## 7. Response contracts

Explicit Swagger DTOs implement 37 shared public interfaces, including newly introduced HTTP error/health/readiness contracts. They describe actual direct resources, ordered arrays, pages, summary/detail differences, nested associations, ISO timestamps, nullable fields and opaque IDs. AI generation ID schemas describe UUID values while generic route parameters accept opaque strings. Domain IDs are not relabeled UUIDs. Chronology is not documented as a calendar date or numeric float.

No generic success wrapper was introduced. Deletes remain bodyless 204. Public response DTOs contain no Prisma entity registration. Lists omit large scene/event/plot/point/note detail text where existing mappers do so. AI detail includes proposals/usage/safe errors but excludes input snapshots/system prompts/lease metadata. Response schema checks reject accidental undocumented field leaks in the exercised HTTP flows.

## 8. Pagination, sorting, filtering and search

Pages remain `{items,nextOffset}` with default limit 50, cap 100, offset default 0 and cap 1,000,000; no total count. Existing books/chapters/timelines/eras/admin arrays and reorder arrays remain unchanged. Allowed sort enums, asc/desc direction, default ordering and tie-breakers are documented in the reference and schemas. Offset paging is not a concurrent-write snapshot.

Text query constraints remain trimmed 2–200 characters, NUL rejected, literal SQL wildcards escaped. Tag filters, relationship type/entity filters, paired event entity filters, inclusive exact chronology bounds, plot point status, media MIME and resource lookup filters are documented. Search stays owned-project scoped, covers 12 kinds, returns snippets capped at 240 characters and preserves ranking/tie-breakers. Arbitrary client database fields or query sorting are not accepted.

## 9. Error contract

All product API exception responses now use `statusCode`, stable `code`, `error`, and `message` (string or validation string array). Field validation additionally has optional `details: [{field,messages}]`, including dotted nested paths, with no rejected object/value. Categories include validation/bad request, unauthorized, forbidden, not found, conflict, payload too large, unsupported media type, rate limited, service unavailable and internal error. Actual unsupported media rejection remains 400; 415 is a reserved category, not a behavior change.

For example: `{ "statusCode": 401, "code": "UNAUTHORIZED", "error": "Unauthorized", "message": "Unauthorized" }`. Clients should use code/status, not message wording. Unknown or 500 exceptions return generic `Internal server error`, with no raw SQL, stack, Redis, filesystem or provider details. Pre-header stream failure returns standard JSON 503; an already-started binary transfer ends and must be treated as incomplete. Failed AI resources remain 200 detail responses with safe failure fields.

## 10. Authorization contract

401 means missing/invalid credentials or revoked account; 403 means an explicit role denial; 404 covers both absent and inaccessible private resources. Admin user list/read requires ADMIN. ADMIN does not gain an author ownership bypass. Auth resolves current database role rather than trusting stale token roles. All existing project ownership and same-project reference checks remain. Existing and new HTTP/real database tests exercise these boundaries.

## 11. Media contract

Upload is authenticated file-only multipart, field `file`, with exactly one file and no extra fields. Default max 10 MiB, configurable up to 100 MiB. Supported plain text/PDF/PNG/JPEG/WebP undergo existing content/signature/MIME/filename checks. Invalid input is 400, oversized upload 413. Upload success returns safe metadata with checksum rather than a public storage URL.

Content GET returns bytes with actual MIME, length, safe attachment disposition and private/no-store cache policy. OpenAPI has binary media success content and no JSON success envelope. Pre-header failure is safe JSON; post-header failure terminates transfer. Attachments accept PROJECT, NOTE, CHARACTER, PLACE, FACTION and ARTIFACT within the owned project. Cleanup failure can be 503, including parent deletion. The real media integration passed 108 requests with JSON response schemas checked.

## 12. Background job contract

The only public queue operation remains `/health/queues`: ready/enabled true, disabled/enabled false, or standard 503. It does not promise a live worker or completed maintenance. Maintenance enqueue/polling is operator CLI only and described in [background jobs](background-jobs.md). No generic job route, arbitrary queue payload or BullMQ/lease details are exposed. Isolated real queue/worker/database/storage integration passed delivery, status, retries, failures, idempotency, restart/shutdown and outage isolation.

## 13. AI contract

Project generation create is durable 202, list returns paged summaries and detail supports owner-only polling. States are QUEUED/RUNNING/COMPLETED/FAILED with recovery/retry possible. Tasks are BRAINSTORM/SUMMARIZE/REWRITE; explicit context supports five kinds. Instruction/input/context limits remain enforced (2,000/8,000/eight), with same-project reference validation, bounded output (12,000), proposals only, truncation indicator, nullable token usage and null fake-provider cost. Safe failures do not expose provider internals. Quotas remain five pending/30 hour/200 day per user.

AI is disabled by default; only explicit development/test fake adapter exists. No production real provider or paid call was enabled. Real Redis/PostgreSQL HTTP integration passed 61 checks against response schemas, including all five context kinds, failures/retries/recovery/quotas and actual worker entry point. Full lifecycle: [AI report](ai-backend.md).

## 14. Shared types

Added and exported `ApiErrorCode`, `ApiValidationDetail`, `ApiError`, `ApiHealth` and `ApiQueueReadiness` from `packages/types/src/http.ts`. Existing public domain/AI/media interfaces remain unchanged. Response DTO properties use indexed public-interface types, and their classes implement those interfaces. Legacy exported non-HTTP types using Date remain for compatibility; documented HTTP types use ISO strings. No frontend-specific package or SDK was introduced.

## 15. Intentional compatibility changes

1. Malformed/oversized route IDs now return 400 VALIDATION_ERROR rather than proceeding to lookup/404. Accepted IDs remain opaque ASCII 1–128 strings; upload applies the same check before staging.
2. Error responses add `code`; validation adds `details`. Unknown 500 now consistently includes the error label as well as the existing generic message/status. Exact-object consumers must account for the new fields.
3. Queue readiness outage replaces its former `{status:'unavailable',enabled:true}` body with the standard 503 error body. Successful readiness stays unchanged.
4. Download pre-header stream errors replace plain failure text with standard JSON 503 and correct JSON content type. Failures after headers terminate the existing transfer.

No success resource/envelope/status/route was changed, no database migration was added, and no historical migration was edited.

## 16. OpenAPI testing

Nine focused document tests check full compiled route/source controller coverage, unique operation IDs, resolved references, public field exclusions, bearer/admin boundaries, composed/inherited validator constraints, nullable/summary/page/ID/date schemas, multipart/binary/AI 202 proposals, deterministic secret-free generation, documentation configuration and standard unknown API route errors. Eleven error/ID unit tests check categories, nested field safety and opaque bounds. Configuration tests cover development/test/production defaults, explicit opt-in and invalid boolean input.

HTTP tests cover actual 400 field details, 401, 403, 404, 409 and invalid long IDs. Media and AI integrations recursively check actual JSON responses against generated schemas, including nullable/nested/array/type/enum/required/private-field constraints. Existing domain test coverage is retained; no giant generated JSON snapshot or disabled assertions were introduced.

## 17. Security review

| Requested check                         | Finding / evidence                                                                                       |
| --------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| 1 Internal routes exposed               | No generic jobs/operator routes appear; compiled inventory tests cover actual controllers.               |
| 2 Protected routes marked/authenticated | Bearer metadata added; existing JWT guards retained.                                                     |
| 3 Public routes intentional             | Register/login/liveness/readiness only; docs are a deliberate configuration mount.                       |
| 4 Server fields mass-assigned           | Strict body/nested whitelist retained; register role and extra metadata rejected in HTTP tests.          |
| 5 Private errors consistent             | Owned lookup semantics retained; absent/foreign resources use 404.                                       |
| 6 SQL/Prisma leakage                    | Global unknown/500 filter returns generic safe JSON.                                                     |
| 7 Redis leakage                         | Queue outage normalizes to generic 503, no connection details.                                           |
| 8 Filesystem leakage                    | No paths in response DTOs; stream failures use generic JSON.                                             |
| 9 Provider leakage                      | Safe generation failure mapping retained; no raw provider exception response.                            |
| 10 Media storage keys                   | Excluded from public schemas/mappers; real response schema checks.                                       |
| 11 BullMQ internals                     | Only readiness public; operator status remains internal CLI.                                             |
| 12 System prompts/keys                  | Excluded; no client provider/key configuration accepted.                                                 |
| 13 Validation constraints               | Derived from actual validators; focused nested/inherited limits tests.                                   |
| 14 Pagination limits                    | 50 default, 100 max, million offset documented/tested.                                                   |
| 15 ID formats                           | Opaque bounded path schemas; no UUID assumption for CUID domains.                                        |
| 16 Admin routes                         | Explicit ADMIN docs plus existing role guards/HTTP 403 tests.                                            |
| 17 File limits                          | Existing byte/signature/field enforcement preserved; 108 real requests passed.                           |
| 18 AI limits                            | Existing validation/quotas preserved; isolated fake-only integration passed.                             |
| 19 Sensitive response fields            | Explicit public DTOs plus exact exercised response-schema checks.                                        |
| 20 Undocumented public routes           | All 113 product operations covered; optional docs endpoints intentionally outside the product inventory. |

This review is scoped to API contract exposure, not a claim of a complete production penetration test. No authorization, validation, integrity constraint or secret boundary was weakened.

## 18. Verification

| Check actually run                          | Result                                                                                        |
| ------------------------------------------- | --------------------------------------------------------------------------------------------- |
| Frozen pnpm install                         | Passed; lockfile current.                                                                     |
| Prisma validation/client generation         | Passed, Prisma 7.10.0 retained.                                                               |
| Local migration status                      | All 11 migrations current; no Part 13 migration.                                              |
| Root formatting/lint/typecheck/build        | Passed; final lint has zero warnings/errors.                                                  |
| Unit tests                                  | 362 passed: API 276, shared backend 58, worker 28.                                            |
| API HTTP E2E                                | 147 passed across eight suites.                                                               |
| Auth PostgreSQL                             | Passed account/profile/roles/race/deletion/rollback smoke checks.                             |
| Domain PostgreSQL                           | Manuscript, worldbuilding, relationships, timeline, plot, organization and search passed.     |
| Media PostgreSQL/HTTP                       | 108 requests passed, with OpenAPI JSON response assertions.                                   |
| Maintenance Redis/PostgreSQL/worker/storage | Passed retry/status/idempotency/shutdown/outage integration.                                  |
| AI Redis/PostgreSQL/HTTP/worker             | 61 checks passed, fake only, with response schema assertions.                                 |
| OpenAPI root export                         | Passed: 60 paths/113 operations/81 schemas, repeated output byte-identical, artifact ignored. |
| Frontend folders                            | Both contain only `.gitkeep`.                                                                 |

Database checks used existing disposable schemas/temporary accounts; queue checks used unique test prefixes and an isolated temporary Redis 8.0.6 on loopback port 16379. No production reset, queue flush or paid API call. Older database smoke scripts emit the pre-existing pg concurrent-query deprecation warning while passing; no warning is suppressed. Test resources are cleaned by their checked cleanup routines.

## 19. Dependencies

Added only direct API dependency `@nestjs/swagger` pinned `12.0.2`, compatible with the existing Nest 12/TypeScript 6 stack. No direct dependency was removed/upgraded, and Prisma remains 7.10.0. Its lockfile dependencies include mapped-types, standard-schema/spec, es-toolkit, Swagger UI and their required transitive support packages. The optional `@scarf/scarf` install telemetry script is explicitly disabled through existing pnpm allowBuilds configuration. No frontend development package was installed.

## 20. Backend v1 contract

The future client can rely on the documented product routes, success statuses/envelopes, validators/enums, timestamps/opaque IDs/nullability, summary/detail separation, paging/sort/filter/search, JWT/role/ownership semantics, media bytes/metadata, operator-only maintenance boundaries and AI proposals/polling. The [reference](api.md), [inventory](api-route-inventory.md) and offline OpenAPI remove the need to infer HTTP behavior from service code. Generated contracts and CI assertions guard subsequent changes. A contract freeze does not prevent bug fixes or claim that every future product feature exists.

## 21. Remaining issues

- **BLOCKER:** None found for this backend contract freeze. Real AI service is not promised or enabled.
- **SHOULD FIX BEFORE V1 public deployment:** Operational readiness requires a supported Redis (6.2+), durable absolute media storage, correct HTTPS CORS/secret configuration and an explicit production docs exposure choice. Existing Windows Redis 5 is unsuitable; tests used isolated Redis 8 rather than silently replacing the user's service. These deployment prerequisites do not require an API contract rewrite.
- **SHOULD FIX BEFORE V1 public deployment:** Consider authentication abuse controls/rate limiting as part of production hardening; this phase preserved current auth behavior and introduced no new feature/limiter.
- **POST-V1:** Replace the deprecated concurrent client.query pattern in older isolated smoke scripts before a future pg 9 upgrade. Current pg tests pass; no dependency upgrade was made.
- **POST-V1:** Cursor paging/unbounded array scaling, real AI provider adapters and actual usage pricing, object storage drivers, broader runtime schema coverage and a future SDK can be evaluated separately with deliberate compatibility decisions. No such work started here.

Part 13 stops here. Part 14 and frontend development have not started.
