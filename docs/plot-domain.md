# Plot and story structure — Part 7

Rawan now supports flexible story planning through `Project → Plot → PlotPoint`, with authenticated REST APIs, database integrity, and automated verification. This phase adds backend/database behavior only.

## Architecture and decisions

A project may have many plots, and each plot has ordered points. A plot can itself represent a main plot, subplot, character arc, political arc, mystery, or any custom structure. No separate PlotLine/StoryArc model or parent-plot hierarchy is required for this first version: those would add another level without a distinct business rule. Optional templates can later create ordinary Plot/PlotPoint records.

`Plot`: ID, project ID, title, optional description and custom category, explicit position, and system timestamps. Category is nullable author text rather than an enum or taxonomy engine. No plot workflow status was added.

`PlotPoint`: ID, project/plot IDs, title, optional description, position, status, and system timestamps. Status is `PLANNED` (default), `IN_PROGRESS`, or `RESOLVED`; authors may move freely between them. It tracks planning progress and is independent of manuscript completion.

Planning points, manuscript scenes, and fictional timeline events remain distinct concepts. Narrative order uses point positions, never event chronology. One point can link multiple scenes or events, and a scene/event can link multiple points across plots within its project.

Five new models implement the domain: `Plot`, `PlotPoint`, `PlotPointScene`, `PlotPointEvent`, and `PlotPointEntity`. Scene/event links are focused many-to-many associations. Entity links use one typed association table for the four existing entity kinds, with optional custom role text. The Relationship model retains its original world relationship meaning.

The existing timeline and new plot domain share a small `requireWorldEntity` / `entityFields` helper, preserving exactly the existing project-and-owner lookup rules. This is not a generic association engine.

## Ordering and transactional reordering

Plots and points list by `position ASC, id ASC`. Positions are integers between 0 and 2,147,483,647. Equal positions are allowed, with stable ID tie-breaking, following the established explicit manuscript position approach. Creation without a position appends at `max(position) + 1`, or 0 for an empty parent. Explicit zero is preserved. Creation calculates the maximum and inserts in a serializable transaction; concurrent appends were verified to receive distinct next positions.

If the maximum has reached the integer limit, automatic creation returns 409; reorder positions or provide an explicit valid position. Deletion leaves gaps and does not renumber records.

`PATCH /plots/:plotId/points/reorder` accepts:

```json
{
  "items": [
    { "id": "<point-a>", "position": 1 },
    { "id": "<point-b>", "position": 0 }
  ]
}
```

The batch contains 1–200 items. IDs and positions must be distinct within the request. Every point must belong to the requested owned plot. All IDs are verified before any update; every update retains owner/plot scopes and runs within one serializable transaction. The endpoint returns an ordered array of updated point summaries.

This is a **partial batch** contract: omitted points keep their positions. Requested positions may coincide with omitted points' positions; stable ID ordering resolves ties. Clients that need a complete contiguous outline should supply all affected point positions. The operation does not move points between plots or reorder plots in bulk. Individual plot positions can be patched.

Validation failures produce 400 and foreign/missing IDs produce 404, with no partial writes. Real PostgreSQL tests also inject a trigger failure after the first update and verify rollback of that first write.

Serializable conflicts retry at most three times, then return 409. Prisma 7's adapter can expose PostgreSQL commit conflicts directly as `DriverAdapterError` instead of P2034. The shared conflict classifier recognizes only confirmed serialization/deadlock errors (`40001`/`40P01`) or P2034, and is used by plots, timelines, and relationship update transactions. Unrelated failures are not retried.

## REST endpoints

All 17 routes use `/api/v1` and bearer authentication. POST returns 201; GET/PATCH return 200; DELETE returns 204 with no body.

