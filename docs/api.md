# Rawan backend v1 API

The HTTP contract is `/api/v1`. This reference, the [complete route inventory](api-route-inventory.md), and the generated OpenAPI document describe the backend for future client development. Both frontend directories remain empty. No client SDK is generated.

## Documentation and generation

In development, start the API and open `/api/docs`. Its JSON is `/api/docs/openapi.json`. `OPENAPI_ENABLED` accepts only `true` or `false`; it defaults to true in development and false in test/production. Explicit production opt-in exposes the documentation publicly, so keep `OPENAPI_ENABLED=false` on public production deployments unless that exposure is intended. Swagger does not persist bearer tokens. Authentication inside Swagger uses **Authorize**, with the JWT access token.

Run `pnpm api:openapi` from the root to build and export `apps/api/.data/contracts/openapi.json`. That runtime output remains ignored. Part 15 freezes the reviewed contract in [backend-v1.openapi.json](contracts/backend-v1.openapi.json); unit tests compare controller/DTO generation against that baseline. Do not automatically overwrite it to hide a failing contract check. Intentional changes require review and a compatibility/version decision. Export uses a controllers-only application; it loads no application environment file, connects to no database or Redis, starts no worker, and makes no provider call. Object keys are sorted for deterministic output. The generator's stub application is solely for documentation, never a runnable backend.

Documentation uses Nest's supported [Swagger decorators and generator](https://docs.nestjs.com/openapi/introduction). Request property metadata derives from the same class-validator decorators that validate HTTP input, including inherited and composed decorators. Explicit public response DTOs implement the shared HTTP interfaces; Prisma entities are not registered as response models.

## Authentication and ownership

Register with `POST /api/v1/auth/register` (201), then use the returned access token as `Authorization: Bearer <token>`. Login is `POST /api/v1/auth/login` (200). Emails are trimmed and lowercased; registration passwords are 12–128 characters, while login accepts 1–128 to preserve older passwords. Registration cannot assign a role. Tokens identify a user; current database role and account existence are checked on requests. There is no refresh-token, logout, or public Author CRUD endpoint.

`GET /users/me` resolves the current user. `GET /users` and `GET /users/:id` require ADMIN. ADMIN does not bypass private author/project ownership. Missing/invalid/expired credentials return 401; an authenticated user denied an explicit role operation receives 403. Missing and inaccessible private resources both return 404. References used in relationships, timeline entities, plot links, tags, media attachments and AI context must belong to the same owned project. Ownership is enforced on mutations and polling as well as reads.

## Success and request conventions

Responses are direct JSON resources, arrays, or `{ "items": [], "nextOffset": null }` pages. There is no generic `data` wrapper. Ordinary creates return 201; reads/updates return 200; deletes return 204 with no body. AI creation returns 202 and a durable generation summary. Do not parse a 204 response as JSON.

JSON body DTOs and DTO-backed query objects reject unexpected fields; nested objects are validated recursively. Routes without a query DTO do not define arbitrary filtering parameters. No implicit body type coercion is enabled. Pagination explicitly accepts decimal digit query strings and converts those fields to integers. Transformations such as trimming titles/emails and normalizing relationship type keys remain domain specific. Omitted patch fields preserve existing values. Null is permitted only where the documented schema is nullable, typically to clear optional text or references; null is not a substitute for an omitted non-nullable title or enum. Empty updates retain existing domain behavior.

Treat IDs as opaque strings. Route IDs accept 1–128 ASCII letters, digits, `_` or `-`; malformed or oversized IDs return 400 before service calls. Most domain IDs are CUIDs; AI generation IDs are UUIDs, but clients must not reinterpret other IDs as UUIDs. Timestamps are UTC ISO 8601 strings, not JavaScript Date objects. Nullable response fields are explicit null. Chronology `start`/`end` values are exact signed decimal **strings**, with up to 24 integer and 6 fractional digits, not calendar timestamps or floating-point numbers. Range endpoints validate start/end ordering and associated era containment.

Lists of scenes, events, plots, plot points and notes use summary schemas that omit large content/detail fields. Fetch the individual resource for its detail schema. AI summaries omit result/input context. Search returns bounded snippets rather than whole manuscript text. Public user responses exclude password hashes; media excludes storage keys/providers/paths; AI excludes prompts, provider credentials, context snapshots, queue/lease metadata and raw provider failures.

## Route structure

