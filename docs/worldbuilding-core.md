# Worldbuilding API

Characters, Places, Factions, and Artifacts belong to Projects and are shared across their books.

## Database

Prisma models have Project relations, cascading deletion, timestamps, and project/name indexes. All have a name, optional summary and description. Characters also have role/status; the other kinds have a type. Names are trimmed to 1–200 characters, summaries allow 1,000 characters, and descriptions allow 10,000 characters. Optional fields can be cleared with null.

Migration: 20261004010000_worldbuilding. Earlier migrations are preserved; Prisma remains 7.10.0.

## Routes and ownership

All routes require bearer authentication under /api/v1. For characters, places, factions, and artifacts:

- GET/POST /projects/:projectId/:collection lists or creates.
- GET/PATCH/DELETE /:collection/:id reads, updates, or deletes.

Lists return `{ items, nextOffset }` pages and default to name then ID. They accept bounded `limit`/`offset`, validated `q`, allowlisted `sort`/`order`, and a project-owned `tagId`; see [query contracts](search-domain.md). Records use ISO timestamps; deletes return 204. Public API types live in packages/types.

Queries and mutations scope through Project → Author → User. Administrators do not bypass ownership. Missing and foreign resources return the same 404. DTO validation rejects ownership and parent reassignment.

## Verification

Run pnpm --filter @rawan/api test:e2e for isolated HTTP tests and pnpm --filter @rawan/api test:world:database for PostgreSQL coverage. The database smoke check creates a disposable schema, applies every migration, and drops only that schema in finally. It covers CRUD, validation, ordering, author isolation, partial updates, and deletion cascades.
