# Part 11 — Background jobs, Redis, BullMQ, and worker

Implemented and verified locally on 2026-10-05. This report is the current queue/worker contract. The Part 10 report records the earlier synchronous media foundation; stale cleanup now also runs through the background worker.

## 1. Plan executed

0. Inspected packages, existing worker, environment handling, Prisma, media cleanup, health/shutdown, tests, CI, and development configuration. The worker contained only a startup message; Redis/BullMQ infrastructure was absent.
1. Audited actual asynchronous work. Selected stale MediaCleanup reconciliation, preserving normal synchronous CRUD and deletion behavior.
2. Wrote `background-jobs-plan.md` before installing dependencies or changing application behavior.
3. Added validated Redis connection/prefix settings, a small Redis-only Compose service, BullMQ, and one compatible client. Focused configuration checks passed. Prepared an isolated Redis 8 server for local integration verification.
4. Added a separate internal contracts entry point and shared backend package. Moved the existing storage implementation into that package with API re-exports for compatibility. Shared builds/typechecks passed.
5. Added the managed API producer, schedule registration, operator commands, and separate queue readiness. Focused API tests/typechecks passed.
6. Evolved the existing worker into a lightweight typed consumer with validated configuration, Prisma adapter, structured logging, and graceful lifecycle. Worker checks passed.
7. Implemented safe internal Redis status and bounded retention. Deliberately deferred PostgreSQL BackgroundJob and public status routes because the only current job is internal maintenance.
8. Implemented the real cleanup processor using existing durable cleanup records, shared storage, live-media protection, safe error classification, and bounded execution. Processor/idempotency tests passed.
9. Added real Redis/PostgreSQL/HTTP/file integration including the actual worker entry point, retries, permanent failure, offline worker, restart, and graceful draining.
10. Completed the twenty-question review below. Fixed test queue isolation, unsafe job-name logging, scheduler registration timing, repeated schedule updates, and shutdown fallback behavior.
11. Ran root/API/worker/shared checks, existing database regressions, migration status, frozen installation, formatting, and test refusal guards.
12. Documented setup, verification, status decisions, consistency windows, and remaining operational work. No AI or frontend was implemented.

## 2. Redis architecture

`REDIS_URL` is the single connection setting, accepting redis:// and rediss://, optional credentials, and database 0–15. Invalid URLs, credentials encoding, schemes, ports, and namespaces fail safe validation. Redis is required for the worker and production API. Development API queues are disabled when REDIS_URL is absent/empty; unrelated API functionality remains usable.

One managed long-lived producer connection is reused for the maintenance queue. Worker connections are long-lived; BullMQ also owns its necessary blocking connection. There is no connection per request/job and no competing Redis client. Producer commands fail quickly when offline; workers reconnect to resume processing. Queue keys use BullMQ's prefix option, never the Redis client's keyPrefix. Defaults are rawan-development/rawan-test/rawan-production; deployments should configure distinct namespaces and match API/worker settings.

The producer uses maxRetriesPerRequest=1, enableOfflineQueue=false, two-second connect/command limits, and a three-second outer operation deadline. Worker connections use maxRetriesPerRequest=null for reconnecting consumption. These client reconnect policies are distinct from the bounded three-attempt job retry policy. The implementation follows BullMQ's [connection guidance](https://docs.bullmq.io/guide/connections) and [fail-fast guidance](https://docs.bullmq.io/patterns/failing-fast-when-redis-is-down).