All paths below are relative to `/api/v1`; the inventory lists every operation and its request/query/response type.

| Domain        | Collection parent / individual resources                                                                                                                      |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Manuscript    | `/projects`, `/projects/:projectId/books`, `/books/:bookId/chapters`, `/chapters/:chapterId/scenes`; `/books/:id`, `/chapters/:id`, `/scenes/:id`             |
| Worldbuilding | `/projects/:projectId/characters`, `places`, `factions`, `artifacts`; individual resource by ID                                                               |
| Relationships | `/projects/:projectId/relationships`; `/relationships/:id`                                                                                                    |
| Timeline      | `/projects/:projectId/timelines`, `/timelines/:timelineId/eras`, `/timelines/:timelineId/events`; individual timeline/era/event and event entity associations |
| Plot          | `/projects/:projectId/plots`, `/plots/:plotId/points`; individual plot/point, reorder and scene/event/entity associations                                     |
| Organization  | Project notes/tags, individual notes/tags, tag assignments and resource tag lookup                                                                            |
| Search        | `/projects/:projectId/search`                                                                                                                                 |
| Media         | Project upload/list, `/media/:id`, `/media/:id/content`, media attachments and project resource attachment lookup                                             |
| AI            | `/projects/:projectId/ai/generations`, `/ai/generations/:id`                                                                                                  |
| Operations    | `/health`, `/health/queues`; no public maintenance enqueue/status endpoint                                                                                    |

## Paging, ordering and filters

Paged routes use `limit` (default 50, 1–100) and `offset` (default 0, 0–1,000,000). `nextOffset` is null at the end. No total count is promised. Offset paging can shift during concurrent writes; it is not a snapshot. Books, chapters, timelines, eras and the admin user list retain bare arrays but now accept validated limit/offset (default 50, maximum 100). These arrays have no nextOffset: increment offset by limit and stop when fewer than limit rows arrive. Plot reorder remains a bounded array of the submitted point summaries.

Sortable lists accept only each operation's documented `sort` enum and `order=asc|desc`. Unsupported fields, duplicate query arrays, negative/fractional pagination and null DTO query fields are rejected. Domain-owned allowlists select database fields. Paged domain lists retain an ID tie-breaker. When only order is supplied, the domain's default sort field is used.

| Collection                           | Default order                       | Allowed sort fields                          |
| ------------------------------------ | ----------------------------------- | -------------------------------------------- |
| Projects                             | createdAt desc, id asc              | title, createdAt, updatedAt                  |
| Characters/places/factions/artifacts | name asc, id asc                    | name, createdAt, updatedAt                   |
| Scenes                               | position asc, createdAt asc, id asc | title, position, createdAt, updatedAt        |
| Relationships                        | createdAt desc, id asc              | label, createdAt, updatedAt                  |
| Events                               | start asc, position asc, id asc     | title, start, position, createdAt, updatedAt |
| Plots/plot points                    | position asc, id asc                | title, position, createdAt, updatedAt        |
| Notes                                | updatedAt desc, id asc              | title, createdAt, updatedAt                  |
| Tags                                 | normalizedName asc, id asc          | name, createdAt, updatedAt                   |
| Media                                | createdAt desc, id asc              | createdAt, originalFilename, sizeBytes       |
| AI generations                       | createdAt desc, id asc              | fixed; optional status filter                |

`q`, where supported, is trimmed, 2–200 characters and cannot contain NUL. Text matching is case insensitive and treats SQL wildcard characters literally. World lists/scenes/events/plot points/notes support their documented tag filter. Relationships support normalized `typeKey` and paired `entityKind`/`entityId`. Event filters include era, paired entity kind/ID, tag, and inclusive `from`/`to` exact chronology bounds. Plot point lists support status. Tag/resource and media attachment lookups require the documented resource kind and ID. A filter reference outside the owned project returns 404. Plot reorder requires 1–200 items with unique IDs and unique positions, belonging to the specified owned plot.

For example, create a project with authenticated `POST /api/v1/projects` and body `{ "title": "My novel", "description": "First draft" }`. The 201 response contains its ID for nested operations. Page its characters with `GET /api/v1/projects/<projectId>/characters?limit=20&offset=0&sort=name&order=asc`; follow `nextOffset` until null. Filter timeline events with `GET /api/v1/timelines/<timelineId>/events?from=-10&to=20&entityKind=CHARACTER&entityId=<characterId>` (both entity filters together). Search with `GET /api/v1/projects/<projectId>/search?q=castle&kind=PLACE&limit=20`. Angle-bracket values are placeholders to replace with actual opaque IDs. Send the bearer header for every request in this paragraph.

