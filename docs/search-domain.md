# Part 9 — Search, filtering, sorting, and pagination

Implementation and local verification completed on 2026-10-05. All routes below use the `/api/v1` prefix and require a Bearer JWT. This is the current query contract; earlier domain reports record their respective implementation phases.

## 1. Plan executed

Completed all ten requested phases:

1. Inspected the workspace, package scripts, schema/migrations, indexes, controllers, services, DTOs, response types, ownership helpers, and database test safeguards.
2. Audited each author-domain collection and identified unbounded lists and repeated pagination validation.
3. Chose the existing offset contract, explicit domain sorts/filters, and a single PostgreSQL project-search query.
4. Added shared validated DTOs, page calculation/mapping, literal substring escaping, sort mapping, and project-owned tag resolution. Focused tests and type checking passed before domain adoption.
5. Implemented project search, then checked its SQL against real PostgreSQL in a disposable schema.
6. Migrated each appropriate domain incrementally, updating deliberate response changes and running its focused tests before proceeding.
7. Added unit/security tests, compiled-application HTTP cases, and an extensive live PostgreSQL/HTTP query check.
8. Reviewed performance/security, checked query plans and indexes, and confirmed safe database-test refusals.
9. Verified migration deployment, full checks, and existing database regressions.
10. Prepared this report after successful verification.

## 2. Query audit

| Collection                           | Before Part 9                                  | Current behavior                                                       |
| ------------------------------------ | ---------------------------------------------- | ---------------------------------------------------------------------- |
| Projects                             | Unbounded array; creation date ordering        | Paged; text search and explicit sorting                                |
| Books                                | Ordered array under a project                  | Preserved structural ordered array                                     |
| Chapters                             | Ordered array under a book                     | Preserved structural ordered array                                     |
| Scenes                               | Unbounded array including content              | Paged summaries; text search, sorting, tag filter                      |
| Characters/Places/Factions/Artifacts | Unbounded arrays; name ordering                | Paged; text search, sorting, tag filter                                |
| Relationships                        | Unbounded array; type/entity filters           | Paged; existing filters plus text search and sorting                   |
| Timelines                            | Ordered project array                          | Preserved structural ordered array                                     |
| Eras                                 | Ordered timeline array                         | Preserved structural ordered array                                     |
| Events                               | Paged summaries; era/entity/chronology filters | Shared paging; preserved filters plus text search, sorting, tag filter |
| Plots                                | Paged summaries; position ordering             | Shared paging; text search and sorting                                 |
| Plot Points                          | Paged summaries; position ordering             | Shared paging; text search, sorting, status and tag filters            |
| Notes                                | Paged summaries; tag filter                    | Shared paging; retained tag filter plus text search and sorting        |
| Tags                                 | Paged; normalized name ordering                | Shared paging; display-name search and sorting                         |
| Tag assignments                      | Paged in both query directions                 | Shared paging; existing kind/resource queries preserved                |

There was no project-wide search. Offset validation was duplicated across events, plots, and organization DTOs; page construction was repeated in their services. These now share one small foundation. Books, Chapters, Timelines, and Eras remain structural lists rather than undergoing a mechanical API change. Admin user queries and detail/association responses were outside this author-content query change.

Search never includes User or Author data, passwords, emails, JWTs, roles, or authentication metadata. Project search selects an explicit set of author-content fields rather than arbitrary database columns.

## 3. Pagination

The existing offset strategy remains the v1 convention:

```text
?limit=50&offset=0
```

Defaults: limit 50, offset 0. Limit range: 1–100. Offset range: 0–1,000,000. Values must be decimal integer query strings; negative values, fractions, invalid strings, nulls, repeated values/arrays, and extra fields fail validation.

Response:

```json
{
  "items": [],
  "nextOffset": null
}
```

Each query fetches at most `limit + 1`, returns at most `limit`, and computes `nextOffset` without a count query. A non-null offset identifies the next page; null means no next page at query time. Requests beyond the last page return an empty page. Shared types use `ApiPage<T>`; existing named page types now alias this contract.