| Method               | Path                                            | Behavior                               |
| -------------------- | ----------------------------------------------- | -------------------------------------- |
| POST / GET           | `/projects/:projectId/plots`                    | Create / list ordered project plots    |
| GET / PATCH / DELETE | `/plots/:id`                                    | Plot detail / edit / delete            |
| POST / GET           | `/plots/:plotId/points`                         | Create / list ordered point summaries  |
| GET / PATCH / DELETE | `/plot-points/:id`                              | Point detail / edit / delete           |
| PATCH                | `/plots/:plotId/points/reorder`                 | Atomic partial reorder                 |
| POST                 | `/plot-points/:pointId/scenes`                  | Attach scene                           |
| DELETE               | `/plot-points/:pointId/scenes/:associationId`   | Detach scene                           |
| POST                 | `/plot-points/:pointId/events`                  | Attach timeline event                  |
| DELETE               | `/plot-points/:pointId/events/:associationId`   | Detach event                           |
| POST                 | `/plot-points/:pointId/entities`                | Attach world entity with optional role |
| DELETE               | `/plot-points/:pointId/entities/:associationId` | Detach entity                          |

Create plot: `{ "title": "Mystery of the Crown", "category": "Mystery", "description": "Optional notes" }`.

Create point: `{ "title": "Arin discovers the truth", "status": "PLANNED" }`. Position and description are optional.

Scene attachment: `{ "sceneId": "<scene-id>" }`.

Event attachment: `{ "eventId": "<event-id>" }`.

Entity attachment: `{ "kind": "CHARACTER", "entityId": "<character-id>", "role": "protagonist" }`.

Association identity is independent of role: the same scene/event/entity can be attached once per point. Duplicates return 409. Roles are custom text, not a giant enum. Editing roles after attachment is not introduced; detach and reattach when needed.

## Public response contracts and performance

Both plot and point lists accept validated `limit` (default 50, max 100) and `offset` (default 0, max 1,000,000). They return `{ "items": [...], "nextOffset": 50 }` with null when no further page exists. Unknown query fields, arrays, negative/fractional values, and out-of-range pagination fail with 400. Offset pages can shift under concurrent insertion/deletion and do not represent a snapshot or provide a total count.

Plot summaries contain ID/project ID, title, category, position, and timestamps. Plot detail adds description; points are obtained through the separate paginated points endpoint.

Point summaries contain ID/project/plot IDs, title, position, status, and timestamps. Detail adds description plus:

- `scenes`: `{ associationId, scene: { id, title, chapter: { id, title, book: { id, title } } } }`.
- `events`: `{ associationId, event: { id, title, timelineId, start, end, dateLabel } }`.
- `entities`: `{ associationId, entity: { id, kind, name }, role }`.

Scene content and descriptions are never fetched for plot references. Event descriptions are similarly omitted; event chronology remains exact decimal strings. Internal composite-FK columns are not exposed. Association arrays are ordered by association ID. Nullable fields remain explicit null.

Lists use compact Prisma selects, bounded fetches, and one extra record to determine the next page. They do not fetch associations or descriptions. Details use explicit includes/selects for all compact references, without per-point/association service lookups or N+1 loops.

`@rawan/types` now exports `PlotPointStatus`, `ApiPlotSummary`, `ApiPlot`, `ApiPlotPointSummary`, `ApiPlotPoint`, `ApiPlotPointScene`, `ApiPlotPointEvent`, `ApiPlotPointEntity`, `ApiPlotPage`, and `ApiPlotPointPage`. No Prisma-generated model is a public API contract.

## Validation and security

DTOs cover create/update plot and point, nested reorder items, each attachment kind, and pagination. The existing global strict ValidationPipe transforms only deliberate fields and forbids unknown properties.

Titles are trimmed and 1–200 characters. Descriptions are optional/null and at most 10,000 characters. Categories and entity roles are optional/null, trimmed, and 1–100 characters when supplied. Positions are bounded nonnegative integers. Statuses and world entity kinds are validated enum values. Body IDs are 1–128 ASCII letters/digits/underscores/hyphens. Reorder arrays validate every nested object, item count, duplicate IDs, duplicate positions, and integer bounds.

PATCH omissions leave fields unchanged. Null clears optional description/category, but cannot clear required title/position/status. Ownership, parent IDs, and association internals are not accepted for mass assignment. Moving a point to another plot/project is not supported.

Every read and mutation scopes through Project → Author → User. Missing and foreign-owned resources both return 404; unauthenticated/invalid tokens return 401. ADMIN has no ownership bypass. Parent list/create/reorder routes validate the requested owned parent. Detachment checks the association ID, point ID, and owner together.

