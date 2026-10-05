# Part 14 release-candidate backend audit

Audit date: 2026-10-05. Scope: existing backend through Part 13. Plan: [backend-hardening-plan.md](backend-hardening-plan.md). Existing work was preserved; no frontend or Part 15 work, production resets, paid AI calls, migration rewrites, commits or pushes.

## 1. Plan executed

Phases 0–2 inspected source, schema, migrations, infrastructure, contracts, tests and dependencies, and wrote the risk inventory before implementation. Phase 3 hardened authentication and abuse controls. Phase 4 reviewed ownership across domains. Phase 5 reviewed SQL integrity, concurrency and cascades. Phases 6–7 bounded HTTP and collection work and inspected actual query plans. Phases 8–10 reviewed media, queues, worker and AI with real infrastructure regressions. Phase 11 added safe operational metadata and audited secrets/dependencies. Phase 12 closed test and CI gaps. Phase 13 ran the verification below; phase 14 records this report.

Discoveries after the initial plan: embedded timeline/plot association reads needed bounds; worker shutdown needed independent cleanup attempts; HTTP test fixtures repeatedly opened listeners; trusted proxies needed explicit IP/CIDR validation. PostgreSQL's deprecation warning was traced to Prisma's transaction adapter rather than attributed solely to test scripts.

## 2. Risk inventory

No confirmed CRITICAL vulnerability. All identified HIGH findings were resolved. Severity refers to the original finding, not residual severity.

| Severity | Problem and risk                                                                                                                                | Fix                                                                                                                | Evidence                                                                                    |
| -------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------- |
| HIGH     | Unlimited authentication traffic/native password work could exhaust CPU and memory; production accepted obvious long example/repeated JWT keys. | Bounded request budgets, two concurrent password operations, explicit Argon2 settings, production secret checks.   | Auth/config/security units and real HTTP throttling.                                        |
| HIGH     | Older database tests implicitly selected development configuration and auth wrote to public schema.                                             | Explicit loopback TEST_DATABASE_URL, production refusal, isolated migrated auth schema, checked cleanup.           | Three fail-closed subprocess tests; all ten database suites.                                |
| HIGH     | Full dependency audit found vulnerable deployment-tool/Prisma CLI transitives.                                                                  | Removed unused deploy helper; scoped patched deepmerge-ts/mysql2 overrides.                                        | Frozen install, full and production audits zero vulnerabilities; Prisma/build/tests passed. |
| MEDIUM   | Five legacy arrays and embedded association reads were unbounded.                                                                               | Default 50/max 100 limit-offset arrays; association queries take 1001 and reject overflow above 1000.              | Real database pagination, detail-bound units, generated contract assertions.                |
| MEDIUM   | AI summary list loaded private context/instructions/result needlessly.                                                                          | Explicit summary-only Prisma selection.                                                                            | Selection unit and AI HTTP integration.                                                     |
| MEDIUM   | Implicit parser/pool limits and generic parser failures; insufficient HTTP correlation.                                                         | Explicit parser/transport/pool/SQL bounds, safe parser status mapping, server request IDs, metadata-only 5xx logs. | Malformed/large/compressed HTTP requests, log redaction, database integrations.             |
| MEDIUM   | A failed worker close could prevent other resource cleanup.                                                                                     | Attempt every worker close, then database disconnect; report generic failure.                                      | Three worker cleanup tests and real process shutdown integration.                           |
| LOW      | CI omitted domain/media DB regressions; repeated test listeners caused unnecessary socket churn.                                                | Full DB runner in CI and one listener per HTTP fixture.                                                            | All domain/media checks and 147 HTTP tests.                                                 |
| LOW      | pg warns about queued queries inside Prisma transactions.                                                                                       | Traced to @prisma/adapter-pg 7.10.0; no unsupported package patch or warning suppression.                          | Relationships transaction trace and passing real DB suites; compatibility debt retained.    |

## 3. Authentication

Registration/login DTO bounds, normalized email uniqueness, password hashing, JWT verification and database-backed user/role lookup were reviewed. Clients cannot register as ADMIN or assign server-owned fields. Argon2id uses 64 MiB, three iterations and one lane; at most two native operations run per API process. Excess work returns 429 instead of accumulating an unbounded queue. Unknown/passwordless accounts perform cached dummy verification; corrupt stored hashes produce generic authentication failure. Dummy-hash initialization can recover after failure.

