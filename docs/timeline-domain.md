# Timeline, eras, and events — Part 6

Implemented as a backend domain in the existing NestJS API, PostgreSQL database, and shared API contracts. The existing manuscript and relationship domains retain their behavior. No new dependencies were installed.

## Implementation plan and outcome

1. Inspect the current schema, migrations, world entity references, ownership checks, DTOs, REST conventions, and safe test infrastructure. Reuse `WorldEntityKind` and `WorldEntityReference` without changing the meaning of `Relationship`.
2. Add exact fictional chronology and four models, with PostgreSQL constraints, composite foreign keys, useful indexes, and a new additive migration.
3. Implement authenticated CRUD, entity associations, explicit public serializers, bounded event lists, and validated filters.
4. Test services, compiled Nest routing and guards with isolated persistence, and actual PostgreSQL constraints and concurrency in disposable schemas.
5. Validate migration deployment using Prisma in an isolated schema, apply the committed migration to the configured local database, and run the monorepo checks.

All five stages are complete. Frontend folders remain empty apart from their directory-preserving `.gitkeep` files. Plot and other later systems are outside this change.

## Architecture and chronology

A project has multiple `Timeline` records. Each timeline has `Era` records and `TimelineEvent` records. Events can have no era, or one era belonging to their timeline. `EventEntity` connects an event to one existing character, place, faction, or artifact. It is separate from a world relationship.

`Timeline` stores its project, name, optional description, and real creation/update timestamps. `Era` stores its timeline, name, optional description, nonnegative position, optional start/end boundaries, and timestamps. `TimelineEvent` stores its project and timeline, optional era, title, optional summary/description/date label, required start, optional end, nonnegative position, and timestamps.

Story time uses PostgreSQL `numeric(30,6)` / Prisma Decimal. API chronology is always a **decimal string**, with at most 24 integer digits and 6 fractional digits. Negative values, zero, and large values above JavaScript's safe integer range are supported exactly. No fictional date is converted to a JavaScript Date or floating-point number. Only `createdAt` and `updatedAt` use real timestamps.

Examples: `"-120"`, `"0"`, `"9007199254740993.000001"`. Scientific notation, leading zeroes such as `"01"`, numeric JSON values, NaN, Infinity, and excess precision are rejected. Responses use canonical plain decimal strings: `"1.500000"` becomes `"1.5"`, and negative zero becomes `"0"`. PostgreSQL independently rejects NaN and values beyond its numeric capacity. Direct SQL writers must avoid relying on PostgreSQL's rounding of excess fractional precision; the HTTP API rejects it.

`dateLabel` is independent author text, such as “Third Age, Year 77”, “circa 900”, or “before the battle”. No calendar, precision, or exact day is inferred from it. The ordinal unit is author-defined. Future calendar metadata can map onto this neutral chronology foundation.

An event with no end is instantaneous. An end may equal its start; otherwise it must be greater. Era bounds may independently be absent; when both exist, start must not exceed end. Era membership does not force an event within its era boundaries, and eras may overlap. These are organizational periods rather than a calendar engine.

Event order is `start ASC, position ASC, id ASC`. Era order is `position ASC, id ASC`. Timeline order is `createdAt ASC, id ASC`. Equal positions are legal and IDs provide a stable tie-breaker. Change `position` through PATCH; no bulk reorder operation or automatic renumbering is introduced, consistent with the existing manuscript position convention.

## REST contract

All routes are under `/api/v1` and require bearer authentication. Creation returns 201, reads and updates return 200, and deletion returns 204 with no body.

