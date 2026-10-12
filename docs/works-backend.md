# Private Work backend

Implemented 12 October 2026. This is a backend-only foundation: a stable private creative identity linked explicitly to existing manuscripts. The later [expanded backend](backend-horizon-2.md) now adds publishing, public credits, editions, reader/library state and imported comic structures through separate contracts. This document describes the compatible private foundation.

See [ADR 0001](adr/0001-private-work-identity.md) for ownership, cardinality and deletion decisions, and [product horizons](product-horizons.md) for remaining scope.

## API

All routes are relative to `/api/v1`, require JWT authentication and enforce account ownership. Missing and inaccessible resources return 404. ADMIN does not bypass ownership.

| Method / route                    | Behavior                                                                                            |
| --------------------------------- | --------------------------------------------------------------------------------------------------- |
| GET /works                        | Bounded owned Work list; title/description `q`, title/createdAt/updatedAt sort, order, limit/offset |
| POST /works                       | Create title and optional description; owner comes only from authentication                         |
| GET /works/:workId                | Private identity detail                                                                             |
| PATCH /works/:workId              | Update title/description; omitted fields preserved, null description clears it                      |
| DELETE /works/:workId             | Remove Work and source associations; preserve manuscript content/projects                           |
| GET /works/:workId/sources        | Bounded association list, createdAt/id order                                                        |
| POST /works/:workId/sources       | Link `{ projectId, bookId }`; both manuscript and Work must belong to this account                  |
| DELETE /works/:workId/sources/:id | Unlink only this association                                                                        |

Work responses expose id, title, description and ISO timestamps. Source responses expose id, workId, projectId, bookId and createdAt. Collections return `{ items, nextOffset }` with default 50, maximum 100. Text/IDs use the existing validation conventions. Unsupported fields such as workType, cover, ownerUserId or publicationStatus are rejected.

A Work can be empty or link several owned manuscripts, including manuscripts in different owned projects. A manuscript can link to several private Works. Duplicate links to the same Work return 409. Source associations do not establish a series, content order or public visibility.

Deleting a manuscript/project unlinks its sources while preserving the private Work. Deleting an account removes its private Works. Any future public release must define a separate retention/access lifecycle; these private cascades cannot be copied automatically into publishing.

## Database and verification

The additive `20261012010000_private_work_identity` migration creates Work/WorkSource without rewriting existing records or inventing Works from existing Books. Other checkouts apply it with `pnpm db:deploy` and generate the client with `pnpm db:generate`.

`pnpm --filter @rawan/api test:works:database` requires explicit loopback `TEST_DATABASE_URL`. It applies committed migrations only in a disposable schema and removes that schema afterward. It tests existing-data preservation, real HTTP validation, owner/admin isolation, duplicate and mismatched links, paging and deletion behavior. It never falls back to an application database URL or registers cleanup queues.

The reviewed OpenAPI contract adds eight operations and five schemas. Every pre-existing operation and schema was compared unchanged before updating the baseline. Private project search and tag/media association enums are unchanged; Works are not silently added to those systems.