Production rejects known placeholder and low-diversity JWT keys in addition to existing length checks. These heuristics do not prove entropy: generate at least 48 random bytes and manage the key through deployment secrets. Existing JWT expiration behavior remains; this task adds no refresh-token or account-disable subsystem.

## 4. Authorization

Ownership checks traverse the resource's project owner, and associations independently validate both resources against the requested project. ADMIN authorization protects user administration and does not bypass author resource ownership. Missing and foreign owned resources use safe not-found behavior. Unit/HTTP fixtures and real database suites exercise foreign-author and same-author foreign-project IDs.

| Domain                                  | Boundary reviewed                                      | Regression evidence                         |
| --------------------------------------- | ------------------------------------------------------ | ------------------------------------------- |
| Projects                                | owner-scoped reads/mutations                           | Auth/database and HTTP workflows            |
| Books, chapters, scenes                 | parent ownership, hierarchy and reorder membership     | Manuscript HTTP/database                    |
| Characters, places, factions, artifacts | project ownership and associations                     | Worldbuilding HTTP/database                 |
| Relationships                           | both endpoints/kinds in same owned project             | Relationship HTTP/database                  |
| Timelines, eras, events                 | timeline/project membership, temporal associations     | Timeline HTTP/database                      |
| Plot threads, points                    | owned project, linked scenes/events/entities           | Plot HTTP/database                          |
| Notes, tags and assignments             | generic target membership and project scope            | Organization HTTP/database                  |
| Search                                  | owned project predicate before matches, SQL parameters | Search HTTP/database                        |
| Media                                   | owned upload metadata/content/attachment targets       | 108 real HTTP checks                        |
| AI                                      | owned generation and explicit context resources        | 61 real HTTP checks plus worker integration |
| Jobs/admin                              | no public arbitrary enqueue route; guarded user admin  | Contract/HTTP and jobs integration          |

No confirmed IDOR bypass remained after review. This is an audit of the exercised implementation, not a proof against every possible future change.

## 5. Database

Reviewed existing composite same-project foreign keys, association kind/nullability checks, partial unique indexes, normalized tag constraints, timeline range enforcement and hierarchy deletion behavior. Serializability/retries, atomic multi-write/reorder operations, uniqueness conflicts and cascade behavior were exercised by isolated domain regressions. Constraints remain authoritative beneath service checks; no check was removed to obtain passing tests.

API pool maximum is 10, connection timeout five seconds and statement timeout 15 seconds. Eleven existing migrations are current. **No Part 14 migration was needed or created.** Historical migrations were not rewritten. No speculative index was added.

## 6. API hardening

Validation rejects unknown properties and bounds strings, numeric pagination, enums, IDs, association kinds and reorder inputs. JSON/urlencoded bodies are limited to 1 MiB; compressed bodies are rejected, urlencoded parameter count is 100. Parser failures map safely to 400/413/415 without reflecting payloads. Transport settings: headers 15 seconds, request body 60 seconds, idle keepalive five seconds, 100 requests per connection.

Per-source/per-process minute budgets: general 300, login 20, registration 10, upload 20, search 60. The fixed-window map has a 10000-entry ceiling and refuses excess entries instead of evicting active budgets. Rate limiting defaults on outside tests and cannot be disabled in production. Liveness is exempt. Login/registration concurrency is additionally bounded. These are process-local controls, not a distributed account lockout or global quota.

Forwarded source addresses are trusted only through explicitly configured IP/CIDR proxies; default is direct socket identity. Global/zero-prefix ranges and malformed configurations are rejected. Configure the actual ingress proxies and aggregate ingress budgets when deploying replicas. Exact CORS allowlists, no cookie credentials and Helmet remain. X-Request-Id is generated by the server; CORS exposes it and Retry-After. Standard errors hide SQL/Redis/filesystem/provider internals. 5xx HTTP logs contain only generated correlation, method, status and duration.

## 7. Performance

Books, chapters, timelines, eras and admin users now return bounded arrays with validated optional limit/offset; ordering is deterministic. Existing envelope pagination remains. AI summary queries select only public summary fields. Plot/timeline detail queries fetch at most 1001 related rows per collection and return 409 above 1000 rather than silently truncating. This bounds reads, not association creation quotas.

