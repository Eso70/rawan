# Part 8 — Notes, tags, and flexible organization

Verified locally on 2026-10-05. This document records the implementation, API contract, security review, and actual verification results.

## 1. Plan executed

Completed phases 0–8: inspected the existing domain, migrations, ownership helpers, configuration, and tests; planned a small organization module; designed and implemented the database; implemented the API; added focused unit, HTTP, and PostgreSQL tests; reviewed security and integrity; ran full verification; and prepared this report.

Reused JWT authentication, private-resource 404 behavior, strict DTO validation, Prisma error mapping, world-entity resolution, composite project foreign keys, existing pagination conventions, and bounded transaction conflict retries. Separate notes and tags services share one `OrganizationModule`; controllers remain thin.

## 2. Database changes

New additive migration: `20261005040000_organization`. Historical migrations were preserved. No reset, backfill, or dependency upgrade was required.

| Model         | Fields and relations                                                                                                                                                                        |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Note          | CUID `id`, `projectId`, `title`, plain-text `content` defaulting to an empty string, `createdAt`, `updatedAt`; belongs to Project and has tag assignments                                   |
| Tag           | CUID `id`, `projectId`, display `name`, database-derived `normalizedName`, `createdAt`, `updatedAt`; belongs to Project and has assignments                                                 |
| TagAssignment | CUID `id`, `projectId`, `tagId`, `resourceKind`, eight nullable concrete resource IDs, and nullable scene ancestry `bookId`/`chapterId`; references Project, Tag, and the concrete resource |

`TagResourceKind` enumerates the eight supported kinds. Database checks require exactly one concrete resource ID matching the kind. Scene assignments additionally require valid book/chapter ancestry; other kinds forbid those ancestry fields.

Composite foreign keys enforce the same project for Tag and every resource. Scene project membership is enforced through Project → Book → Chapter → Scene composite keys. Cascades remove assignments when a tag, resource, ancestry container, or project is deleted. Deleting a tag preserves its resources.

Unique constraints cover `(projectId, id)` on Note and Tag and `(projectId, normalizedName)` on Tag. A SQL expression unique index covers `(tagId, resourceKind, concrete resource ID)` on assignments. It is intentionally migration-managed because Prisma cannot represent this expression constraint.

Indexes support notes by `(projectId, updatedAt DESC, id)`, assignments by `(tagId, resourceKind, id)`, each concrete resource by `(projectId, resource ID, tagId)`, and scene ancestry foreign keys. Tag project/name listing uses its unique normalized-name index. Note title/content and tag name bounds also have database checks.

## 3. Notes architecture

Ownership follows Note → Project → Author → User. Notes are project-level plain text. No pinned/status/position fields or editor infrastructure were added.

Creation requires a title and accepts optional content; omitted content becomes `""`. Detail, creation, and update responses include content. Listing returns summaries without fetching content, ordered by `updatedAt DESC, id ASC`. An optional project-owned `tagId` filters notes at the database. Deletion returns 204 and cascades note assignments.

## 4. Tag architecture

Tags belong exclusively to one project. The API trims surrounding whitespace and collapses internal ECMAScript whitespace to one space. A PostgreSQL trigger performs the same whitespace folding on every insert/update, preserves display casing, and sets `normalizedName = lower(name)`.

PostgreSQL is the single authority for case normalization under the database collation. Clients cannot submit the normalized key. `Magic`, `magic`, and `MAGIC` conflict within one project and may exist independently in different projects. Unicode whitespace, including nonbreaking space and the byte-order mark, cannot bypass normalization through direct database writes.

Tag lists sort by `normalizedName ASC, id ASC`. Responses expose the display name and ISO timestamps, never the normalized key. Duplicate creation or rename conflicts return 409.

## 5. Tag assignment architecture

Supported kinds: `NOTE`, `CHARACTER`, `PLACE`, `FACTION`, `ARTIFACT`, `SCENE`, `TIMELINE_EVENT`, `PLOT_POINT`.

One dedicated assignment table uses an enum discriminator and real nullable foreign keys rather than arbitrary resource IDs or separate tables for each kind. This follows established event/plot association patterns without treating tagging as a world relationship. Supporting another kind later requires an explicit migration, resolver, contract, and tests.

Assignment creation resolves the owned tag, resolves the resource in that exact project, derives scene ancestry server-side, and writes atomically in a serializable transaction. Confirmed serialization/deadlock conflicts receive at most three attempts, then 409. Single-record CRUD uses normal database operations.

