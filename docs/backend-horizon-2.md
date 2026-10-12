# Rawan expanded backend

The Horizon 2 expansion was implemented with zero frontend changes in that phase. Originally Horizon 2 scopes N01–N26 are implemented as bounded backend capabilities; Horizon 3 remains deferred. Subsequent authorized authentication work adds verified email signup and login UI, retires unverified direct registration, and brings the reviewed contract to 268 operations. Other existing operations remain compatible. See [email auth](email-auth.md) for this explicit security-related contract change. Research documents preserve the original studies; this guide and the implementation ledger describe current behavior.

## Work-centered foundation

User owns Work; existing Author → Project → Book → Chapter → Scene ownership stays intact. WorkSource explicitly links existing manuscripts without copying them. WorkDocument supports optional simpler/semantic prose. ComicDocument separately organizes imported graphic work. A work can omit all worldbuilding modules. Product classifications are metadata, not requirements to manufacture a fictional world or a new manuscript hierarchy.

Public CreatorIdentity personas, credits, editions, series/anthology memberships and related works are separate from private accounts and projects. Multiple public pen names do not disclose their common manager. Credits never grant edit rights. Edition metadata supports WEB/EPUB/PDF/PRINT/GRAPHIC descriptions and optional ISBN-13/DOI; describing a PDF/print edition does not promise PDF export or distribution. ISBN checksum validation does not verify assignment.

## Publication and reader boundary

Preparing a release copies selected manuscript sources or structured documents, metadata, credits, optional edition, approved assets, related works and explicitly selected supplements. It starts DRAFT; owners can inspect prepared metadata, credits/assets/supplements and prose/graphic snapshots. Explicit publication makes the release publicly/free readable. Withdrawal blocks all public content, search, navigation and asset reads. Withdrawal is terminal; publish a new snapshot to update content. Draft/withdrawn snapshots can be deleted, and version numbers are never reused.

Source edits/deletion preserve snapshots. Work/account deletion removes releases and their access. Public bylines are approved copies; changing or removing a public persona hides its profile link without rewriting released attribution. Private notes, account/project/source IDs, storage keys, private appearance links and unselected lore are not exposed. Released relationships use new public supplement IDs. Selected maps copy safe geometry and an explicitly approved processed image. Source references are never made anonymous.

The catalogue supports literal title/synopsis search, exact genre/topic/language/medium filters and stable title/publication sorting. Its entries are eligible release/edition snapshots; `/catalog/works/:id` resolves the latest eligible version, and `/catalog/works/:id/releases` supports edition/version selection. Explicit public profiles, series and shared/editorial collections connect works without recommendations or commerce.

Prose reading uses paginated ordered sections/blocks, source-component group titles, semantic kinds and linked footnotes. Graphic reading uses paginated stable pages/segments, accessibility transcripts, LTR/RTL direction, authored guided panels and validated spreads. Public content is plain text or canonical image renditions, never an editable creator workspace. Client typography, zoom/fullscreen and device interactions are outside this backend task.

## Private reader and creator state

Library entries support reading status, favorites and manual collections. Public collection projections exclude personal status and account/entry IDs; editorial collections require ADMIN. Saving a work grants no access. Deletion leaves minimal approved unavailable library metadata. Reader progress, furthest progress, recency/history, bookmarks, highlights and notes are account-private, separate from author Notes. Stale progress updates return 409. Resume maps stable server-private keys to the target release or explicitly falls back to its start; no private source IDs are returned.

Preferences have validated values, optimistic revisions and null-to-inherit resets. GLOBAL → CREATOR → PROJECT and GLOBAL → READER → WORK precedence is explicit. Themes, accent, motion preference, typography, width/spacing/margins, focus and comic mode are portable; device geometry/session choices remain local. Saved views validate actual resource sort/filter options, owned manuscript/timeline/plot parents and tags, with optional module arrangements. Preferences never grant permissions.

Research sources record authors, identifiers, dates, URLs and provenance, with optional owned project Media and citations into owned document blocks. Sources/citations remain private; an explicit bibliography selection publishes approved bibliographic metadata. Maps/pins/regions and canvas nodes/edges remain project-owned private tools. They are optional modules, not a global World model.

## Processing, limits and operation

Artwork imports copy owned JPEG/PNG/WebP Media into retained Work assets, independent of the source file. Originals are private, immutable and bounded to 10 MiB each and 500/512 MiB per work. Worker decoding is bounded by dimensions/pixels/time, strips metadata and normalizes orientation. Only FULL/DISPLAY/THUMBNAIL WebP renditions are public through approved release/avatar access. Artwork replacement invalidates authored panels. Graphic content uses imported art/scripts; native drawing, OCR and automatic panel detection remain deferred.

Artwork and export records are durable PostgreSQL jobs with conditional leases and fenced completion. The existing worker processes them and retries cleanup through ArtifactBlob records that survive parent deletion. API and worker must share the configured storage path/database. An expired execution can recover; exhausted jobs fail safely. Invalid decoding/rendering exposes safe codes. A corrected image is imported as a new version. The worker, not an API request, performs native rendering/export work.

Prose exports support actual TXT, escaped HTML and EPUB from an owned immutable release snapshot, including private drafts/withdrawn snapshots. Results are private downloads. EPUB includes contents, ordered XHTML and footnotes; PDF export is not advertised. Release prose is bounded to 200 sections/1,000 blocks/4 MiB text; documents to 100 sections/1,000 blocks, graphic releases to 500 pages, credits to 30, and release counts to 100 per work. HTTP bodies remain capped at 1 MiB, so large structured updates must fit that request limit. All lists have explicit bounds; no silent release-content truncation is permitted.