Representative EXPLAIN ANALYZE/BUFFERS used synthetic data in a disposable schema (1000 scenes/events/AI rows). Observed scene list 0.047 ms, event list 0.026 ms, AI summary 0.031 ms used existing composite indexes. Project search 4.465 ms used scoped joins/append, index and sequential scans; pending recovery 0.226 ms used a sequential scan when all rows were pending. These are small local observations, not production benchmarks. They did not justify index migrations. Query plans are saved in ignored `.data/hardening/query-plans.json`.

No application N+1 defect requiring a rewrite was confirmed. Literal substring search can scan a large project; output, inputs and SQL time are bounded, but realistic load measurements are still needed before sizing production.

## 8. Media

Reviewed signature-based type validation, upload byte limits, generated storage keys, filename/disposition sanitation, path containment/symlink protections, ownership before content retrieval, safe attachment association constraints and metadata privacy. Storage keys/provider/internal paths are excluded from public contracts. Unsupported/traversal/oversized/foreign-access and lifecycle paths passed real HTTP/database checks. Cleanup/reconciliation remains bounded and designed to tolerate races and partial storage/database failures. Tests use temporary storage; no real media cleanup was run.

## 9. Redis, BullMQ and worker

Reviewed bounded attempts/backoff, retention, namespace validation, publisher scheduling, readiness under outage, idempotent maintenance operations and AI recovery/fencing. Generic jobs are CLI-controlled, not arbitrary public enqueue endpoints. No test flushes Redis; integration runs use random namespaces and delete their own keys.

Worker shutdown now attempts every worker drain even if one fails, then attempts bounded Prisma disconnect; infrastructure messages remain generic. Actual worker entrypoint startup, retry/recovery and termination were exercised with loopback PostgreSQL and temporary Redis 8.0.6. Existing Windows Redis 5 was unsuitable; it was not upgraded or flushed.

## 10. AI

AI is disabled by default. Fake provider is restricted to development/tests and rejected in production; no paid/remote provider was added or called. Context is selected explicitly from owned resources in the same project, with count/text limits; no broad project-content sweep. System instructions remain server-controlled, user/context text is treated as input, output is a proposal and never automatically mutates canonical manuscript/world data.

Reviewed project quota, bounded queue/retries, concurrency, timeout/cancellation, persisted state transitions, leases/fencing and stale recovery. Client responses and logs exclude internal provider errors, prompt/context and leases; summaries now also avoid loading private detail columns. Users can themselves type secrets into manuscript/instructions, so the audit cannot guarantee their text contains none. A future external provider requires a separate data-processing/retention and credential review.

## 11. Secrets and dependencies

Known private-key, cloud access-key, GitHub token and provider-key patterns were scanned in tracked/untracked worktree files and Git history without printing values. No recognized credential category was found; no tracked non-example local environment file was found. This pattern scan is not exhaustive secret detection. The ignored evidence file contains scope/count metadata only; no rotation category was identified.