Project search requires `q`, supports optional `kind` plus paging, and covers PROJECT, BOOK, CHAPTER, SCENE, CHARACTER, PLACE, FACTION, ARTIFACT, TIMELINE_EVENT, PLOT, PLOT_POINT and NOTE. It ranks exact title, title prefix, title substring, then body matches, with updatedAt descending, kind and ID tie-breakers. Each result has kind, ID, projectId, title, a snippet of at most 240 characters, and updatedAt. Search has no arbitrary client sort or global cross-author scope.

## Error contract

```json
{
  "statusCode": 400,
  "code": "VALIDATION_ERROR",
  "error": "Bad Request",
  "message": ["email must be an email"],
  "details": [{ "field": "email", "messages": ["email must be an email"] }]
}
```

`message` remains a string for ordinary failures and an array for DTO validation. `details` is optional and present for field validation, with dotted paths for nested fields (for example `context.0.id`). It contains field names/messages, never rejected values or whole objects. Consumers should branch on status/code rather than message wording or ordering.

| HTTP | Stable code                    | Meaning                                                            |
| ---- | ------------------------------ | ------------------------------------------------------------------ |
| 400  | VALIDATION_ERROR / BAD_REQUEST | Invalid DTO/route ID / domain request or association semantics     |
| 401  | UNAUTHORIZED                   | Missing/invalid credentials or deleted account                     |
| 403  | FORBIDDEN                      | Explicit role denial                                               |
| 404  | NOT_FOUND                      | Missing or inaccessible private resource                           |
| 409  | CONFLICT                       | Duplicate or conflicting domain state                              |
| 413  | PAYLOAD_TOO_LARGE              | Body or upload exceeds configured size                             |
| 415  | UNSUPPORTED_MEDIA_TYPE         | Unsupported body encoding; rejected media file types use 400       |
| 429  | RATE_LIMITED                   | HTTP budget, password-work capacity or AI quota                    |
| 503  | SERVICE_UNAVAILABLE            | Unavailable queue/storage/provider capability                      |
| 500  | INTERNAL_ERROR                 | Generic internal failure; no SQL/stack/filesystem/provider details |

Unknown failures return `message: "Internal server error"`. Queue readiness outage uses this same JSON error contract, not the successful readiness schema. A failed generation is a successful GET of a resource with status FAILED and its safe failure code; it does not turn polling into a 500. Binary stream failure before headers returns JSON 503; after headers the transfer ends and the client must treat incomplete bytes as a failed download.

## Media

Upload `POST /projects/:projectId/media` with `multipart/form-data`, exactly one field named `file`, no extra metadata/form fields. Authenticate first. Default maximum is 10 MiB; deployments can configure `MEDIA_MAX_FILE_SIZE` up to 100 MiB. Supported types are plain text, PDF, PNG, JPEG and WebP. File signatures, declared types, text content, filename safety and project ownership are checked. Invalid/unsupported files are 400; oversized files are 413. Upload returns metadata, including sanitized originalFilename, MIME, sizeBytes and SHA-256; no storage path or publicly usable URL.

`GET /media/:id/content` requires JWT ownership and returns actual bytes with the stored MIME type, Content-Length, attachment Content-Disposition and `Cache-Control: private, no-store`. It has no JSON success envelope. Use an authenticated fetch rather than assuming a public asset URL. Attachments support PROJECT, NOTE, CHARACTER, PLACE, FACTION and ARTIFACT, always within the same project. Removing an attachment does not delete the media. Deleting media or parent resources uses the existing compensating storage cleanup; transient cleanup failure can be 503. Local storage remains the implemented driver; external object storage is not implied by this contract.

## Background jobs and AI

`GET /health` returns `{ "status": "ok", "service": "rawan-api" }`. Public `GET /health/queues` returns `{ "status": "ready", "enabled": true }` or `{ "status": "disabled", "enabled": false }`, with standard JSON 503 on outage. This is readiness, not a worker completion guarantee. Maintenance enqueue/status is operator CLI only (`pnpm --filter @rawan/api jobs:cleanup`); see [job operations](background-jobs.md). No generic HTTP job polling route is introduced.

