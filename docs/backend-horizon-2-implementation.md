# Backend Horizon 2 implementation ledger

Authorized scope: all Horizon 2 backend capabilities; Horizon 3 deferred. Zero frontend changes. Implemented and validated 12 October 2026. The bounded scopes N01–N26 are complete in the backend; the operational limitations below remain explicit.

## Fixed initial product policies

- One account; private project ownership remains unchanged. Public creator identities/credits are separate.
- Initial published reader access is public/free only. Paid access, lending, recommendations, trending, community and native drawing remain Horizon 3.
- Work releases are explicit immutable snapshots. Publishing is deliberate; withdrawal blocks public reads. Draft edits and source deletion do not alter existing snapshots.
- Libraries contain Rawan works, with private account-owned collections/state. External imports are Horizon 3.
- Prose and graphic content have separate structures. Graphic creation means organizing scripts/imported artwork, not a native drawing application.
- Portable preferences are validated and scoped; device geometry remains local. Appearance choices do not change content/access.
- Real text AI is optional and disabled until configured; no live provider call or billing during implementation tests.

## Implementation sequence and status

| Stage                                                                                 | Horizon IDs                 | Status                                                          |
| ------------------------------------------------------------------------------------- | --------------------------- | --------------------------------------------------------------- |
| Private Work/source foundation                                                        | C13                         | Implemented and validated before this expanded scope            |
| Public metadata, editions, creator personas/credits, series and release foundation    | N01/N02/N10/N11/N12/N13/N26 | Implemented and validated; ADR 0002                             |
| Basic reader, library, progress/history/bookmarks, annotations and released search    | N03/N04/N05/N06/N07         | Implemented and validated; ADR 0003                             |
| Catalogue, editorial/shared collections and selected reader-safe supplements          | N09/N14/N15                 | Implemented and validated; ADR 0002/0003/0004                   |
| Semantic documents/footnotes and structured sources/citations                         | N08/N18                     | Implemented and validated; ADR 0004                             |
| Scoped synchronized preferences and saved views                                       | N16/N17                     | Implemented and validated; ADR 0003                             |
| Private maps and persisted canvas structures                                          | N19                         | Implemented and validated; ADR 0004                             |
| Imported comic organization/reader, vertical/guided metadata, artwork jobs/renditions | N20/N21/N22/N23             | Implemented and validated; ADR 0005                             |
| Optional production text-AI adapter                                                   | N24                         | Implemented; mocked provider validation, no live call; ADR 0006 |
| Versioned prose exports and job results                                               | N25                         | Implemented and validated; actual TXT/HTML/EPUB; ADR 0005       |
| Final contract/schema/security regression and horizon-document reconciliation         | All                         | Completed; supported-Redis integration verified                 |

## Verified Horizon 2 phase results

- API unit: 327 tests passed; API HTTP end-to-end: 147 passed.
- Worker unit: 32 passed; shared backend: 68 passed. Total: 574 unit/HTTP tests.
- Full database regression: 12 suites passed, including all existing author domains and new platform domains.
- Final platform database suite: 161 actual HTTP responses checked against OpenAPI, with real isolated PostgreSQL/storage, native image processing, EPUB generation, permissions, withdrawal, source deletion, graphic reading, related works, private preferences and account/file cleanup.
- Additional final checks cover non-reused release versions, detached deletion intents after partial storage writes, terminal-job crash output cleanup and concurrent artwork claims.
- Follow-up queue verification passed using an isolated Redis 8.0.6 process: maintenance PostgreSQL/Redis/HTTP/storage integration and AI PostgreSQL/Redis integration, including 61 AI HTTP checks and both actual worker entry-point paths. Each suite ran in its own process. No paid provider calls occurred.
- Backend builds, type checks, lint, Prisma validation and whitespace checks passed. Original 124 operations remain compatible; reviewed OpenAPI contains 265 operations.
- Local `rawan` database: five additive Horizon 2 migrations applied successfully; all 20 repository migrations are applied and migration status is up to date. The database-to-Prisma schema comparison reports no difference. No database reset was performed.
- Frontend untouched by this task. The existing `apps/website/next-env.d.ts` modification predates this work.

## Operational limits and remaining setup

- API and worker `.env.local` now configure the same local Redis URL on port 6379; that endpoint responds to PING. The installed Windows Redis 5.0.14.1 triggers BullMQ compatibility warnings, so a supported Redis service is still recommended for normal operation. Follow-up verification built the repository's Redis 8.0.6 version from official source in a temporary WSL directory, ran it on loopback port 16379 without persistence, passed both integration suites and stopped it. This did not install a persistent Redis service. `compose.dev.yml` supplies Redis 8, but Docker is unavailable on this machine.
- Real AI remains disabled by default. OpenAI tests use controlled responses; no real provider call, external processing or billing occurred. An explicit model, server-only key and external-processing opt-in are required in API/worker before enabling it.
- API and worker must share the same database and configured storage path. Restart services after updating. No frontend screens are delivered by these backend capabilities.
- Paid publishing/distribution, recommendations, trending/community, lending/imports, shared universes, collaboration, native drawing and visual AI remain Horizon 3 and are deferred.

See [current backend behavior and limits](backend-horizon-2.md), [feature register](product-horizons.md) and accepted ADRs 0001–0006 for the exact implemented scope. Historical research remains distinguishable from delivered APIs.

## Subsequent verified-email authentication update

The authorized email-auth update adds three operations (268 total), retires direct unverified registration (410/GONE), and applies additive migration 21. Login/verification UI is now implemented in the separate frontend phase; earlier statements about zero frontend work refer to the Horizon 2 implementation phase. Other API operations remain unchanged. Current checks: 351 API unit tests, 147 HTTP end-to-end tests, 32 worker tests, 6 website tests, all 13 database suites, and the dedicated email suite with recording mail transport. See [email authentication](email-auth.md) for delivery setup and exact policy. Real Gmail delivery remains pending the app password; no email was sent externally.