Initial full audit reported 22 advisories and production audit three. Removed unused @nestjs/mau and its deploy script; scoped overrides patch Prisma CLI deepmerge-ts to 8.0.0 and mysql2 to 3.23.1. Prisma/Nest versions were preserved. Final full and production audits report **zero known vulnerabilities at all severities**, without exceptions or suppression. Relevant primary advisories: [deepmerge-ts](https://github.com/advisories/GHSA-ggr8-5vv4-36mx), [mysql2](https://github.com/advisories/GHSA-3f6p-5ww8-9rcr).

## 12. Testing

Added bounded-budget/expiry/capacity, password-concurrency/release, HTTP forwarding/throttle/parser/request-ID, log-redaction, test-database isolation, embedded-detail bounds, environment/key/proxy validation, AI select, admin pagination and independent worker cleanup coverage. Expanded existing generated OpenAPI assertions rather than duplicating implementation-only tests. Added isolated real database pagination and query-plan observations.

Final unit total: **379** (API 290, shared backend 58, worker 31). HTTP suites: **147** across eight suites. Real media checks: **108**; AI HTTP checks: **61**, plus real worker/queue assertions. Full database runner covers ten suites. Counts overlap where workflows share assertions; do not add them as independent unique tests.

An earlier HTTP run encountered Windows ENOBUFS while test fixtures repeatedly opened listeners. Fixtures now reuse one listener per suite; reruns passed. Socket churn was observed, but the operating-system root cause was not conclusively established. No assertion was weakened, test skipped or timeout blindly increased.

Two final verification mistakes were corrected: a new contract assertion initially used a shortened chapter route rather than its existing project/book path, and combining media/AI imports in one process retained the media suite's disabled-AI configuration. The contract assertion now uses the actual route; media and AI passed in separate processes, as the supported runners invoke them. Neither required weakening application checks. Canonical OpenAPI exports were also compared byte-for-byte rather than comparing their sorted export with an unsorted in-memory serialization.

## 13. CI

CI retains frozen install, Prisma generation, shared builds, root lint/types/unit/build, HTTP/OpenAPI and real jobs/AI infrastructure checks. Added all isolated domain/media/hardening database regressions and full dependency high-severity audit. Explicit test DB, test mode and fake AI configuration remain. Local equivalent checks ran; this task did not trigger or verify a GitHub Actions run.

## 14. Actual verification

| Actual command/check                                                     | Result                                                                                               |
| ------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------- |
| Prisma format; pnpm db:validate; pnpm db:generate; Prisma migrate status | Passed; 11 migrations current                                                                        |
| pnpm install --frozen-lockfile                                           | Passed                                                                                               |
| pnpm lint                                                                | Passed, no lint warnings/errors                                                                      |
| pnpm typecheck                                                           | Passed                                                                                               |
| pnpm test                                                                | Passed: API 290 + backend 58 + worker 31                                                             |
| pnpm build                                                               | Passed all five buildable packages                                                                   |
| pnpm test:e2e / compiled Vitest e2e runner                               | Passed 147 HTTP tests                                                                                |
| node apps/api/test/database-regression.mjs                               | Passed auth/manuscript/worldbuilding/relationships/timeline/plot/organization/search/media/hardening |
| node apps/api/test/media-database-smoke.mjs                              | Passed 108 real HTTP checks                                                                          |
| node apps/api/test/jobs-integration.mjs                                  | Passed real PostgreSQL/Redis/storage/worker scenarios                                                |
| node apps/api/test/ai-integration.mjs                                    | Passed 61 real HTTP checks plus queue/worker scenarios                                               |
| pnpm api:openapi                                                         | Passed offline generation: 113 operations, 60 paths, 81 schemas; deterministic contract tests passed |
| pnpm audit; pnpm audit --prod                                            | Both passed: zero known vulnerabilities                                                              |
| pnpm format:check; git diff --check                                      | Passed                                                                                               |

Integration invocation explicitly sets TEST_DATABASE_URL from the local loopback server configuration without displaying credentials, then runs only disposable randomly named migrated schemas. Redis uses the dedicated temporary loopback instance/isolated prefixes, storage temporary directories and AI the deterministic fake. Prisma's pg adapter still emits the compatibility warning described below; that is not a failing check.

## 15. Breaking and operational changes

Intentional bounded behavior: previously unlimited books/chapters/timelines/eras/admin-user arrays default to 50 and cap at 100, keeping bare-array shapes. Clients must request later offsets. Oversized embedded association details now return 409 above 1000; there is no silent truncation or creation quota. Existing detach operations can remove known associations; future detail paging is preferable for very large resources.

Abusive requests/native authentication contention can return 429; compressed HTTP request bodies return 415; oversized bodies 413. Production now rejects weak/example JWT keys and disabled throttling. Production does not implicitly load local .env files. Legacy database tests require explicit TEST_DATABASE_URL. The unused deploy script was removed. No normal success response fields, route IDs, ownership boundary or database migration changed.

## 16. Remaining risks

**BLOCKER:** None identified by this audit; no unresolved CRITICAL/HIGH finding.

**SHOULD FIX BEFORE PRODUCTION:** Configure actual trusted ingress proxies and aggregate replica rate limits, TLS, random managed JWT keys, restricted database/Redis credentials/networking, durable media storage, backups/restore monitoring and realistic load budgets. These are deployment prerequisites, not completed by local tests. Review resources approaching the 1000-association detail ceiling before exposing them to users.

**ACCEPTABLE V1 DEBT:** Literal substring search scans; fixed-window/process-local rather than distributed rate limits; initial small synthetic query measurements; Prisma adapter-pg transaction queuing deprecation with pg 8.23.1. Address adapter compatibility before upgrading to pg 9; no unsupported patch was made.

**POST-V1:** Embedded association pagination, richer production telemetry, provider-specific AI security/privacy review when a real provider is introduced, deeper load testing and optional distributed abuse policy. No such feature platform was implemented here.

## Security checklist: all 30 questions

| #   | Question                               | Audit answer / evidence                                                                                                                                                   |
| --- | -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Author A access Author B data?         | No bypass found; owned-domain HTTP/DB matrices.                                                                                                                           |
| 2   | Project A IDs injected into Project B? | Rejected; same-author foreign-project associations tested.                                                                                                                |
| 3   | AUTHOR obtain ADMIN behavior?          | Guarded role from persisted user; registration cannot assign role.                                                                                                        |
| 4   | Protected routes without valid JWT?    | Rejected by guard; missing/invalid-token HTTP coverage.                                                                                                                   |
| 5   | Mass-assign server fields?             | DTO whitelist rejects unknown fields.                                                                                                                                     |
| 6   | Arbitrary sort into Prisma?            | Enum-to-explicit order mapping only.                                                                                                                                      |
| 7   | Search escape scope?                   | Ownership checked, parameterized project predicates; special input tests.                                                                                                 |
| 8   | Generic associations cross projects?   | Service checks and SQL composite constraints.                                                                                                                             |
| 9   | Filenames escape storage?              | Generated keys, containment/symlink checks; malicious filename tests.                                                                                                     |
| 10  | Unsupported types bypass validation?   | Signature/type allowlist checks and mismatch tests.                                                                                                                       |
| 11  | Oversized uploads bypass limits?       | Multipart byte bounds and real upload tests.                                                                                                                              |
| 12  | Media content without ownership?       | Ownership checked before streaming; foreign-author tests.                                                                                                                 |
| 13  | Arbitrary client jobs?                 | No public enqueue route; contract inventory and CLI boundary.                                                                                                             |
| 14  | Duplicate jobs corrupt state?          | Idempotency/state fencing/reconciliation; real duplicate/recovery checks.                                                                                                 |
| 15  | Bounded retries?                       | Configured attempts/backoff and bounded transaction retry loops.                                                                                                          |
| 16  | Tests flush unrelated Redis?           | No flush command; random validated prefixes, own-key cleanup.                                                                                                             |
| 17  | AI read another project's content?     | Explicit resource membership; same-author and foreign-author integration tests.                                                                                           |
| 18  | Override AI system instructions?       | System instructions server-owned, DTO rejects extra fields. Text injection remains untrusted input.                                                                       |
| 19  | AI mutate canonical data?              | Proposal-only result; no automatic application path.                                                                                                                      |
| 20  | Secrets into prompts/logs/errors?      | No infrastructure secrets added; safe logs/errors. User-authored text can contain user-entered secrets.                                                                   |
| 21  | Raw SQL/Prisma client errors?          | Standard safe error filter; DB conflict/validation HTTP tests.                                                                                                            |
| 22  | Raw Redis client errors?               | Safe readiness/failure contract, real outage tests.                                                                                                                       |
| 23  | Filesystem paths to clients?           | Public media projections and safe exception mapping; contract/privacy tests.                                                                                              |
| 24  | Raw provider errors?                   | Safe persisted/public failure codes; fake failure tests.                                                                                                                  |
| 25  | Expensive inputs bounded?              | DTO/body/upload/AI/reorder/search/hash/budget/SQL bounds.                                                                                                                 |
| 26  | Large collections paginated?           | Top-level lists bounded/paged; embedded details bounded with explicit 409, future paging debt.                                                                            |
| 27  | Critical queries indexed?              | Existing composites reviewed; five actual plans, no justified new index.                                                                                                  |
| 28  | Multi-write operations transactional?  | Association/reorder/quota/state transitions reviewed and exercised.                                                                                                       |
| 29  | Concurrency break uniqueness/order?    | SQL uniqueness, serializable writes/retries and race regressions; no confirmed violation.                                                                                 |
| 30  | Tests touch real infrastructure?       | Explicit loopback opt-in; disposable schemas/prefixes/storage and fake AI. They use a local server but never intentionally operate on real application tables/keys/files. |

## 17. Release-candidate verdict

**BACKEND HARDENING PASSED**

The reviewed backend passes the recorded local checks with all identified CRITICAL/HIGH findings resolved. Production deployment prerequisites and remaining debt are explicitly listed above; this verdict is not a claim that an unconfigured deployment is ready.