Each attachment separately verifies project membership, even when another project has the same author. Scene ownership follows Scene → Chapter → Book → Project. Event ownership follows TimelineEvent → Timeline → Project. World entity checks use their existing project-and-owner helper. Attachments and ownership checks execute in the same serializable transaction to handle concurrent deletion safely.

## Migration, integrity, and indexes

Migration: `20261005030000_plot`. Historical migrations and Prisma 7.10.0 were preserved. It is additive: five new tables, one status enum, relevant indexes/FKs/CHECK constraints, and composite unique targets on existing manuscript tables. No existing manuscript row is backfilled or rewritten.

Point `(projectId, plotId)` references its plot's `(projectId, id)`. Every association references point `(projectId, id)`. Event and world entity targets use `(projectId, id)` composite FKs, independently prohibiting cross-project links.

Scenes currently derive their project through Chapter and Book and do not carry a project ID. The scene association stores that existing path (`projectId`, `bookId`, `chapterId`, `sceneId`) and uses composite FKs to Book `(projectId,id)`, Chapter `(bookId,id)`, and Scene `(chapterId,id)`. These checks prove the entire path belongs to the same project as the point. They avoid introducing redundant project columns into existing manuscript records or a trigger-maintained project field. The extra path columns are internal; callers supply only sceneId. Composite unique targets on existing tables are required for these FKs despite globally unique IDs.

Scene and event association unique keys prevent duplicate point/target pairs. Entity CHECK constraints require exactly one concrete FK matching its kind; an expression unique index prevents duplicate point/kind/entity identity. PostgreSQL also enforces nonnegative positions, content limits, valid enum status, and optional nonblank category/role.

Indexes cover plots by project/position/ID, points by plot/position/ID, reverse scene/event references, the scene link's manuscript FK paths, and each world entity's project/entity/point lookup. Scene/event unique pair indexes already serve point association lookups, so redundant point-only indexes were not added. Entity links have a point/ID index and concrete entity reverse indexes.

Deletion cascades:

- Plot → its points → all point associations.
- Point → its scene/event/entity associations.
- Scene, event, or world entity → its corresponding associations; linked points survive.
- Chapter/Book → scene associations through the manuscript path.
- Project → the complete plot domain.

Simple single scoped updates/deletions rely on database atomicity/cascades. Creation with automatic ordering, attachments, and batch reordering use transactions. No unnecessary read transaction or bulk association mutation API was introduced.

## Verification and safe test usage

- **129 unit/service tests passed**, including 39 new plot tests. Covers automatic/explicit/overflow positions, ownership scopes, partial/invalid reorder behavior, compact paging, attachment project checks, scoped detachment, duplicate/error mapping, confirmed commit conflicts, retry limits, and no retries for unrelated failures.
- **98 isolated HTTP tests passed**, including 20 new plot tests. Runs compiled Nest routing, real JWT guards, global DTO validation, and services with isolated persistence. Covers CRUD/statuses/order/reorder, scene/event many-to-many references, four entity kinds, duplicate/removal behavior, 401 on all 17 routes, cross-owner/admin isolation, same-owner project boundaries, and malformed input.
- **PostgreSQL + real HTTP integration passed**, applying all committed migrations only inside a random disposable schema. Covers concurrent appends, pagination/ties, many-to-many scene/event links, entity roles, atomic reorder rejection, deliberate mid-write failure rollback, duplicate race, **32 direct integrity rejections**, all world entity deletion cascades, scene/event deletion, point/plot/project cleanup, and both cross-author and same-author cross-project security.
- Missing `TEST_DATABASE_URL` and production mode were verified to refuse execution before connecting. Test scripts never reset an existing database or modify its existing schema/data.
- Prisma CLI deploy/status passed in a separate disposable schema. The new migration was then successfully deployed to the configured local `rawan` database; all seven migrations are applied.
- Prisma format/validate/generate, database/types builds, API/root lint/typecheck/build/tests/formatting, frozen installation, and Git whitespace checks passed. Earlier manuscript, worldbuilding, relationship, and timeline PostgreSQL regressions passed against the expanded migration set.

Explicitly configure a PostgreSQL **test** connection with CREATE SCHEMA permission in process `TEST_DATABASE_URL` or the API environment file, then run:

```sh
pnpm --filter @rawan/api test:plot:database
```

The runner creates only a randomly named schema, applies committed SQL there, and removes that schema in `finally`. It overrides the API Prisma provider with a schema-scoped client. Its intentional rollback trigger exists only in that disposable schema. Local environment credentials were preserved. No data-reset command was used.

For another checkout/database:

```sh
pnpm db:deploy
pnpm db:generate
pnpm dev
```

## Technical decisions and remaining debt

Offset pagination and the 200-item partial reorder batch are deliberate first-version limits. Clients must refetch after contention or concurrent page shifts. Position ties are permitted; there is no unique global ranking invariant. No nested arcs, custom status taxonomy, association-role editing, templates, or plot/point moves have been partially implemented.

The existing pg adapter overlapping-query deprecation warning is still emitted during transaction tests; assertions pass. The confirmed commit-conflict failure is fixed without dependency upgrades. PostgreSQL checks remain explicitly opt-in because default CI has no test database; default unit and isolated HTTP checks include all new tests.

All existing frontend directory placeholders were preserved; no pages, components, design assets, or frontend packages were created. No tags, notes system, search, media, AI, queues, collaboration, or later feature was started.

## Requested 21-point completion report

| #   | Topic                               | Result                                                                                                                                        |
| --- | ----------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Plot architecture                   | Multiple independent ordered plots per owned project, with optional custom category.                                                          |
| 2   | PlotLine/StoryArc choice            | No extra model: a Plot already represents an arc/subplot without unnecessary hierarchy.                                                       |
| 3   | PlotPoint architecture              | Independent planned narrative beats, explicit position, notes, and three validated planning statuses.                                         |
| 4   | Ordering/reordering                 | Automatic append in serializable transactions; stable position/ID order; atomic partial batch reorder of up to 200 distinct points.           |
| 5   | Scene association                   | Many-to-many PlotPointScene, compact manuscript context, full project/book/chapter/scene path constraints.                                    |
| 6   | Event association                   | Many-to-many PlotPointEvent, exact compact chronology, same-project composite FK.                                                             |
| 7   | Entity association                  | One typed PlotPointEntity model for all four world kinds, optional custom role, separate relationship semantics.                              |
| 8   | Models/constraints/indexes          | Five new models, status enum, composite FKs, uniqueness and content/kind CHECK constraints, actual-use indexes.                               |
| 9   | Migration                           | New additive 20261005030000_plot; existing migration files unchanged.                                                                         |
| 10  | Endpoints                           | 17 authenticated routes: plot/point CRUD, reorder, three association attach/remove pairs.                                                     |
| 11  | Validation                          | Strict DTOs for CRUD, nested reorder, attachment and bounded pagination; null/unknown/duplicates/mass-assignment rejected as appropriate.     |
| 12  | Ownership/boundaries                | Owner scopes on all operations; no admin bypass; project membership required independently of author identity.                                |
| 13  | Transactions                        | Serializable append/reorder/attachment checks and writes; three confirmed-conflict retries, including PostgreSQL commit errors.               |
| 14  | Cascades                            | Point/plot/project and target deletion cleanup, with planning points preserved when linked targets are deleted.                               |
| 15  | Unit tests                          | 39 new tests; 129 total passing.                                                                                                              |
| 16  | HTTP/integration                    | 20 new isolated HTTP tests; 98 total passing; real PostgreSQL/API integration and rollback tests passing.                                     |
| 17  | Cross-author tests                  | Foreign plot/point reads, mutations, lists, creation, reorder, attachments and removals rejected.                                             |
| 18  | Same-author different-project tests | Scene/event/all four world entity attachments rejected in API and PostgreSQL.                                                                 |
| 19  | Prisma results                      | Format/validate/generate, isolated migration deploy/status, and local deploy/status passed; seven migrations applied.                         |
| 20  | Quality results                     | Root lint without warnings, typecheck/build/unit/HTTP/format checks, frozen install, whitespace checks, and previous database domains passed. |
| 21  | Technical debt                      | Pagination shifts, partial batch bound, position ties, upstream pg warning, and opt-in PostgreSQL CI strategy documented.                     |