| Method               | Path                                       | Purpose                               |
| -------------------- | ------------------------------------------ | ------------------------------------- |
| POST / GET           | `/projects/:projectId/timelines`           | Create / list project timelines       |
| GET / PATCH / DELETE | `/timelines/:id`                           | Read / edit / remove timeline         |
| POST / GET           | `/timelines/:timelineId/eras`              | Create / list ordered eras            |
| GET / PATCH / DELETE | `/eras/:id`                                | Read / edit / remove era              |
| POST / GET           | `/timelines/:timelineId/events`            | Create / list ordered event summaries |
| GET / PATCH / DELETE | `/events/:id`                              | Read detail / edit / remove event     |
| POST                 | `/events/:id/entities`                     | Attach an existing world entity       |
| DELETE               | `/events/:eventId/entities/:associationId` | Remove that event's association       |

Create timeline: `{ "name": "Main World History", "description": "Optional notes" }`.

Create era: `{ "name": "First Age", "position": 0, "start": "-100", "end": "100" }`.

Create event:

```json
{
  "title": "The Northern War",
  "summary": "The empire invades",
  "description": "A longer account",
  "start": "-10.000001",
  "end": "4.5",
  "dateLabel": "Day 14 of the Red Moon",
  "position": 0,
  "eraId": "<era-id>"
}
```

Attach entity: `{ "kind": "CHARACTER", "entityId": "<character-id>", "role": "attacker" }`.

The response is `{ "associationId": "...", "entity": { "id": "...", "kind": "CHARACTER", "name": "Arin" }, "role": "attacker" }`. Role is optional custom text, not a predefined enum. One entity may be attached once per event, regardless of role; duplicates return 409.

Timeline and era lists return arrays. Event lists return `{ "items": [...], "nextOffset": 50 }`; `nextOffset` is null when no further page exists. Default limit is 50, maximum 100; offset defaults to 0 and is capped at 1,000,000. Offset pagination is intentionally simple and may shift during concurrent insertion/deletion. It is not a snapshot or a total count; cursor pagination can be added for very large histories.

Event queries support `eraId`, `entityKind` plus `entityId` together, and inclusive `from` / `to` start boundaries. Filters can be combined. The chronology range selects events whose **start** is within the range, not any duration overlapping the range. A supplied era must belong to the requested timeline, and a supplied entity must belong to the timeline's project. Invalid query syntax or unknown parameters return 400; inaccessible filter references return 404. Example:

```text
GET /api/v1/timelines/<id>/events?from=-120&to=900&limit=50&offset=0
GET /api/v1/timelines/<id>/events?entityKind=CHARACTER&entityId=<id>
```

Summaries contain identity, project/timeline IDs, title, summary, chronology, label, position, optional `era: { id, name }`, and timestamps. Detail responses add description and `entities` using the public association shape above. Nullable fields are explicit null. No concrete polymorphic FK columns or Prisma objects appear in the API.

Shared types in `@rawan/types`: `Chronology`, `ApiTimeline`, `ApiEra`, `ApiEventSummary`, `ApiTimelineEvent`, `ApiEventEntity`, and `ApiEventPage`. These are independent of Prisma-generated models.

## Validation, security, and transactions

DTOs cover create/update timeline, era, and event; entity attachment; and list queries. Existing strict global validation rejects unknown fields. Names/titles are trimmed and 1–200 characters; descriptions max 10,000, event summaries max 1,000, date labels max 200, and roles 1–100 after trimming. Positions are integers from 0 to 2,147,483,647. IDs in bodies/queries are 1–128 ASCII letters, digits, underscores, or hyphens. Query pagination transforms digit strings deliberately; arrays, decimals, and out-of-range values fail.

PATCH distinguishes omitted values from null. Null clears optional descriptions, bounds, labels, roles at attachment, or era assignment; it cannot clear a required title/name/start/position. Moving existing records to another project or timeline through PATCH is not supported. Duration checks compare a supplied boundary with the persisted opposite boundary, including partial updates.

Every owner-sensitive lookup and mutation scopes through Project → Author → User. ADMIN has no implicit ownership bypass. Missing and foreign-owned resources both return 404; missing/invalid authentication returns 401. Same-author ownership of two projects does not permit cross-project entity associations. Attachment removal checks both the event ID and association ID, preventing substitution of another event's association.

