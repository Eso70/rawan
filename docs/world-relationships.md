# Unified world relationships — Part 5

The existing repository already contained authentication, manuscripts and all
four worldbuilding entity kinds. Unified relationships were absent. This addition
preserves those systems and the public website. No dependencies were installed or
upgraded.

## Architecture and integrity

One project-scoped `Relationship` table connects Character, Place, Faction and
Artifact in any combination. Each endpoint has a `WorldEntityKind` enum and one
of four nullable, concrete foreign keys. This avoids a table per pair while
preserving database referential integrity without replacing existing entity IDs
or CRUD with a new registry.

Each endpoint uses a composite `(projectId, entityId)` foreign key against its
entity's new unique `(projectId, id)` index. PostgreSQL therefore rejects missing
and cross-project endpoints, including links between two projects owned by the
same author. Check constraints require exactly one endpoint reference matching
its kind and prohibit self-links. Deleting either endpoint or its project
cascades to the relationship. Source/target and project indexes support lists.

The new additive migration is
`packages/database/prisma/migrations/20261005000000_relationships/migration.sql`.
The check constraints and expression identity index are maintained in SQL because
Prisma does not represent them in its schema. Preserve them in future migrations.
Earlier migrations and existing records are unchanged.

`RelationshipDirection` supports `DIRECTIONAL` and `SYMMETRIC`. Directional
relationships preserve source/target order. Symmetric relationships store one
canonical pair sorted by `kind:id`, using PostgreSQL's C collation to match the
application's comparison. No reverse row is inserted. Both endpoints' detail
pages show the link with its original direction or a two-way arrow.

Semantic identity is project + normalized type key + direction + typed endpoint
pair. The unique database index handles concurrent duplicates; the API returns 409. Reversed symmetric pairs are duplicates; reversed directional pairs and
different type keys remain distinct. Self-links return 400. Labels and notes are
editable without creating another semantic identity.

Type keys are custom ASCII machine keys, normalized to uppercase with whitespace
and hyphens converted to underscores, up to 64 characters. Display labels are
independent Unicode strings up to 100 characters; descriptions allow 10,000
characters. No relationship vocabulary or localization system is imposed.

## API and security

All routes use the existing JWT guard under `/api/v1`:

| Method | Route                                                                  | Purpose                            |
| ------ | ---------------------------------------------------------------------- | ---------------------------------- |
| POST   | `/projects/:projectId/relationships`                                   | Create                             |
| GET    | `/projects/:projectId/relationships`                                   | Project list                       |
| GET    | `/projects/:projectId/relationships?entityKind=CHARACTER&entityId=:id` | Incoming and outgoing entity links |
| GET    | `/relationships/:id`                                                   | Detail                             |
| PATCH  | `/relationships/:id`                                                   | Edit endpoints, semantics or notes |
| DELETE | `/relationships/:id`                                                   | Delete, returning 204              |

Create bodies contain `source: {kind, id}`, `target: {kind, id}`, `typeKey`,
`label`, optional `description` and optional `direction` (default DIRECTIONAL).
PATCH accepts the same fields optionally; it cannot change project ownership.
The two entity query parameters must be supplied together.

The API checks project ownership through `Project.author.userId`, resolves each
endpoint against that project and owner, and scopes reads and mutations to the
authenticated user. Inaccessible resources return 404. Nested DTO validation
rejects unsupported kinds, unknown fields, malformed IDs and invalid content.
Database constraints remain an independent integrity boundary.

Responses expose endpoint `{id, kind, name}` summaries, relationship semantics
and ISO timestamps. They do not expose Prisma internals or authentication data.
Shared API types live in `packages/types`: `WorldEntityKind`,
`WorldEntityReference`, `RelationshipDirection`, `ApiRelationship` and
`RelationshipInput`.

## Author workspace

`/projects/[projectId]/relationships` uses the existing protected author layout.
Project navigation links to it. `RelationshipsPanel` also appears on Character,
Place, Faction and Artifact detail pages, with that entity preselected as source.
Forms select real project entities, custom type/label, direction and notes.
Lists link to both endpoints and include edit and confirmed-delete forms.
Empty states explain how to begin. Existing loading, not-found and service-error
boundaries remain in use. Labels, keyboard controls and visible focus states are
provided; descriptions are rendered as text rather than HTML.

Server actions use the existing centralized API client and HttpOnly session.
Tokens remain server-side. The client now permits only the narrowly defined
entity relationship query. Actions verify the route's project context and
invalidate the project layout after changes so entity and project views refresh.
Duplicate and self-link feedback is shown without exposing backend diagnostics.

## Verification

- Unit tests cover type-key normalization and symmetric/directional identity.
- Frontend API-client tests cover entity queries, authorization and URL rejection.
- `pnpm --filter @rawan/api test:relationships:database` applies every committed
  migration inside a disposable PostgreSQL schema and exercises all 16 kind
  pairs, CRUD, entity filtering, two-author isolation, same-owner cross-project
  rejection, invalid DTOs, duplicates, canonical ordering, direct SQL integrity
  violations, and entity/project deletion cascades.
- Set `VERIFY_RELATIONSHIPS_FRONTEND=1` for that command after building apps/app
  to additionally verify real sign-in, relationship create/edit/delete server
  actions, both detail and project views, all four detail integrations, source
  preselection, private sessions, duplicate/self rejection and refresh behavior.
- The database smoke check uses local `DATABASE_URL` and `JWT_SECRET` through
  the existing configuration; it never resets existing tables. Secrets should
  remain local. The implementation was tested using an isolated local PostgreSQL
  instance, without changing an existing development or production database.

## Scope and limitations

Verification completed successfully: Prisma validate/generate, database and
shared-types builds, root lint/typecheck/build/format checks, 32 API unit tests,
39 existing API HTTP tests, 12 frontend unit tests, and the real PostgreSQL and
frontend relationship smoke checks. The existing manuscript database smoke and
all four worldbuilding frontend/database flows also passed with the new migration.
The website has no source changes.

This intentionally uses ordinary lists and selectors. There is no graph UI,
timeline, canvas or new writing editor. Entity choices and project lists are not
paginated yet, so a future large-world experience will need search/pagination.
Adding an entity kind requires two foreign-key columns, enum/constraint updates
and resolver support, rather than a new table for every combination. A shared
entity registry can be considered if many kinds eventually warrant it.

Deletion is permanent and follows the existing project/entity deletion policy.
There is no relationship history, date range or inverse-label localization yet.
Repeated historical events should eventually use a separate event domain.

Before running this feature on an existing configured database, apply the new
migration with the repository's normal `pnpm db:deploy` workflow. No production
database was modified during implementation.
