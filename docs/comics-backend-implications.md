# Comics and graphic narratives: backend implications

Implementation update (12 October 2026): originally Horizon 2 backend scopes N01–N26 are now implemented in bounded form; see the [current backend guide](backend-horizon-2.md) and [validation ledger](backend-horizon-2-implementation.md). These backend capabilities are available to a future frontend. Horizon 3 remains deferred and no frontend changes accompany this implementation. The study below preserves its original research baseline; its old capability gaps/horizon labels must be read alongside the current register, not as current implementation status.

## Mandatory product horizons

The [feature register](product-horizons.md) records all six required fields. Reusing queue/storage infrastructure does not promote graphic features to H1.

| Horizon                 | Major recommendations and register IDs                                                                                                                                                 |
| ----------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| H1 — Current Rawan      | Private notes/entities/plans/references and current cleanup infrastructure (C03–C09/C12); no structured comics                                                                         |
| H2 — Near future        | Work/release/locators (N01–N03/N05), series/credits (N11/N13), comic source/reader/guided/vertical/rendition contracts (N20–N23); export only with a separately supported format (N25) |
| H3 — Long-term platform | Native graphics/visual providers (L08), revisions/collaboration (L09), archive/PDF extraction imports and broader distribution (L07), advanced offline delivery (L12)                  |

Repository investigation: 12 October 2026. This is a proposed technical direction accompanying [comic product research](comics-product-research.md), not a schema specification or implemented API.

## Current backend boundary

Rawan has private Project → Book → Chapter → Scene text, project entities, relationships, plot/timeline structures, notes, tags, search, private media, cleanup jobs and optional text-AI infrastructure. None provides page/panel structure, script components, comic release delivery or reader progress.

Uploads currently allow JPEG, PNG, WebP, PDF and plain text. They validate declared type against detected content, use a default 10 MiB file limit, and remain private. `Media` stores file metadata but no image dimensions, rendition catalogue, page order, panel geometry or revision lineage. Supported attachments are PROJECT, NOTE, CHARACTER, PLACE, FACTION and ARTIFACT, not BOOK, SCENE, PAGE or PANEL. PDF upload is storage support, not PDF page extraction or a comic reader; layered art files and comic archive imports are not supported.

These findings come from the [schema](../packages/database/prisma/schema.prisma), [media DTO](../apps/api/src/media/media.dto.ts), [upload validation](../apps/api/src/media/upload-content.ts), [storage configuration](../packages/backend/src/storage/config.ts) and [API contract](contracts/backend-v1.openapi.json).

## Proposed domain responsibilities

| Future concept                | Backend responsibility                                                                                               |
| ----------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| Graphic-content source        | Link a comic's private structure to an owned project and future work identity; preserve existing prose IDs/contracts |
| Series / volume / installment | Explicit membership, labels and ordering without requiring every grouping level                                      |
| Page / vertical segment       | Stable identity, order, role, dimensions, asset/version reference and accessible content                             |
| Spread                        | Explicit relationship or composed asset representation; preserve whether it is authored or just a reader pairing     |
| Panel                         | Stable identity, reading order and optional region relative to the referenced artwork version                        |
| Script component              | Action, dialogue, caption or sound effect with ordered placement and optional speaker reference                      |
| Appearance / setting          | Validated links to owned characters/places; no inferred visual recognition                                           |
| Revision                      | Defined retention and replacement behavior for script/art/lettering and related metadata                             |
| Graphic release               | Reader-safe snapshot/representation, supported reading modes, direction and authorized asset delivery                |
| Reader state                  | Per-user release-aware progress and later bookmarks/annotations                                                      |

Do not map panels to `Scene` records or encode all structure in a note/description JSON string. Scenes remain narrative planning units. A scene may relate to many panels and pages; panel geometry and page layout belong to a graphic-content contract.

Do not implement every concept before a first milestone. An imported-page reader can begin without structured script components, series hierarchies or guided-panel geometry. It still requires explicit page order, suitable assets, reading direction, accessibility content and a publication/access boundary.

## Reuse versus extension

| Existing subsystem          | Reuse                                                 | Needed extension                                                                 |
| --------------------------- | ----------------------------------------------------- | -------------------------------------------------------------------------------- |
| Projects/accounts           | Private ownership and identity                        | Future work/release association and reader permissions                           |
| Characters/places           | Story reference data                                  | Validated page/panel appearance links; released projections if exposed           |
| Relationships/timeline/plot | Narrative planning                                    | New link targets only through explicit validated contracts                       |
| Notes                       | Research and rough script text now                    | Structured script parts, attribution/order if required                           |
| Media/storage               | Upload validation, private files and cleanup patterns | Graphic assets, dimensions, renditions, associations and release asset lifecycle |
| Tags/search                 | Existing private resource kinds                       | Deliberately add graphic/script kinds; separately index released metadata        |
| Worker queues               | Existing infrastructure patterns                      | Image processing and extraction jobs with their own durable status/limits        |
| AI                          | Existing proposal-only pattern                        | Any comic-specific task/provider/context capability requires independent support |

