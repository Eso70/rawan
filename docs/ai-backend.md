# Part 12 — AI backend architecture and verification

Rawan remains backend-first. Both frontend folders contain only `.gitkeep`. This implementation adds the generation pipeline, not a chat interface or autonomous editor. AI returns proposals; author content is never updated by the processor.

## 1. Plan executed

The [implementation plan](ai-backend-plan.md) was written before implementation. Phases 0–2 inspected the actual repository, audited three initial tasks and selected a compact domain model. Phase 3 added and verified a forward migration. Phases 4–6 added the provider contract, bounded authorized context and versioned prompts, with focused tests. Phase 7 connected the dedicated queue and worker with durable recovery and execution fencing. Phase 8 added authenticated validated routes. Phase 9 added usage and safe error mapping. Phase 10 added deterministic unit and real isolated database/Redis HTTP tests. Phase 11 reviewed the 20 security/privacy questions below and tightened JSON context budgets, output validation, global concurrency and error sanitization. Phase 12 verified Prisma, all packages, HTTP suites, both queue suites and existing database domains. Phase 13 delivers this report. No Part 13 product work was started.

## 2. Domain and lifecycle

`AiGeneration` belongs to Project and requested User; reads also verify Project → Author → User. UUID generation IDs also identify BullMQ jobs. State is QUEUED → RUNNING → COMPLETED or FAILED. Transient errors return to QUEUED while attempts remain. There is no cancellation or individual deletion endpoint in v1. Project/User deletion cascades the private input and proposal records; a job referring to a deleted generation becomes a no-op.

Instructions, up to 8,000 characters of supplied input, and selected resource identifiers are deliberately persisted. The worker loads current selected content, not an entire duplicated manuscript or a raw provider response. Results are normalized JSON text proposals with an explicit `proposal: true` flag and context truncation metadata. Only AiGeneration is written by AI execution.

## 3. Initial tasks

- BRAINSTORM: project-aware idea proposals; invented details should be distinguished from supplied facts.
- SUMMARIZE: faithful proposals based on supplied text or explicitly selected resources.
- REWRITE: rewritten proposals preserving meaning unless author instructions request changes.

SUMMARIZE and REWRITE require supplied text or selected content. The architecture and server prompt definitions implement these task paths. The initial fake adapter is a deterministic simulator that returns clearly labeled sample text; it does **not** perform intelligent brainstorming, summarization or rewriting.

## 4. Provider architecture and configuration

`AiProvider.generate(request, AbortSignal)` accepts normalized model/messages/output-token limits and returns text plus optional reported input/output tokens. Adapter errors use `AiFailure` with a controlled code and transient flag. `invokeProvider` enforces the configured deadline, aborts the adapter, validates output and sanitizes unknown errors. A future real adapter must honor AbortSignal; the wrapper also bounds waiting if an adapter is uncooperative.

Shared validated settings:

| Setting               | Default  | Supported values                     |
| --------------------- | -------- | ------------------------------------ |
| AI_PROVIDER           | disabled | disabled, fake                       |
| AI_MODEL              | fake-v1  | fake-v1 only for the initial adapter |
| AI_REQUEST_TIMEOUT_MS | 15000    | integer 1000–60000                   |
| AI_WORKER_CONCURRENCY | 1        | integer 1–4                          |

Fake is explicit development/test opt-in and prohibited in production. AI_API_KEY is intentionally rejected until a real adapter exists. Neither API nor worker config accepts arbitrary providers/models. Normal clients cannot override these settings. Existing non-AI functionality operates with AI disabled.

To exercise the simulator locally, set `AI_PROVIDER=fake` in the API environment (worker inherits it during development) and keep `AI_MODEL=fake-v1`. Supply the existing database and Redis settings, apply migrations, then run `pnpm dev`. If the worker has its own environment, match provider/model/queue prefix there. The API returns 503 for creation when AI is disabled or no Redis URL is configured; existing owned history remains readable.

## 5. Context architecture