Event create/update/attachment and era update/deletion use serializable transactions where checks and writes must remain consistent. Serialization conflicts retry at most three times, then return 409. The duration validation reads the current record inside the transaction, preventing two individually valid boundary patches from combining into an invalid range. Trivial reads and single scoped CRUD writes are not unnecessarily transactional. Prisma uniqueness failures become 409 and missing/FK race failures become safe 404 responses.

## Database integrity and performance

The new migration is `20261005020000_timeline`. Historical migrations were preserved. It creates four tables plus their indexes, FKs, CHECK constraints, and one expression unique index.

Composite FKs enforce Event `(projectId, timelineId)` → Timeline, Event `(timelineId, eraId)` → Era, and association `(projectId, eventId)` → Event plus `(projectId, concreteEntityId)` → its entity. The association CHECK requires exactly one concrete entity ID matching its kind. Its expression unique index prevents duplicate event/kind/entity identity. Range, finite chronology, nonnegative positions, and text length constraints protect direct database writes as well.

Project deletion cascades timelines, eras, events, and associations. Timeline deletion cascades its eras/events/associations. Event deletion and each world entity deletion cascade affected associations. Deleting an era through the API first clears its events' `eraId` and then deletes the era in one transaction; the events survive. A direct SQL era deletion while events still reference it is restricted (`NO ACTION`). This avoids incorrectly nulling the non-null timeline component of the composite FK. Timeline/project cascades were explicitly tested with assigned eras still present.

Indexes support timeline listing by project/time/ID, era listing by timeline/position/ID, event listing by timeline/start/position/ID, era-filtered event listing, associations by event/ID, and each world entity's project/entity/event lookup. Composite unique indexes support FK targets. There are no speculative calendar indexes.

The event page fetch selects compact fields and era names in a bounded Prisma query, with one extra row to identify the next page. No per-event follow-up query is issued. Details fetch all association names through Prisma includes rather than calling each entity service in a loop.

## Automated verification and migration

- Unit/service suite: **90 tests passed**, including 26 new timeline tests. New tests exercise exact decimal comparisons, open boundaries, partial-update validation, ownership scopes, all four entity kinds, transaction retry bounds, error mapping, atomic era detachment, and compact bounded list queries.
- Isolated HTTP suite: **78 tests passed**, including 18 new timeline tests. Compiled Nest modules, global DTO validation, JWT guards, and services run with isolated persistence. Coverage includes CRUD, all routes' 401 behavior, roles without ownership bypass, entity attachment/filter/removal, precision, pagination, cross-project/cross-timeline rejection, and malformed inputs. Database behavior is separately verified against PostgreSQL.
- Real PostgreSQL and HTTP integration: passed using an explicitly supplied `TEST_DATABASE_URL` and a random disposable schema. Applies all committed migration SQL, then exercises full API CRUD, negative/zero/large chronology, tie-breaking, labels, filters, pagination, all entity kinds, owner/project isolation, concurrency, **20 direct constraint rejections**, and every deletion cascade.
- Test safety: missing test URL and production mode were independently verified to fail before connection. Scripts neither reset nor modify existing schemas/data. The random schema is removed in `finally`.
- Prisma CLI `migrate deploy` and `migrate status`: passed in a separate disposable schema. The additive timeline migration was then applied successfully to the configured local `rawan` database; its status is up to date with six migrations.
- Prisma format/validate/generate, database/types builds, API and root lint/typecheck/build/unit/HTTP tests, and formatting: passed. No lint warnings remain.
- Earlier manuscript, worldbuilding, and relationship PostgreSQL integration checks also passed against the expanded migration set. Frozen-lockfile installation and Git whitespace checks passed.

To run the opt-in integration check, explicitly configure a PostgreSQL test connection with `CREATE SCHEMA` permission in process `TEST_DATABASE_URL` or the API environment file:

```sh
pnpm --filter @rawan/api test:timeline:database
```

On another checkout/database, apply the committed migration before starting the API:

```sh
pnpm db:deploy
pnpm db:generate
pnpm dev
```

The PostgreSQL adapter emits the pre-existing warning about overlapping `pg` client queries during transactional checks. Tests pass; track the upstream adapter behavior before a future pg major upgrade. No dependency upgrade was made here. The test runner's detailed database check is opt-in because CI has no explicit test database configured. Default CI unit and HTTP suites include the new tests.

## Future decisions

Chronology units and display labels remain author-defined. Custom calendars, approximate-date semantics, automatic era boundary enforcement, bulk reorder, association role editing, and cursor pagination are future additions, not partially implemented features. Extending entity kinds requires a deliberate FK/check migration, consistent with the existing relationship architecture. API inputs cannot move timelines/events/entities between projects. Current deletion and pagination semantics above should be respected by future clients.

Timeline + eras + events are complete for this phase. No Plot, calendar engine, or frontend work was started.

## Requested 21-point completion report

| #   | Topic                     | Result                                                                                                                                                                   |
| --- | ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1   | Timeline architecture     | Multiple timelines per owned project, with CRUD and ordered listing.                                                                                                     |
| 2   | Era architecture          | Named timeline periods, optional bounds, editable position, and safe deletion preserving events.                                                                         |
| 3   | Event architecture        | Timeline event with optional era, title, notes, exact chronology, label, position, and entity references.                                                                |
| 4   | Fictional chronology      | Decimal(30,6) and decimal strings preserve negative, zero, large and fractional values without Date or floating-point assumptions.                                       |
| 5   | Duration                  | Required start and optional end; start <= end enforced in services and PostgreSQL.                                                                                       |
| 6   | Ordering                  | Events: start/position/id; eras: position/id; timelines: creation time/id.                                                                                               |
| 7   | Entity associations       | One separate typed EventEntity table with optional custom role, reusing the existing world entity kind/reference contracts.                                              |
| 8   | Models and integrity      | Four new models; same-project and same-timeline composite FKs, exact-kind CHECK, duplicate identity index, chronology/content constraints, access-pattern indexes.       |
| 9   | Migration                 | New additive 20261005020000_timeline migration; historical migrations preserved.                                                                                         |
| 10  | Endpoints                 | 17 authenticated routes for timeline, era, event CRUD and event entity attach/remove; full route table above.                                                            |
| 11  | DTO validation            | Strict create/update/attachment/query DTOs, length and numeric bounds, explicit nullable fields, pair filters, no unknown fields.                                        |
| 12  | Ownership                 | Owner scopes on reads and mutations, 404 for foreign resources, no admin bypass, same-author cross-project attachment prohibited.                                        |
| 13  | Transactions              | Serializable checked event writes and era changes; bounded contention retries, atomic era detachment/deletion.                                                           |
| 14  | Unit tests                | 26 new domain/service tests; 90 total passing.                                                                                                                           |
| 15  | HTTP and integration      | 18 new isolated HTTP tests; 78 total passing, plus real PostgreSQL/API integration passing.                                                                              |
| 16  | Cross-owner/project tests | Both different authors and two projects of one author tested; invalid entity and era assignments rejected.                                                               |
| 17  | Chronology tests          | Negative/zero/positive/large/fractional values, exact comparisons beyond JS safe integer range, ties, arbitrary labels, durations and range queries.                     |
| 18  | Cascade/integrity tests   | 20 direct PostgreSQL constraint rejections, all four entity deletion cascades, association/event/timeline/project cleanup, and era-event preservation.                   |
| 19  | Prisma results            | Format, validation, generation, isolated CLI deploy/status, and local deploy/status all passed; local schema up to date.                                                 |
| 20  | Quality checks            | Root lint without warnings, typecheck, build, unit tests, HTTP tests, formatting, frozen installation, whitespace check, and earlier database domain regressions passed. |
| 21  | Future decisions          | Author-defined chronology units, optional future calendars, offset pagination limits, explicit era deletion semantics, and upstream pg adapter warning documented above. |
