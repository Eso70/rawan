# Unified worldbuilding relationships

Backend/database/API only. The existing relationship implementation was retained and hardened on 2026-10-05. No packages were installed or upgraded, and the reserved application folders remain empty.

## Architecture and database integrity

One project-scoped Relationship table connects Character, Place, Faction, and Artifact in all 16 combinations. Strongly typed WorldEntityKind and RelationshipDirection enums describe endpoint kinds and direction. Each endpoint has one of four concrete foreign keys. This preserves existing entity IDs and CRUD APIs without a registry backfill or separate tables for each kind pair.

Composite (projectId, entityId) foreign keys prove that both endpoints belong to the same Project, even when two projects share an author. CHECK constraints require exactly one matching endpoint column on each side, reject self-links, validate type keys/labels/notes, and require canonical symmetric ordering. Project and endpoint deletion cascades remove relationships. No soft deletion is introduced.

The existing 20261005000000_relationships migration is unchanged. The new 20261005010000_relationship_type_filter migration adds (projectId, typeKey, createdAt) for exact type filtering and chronological listing. Existing project/date and project/source-or-target indexes support project lists and incoming/outgoing entity queries. PostgreSQL can combine the endpoint indexes for the OR query. No speculative graph indexes were added. Prisma CLI, Client and adapter remain 7.10.0.

## Semantics and identity

DIRECTIONAL preserves source → target. SYMMETRIC canonicalizes endpoints by ASCII kind:id ordering and stores one row. Reversed symmetric pairs therefore share an identity; reversed directional pairs remain different. IDs accepted by DTOs are ASCII, matching PostgreSQL's C-collated comparison.

Duplicate identity is project + normalized typeKey + direction + ordered typed endpoints. A database expression unique index enforces it atomically, including concurrent inserts. Different type keys allow multiple meanings between the same two entities. Changing a display label or notes does not create a new meaning. An entity cannot link to itself, but equal IDs in different entity tables are distinct entities.

Type keys are custom strings normalized to uppercase with whitespace/hyphens replaced by underscores, using the pattern [A-Z][A-Z0-9_]{0,63}. There is no enum of relationship meanings. Display labels are independent Unicode strings, trimmed to 1–100 characters. Optional descriptions allow 10,000 characters; null clears them. No localization system is implemented.

## REST contract

All routes are under /api/v1 and require bearer authentication.

| Method | Route                              | Result                   |
| ------ | ---------------------------------- | ------------------------ |
| POST   | /projects/:projectId/relationships | Create, 201              |
| GET    | /projects/:projectId/relationships | List, 200                |
| GET    | /relationships/:id                 | Detail, 200              |
| PATCH  | /relationships/:id                 | Partial update, 200      |
| DELETE | /relationships/:id                 | Delete, 204 with no body |

Create example:

```json
{
  "source": { "kind": "CHARACTER", "id": "character-id" },
  "target": { "kind": "PLACE", "id": "place-id" },
  "typeKey": "born-in",
  "label": "born in",
  "direction": "DIRECTIONAL",
  "description": null
}
```

Direction defaults to DIRECTIONAL. Responses contain id, projectId, typeKey, label, direction, description, ISO createdAt/updatedAt, and source/target summaries containing id, kind and name. Internal endpoint columns and authentication fields are never exposed.

GET accepts entityKind + entityId together to retrieve links in which that entity is either source or target. Optional typeKey filters the normalized exact relationship meaning and can be combined with the entity filter. Unsupported/extra/malformed query parameters return 400. An inaccessible or nonexistent filter entity returns 404.

PATCH permits source, target, typeKey, label, direction and description; omitted fields remain unchanged. Project, owner, ID and timestamps cannot be reassigned. Changing endpoints is supported for compatibility with the existing API, with full same-project/ownership validation and symmetric recanonicalization. Changing only a label must not restore stale endpoints or direction: the entire read/validate/update operation runs in a serializable transaction. Serialization/deadlock conflicts retry at most three times, rereading current state on each attempt; exhaustion returns 409. Transactions issue queries sequentially on their single connection.