AI stays disabled by default. Existing simulator tests remain supported; production text proposals can use the optional OpenAI adapter with an explicit model, server secret and `AI_EXTERNAL_PROCESSING_ENABLED=true`, consistently configured in API/worker. Calls use the fixed endpoint, text only, bounded input/output and no tools or stored response retrieval. External submissions get one attempt to avoid automatic duplicate billing after a crash/timeout. No live provider call was made during validation. Configuration and provider availability must be verified by the deployment operator before enabling it.

All API responses use private/no-store caching. Inaccessible resources return scoped 404; malformed input, inconsistent locators and unsupported options fail validation. Unknown DTO fields are rejected. Preparation, upload and search requests have narrower request budgets. No production records, catalogue entries or public profiles are seeded by these migrations.

## Capability coverage

| Original scope | Current backend/data                                                            | Frontend implication                         | Decision      |
| -------------- | ------------------------------------------------------------------------------- | -------------------------------------------- | ------------- |
| N01/N02        | Work, approved metadata, immutable releases, deliberate publish/withdraw/delete | Explicit prepare/preview/publish flow        | ADR 0002      |
| N03            | Released prose sections/blocks and safe navigation                              | Calm reader separate from writing            | ADR 0003/0004 |
| N04            | LibraryEntry, status/favorites, collections/members                             | Personal library with unavailable states     | ADR 0003      |
| N05            | Revisioned reading state, recency, resume mapping, bookmarks                    | Continue reading across devices              | ADR 0003      |
| N06            | Private anchored ReaderAnnotation and captured quote                            | Highlights/notes, no public comments         | ADR 0003      |
| N07            | Literal released-block search with short snippets                               | Navigate to approved reader locations        | ADR 0003      |
| N08            | WorkDocument sections/semantic blocks/footnotes                                 | Optional simpler prose editor/reader         | ADR 0004      |
| N09            | Eligible release catalogue, filtering, work/version lookup                      | Content-first discovery                      | ADR 0002      |
| N10            | Metadata, genres/topics/warnings/language, processed covers                     | Work identity/cards/detail                   | ADR 0002/0005 |
| N11/N12        | Public managed personas, biography/links/avatar, credits                        | Author profiles and pen-name selection       | ADR 0002      |
| N13            | Ordered series/anthologies, approved related-work links                         | Grouping and reader-safe related navigation  | ADR 0002      |
| N14            | Explicit shared collections, ADMIN editorial collections                        | Curated lists, no recommendations            | ADR 0003      |
| N15            | Selected copied lore/events/relationships/maps and approved images              | Contextual exploration with no draft leakage | ADR 0002/0004 |
| N16            | Revisioned scoped preference values and effective resolution                    | Portable creator/reader defaults             | ADR 0003      |
| N17            | Validated saved views/owned parent IDs/module arrangements                      | Optional configurable creator tools          | ADR 0003      |
| N18            | Structured private sources/citations and explicit bibliography projection       | Reference library and citation navigation    | ADR 0004      |
| N19            | Private maps/pins/regions and spatial canvas nodes/edges                        | Optional spatial interfaces                  | ADR 0004      |
| N20            | Immutable graphic manifests/approved renditions                                 | Image-first reader                           | ADR 0005      |
| N21            | Comic documents/pages/scripts and private appearances                           | Imported-art/script organization             | ADR 0005      |
| N22            | Vertical layout, authored panels, validated spreads/direction, graphic locators | Responsive vertical/guided/page reading      | ADR 0003/0005 |
| N23            | WorkAsset/ArtifactBlob, native processing, leases and retained renditions       | Processing status and bounded image loading  | ADR 0005      |
| N24            | Optional real text adapter atop existing proposal jobs/context checks           | Deliberate optional text assistance          | ADR 0006      |
| N25            | ExportJob snapshots, TXT/HTML/EPUB and private results                          | Explicit preparation/download                | ADR 0005      |
| N26            | WorkEdition format/identifiers copied into approved releases                    | Edition-aware selection                      | ADR 0002      |

No additional backend gap exists for these bounded implemented scopes. Expansions beyond them require their own proposal/ADR; they are not silently claimed. H3 commerce, lending/import/distribution, communities, recommendations/trending, collaboration, global/shared universes, native artwork/visual AI and offline distribution remain absent.

## Validation and developer commands

The reviewed [OpenAPI](contracts/backend-v1.openapi.json) and [route inventory](api-route-inventory.md) are the contract. [Implementation ledger](backend-horizon-2-implementation.md) records final check results. The isolated platform database suite migrates a disposable schema, validates real HTTP responses against OpenAPI and processes real bounded artwork/EPUB files with isolated storage. It never resets the application database or calls a real AI provider.

Use `pnpm db:deploy` to apply committed additive migrations and `pnpm db:generate` to regenerate the database client. The local database has all 21 migrations applied. Restart API and worker after updating. Tests require explicit loopback `TEST_DATABASE_URL`; the regression runner never infers permission to modify application data. The platform suite is `pnpm --filter @rawan/api test:platform:database`. No frontend build or modification is needed for this backend change.

The worker also requires `REDIS_URL` for existing maintenance/AI queues. Both queue integration suites passed using an isolated Redis 8.0.6 process built from official source under WSL; that temporary process was stopped afterward. Current API/worker `.env.local` files configure the same loopback Redis endpoint on port 6379, which responds to PING. Installed Windows Redis 5.0.14.1 triggers BullMQ compatibility warnings; use the repository's Redis 8 service in `compose.dev.yml` (Docker is currently unavailable here) or configure another supported Redis instance for normal operation. New artwork/export processing also passed real database/file tests. AI remains disabled until explicitly configured.