Supported explicitly selected resources are SCENE, CHARACTER, TIMELINE_EVENT, PLOT_POINT and NOTE. Scene ownership follows Chapter → Book → Project; the other supported models carry projectId. Creation and execution both resolve references server-side. Missing, foreign-author and same-author foreign-project references fail. A forged persisted request with a mismatched requesting user also fails at execution.

SQL selects only bounded public story fields: project title/description, resource title and relevant text. It never selects passwords, user profiles, configuration, media storage keys or secrets. Bounds are eight unique references, 128-character identifiers, 200-character titles, 1,000-character project description, 3,500-character resource text, 2,000-character author instructions and 8,000-character supplied text. The complete serialized context JSON is limited to 32,000 characters, including JSON escaping, with truncation explicitly reported. No tokenizer or exact token-count claim is made.

Search was reviewed. Existing search remains independent; context is explicit selection, with no automatic RAG, embeddings or vector database.

## 6. Prompts

Central `AI_TASKS` definitions persist brainstorm:v1, summarize:v1 or rewrite:v1. Prompt builders construct a server-owned system policy and a structured JSON user message. Project content and supplied text remain data, including text that says “Ignore all previous instructions.” Language/style instructions remain in the author layer. The common policy preserves language, differentiates proposals from facts, acknowledges missing context and forbids canonical mutation.

There are no tools, arbitrary system prompts or database credentials in provider requests. Structured message separation reduces prompt-injection risk; it cannot guarantee a real model will always obey instructions. Plain normalized text is the supported output contract; future JSON tasks require their own schema validation.

## 7. BullMQ and worker reliability

Queue `ai`, job `generation`, payload `{version: 1, generationId: UUID}`. No manuscript or instructions are copied to Redis. API and worker use the existing Redis connection/prefix conventions. Redis job retention is bounded; PostgreSQL history remains durable until its owning project/user is deleted.

Creation commits the generation before queue publication. A temporary publication failure still returns 202 with the durable identity. API and worker periodically scan up to 20 pending/expired records every 10 seconds and publish stable job IDs. This recovers failed publication, missing Redis jobs and expired executions. Existing waiting/active/delayed jobs are kept; terminal Redis records for still-pending database rows can be replaced. Completed/failed database generations are never republished.

Three transient attempts maximum, with exponential delays starting at one second. Database attempts bound crash/republication recovery too. Permanent input/context/output/configuration errors fail immediately. An atomic database lease claims execution using database time; each write is fenced by its unique lease token. Completed or failed generations skip provider calls. Active overlapping delivery cannot claim or overwrite the generation. Expired claims can recover; a late previous execution cannot overwrite the new result. Exhausted expired claims become FAILED. BullMQ failures always store sanitized errors, including unexpected database failures.

Both per-worker and global queue concurrency use AI_WORKER_CONCURRENCY, independent of maintenance concurrency. Replicas must use consistent settings. The provider deadline is configurable; context resolution is bounded to ten seconds and leases allow an additional thirty seconds. Shutdown drains workers before disconnecting resources.

This is **not exactly-once external charging**. A crash after provider success but before a durable result, or a lost lease, can require another provider call. Future real adapters should support provider idempotency when available. HTTP retries create separate requests; creation idempotency keys are not claimed.

## 8. API and public contracts

All routes are under `/api/v1` and use JWT authentication:

| Method | Route                               | Response                                   |
| ------ | ----------------------------------- | ------------------------------------------ |
| POST   | /projects/:projectId/ai/generations | 202 summary with generation ID/status      |
| GET    | /projects/:projectId/ai/generations | summary page; limit/offset/status          |
| GET    | /ai/generations/:id                 | detail with proposal, usage and safe error |

Body: `{task, instructions, inputText?, context?: [{kind,id}]}`. Unknown properties, malformed nested objects and unsupported tasks are rejected. Lists default to 50 and cap at 100; ordering is createdAt descending then ID. Responses use no-store and deliberately omit persisted instructions, original input, references, lease tokens and raw provider objects. Public types are exported by packages/types; internal queue contracts remain in its `/jobs` subpath.