Part 9 normalizes lists to `{ items, nextOffset }` pages, defaulting to createdAt descending then ID ascending. Validated `limit`/`offset`, `q`, and allowlisted `sort`/`order` now coexist with type/entity filters. See [query contracts](search-domain.md). Entity filtering avoids requiring clients to fetch every project link.

## Ownership and errors

Collection and item operations resolve Relationship → Project → Author → authenticated User. Endpoints are independently resolved within that project and owner. ADMIN has no ownership bypass. Missing and inaccessible resources both return 404. Every mutation scopes ownership; client-supplied IDs or kinds do not establish access.

Strict global DTO validation rejects extra fields, nested mass assignment, unsupported kinds, invalid IDs, invalid semantics and oversize content. Self-links and invalid field combinations return 400. Duplicate conflicts and exhausted concurrent-update retries return 409. Missing/vanished foreign-key resources return 404. Missing, invalid, or expired bearer tokens return 401. Standard NestJS exceptions are used without a custom response envelope.

Shared API contracts remain separate from generated Prisma models: WorldEntityKind, WorldEntityReference, RelationshipDirection, ApiRelationship and RelationshipInput. RelationshipInput now reflects the optional defaulted direction. RelationshipFilters was added and is implemented by the validated query DTO.

## Automated testing and safe database setup

```sh
pnpm test
pnpm test:e2e
pnpm --filter @rawan/api test:relationships:database
```

Unit tests include 32 new relationship-service cases plus existing identity-policy tests. They cover all kind pairs, project/entity/type retrieval, safe serialization, missing/foreign endpoints, self-links, canonicalization, duplicate/error mapping, safe partial updates, serializable retry limits and ownership-aware deletion.

Twenty-one new HTTP tests exercise the compiled production Nest application, actual JWT guards and DTO metadata, and the real relationship service with isolated in-memory persistence. They cover POST/GET/PATCH/DELETE, response contracts, incoming/outgoing/type filtering, all unauthenticated routes, author/admin isolation, missing/foreign/same-owner cross-project endpoints, query validation and mass-assignment rejection. They require no live database; SQL behavior is tested separately.

The PostgreSQL test requires TEST_DATABASE_URL explicitly, read from the process environment or apps/api/.env. Configure a test/development PostgreSQL connection with permission to create schemas; never supply production credentials. The script refuses NODE_ENV=production and missing/invalid test configuration before connecting. It creates a random schema, applies every migration only inside that schema, overrides Nest's Prisma provider with a schema-scoped client, and drops only that schema in finally. Existing public tables, accounts and migration history are untouched.

It proves all 16 kind pairs, normalized type/entity filters, CRUD, two-author and same-owner project isolation, invalid DTOs, direct SQL constraint rejection, directional/symmetric duplicate rules, concurrent duplicate creation, concurrent partial PATCH merging, and Character/Place/Faction/Artifact/Project cascades. Tests intentionally pass a verified local development connection as TEST_DATABASE_URL through a temporary process environment, preserving local configuration files.

## Verification on 2026-10-05

- Prisma format, validation and generation passed with 7.10.0.
- Database/types/API and root builds passed; root typecheck passed.
- Root lint and formatting passed.
- 64 unit tests passed, including the 32 new service cases.
- 60 HTTP tests passed, including the 21 new relationship cases.
- Real PostgreSQL relationship tests passed, with disposable-schema cleanup.
- Missing test configuration was explicitly verified to fail safely.
- Prisma migrate deploy applied all five migrations to a separate disposable schema; migrate status reported up to date, then that schema was removed.
- The normal configured database still has the new index migration pending. Apply it intentionally with pnpm db:deploy, then regenerate with pnpm db:generate and restart the API. No normal-schema migrations were applied by this task.

## Remaining backend work

No Swagger/OpenAPI infrastructure exists; none was installed. Machine-readable API documentation is a later hardening task. No relationship history, events, date ranges or inverse-label localization are implemented. Adding another entity kind requires enum, endpoint columns, constraints and resolver updates; revisit a common entity registry only when more kinds justify the migration cost.

The PostgreSQL smoke test currently emits a pg driver deprecation warning for overlapping queries inside the existing Prisma adapter path; checks pass, and no driver/Prisma upgrades were performed to suppress it. Investigate alongside future compatible adapter upgrades.