Both query directions use filtered database queries and bounded relation includes; there is no application loop fetching each resource separately. Resources for a tag sort by enum kind order, then assignment ID. Tags for a resource sort by normalized tag name, then assignment ID. Enum order is the supported-kind order listed above.

## 6. API endpoints

All routes below are prefixed by `/api/v1` and require a Bearer JWT.

| Method | Route                                | Behavior                                                    |
| ------ | ------------------------------------ | ----------------------------------------------------------- |
| POST   | `/projects/:projectId/notes`         | Create note; 201                                            |
| GET    | `/projects/:projectId/notes`         | Summary page; optional `tagId`                              |
| GET    | `/notes/:id`                         | Note detail                                                 |
| PATCH  | `/notes/:id`                         | Update title/content                                        |
| DELETE | `/notes/:id`                         | Delete note; 204                                            |
| POST   | `/projects/:projectId/tags`          | Create tag; 201                                             |
| GET    | `/projects/:projectId/tags`          | Tag page                                                    |
| GET    | `/tags/:id`                          | Tag detail                                                  |
| PATCH  | `/tags/:id`                          | Rename tag                                                  |
| DELETE | `/tags/:id`                          | Delete tag and assignments; 204                             |
| POST   | `/tags/:tagId/assignments`           | Assign tag; 201                                             |
| GET    | `/tags/:tagId/assignments`           | Resources for tag; optional `resourceKind`                  |
| DELETE | `/tags/:tagId/assignments/:id`       | Remove matching assignment; 204                             |
| GET    | `/projects/:projectId/resource-tags` | Tags for resource; required `resourceKind` and `resourceId` |

Create note example: `{ "title": "Possible ending", "content": "Arin returns home." }`.
Create/rename tag example: `{ "name": "Magic" }`.
Assignment example: `{ "resourceKind": "CHARACTER", "resourceId": "resource-id" }`.

Assignment response:

```json
{
  "assignmentId": "assignment-id",
  "tag": { "id": "tag-id", "name": "Magic" },
  "resource": { "kind": "CHARACTER", "id": "resource-id", "label": "Arin" }
}
```

All list responses use `{ "items": [], "nextOffset": null }`. `limit` defaults to 50, maximum 100; `offset` defaults to 0, maximum 1,000,000. Fetch the next page using the returned offset. A null next offset means no further page at query time. Ordering is deterministic for a stable dataset; offset pagination is not a snapshot across concurrent changes.

## 7. DTO / validation

Note title is trimmed and must contain 1–200 characters. Content is a string up to 50,000 characters, may be empty, and is stored exactly without parsing. Tag name is whitespace-normalized and must contain 1–100 characters. PostgreSQL text cannot contain null characters, so note/tag text rejects them with 400 before persistence.

Optional fields may be omitted but cannot be null. PATCH may be an empty object, following existing update conventions. Query/body IDs use the existing bounded ASCII letter/digit/underscore/hyphen convention, maximum 128 characters; route IDs follow the existing lookup conventions and inaccessible IDs return 404. Supported kinds are strictly enumerated. Pagination requires nonnegative integer offset and positive integer limit; repeated query values, fractions, out-of-range values, and unknown fields fail validation.

Unknown body properties are rejected, including `authorId`, `projectId`, timestamps, and `normalizedName`. Scene ancestry and concrete foreign-key columns are never client inputs. JavaScript validators count UTF-16 code units; PostgreSQL length checks count characters, so API bounds can be more conservative for supplementary Unicode characters.

## 8. Security

The explicit review covered all twelve requested questions:

1. Every endpoint authenticates with the existing live-user JWT guard and scopes access through the current owner's Author profile.
2. Read/update/delete queries include ownership; listing and resource resolution require owned parents.
3. Assignments require the tag's exact project, including when another project has the same owner; composite foreign keys independently enforce this.
4. The normalization trigger derives the key on every database write; project/key uniqueness blocks duplicate races and key spoofing.
5. The assignment identity expression index blocks duplicates, including concurrent requests.
6. Database cascades prevent orphan assignments for every supported resource kind, tag, and project.
7. DTO enumeration and the resolver's own-property check reject unsupported kinds and prototype property names.
8. No endpoint accepts body owner/project/ancestry fields; project ownership is checked against authenticated identity.
9. Explicit response mapping omits Prisma fields, normalized keys, inactive foreign keys, and note/manuscript content from association lists.
10. Database constraints back resource kind, identity, project membership, normalization, length, and deletion rules.
11. Filtered, bounded queries with compact relation selections avoid obvious application-level N+1 queries.
12. Errors follow 400 validation, 401 authentication, 404 missing/private resources, and 409 duplicates/concurrency; raw database exceptions are not returned as API responses.