Creation locks the user row to serialize limits across replicas and projects: five pending requests, 30 per rolling hour and 200 per rolling day. Limit violations return 429. No billing/subscription system was added. Foreign project/generation/context reads return 404, unauthenticated requests 401 and malformed requests 400.

## 9. Database migration

New forward migration: `20261005070000_ai`. No historical migration changed. New enums AiTask and AiStatus; one AiGeneration table, with:

- UUID ID, projectId/requestedByUserId cascade foreign keys, controlled task/status.
- Bounded instructions/inputText/context, provider/model/promptVersion, nullable JSON result.
- Nullable inputTokens/outputTokens/errorCode; attempts and execution lease token/deadline.
- createdAt/updatedAt/startedAt/completedAt timestamps.

Indexes support project/date listing, user/date quotas and pending status/lease recovery. SQL checks enforce input lengths/context array cardinality, nonnegative token usage and attempts 0–3. Prisma generate/build succeeded, the local database has all 11 migrations, and schema diff against the configured database is empty. On another checkout/database run `pnpm db:deploy` followed by `pnpm db:generate`; generation alone does not apply migrations.

## 10. Usage and cost

Only provider-reported nonnegative integer usage is accepted. Fake usage is null, never estimated or fabricated. Tests use a deterministic contract stub reporting known token values to verify persistence. Provider/model/prompt version and timestamps are durable metadata; normal worker logs include generation ID, attempt and safe duration metadata. Cost is always null in v1; no pricing table, currency claim or billing subsystem exists. Failed attempts without usable provider usage cannot be treated as zero billed usage.

## 11. Security/privacy review

| Requested review            | Finding/control                                                 |
| --------------------------- | --------------------------------------------------------------- |
| Foreign author context      | Rejected on create and execution; all supported kinds tested    |
| Same-author foreign project | Rejected for all five kinds                                     |
| Client system override      | Unknown-property rejection; system message is server-owned      |
| Arbitrary model/provider    | Only server config; unsupported values rejected                 |
| Arbitrary jobs              | No public enqueue endpoint; strict internal payload/name parser |
| Context sizes               | SQL field bounds plus complete serialized JSON budget           |
| Output sizes                | Provider limit 2,000 tokens; server cap 12,000 characters       |
| Timeouts                    | AbortSignal and bounded provider/context waits                  |
| Retries                     | Three total database/provider attempts; permanent errors stop   |
| Duplicate jobs              | Stable identity, terminal skip, atomic lease/fenced writes      |
| Canonical writes            | Processor writes only AiGeneration                              |
| Keys                        | No initial key accepted; never read into prompt/result/log      |
| Manuscript logs             | Logs contain identifiers/status/metadata only                   |
| Environment in prompts      | Explicit field selection; requests contain task/context only    |
| Provider errors             | Normalized domain codes; safe client and Redis errors           |
| Output validation           | Nonempty text, size/NUL checks and token integer validation     |
| Trustworthy usage           | Reported values or null; no fabricated costs                    |
| Content minimization        | Explicit selected resources; no project-wide manuscript fetch   |
| Payload size                | Version plus UUID only                                          |
| Paid calls in tests         | Fake/stub only; no SDK or network provider                      |

Review fixes included JSON-escaping budget enforcement, rejecting NUL input/output, global queue concurrency and sanitizing unexpected worker exceptions before BullMQ stores them. Existing maintenance polling had a terminal metadata race: the job could finish between fetching its data and state. Terminal metadata is now refreshed; its real integration test passes.

## 12. Tests

New provider/config/prompt/job-contract tests cover deterministic fake output, language instructions, JSON injection separation, secret-name absence, disabled/production configuration, malformed responses, token mapping, timeouts/abort, rate-limit/permanent and sanitized unknown failures. Worker unit tests cover terminal/deleted/no-overlap/exhaustion behavior. API tests validate nested whitelist, text limits, pagination and safe disabled behavior.