Create AI proposals with `POST /projects/:projectId/ai/generations`: `task` is BRAINSTORM, SUMMARIZE or REWRITE, instructions 1–2,000 characters, optional inputText at most 8,000 characters, and at most eight explicit `{kind,id}` context references. Kinds are SCENE, CHARACTER, TIMELINE_EVENT, PLOT_POINT and NOTE. Ownership is rechecked; provider/model/key/prompt/queue configuration is never accepted from the client. A 202 indicates durable acceptance, not completion. List that project's generation summaries or poll `GET /ai/generations/:id` for QUEUED → RUNNING → COMPLETED/FAILED. Recovery/retries can return a running task to queued. Results always carry `proposal: true`; outputs never automatically change manuscript data.

Completed details contain the bounded text result, task, truncation indicator and usage; token counts can be null when unavailable, and current fake-provider monetary cost is null. Failed details expose safe failure categories, not raw exceptions. Current quotas are five pending, 30 per hour and 200 per day per user. AI is disabled by default. The only implemented adapter is explicit fake development/test, rejected in production; no real provider or paid calls have been enabled. See [AI lifecycle/configuration](ai-backend.md).

## Freeze and compatibility

The paths, successful status/shape contracts, validation constraints/enums, summary/detail split, ownership semantics and pagination above are the backend v1 client contract. Compatible additions can extend v1; removing/renaming fields, changing success envelopes or meanings, or changing ownership rules requires an explicit migration/version decision. Clients should tolerate future additional response fields and error codes. The contract tests check current exact public field allowlists to detect accidental leaks.

Part 14 adds security bounds described below. Part 13 intentionally tightens route ID validation (malformed IDs now 400), standardizes outage JSON, adds error codes/details and ensures pre-header download failures return standard JSON. No successful resource route/envelope is renamed and no database migration is needed. Full review and verification: [Part 13 report](api-contract-report.md).

## Part 14 hardening and deployment

JSON and URL-encoded bodies are limited to 1 MiB, with compressed bodies rejected (415). Oversized bodies return 413 and malformed JSON returns safe 400; raw parser messages/bodies never leave the API. Multipart uses the independent configured file limit. Headers must arrive within 15 seconds and the request body within 60 seconds; idle keep-alive is five seconds, with at most 100 requests per socket. These are transport budgets, not AI execution timeouts.

HTTP budgets per source IP per API process are 300 requests/minute, with narrower budgets of 20 login, 10 registration, 20 uploads and 60 search requests/minute. Rejected requests count. Path case and trailing slash variations share budgets. Liveness is exempt. Budget state is capped at 10,000 entries and fails closed when full. The limit returns standard 429 plus Retry-After seconds. Native password work has an independent two-operation concurrency cap and can also return 429. Existing database-backed AI quotas still apply across replicas.

HTTP_RATE_LIMIT_ENABLED defaults true outside test and cannot be disabled in production. Tests explicitly enable it in security checks; bulk isolated regressions run with test configuration. These HTTP budgets are process local, not a distributed quota. Set aggregate edge limits before a replicated public deployment. By default forwarding headers are ignored. HTTP_TRUSTED_PROXIES can list up to 20 actual proxy IPs/non-global CIDRs; configure only the ingress addresses you control. Do not set a blanket trust-proxy boolean or expose the application to direct traffic that impersonates a trusted ingress.

Every response gets a server-generated X-Request-Id; clients cannot choose its value. CORS exposes it and Retry-After. Failure logs contain event, correlation ID, method, status and duration, without raw URLs, bodies, authorization, passwords, SQL, storage paths or manuscript text. Production loads process configuration rather than local .env files, rejects known/default/repeated signing secrets, and requires explicit HTTPS origins, supported Redis and durable absolute media storage.

Books/chapters/timelines/eras/admin user arrays are now bounded as described above. Event entity detail and each plot-point association array are limited to 1,000 rows. Queries fetch only one overflow sentinel; a larger detail returns 409 instead of silently truncating or loading an unbounded collection. Remove associations by their existing IDs before reading that resource, or plan a deliberate future association paging API. This security/correctness change and default array bounds are intentional compatibility changes for unusually large existing resources.

See the [Part 14 audit and release-candidate report](backend-hardening-report.md). Run all isolated domain/media/hardening database regressions with pnpm --filter @rawan/api test:database:all after explicitly setting a loopback TEST_DATABASE_URL; these tests do not fall back to DATABASE_URL and auth now runs inside a disposable schema too.