Offset pagination preserves established API conventions and keeps v1 simple. Ordering is deterministic for a stable dataset. Concurrent insertion/deletion/editing can shift pages; this is not a database snapshot or cursor contract. Clients should restart paging when query/filter/sort changes.

## 4. Sorting

List sorting uses `?sort=title&order=asc`. `order` accepts only lowercase `asc` or `desc`. Domain DTOs enumerate fields; services map them explicitly to typed Prisma expressions. Client strings never become arbitrary database keys. Prototype property names are rejected too.

| Resource          | Allowlisted sort fields                      | Default primary ordering                     |
| ----------------- | -------------------------------------------- | -------------------------------------------- |
| Projects          | title, createdAt, updatedAt                  | createdAt descending                         |
| Scenes            | title, position, createdAt, updatedAt        | position ascending, then createdAt ascending |
| World entities    | name, createdAt, updatedAt                   | name ascending                               |
| Relationships     | label, createdAt, updatedAt                  | createdAt descending                         |
| Events            | title, start, position, createdAt, updatedAt | start ascending, then position ascending     |
| Plots/Plot Points | title, position, createdAt, updatedAt        | position ascending                           |
| Notes             | title, createdAt, updatedAt                  | updatedAt descending                         |
| Tags              | name, createdAt, updatedAt                   | normalized display name ascending            |

Every ordering finishes with ID ascending. With no sorting parameters, the complete legacy default order is preserved. An explicit sort uses that primary field followed by ID ascending. An order without a sort applies to the resource's default primary field. A sort without an order uses the default direction from the table. Tag `sort=name` maps to the server-owned normalized name, which cannot be selected directly by clients.

Project-wide search has a fixed relevance order; it deliberately rejects list `sort`/`order` parameters. Assignment queries retain their established deterministic kind/name/ID order.

## 5. Filtering

Filters are explicit and resource-specific; no generic filter language was introduced.

| Resource                      | Supported filters                                       |
| ----------------------------- | ------------------------------------------------------- |
| World entities, Scenes, Notes | tagId                                                   |
| Events                        | tagId, eraId, entityKind + entityId, from, to           |
| Plot Points                   | tagId, status (`PLANNED`, `IN_PROGRESS`, `RESOLVED`)    |
| Relationships                 | normalized typeKey, entityKind + entityId               |
| Resources for a tag           | resourceKind                                            |
| Tags for a resource           | required resourceKind + resourceId in the owned project |
| Project-wide search           | optional kind                                           |

Filters combine with text search, pagination, and allowed sorting. Existing event chronology remains exact decimal strings and preserves range validation. Entity kind/ID must be supplied together where required. Era filters require the current timeline. Tag filters require the resource's exact project and current author; missing, deleted, foreign-author, and same-author foreign-project tags return 404 rather than silently matching nothing. A valid project tag with no matching resources returns an empty page.

## 6. Search architecture

V1 uses case-insensitive PostgreSQL substring matching. Resource lists use typed Prisma `contains`/insensitive queries. Project search encapsulates parameterized SQL in `search/search.sql.ts` so mixed kinds can receive one global rank/order/page. It does not fetch a page for each kind and combine them in application memory.

The same escaping helper makes `%`, `_`, and backslash literal characters in both search paths. Quotes and SQL-looking text remain bound values. Query `q` is trimmed, required for project search, optional on supported resource lists, and must contain 2–200 characters when present. Empty/whitespace-only queries, arrays/repeated values, null characters, and overlong queries return 400. Omitting resource-list `q` retains browsing behavior. A no-match search returns an empty page.

Search is a literal phrase substring, not tokenization, stemming, fuzzy matching, accent folding, or Unicode canonical-equivalence matching. Case behavior follows PostgreSQL collation. Non-Latin text is supported without a language-specific full-text dictionary.