`pnpm --filter @rawan/api test:ai:integration` builds dependencies and the worker, then uses explicit TEST_DATABASE_URL/TEST_REDIS_URL, a random PostgreSQL schema, random Redis namespace and temporary storage directory. It refuses production before touching services, never flushes Redis and removes only its validated test resources. It exercises 61 HTTP checks plus direct database/provider assertions: all five contexts, foreign author/same-author project isolation, bounded and escaping-heavy text, queue payload, offline worker, RUNNING/completion, all three tasks, result/usage, transient retry, exhausted retry, permanent and malformed output, timeout, terminal duplicate, active overlap, stale recovery/fencing, deleted/forged context, quota concurrency/hour/day, publication outage, automatic recovery, global concurrency, unsupported job and actual worker entry point. Canonical records are compared before/after. All provider calls are deterministic test code.

Existing 146 HTTP tests, real maintenance queue integration, auth database checks and all eight domain database suites also pass. Media database regression covers 108 HTTP requests. Some older pg smoke suites emit an existing concurrent-query deprecation warning; they pass.

## 13. External provider

No external provider was installed or called. No configured AI credential names were found in the local API environment. The attachment explicitly allows a fake implementation without credentials. Fake supports building and testing the architecture without credits; real intelligent output remains a deliberate next adapter task. Before adding one, verify that provider's current official API documentation, implement normalized output/errors/AbortSignal, test its HTTP/SDK boundary without network calls, and add secure key configuration. No deprecated completion API was introduced.

## 14. Verification

Prisma format, validate, generate, deploy, migration status and empty schema diff; database/types/backend/API/worker builds; root lint (zero warnings/errors), typecheck, build, formatting and frozen installation all passed. Unit tests: 341 (255 API, 58 shared backend, 28 worker), including 39 new AI tests. Existing HTTP tests: 146. AI real Redis/PostgreSQL integration: 61 HTTP checks plus worker/provider/database assertions. Maintenance queue integration, auth PostgreSQL smoke and all eight domain PostgreSQL suites passed; media included 108 HTTP requests. No development database reset, historical migration edit or real media deletion occurred.

## 15. Dependencies

No new dependency or SDK. Existing BullMQ/ioredis, Prisma/PostgreSQL adapter, NestJS validation/auth, class-transformer/class-validator and Vitest are reused. The lockfile remains compatible with frozen installation. CI now also executes the isolated fake-only AI integration against its existing PostgreSQL/Redis services.

## 16. Future client consumption

Submit the controlled body → receive durable generation ID → poll detail → wait for COMPLETED/FAILED → show proposal, usage and safe error → author explicitly decides whether to use the result through normal domain editing. A 202 during Redis outage means accepted/pending, not already processed. No automatic apply endpoint exists. No frontend was created.

## 17. Extensibility

Add task definitions and versioned validated schemas without changing queue identity. Add provider adapters behind AiProvider rather than SDK calls in controllers. Extend the bounded context resolver to other explicit resources; future retrieval/RAG can feed the same prompt contract. Streaming/SSE can observe the same generation identity later. Structured output tasks require normalized schema validation. Billing, vectors, tools and autonomous agents remain out of scope.

## 18. Remaining work and configuration

No implementation blocker remains for the fake-backed architecture. Real AI output requires a real adapter/model/key and production configuration; fake is deliberately prohibited there. Redis 6.2+ is required by BullMQ; the existing local Redis 5 service is too old. A separate temporary Redis 8 test daemon was used and stopped after verification. Configure supported Redis, the same queue prefix and AI settings in API/worker before development simulation.

Private request/result history has project/user cascade retention, with no per-generation delete or time-based retention policy yet. Exactly-once external billing and HTTP creation idempotency remain explicit future work. Provider quotas/global concurrency must be configured consistently across replicas. Context reflects current resource data at execution, and intentionally truncates large selections. No real-provider quality test or external-provider behavior claim is made. Older passing PostgreSQL tests retain their pre-existing pg deprecation warning. Work was left in the existing working tree without commit or push.