Administrative roles do not bypass author ownership. All eight kinds were tested against both another author and another project belonging to the same author. Removing an assignment also checks its tag ID, preventing deletion through an unrelated parent route.

## 9. Tests

| Check                               | Actual result                                                                                                                                                                      |
| ----------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Full unit/service suite             | 158 passed across 9 files; 29 new organization cases                                                                                                                               |
| Full HTTP/e2e suite                 | 122 passed across 7 files; 24 new organization cases                                                                                                                               |
| Organization PostgreSQL + real HTTP | Passed all eight kinds, CRUD, pagination/order, normalization, owner/project isolation, concurrent duplicate races, deletion cascades, and 41 direct database integrity rejections |
| Existing PostgreSQL regressions     | Manuscript, worldbuilding, relationships, timeline, and plot checks all passed with the new migration included                                                                     |
| Test safety                         | Missing explicit test connection and production mode both refused before database connection                                                                                       |

The organization database test requires explicit `TEST_DATABASE_URL`, refuses production mode, creates a random disposable schema, applies all committed migrations only there, and removes only that schema in `finally`. It never resets the database or deletes existing application records. Local verification used a localhost connection supplied to the test process; existing `.env` files were preserved.

Run the opt-in check with `pnpm --filter @rawan/api test:organization:database` after setting `TEST_DATABASE_URL` to an intended development/test PostgreSQL connection with `CREATE SCHEMA` permission. Normal unit and HTTP suites do not require a live database.

## 10. Database verification

Prisma format, validate, and client generation passed with pinned Prisma 7.10.0. Actual Prisma CLI migration deploy/status passed first in a disposable schema. The additive organization migration then applied successfully to local `rawan.public`; status reports all eight migrations applied and the schema up to date. Database package build passed.

The SQL trigger, checks, and expression index are essential migration-managed guarantees. Future migrations must preserve them; changing the Prisma schema alone does not recreate those SQL features.

## 11. Code quality

Root `pnpm lint`, `pnpm typecheck`, `pnpm build`, `pnpm test`, `pnpm test:e2e`, `pnpm format:check`, frozen-lockfile installation, and `git diff --check` all passed. API focused build/typecheck/lint and organization HTTP checks also passed before full verification. Lint reported zero warnings/errors. Shared types and database builds passed through the dependency builds.

No separate root integration script exists; live database integration is covered by the opt-in API database scripts described above.

## 12. Dependencies

No packages were installed or upgraded for Part 8. Existing NestJS, Prisma, PostgreSQL adapter, class-validator, class-transformer, Vitest, and test infrastructure were sufficient. Frozen installation confirmed the current lockfile remains usable.

## 13. Frontend readiness

The API provides stable IDs, ISO system timestamps, compact paged note lists, detail content for editing, tag CRUD, assignment/removal, note filtering by tag, and both tag/resource query directions. Shared contracts live in `packages/types`. A later client can consume these contracts without inspecting database columns.

Both `apps/app` and `apps/website` remain empty apart from their existing `.gitkeep` files. Part 8 added no UI, cosmetic fields, editor dependencies, search, or future infrastructure.

## 14. Remaining issues

No blocking implementation or verification failures remain.

- The existing PostgreSQL adapter emits a `client.query()` overlap deprecation warning during transaction checks. Tests pass with the pinned versions; a future adapter/driver update should address this before adopting pg 9.
- The existing application uses the default JSON request-body byte limit, which also applies to note requests. Large Unicode content or JSON escaping can reach that transport limit before the 50,000-character DTO limit. Content is plain text; a later client must treat it as text when displaying it.
- Case folding follows PostgreSQL collation; this is not accent-insensitive or Unicode canonical-equivalence matching. Those semantics would require a deliberate future data migration.
- Offset pagination may shift under concurrent edits and can become expensive at large offsets. Current limits and compact projections are suitable for v1; cursor pagination can be considered when actual scale requires it.
- Changes remain uncommitted and unpushed alongside preserved work from earlier phases. No GitHub publication was requested. Other environments must apply all pending committed migrations with `pnpm db:deploy` and generate their client through the normal build/setup process.

The local database is ready; normal development starts with `pnpm dev`. This phase ends here.