No cross-project association should bypass current ownership validation. Published supplementary relationships must reference only reader-safe selected targets. Reference art and finished page artwork require distinct association meaning, even if they reuse the same storage service.

## Artwork pipeline and delivery

Proposed image processing should preserve originals privately and generate identified display/thumbnail renditions with measured dimensions, aspect ratio, byte size, format and processing status. Define orientation normalization and metadata handling so panel coordinates reference the final canonical image orientation. Original artwork should not become publicly downloadable merely because a reader rendition is published.

Byte limits alone are insufficient for image decoding workloads. A future pipeline needs decoded-pixel/dimension limits, bounded memory/time, validated processing outputs and safe handling of corrupt or oversized files. PDF rasterization and ZIP/CBZ ingestion would be separate additions with page-count/decompression bounds and safe path handling; do not infer them from PDF storage support.

Reader manifests can describe stable ordered items and available renditions. Cache identity should follow release/asset versions. Preloading is primarily a client scheduling concern, while backend delivery must enforce access and produce predictable asset responses. Restricted assets need an authorization-aware delivery policy; public delivery is allowed only for intentionally public release assets. A CDN or object store is a future deployment decision, not installed capability.

Tall vertical content may need bounded segments to control decoding and mobile memory. Segment boundaries must preserve the authored composition and order. Guided-panel regions should use validated canonical coordinates plus sequence, with deliberate handling of irregular/overlapping panels. Normalized coordinates can accommodate different rendition sizes, but cannot survive arbitrary artwork cropping/replacement without revalidation.

## Publication, revisions and progress

Private edits must not silently change an existing reader release. A replacement page asset can invalidate panel geometry, dialogue placements and progress anchors. Validate these dependencies and require a release update policy. Reader navigation needs an explicit total order, not filenames or duplicated editable positions.

Progress should identify a release version and stable content item, optionally a panel or within-segment fraction. Store no DOM-specific pixel offsets as the sole cross-device anchor. A publication update needs a mapping or defined fallback; percentage alone is insufficient when pages are inserted or reordered. Resolve conflicting progress writes across devices intentionally rather than assuming the furthest position is always the desired resume location.

Define spread behavior for covers, blank pages and RTL progression. Keep artwork orientation, page progression, language direction and reader presentation mode separate. Chapter/issue boundaries can have their own labels without changing panel order inside a page.

Published assets cannot depend blindly on current source deletion cascades and media cleanup. A retention policy must preserve referenced release assets or withdraw their release deliberately. Readers' personal state must be identity-scoped and separate from creator editing rights.

## Text, accessibility and search

Image-only artwork is not structured dialogue. A creator-supplied transcript/description can be a first supported accessibility representation without committing to a native lettering editor. If structured lettering is later introduced, distinguish speech, captions and sound effects, optional speaker identity, language and ordered reading sequence.

Store accessible text with the content/release version it describes. Specify which portions can be searched and exposed: private script search and public released transcript search are different policies. No OCR, machine-generated descriptions or multimodal AI capability exists by default. W3C's [fixed-layout accessibility guidance](https://www.w3.org/TR/epub-fxl-a11y/) informs the product requirement; it does not certify Rawan's future implementation.

## Evolution and proposed validation

The first backend proposal should cover owned imported pages, validated ordering, direction, authored spreads where needed, creator-supplied accessible text, image processing/delivery and release-safe reader access. Reuse future Work/Release foundations rather than creating an unrelated comic account or publishing system. Keep prose editing unchanged.

Later add vertical segments, series/issue structure, guided panels, structured scripts and appearance links through separately reviewed contracts. Use additive migrations and explicit public response types; preserve the existing OpenAPI behavior. Production image processing would need tested jobs, retries, cleanup and status reporting rather than reusing the queue-health endpoint as job polling.

Future tests should cover project isolation; release asset authorization; private-script exclusion; ordered RTL/cover/spread behavior; page replacement invalidating guided metadata; oversized/corrupt image limits; cleanup with published references; per-user progress; and predictable resume after updates. Client validation additionally covers zoom, bounded preloading, weak connectivity and accessibility navigation.

No schema, association enum, route, worker, import/export feature or comic reader is added during this research.