| Project search kind                 | Search fields               |
| ----------------------------------- | --------------------------- |
| PROJECT, BOOK, CHAPTER              | title, description          |
| SCENE                               | title, description, content |
| CHARACTER, PLACE, FACTION, ARTIFACT | name, summary, description  |
| TIMELINE_EVENT                      | title, summary, description |
| PLOT, PLOT_POINT                    | title, description          |
| NOTE                                | title, content              |

Tags and Relationships participate in their own resource-list search, not the heterogeneous project-search kinds. Timelines and Eras remain structural collections and are not result kinds.

Ranking is explicit: case-insensitive exact title/name, then prefix title/name, then title/name substring, then body match. Ties use updatedAt descending, kind ascending, and ID ascending. Search snippets are plain text, at most 240 PostgreSQL characters, beginning up to 60 characters before a body match or at the body start when only the title matched. They contain no generated HTML/highlighting. Full bodies never leave PostgreSQL as search response fields.

Ownership is part of SQL itself: a materialized owned-project CTE checks both project ID and authenticated user ID, and every branch joins that scope, including the Book → Chapter → Scene ancestry chain. An application lookup supplies established private-resource 404 behavior; SQL repeats ownership rather than trusting that earlier check alone.

## 7. Project search API

```text
GET /api/v1/projects/:projectId/search?q=dragon&kind=SCENE&limit=25&offset=0
```

`kind` is optional and accepts one enumerated result kind from the table above. Repeating it or passing an arbitrary model name is invalid. Without it, all twelve kinds participate in the same page.

```json
{
  "items": [
    {
      "kind": "SCENE",
      "id": "scene-id",
      "projectId": "project-id",
      "title": "The Dragon Cave",
      "snippet": "The dragon sleeps beneath the mountain.",
      "updatedAt": "2026-10-05T12:00:00.000Z"
    }
  ],
  "nextOffset": null
}
```

Shared `SearchResultKind` and `ApiSearchResult` describe exactly these fields. Search results are discovery records; use the existing detail route for editing or reading the complete resource. ID and kind identify the resource, and projectId identifies its scope.

## 8. Resource search

These collection routes support optional `q`, allowed `sort`/`order`, and shared `limit`/`offset`:

- `/projects`
- `/projects/:projectId/books/:bookId/chapters/:chapterId/scenes`
- `/projects/:projectId/characters`
- `/projects/:projectId/places`
- `/projects/:projectId/factions`
- `/projects/:projectId/artifacts`
- `/projects/:projectId/relationships`
- `/timelines/:timelineId/events`
- `/projects/:projectId/plots`
- `/plots/:parentId/points`
- `/projects/:projectId/notes`
- `/projects/:projectId/tags`

List searches use the relevant fields from the search-field table. Relationships search label/description; Tags search display name. Scene/Note/Event/Plot/Point listing keeps compact projections while allowing filtering against body fields inside PostgreSQL. World entity record fields retain their existing public shape.

## 9. Tag filtering

All eight Part 8 taggable kinds support list filtering: Notes, Characters, Places, Factions, Artifacts, Scenes, Events, and Plot Points.

Example:

```text
GET /api/v1/projects/:projectId/characters?q=arin&tagId=tag-id&sort=name&order=asc
```

A scoped tag lookup verifies the authenticated owner and exact project before a database `tagAssignments.some` filter is applied. Nested Scene/Event/Point collections derive or validate project membership through their owned parents. No new tag assignment tables or unsupported taggable kinds were introduced.

The PostgreSQL test verifies resource-with-tag, untagged resources, an unused/different tag, nonexistent tags, another author's tag, another project owned by the same author, and deleted tags across every supported kind.

## 10. Database

New migration: `20261005050000_query_indexes`. No models, fields, extensions, triggers, or data were added/removed. Seven existing indexes were replaced with versions matching default paging order:

| Model        | Index columns                      |
| ------------ | ---------------------------------- |
| Project      | authorId, createdAt DESC, id       |
| Scene        | chapterId, position, createdAt, id |
| Character    | projectId, name, id                |
| Place        | projectId, name, id                |
| Faction      | projectId, name, id                |
| Artifact     | projectId, name, id                |
| Relationship | projectId, createdAt DESC, id      |

The longer indexes preserve useful leading ownership/parent columns without retaining redundant shorter indexes. Existing event chronology/era, plot position, note update-time, normalized-tag uniqueness, assignment identity, and per-resource tag indexes remain in place. Historical migrations and custom integrity SQL remain unchanged.

No text-column B-tree index is claimed to accelerate arbitrary contains search. No FTS/trigram indexes or extensions were added. Normal index creation can block writes during deployment; schedule deployment appropriately if applying this migration to a large active database.

## 11. Security

The fourteen requested review questions were checked explicitly:

1. List queries include current-user ownership in their database predicates.
2. Project/parent scope is enforced in queries, including nested manuscript ancestry.
3. Sort DTOs enumerate fields and services use explicit typed maps; arbitrary fields and prototype names are rejected.
4. Search kinds are controlled by DTO enumeration and a defensive SQL-builder check.
5. Tag/entity/era filter lookups enforce the current project or timeline before querying.
6. Another author's content does not enter project search; both lookup and SQL enforce ownership.
7. Another project with the same author does not enter the selected project's search.
8. User/Auth tables and fields do not participate in searchable sources or public response mapping.
9. Search input length is bounded and null characters are rejected.
10. Page sizes and offsets are bounded centrally.
11. Snippets are bounded within PostgreSQL before returning results.
12. All runtime SQL values are Prisma parameters; table names and joins are static application SQL fragments.
13. Unexpected database failures return the normal generic 500 response, not SQL/error/credential details; representative HTTP coverage verifies this.
14. Every newly introduced or extended query DTO uses the application's strict whitelist validation and rejects extra fields.

Private resource behavior remains 404, authentication failures 401, and malformed queries 400. Existing guards continue to resolve the live user; administrative roles do not grant ownership bypasses. No body owner IDs or arbitrary query filters were introduced.

## 12. Tests

Actual final results:

| Suite                                    | Result                                                                                                                                                                                                                                                                           |
| ---------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Full unit/service suite                  | 186 passed in 11 files; 24 new shared-query and 4 new search cases                                                                                                                                                                                                               |
| Full compiled-application HTTP/e2e suite | 146 passed in 8 files; 24 new search HTTP cases                                                                                                                                                                                                                                  |
| Search PostgreSQL + real HTTP            | Passed all twelve kinds, all eight tag filters, ranking, bounded snippets, literal wildcard/backslash/quote/Unicode queries, sort fields/orders, default/custom/max paging, beyond-final pages, stable ties, validation, owner/project isolation, and sensitive-field protection |
| Existing live PostgreSQL regressions     | Manuscript, worldbuilding, relationships, timeline, plot, and organization all passed with all nine migrations included                                                                                                                                                          |
| Safety refusals                          | Missing explicit test connection and production mode both refused before database connection                                                                                                                                                                                     |

The live test seeds two authors and two projects belonging to one author, plants unique foreign-project phrases, and proves they cannot appear in the selected project. It searches an actual stored password hash/email and confirms no results. Positive search responses are checked against the exact six-field contract. Wildcard tests include nonliteral decoys to prove escaping rather than merely accepting special text. A 105-note fixture verifies default/max limits and consecutive pages, including tied timestamps.

Existing contract tests were updated deliberately for new pages; authorization, mutation, and cascade checks were retained. The live PostgreSQL tests validate real query behavior; isolated HTTP fixtures validate routing, guards, DTOs, and serialization without needing a database.

## 13. Performance review

Large collection queries are bounded and retrieve one extra row, with no count query. Scene lists explicitly omit content; existing Note/Event/Plot/Point summary selections remain compact. Tag filtering occurs in PostgreSQL, and project search has one global SQL page rather than loading all matches or making one query per result. Existing bounded relation includes avoid application-level N+1 reads.

