# Manuscript domain

The first writing domain is Project → Book → Chapter → Scene. An Author owns many Projects; a Project has many Books, a Book has many Chapters, and a Chapter has many Scenes. Scene content is plain text. The public website and author workspace have not been changed by this implementation.

## Database

The additive migration `20261004000000_manuscript` creates four tables, ownership/ordering indexes, and foreign keys. Existing User and Author records are unchanged. Deleting an Author, Project, Book, or Chapter cascades to its descendants. Deletion is permanent; there is no soft-delete or revision history yet.

Apply committed migrations to your intended development database from the repository root:

```sh
pnpm db:deploy
```

Building regenerates Prisma without applying migrations. The implementation's database smoke check applies migrations inside a temporary schema and leaves the application's tables and migration history unchanged.

## Access

Every manuscript endpoint requires an existing bearer JWT. Every database query checks ownership through the current user's Author profile; ADMIN accounts have access only to their own manuscripts. Missing resources, someone else's resources, and mismatched ancestors return 404. Writes include ownership and ancestor constraints in the Prisma mutation or parent connect operation, rather than relying on an earlier authorization check.

Project creation requires an existing Author profile (403 if absent). Existing legacy accounts without a profile are not silently modified. Empty project lists return `[]`. Child lists require a valid owned parent (404 otherwise). Ownership and parent IDs come from the authenticated user and URL; clients cannot reassign either in request bodies.

## Routes

All routes start with `/api/v1`:

| Resource | Collection path |
| --- | --- |
| Project | `/projects` |
| Book | `/projects/:projectId/books` |
| Chapter | `/projects/:projectId/books/:bookId/chapters` |
| Scene | `/projects/:projectId/books/:bookId/chapters/:chapterId/scenes` |

Each collection supports GET (list, 200) and POST (create, 201). Append `/:projectId`, `/:bookId`, `/:chapterId`, or `/:sceneId` respectively for GET (read, 200), PATCH (update, 200), and DELETE (204 without a body). Lists return flat arrays; reads return one record. Retrieve each collection to traverse the hierarchy. Responses include IDs, the immediate parent ID, title, nullable description, and ISO 8601 `createdAt`/`updatedAt`; children also include `position`, and Scenes include `content`. Shared `ApiProject`, `ApiBook`, `ApiChapter`, and `ApiScene` types describe the JSON contracts. The earlier Date-based `Project` type is preserved.

## Input and ordering

- Create requires a title, trimmed to 1–200 characters. PATCH accepts a subset of writable fields; omitted fields remain unchanged.
- Optional description accepts up to 10,000 characters. `null` clears it; omission preserves it on PATCH.
- Books, Chapters, and Scenes accept an integer `position` from 0 to 2,147,483,647, defaulting to 0. Lists sort by position, creation time, then ID. Duplicate positions are allowed, with deterministic ties. PATCH can change position without renumbering siblings.
- Scenes accept plain-text content up to 50,000 characters, defaulting to an empty string. Whitespace, line breaks, and Unicode are preserved; an empty string clears content. The existing HTTP JSON body limit still applies (approximately 100 KB), so a large encoded request can receive 413 before field validation.
- Unknown fields, blank/null titles, null positions/content, noninteger positions, and incorrect value types return 400. No implicit numeric coercion is enabled.

## Verification

The existing API HTTP test command automatically includes `manuscript.e2e-spec.ts`. It exercises the compiled production application, JWT guards, validation, every CRUD route, cross-author/admin isolation, mismatched ancestors, content persistence, ordering, and CORS preflight using isolated persistence.

For an opt-in real PostgreSQL check:

```sh
pnpm --filter @rawan/api test:domain:database
```

This requires the configured development/test database and permission to create a temporary schema. It applies all committed migrations to that randomly named schema, runs the real API and Prisma against it, verifies ownership, parent constraints, partial updates, ordering and cascading deletes, then drops only that schema in `finally`. It does not require deploying the new migration to the application's normal schema. The default CI remains independent of a live database.