Development Compose runs Redis 8.0.6, binds only loopback port 6379, persists AOF in a named volume, uses noeviction, and caps memory at 256 MiB. This is local infrastructure, not an authenticated production Redis deployment. Provision network isolation/TLS/ACLs, persistence/backups, and monitoring for production. BullMQ documents compatibility with [Redis 6.2 or newer](https://docs.bullmq.io/guide/redis-tm-compatibility/).

## 3. BullMQ architecture

One queue: `maintenance`. One job: `media-cleanup`. One scheduler identity: `media-cleanup`. All names are centralized in the internal contracts package.

Three attempts use exponential backoff starting at one second. Invalid payloads and unsafe/unsupported cleanup records throw UnrecoverableError and do not retry. Transient storage/database failures retry. Completed jobs retain at most 500 entries for up to one day; failed jobs retain at most 1,000 entries for up to seven days. Queue events retain approximately 1,000 entries; per-job logs cap at ten. BullMQ cleanup is lazy on subsequent finalization, so age retention is not a strict periodic expiration promise. See [auto-removal semantics](https://docs.bullmq.io/guide/queues/auto-removal-of-jobs).

Worker concurrency defaults to two and validates 1–10. The recurring scheduler defaults to a 60-second interval and generates subsequent runs through BullMQ; it does not require worker presence during HTTP requests. API startup registers it when Redis becomes ready, retries registration after outages, and avoids repeatedly moving an already registered schedule. Multiple API instances share the same scheduler identity. The schedule persists in Redis after API shutdown. `MEDIA_CLEANUP_SCHEDULE_ENABLED=false` prevents registration by that API; it does not remove an already existing Redis schedule.

## 4. Shared contracts

`@rawan/types/jobs` is separate from the public API types entry point. It exports centralized maintenance identities, `MediaCleanupPayload`, `MediaCleanupResult`, `MaintenanceJobName`, and runtime parsing.

Payload is exactly `{ version: 1 }`. Result is `{ removed: number }`. Extra fields, alternate versions, unknown names, arrays, and missing values fail validation. Queue payloads contain no storage paths, keys, content, credentials, arbitrary resource IDs, or user-supplied commands.

`@rawan/backend` contains connection/configuration policy, MaintenanceQueue, local storage, the storage contract, shared storage configuration, and framework-independent reconciliation/repository logic. Workspace dependencies ensure types/database/shared runtime build before API and worker. Shared packages have watch scripts for development.

## 5. API producer

JobsModule owns JobsService and one managed MaintenanceQueue. Domain services can call a specific typed enqueue method; controllers never create Redis clients. The current use case is automatically scheduled internal maintenance, plus explicit operator commands:

```sh
pnpm --filter @rawan/api jobs:cleanup enqueue --confirm
pnpm --filter @rawan/api jobs:cleanup status <returned-job-UUID>
```

Enqueue returns a generated BullMQ UUID only after successful publication. Status returns a small safe internal summary. These commands require server configuration and database access; they are not product HTTP endpoints. There is no POST /jobs or public job lookup endpoint.

`GET /api/v1/health` remains liveness. `GET /api/v1/health/queues` returns `{ status: "disabled", enabled: false }` when optional development queues are disabled, `{ status: "ready", enabled: true }` when Redis/queue access is ready, or safe 503 when unavailable. Queue readiness does not assert worker presence or full PostgreSQL readiness.

## 6. Worker

The existing `apps/worker` now has config, queues, processors, and an executable index. It is not another HTTP server. Startup loads development `.env` overrides, validates configuration, creates Prisma 7 with PrismaPg, connects PostgreSQL and Redis with bounded startup waits, and starts the maintenance consumer.

Development config precedence: process environment → worker `.env` → API `.env` fallback. Production uses process environment only. Worker does not require JWT/CORS settings. Relative local storage paths resolve from apps/api for both applications; production requires an explicit absolute path. Worker supports a validated PostgreSQL `schema` URL parameter and configures the adapter/search path consistently.

Logs are structured JSON with service/time, queue, safe job identity/type, attempt, lifecycle event, and execution duration. Errors use safe event codes rather than raw credentials, content, filesystem paths, or provider traces. Unexpected consumer-loop failure triggers shutdown with nonzero process status.

SIGINT/SIGTERM stops consumption, waits for active processing, closes worker/blocking resources, disconnects owned Redis, and disconnects Prisma. Graceful drain has a 30-second deadline with a force-disconnect fallback. Database disconnect has a five-second deadline. No unconditional process.exit() interrupts active work. Application shutdown follows BullMQ's [graceful close model](https://docs.bullmq.io/guide/workers/graceful-shutdown).

## 7. Job status

No PostgreSQL BackgroundJob model or public status API was added. Internal maintenance has no user-request/project workflow to expose, so duplicating Redis job state into PostgreSQL would add transitions and consistency windows without a current product need.

BullMQ owns QUEUED/RUNNING/COMPLETED/FAILED execution state and attempt count. The operator status command maps that state and exposes a sanitized result/error. Status expires with Redis retention; it is not a durable application audit record. IDs are BullMQ UUIDs, with no separate application Job ID in this phase.

User-facing AI/export work should add a small project-owned durable application job model and polling endpoints in its own phase. Possession of a queue ID must never become authorization. No job ownership endpoints exist now; arbitrary enqueue/status HTTP routes return 404.

## 8. First real job

The worker selects at most 100 MediaCleanup records older than one hour, ordered by createdAt/id. These already represent failed physical deletion, upload compensation, crash leftovers, or database cascades. It validates provider/key/age, refuses to delete an object still referenced by live Media, deletes the physical object, and only then removes the matching durable intent.

Fresh upload intents are protected by the existing one-hour grace period. Normal Media/project deletion remains synchronous and retryable. Recent failed deletions therefore wait until they become stale unless a client retries the original deletion. The existing `media:cleanup --confirm` direct operator fallback remains available.

Operations have three-second deadlines and batches stop starting further records after 20 seconds. A final in-progress record may extend the batch by its bounded operations. Worker database connection/statement timeouts add independent protection. Storage is the exact shared LocalStorageProvider used by the API; both processes must access the same durable volume.

## 9. Idempotency

The job assumes repeated delivery. Deleting a missing object is successful. A cleanup intent is removed only after deletion and matches ID, provider, and key. If storage deletion succeeds but PostgreSQL removal fails, the next attempt safely deletes the already missing object and finishes the record. Concurrent consumers may see the same intent; idempotent deletion plus deleteMany count keeps state correct. Re-execution after completion returns zero removals.

Generated job IDs identify executions, not business exactly-once guarantees. Retention can remove queue IDs, so correctness relies on the durable intent and idempotent processor, not permanent Redis deduplication. Valid records in a batch still process when a different record is malformed; invalid records remain for correction.

## 10. Failure handling and consistency

Redis outage produces bounded safe queue errors/readiness 503, never a fake successful publication. Unrelated API health/read/CRUD routes continue. The worker can be offline while Redis accepts jobs; waiting jobs process when it returns.

Transient failures retain affected intents and trigger at most three execution attempts. Permanent invalid payloads/provider/key/live-reference failures stop retries. Later scheduled reconciliation rediscovers pending records. Errors stored in BullMQ/status are safe generic messages; operator logs provide lifecycle codes.

PostgreSQL and Redis are not one transaction. The existing MediaCleanup table/trigger is the durable recovery source, so losing a schedule/publication is recoverable by re-registration and rescanning. No additional transactional outbox was justified for this maintenance-only flow. Producer timeout can be ambiguous if Redis accepted a command just before the response was lost; duplicate cleanup is safe. Failed jobs can age out while unresolved cleanup remains in PostgreSQL.

Promise deadlines do not cancel every underlying filesystem/database operation. A late operation may finish after the caller times out; immutable keys and idempotent deletion preserve safety. Future non-idempotent jobs need their own cancellation/delivery design. Hosts should synchronize clocks because worker age checks protect upload intents.

## 11. Database

No schema changes, constraints, indexes, or migration were added. Existing MediaCleanup, cascade-safe trigger, and metadata constraints remain the durable basis. All ten migrations are current in the local database and independently applied by disposable-schema integration tests. Prisma was not upgraded and historical migrations were preserved.

## 12. Configuration

| Variable                       | Behavior                                                                                                                             |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------ |
| REDIS_URL                      | Required for worker/production API; optional development API. redis:// or rediss://, validated database 0–15.                        |
| QUEUE_PREFIX                   | Default rawan-<NODE_ENV>; lowercase letters/digits/underscore/hyphen, 3–80 characters. Must match API/worker; unique per deployment. |
| MEDIA_CLEANUP_INTERVAL_MS      | Default 60000; integer 10000–3600000. Scheduler cadence.                                                                             |
| MEDIA_CLEANUP_SCHEDULE_ENABLED | API default true; strictly true/false. Controls registration, not existing scheduler removal.                                        |
| WORKER_CONCURRENCY             | Default 2; integer 1–10.                                                                                                             |
| TEST_REDIS_URL                 | Explicit opt-in Redis connection for real integration tests.                                                                         |
| TEST_DATABASE_URL              | Explicit test PostgreSQL connection with CREATE SCHEMA permission.                                                                   |

Existing DATABASE_URL/MEDIA_STORAGE_DRIVER/MEDIA_LOCAL_PATH are reused. API JWT/CORS validation remains unchanged. Actual local credentials were preserved. Example files and Turbo environment passthrough were updated.

## 13. Tests

- API: 246 unit tests across 15 files.
- Shared backend: 33 contract/configuration tests across two files.
- Worker: 23 configuration/processor tests across two files. Includes repeat execution, missing objects, durable removal ordering, storage/DB failure recovery, provider/key rejection, live-media protection, and mixed valid/invalid batches.
- Combined unit total: 302 across 19 files.
- Existing HTTP/e2e: 146 tests across eight files.
- Real queue integration passed against Redis 8.0.6, PostgreSQL, compiled Nest API, actual worker runtime/entry point, and temporary local storage. Covers offline waiting, producer publication, completed/status/result, exactly three transient attempts, safe failure information, later recovery, no retry for invalid payload/name/provider, fresh-intent protection, worker restart, active-job graceful close, bounded Redis outage with unrelated HTTP functionality, absence of arbitrary/public job routes, scheduler registration, and actual worker entry processing.
- All eight existing PostgreSQL domain suites passed; Media retains its 108-request real HTTP/storage test.
- Missing explicit test configuration and production mode refuse integration. Namespace cleanup is restricted to a generated checked test prefix; no FLUSHALL/FLUSHDB is used. Domain HTTP/database tests explicitly disable queue side effects to avoid touching development Redis.

The actual entry-point SIGTERM graceful path is asserted on Unix CI. Windows child-process SIGTERM uses native process termination after its test job has completed; active-job graceful draining is independently tested through the worker runtime on Windows.

## 14. CI and development

After local PostgreSQL setup and committed migrations, start your locally installed Redis 6.2+ service. Docker is optional; the existing Compose file remains available for developers who already use it. See [native setup](local-development.md).

Set REDIS_URL in `apps/api/.env` using the example; copy the worker example if overrides are needed. Keep queue prefix and storage root aligned. Then:

```sh
pnpm dev
```

Turbo starts API, worker, and shared package watchers after dependency builds. To run only the API during a Redis outage use `pnpm --filter @rawan/api dev`; development root dev expects valid worker dependencies. Production runs built API and worker as separate supervised processes with explicit environment and the same storage mount.

Run real integration with TEST_REDIS_URL and TEST_DATABASE_URL explicitly configured:

```sh
pnpm --filter @rawan/api test:jobs:integration
# Equivalent consumer-facing entry:
pnpm --filter @rawan/worker test:integration
```

CI now provides isolated Redis/PostgreSQL services, runs root unit tests including shared/worker packages, builds the worker, and executes the real queue suite. No queue tests are silently skipped. CI uses disposable service credentials, random Redis namespaces/schema names, and temporary storage. The edited GitHub workflow has been verified locally through its constituent commands; a remote GitHub Actions run was not triggered here.

## 15. Security and reliability review

| Question                         | Result                                                                                                               |
| -------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| 1. Arbitrary client enqueue?     | No public enqueue route; only specific internal maintenance methods/operator command.                                |
| 2. Another author's jobs?        | No public status route; operator status requires server access. Future product jobs need project ownership.          |
| 3. Cross-project job context?    | No user/project job API or untrusted project payload in this phase. Domain ownership regressions pass.               |
| 4. Arbitrary storage operations? | Payload has only a version; keys load from durable records and validate UUID/provider/age/live-reference protection. |
| 5. Typed payloads?               | Shared explicit payload/result/name types, no application any escape hatch.                                          |
| 6. Worker validation?            | Exact name/version/shape parser runs before business processing.                                                     |
| 7. Bounded retries?              | Three attempts; permanent failures stop immediately.                                                                 |
| 8. Idempotent processors?        | Missing-object deletion and conditional durable record removal; repeated execution tested.                           |
| 9. Duplicate corruption?         | Duplicate cleanup cannot create/delete metadata incorrectly; live references protected and immutable keys used.      |
| 10. Completed job growth?        | Count/age retention and bounded events/logs.                                                                         |
| 11. Failed retention?            | 1,000 entries/seven days; durable intents survive job retention.                                                     |
| 12. Connection reuse?            | Managed producer/consumer connections; no per-job connection creation.                                               |
| 13. Connection closure?          | API hooks, worker drain/disconnect, Prisma shutdown, integration teardown.                                           |
| 14. Safe worker shutdown?        | Active job completes before closing in integration; bounded fallback and recoverable stalled work.                   |
| 15. Hidden credentials?          | Safe config errors/status and structured event codes; raw exception paths/provider traces are suppressed.            |
| 16. Centralized names?           | Internal shared contracts entry point.                                                                               |
| 17. Isolated queues?             | Random checked test prefix passed to API/worker/raw test queue.                                                      |
| 18. Accidental Redis flush?      | No global flush; obliterate only the generated maintenance namespace after consumers close.                          |
| 19. Outage isolation?            | Safe 503 for queue readiness/operations; ordinary HTTP health/read remains 200 in real test.                         |
| 20. DB/Redis windows?            | Durable intent rescan, ambiguous enqueue handling, at-least-once safety, and retained failed work documented.        |

Issues fixed during review: existing tests could inherit development Redis settings; schedule registration initially waited for a later timer after connection readiness; repeated upserts could unnecessarily alter scheduling; a second worker.close(true) would reuse an already pending close promise, so fallback now disconnects explicitly; unknown queue names are logged as unsupported rather than arbitrary strings; live Media objects are protected from stale malformed cleanup records; unexpected consumer-loop failure triggers process shutdown.

## 16. Verification

Prisma format/validate/generate and database build passed. Migration status reports ten migrations up to date; no migration required for Part 11. Root lint has zero errors/warnings. Root typecheck, unit tests, builds, and HTTP/e2e passed. API, worker, and shared-package focused checks passed. Frozen installation, formatting, and git whitespace checks passed. Queue integration and all existing database domain regressions passed.

Frontends remain empty except `.gitkeep`. No tests were disabled/deleted, TypeScript loosened, Prisma upgraded, migrations reset/edited, actual credentials changed, or commits/pushes made.

## 17. Dependencies

| Manifest addition                                     | Reason                                                                                                       |
| ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| @rawan/backend: bullmq 6.3.11                         | Stable queue/scheduler/consumer implementation.                                                              |
| @rawan/backend: ioredis 6.0.0                         | One compatible Redis client; BullMQ 6 declares clients as optional peers, so it must be supplied explicitly. |
| @rawan/backend: @rawan/database, @rawan/types         | Shared Prisma types and internal queue contracts.                                                            |
| API: @rawan/backend                                   | Managed producer/configuration and shared storage.                                                           |
| Worker: @rawan/backend, @rawan/database, @rawan/types | Shared runtime, existing Prisma client, contracts.                                                           |
| Worker: @prisma/adapter-pg 7.10.0, pg ^8.23.1         | Correct existing Prisma 7 PostgreSQL adapter architecture.                                                   |
| Worker: dotenv ^18.0.5                                | Development worker/API environment fallback.                                                                 |
| Backend/worker: @types/node ^26.6.4, Vitest ^4.1.2    | Node types and automated tests.                                                                              |
| Backend: TypeScript ^7.0.2                            | Same compiler convention as worker/types packages.                                                           |

Existing package versions were reused where possible; no unrelated upgrades. BullMQ's transitive serializer dependencies include msgpackr-extract; its optional native build is explicitly permitted in pnpm allowBuilds. No Nest BullMQ wrapper, second Redis client, cloud SDK, AI, or frontend dependencies were added.

## 18. Future AI readiness

Future processors can add centralized names, versioned typed payload/result contracts, producer methods, and worker handlers while reusing connection management, retries, logging, shutdown, configuration, and integration-test isolation. Add project-owned durable application job/request state before exposing AI status to users. A PostgreSQL transaction/outbox or compensating publication flow must be chosen based on that workflow's guarantees. BullMQ progress can be used internally and mapped into a polling-compatible domain response; no WebSockets are required. AI providers and AI jobs were not implemented.

## 19. Remaining issues and manual actions

No known failing check or implementation blocker remains. Local development needs a compatible running Redis and REDIS_URL configured. Docker is not installed on the inspected machine; its Windows Redis server reports version 5.0.14.1. Local verification therefore used an isolated Redis 8.0.6 binary in WSL on a temporary test port, without replacing/stopping the existing server. Install/use a native Redis 6.2+ server (WSL is an option on Windows); the supplied Compose file is optional. Port conflicts with an existing Redis service must be resolved through deployment configuration.

Production requires Redis ACL/TLS/network policy, persistent Redis storage/backups, process supervision, shared durable media volume, correct filesystem permissions, and aligned API/worker namespaces. Scheduled work remains until explicitly removed from Redis; disabling registration alone does not stop an existing schedule. Redis status is retained internal operational state, not a permanent user audit trail.

Technical debt: malformed/unsupported cleanup records require operator correction and can fill a batch if many accumulate; automated quarantine/alerting is deferred. Large cleanup backlogs may justify a createdAt index/claiming strategy later. Hung underlying filesystem operations are bounded for callers but not universally cancellable. No production Redis cluster/mixed storage-provider registry, queue dashboard, durable product BackgroundJob, cancellation API, or deployment supervisor is implemented. Media scanning/quotas/rate limits remain the previously documented future work.

Pre-existing PostgreSQL regression suites still emit pg's concurrent-client-query deprecation warning and pass. The new queue suite passes without that warning. No AI/frontend/notifications/realtime work was started.