EXPLAIN (FORMAT JSON) ran successfully for the actual parameterized twelve-kind search in a disposable schema and showed the top-level Limit. Migration-created index presence was verified. This was a small functional dataset, not a production benchmark; sequential scans on small tables are expected, and no large-dataset performance claim is made.

ILIKE/contains still examines text within the scoped project. Extensive manuscripts or very large projects can make it expensive even though result size is bounded. Future evidence may justify indexed full-text/trigram search and cursor pagination. Neither is needed operationally for this v1 implementation.

## 14. Verification

Passed: Prisma format, validate, generate (pinned 7.10.0), actual CLI migration deploy/status in an isolated schema, database/types builds, focused API tests/typecheck/build, root lint/typecheck/build/test, API HTTP/e2e, frozen-lockfile installation, formatting, and `git diff --check`. Lint reports zero warnings/errors.

The index migration then applied successfully to local `rawan.public`. Migration status reports all nine migrations applied and the schema up to date. No database reset or application data deletion occurred.

No separate root integration script exists. Applicable database integration scripts were run directly with explicit local test configuration and random schemas. Normal unit/HTTP suites remain database-independent.

## 15. Breaking API changes

Intentional normalization:

- Projects, Scenes, Characters, Places, Factions, Artifacts, and Relationships now return `{ items, nextOffset }` instead of arrays. Default output is bounded to 50 records, maximum 100 per page.
- Scene list items omit `content`; use Scene detail to retrieve it. Shared `ApiSceneSummary` describes this distinction.
- Migrated collection queries now reject unknown query properties instead of ignoring them.

Books, Chapters, Timelines, and Eras keep their existing array shapes. Already-paged Events, Plots, Plot Points, Notes, Tags, and assignment queries preserve their response shapes and default ordering. Detail/create/update/delete contracts remain unchanged.

## 16. Dependencies

No packages were installed or upgraded for Part 9. Existing NestJS, Prisma, class-validator/class-transformer, PostgreSQL, Vitest, and HTTP test tooling were sufficient. No search server, extension, Redis, or AI dependency was introduced.

## 17. Future frontend contract

Clients can keep q/filter/sort state in validated query parameters, render `items`, and request the next page using `nextOffset`. Restart paging when query state changes. Each domain's sort allowlist is explicit above. Project search offers one predictable six-field result shape; resource kind/ID plus project scope support detail retrieval. Treat snippets and author content as plain text, including text that resembles markup.

Both reserved frontend folders still contain only their existing `.gitkeep`. No frontend or subsequent media/AI infrastructure was implemented.

## 18. Remaining issues

No blocking implementation failures remain.

- Offset pagination can shift under concurrent changes and has skip cost at large offsets.
- Substring search lacks tokenization, typo tolerance, stemming, accent/canonical-equivalence folding, and an index for arbitrary text matches. Its cost grows with scoped project content.
- Structural Book/Chapter/Timeline/Era arrays remain unpaged intentionally; revisit if real collection sizes justify it. Existing detail association collections are unchanged.
- The pre-existing pg adapter emits a client-query overlap deprecation warning during transaction tests. Checks pass on pinned versions; address driver/adapter compatibility before pg 9 adoption.
- Existing application body-byte limits still apply to note/manuscript writes independently of character limits.
- Raw search SQL follows the PostgreSQL connection search path; the API currently uses its existing public-schema deployment. The isolated test explicitly sets its connection search path and Prisma schema to the same random schema. A future multi-schema deployment must keep raw SQL and ORM schema configuration aligned.
- Ordinary index replacement may block writes while creating indexes on a large active database; this local migration passed without changing data.
- Changes remain uncommitted/unpushed alongside preserved earlier work. Other environments must deploy all pending committed migrations with `pnpm db:deploy`. Local migration is already applied; normal development starts with `pnpm dev`.

Part 9 ends here.
