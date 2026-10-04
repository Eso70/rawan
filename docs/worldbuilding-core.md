# Worldbuilding core

Characters, Places, Factions, and Artifacts belong to Projects and are shared across their books. The existing manuscript domain and authenticated workspace remain intact.

## Database and design

Added Prisma models `Character`, `Place`, `Faction`, and `Artifact`, with Project relations, cascading deletion, timestamps, and compound project/name indexes. All have name, nullable summary and description; Characters also have nullable role/status, and the other entities have nullable type. Classification fields are flexible text (100 characters), rather than restrictive enums. Names are trimmed to 1–200 characters, summaries accept 1,000 characters, and descriptions accept 10,000 characters with Unicode and whitespace preserved. Optional fields can be cleared with null.

Migration: `20261004010000_worldbuilding`. Earlier migrations are preserved. Prisma remains 7.10.0. No JSON metadata, entity relationships, timeline, maps, uploads, or future-system dependencies were introduced.

## API and ownership

One WorldbuildingModule groups four controllers/services and explicit DTOs, following the existing manuscript module convention. All routes start with /api/v1 and require bearer authentication.

For each collection (`characters`, `places`, `factions`, `artifacts`):

- GET/POST `/projects/:projectId/:collection` lists or creates.
- GET/PATCH/DELETE `/:collection/:id` reads, updates, or deletes.

Lists sort by name then ID. Responses are flat records with ISO timestamps; deletes return 204. Shared ApiWorldEntity, ApiCharacter, ApiPlace, ApiFaction, ApiArtifact and WorldKind types keep frontend code independent of generated Prisma internals.

Read/list queries scope through Project → Author → User. Create connects to a project with ownership conditions; update/delete include ownership conditions in the mutation itself. Administrators have no manuscript/worldbuilding ownership bypass. Missing and foreign resources return the same 404. DTO whitelisting rejects ownership and parent reassignment. Frontend actions additionally verify the entity matches the project in the page URL.

## Author workspace

Routes:

- `/projects/:projectId/:collection`: list, empty state, and create form.
- `/projects/:projectId/:collection/:entityId`: detail, edit form, and confirmed deletion.

A project sub-navigation separates Manuscript/Books from Worldbuilding's four collections, including inside existing book/chapter/scene pages. Pages reuse the existing shell, typography, forms, cards, loading/error/404 boundaries, API client and server-side session. Tokens remain in HttpOnly cookies and never enter page props. Forms provide pending, validation, error, success, and expired-session states. Plain text is rendered safely.

No dependencies were installed.

## Verification

- Prisma validation and 7.10.0 generation passed; database/types/API builds passed.
- All migrations were applied to the local database used by the API, and independently to a disposable PostgreSQL schema in smoke tests.
- Root lint and typecheck passed; API lint has no introduced warnings.
- API unit tests: 29 passed. HTTP tests: 39 passed, including four comprehensive entity cases covering CRUD, author/admin isolation, DTO validation, reassignment rejection, deterministic ordering and unauthenticated access.
- Frontend unit tests: 10 passed, including constrained world paths and empty 204 delete handling.
- Real PostgreSQL/API tests verified CRUD, partial updates, author isolation, validation, ordering and project cascades for every entity.
- The built author workspace was tested over HTTP with real API/PostgreSQL: real login, create/detail/edit/confirmed deletion for all four collections, private session handling and cross-author 404. No fixture data replaces the feature.

Run `pnpm --filter @rawan/api test:world:database` for the database smoke check. It creates a disposable schema, applies every migration, and drops only that schema in finally. To include the frontend HTTP flow, first build apps/app and set VERIFY_WORLD_FRONTEND=1 for that command. This extra flow exercises progressively enhanced server-action forms without adding a browser testing framework.

## Local environment limitations

The local API and database-package environment files have different DATABASE_URL values. The database-package default migration command fails with its configured connection; migrations were successfully deployed using the API connection as a temporary process environment override. Existing secrets and environment files were preserved. Align the two URLs for routine root database commands.

Default Next.js Turbopack builds fail on this Windows environment when spawning CSS helper processes with Access denied. Both the author workspace and public website production builds pass using `next build --webpack`. This verification fallback does not change the repository's default compiler.
