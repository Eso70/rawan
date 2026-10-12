# Book and work identity: research and gap analysis

Implementation update (12 October 2026): originally Horizon 2 backend scopes N01–N26 are now implemented in bounded form; see the [current backend guide](backend-horizon-2.md) and [validation ledger](backend-horizon-2-implementation.md). These backend capabilities are available to a future frontend. Horizon 3 remains deferred and no frontend changes accompany this implementation. The study below preserves its original research baseline; its old capability gaps/horizon labels must be read alongside the current register, not as current implementation status.

## Mandatory product horizons

The [feature register](product-horizons.md) adds horizon and ADR requirements to the field-by-field evidence below. Candidate metadata is not permission to add fields.

| Horizon                 | Major recommendations and register IDs                                                                                                                                                                                                                       |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| H1 — Current Rawan      | Private title/description/hierarchy (C02), project supporting material (C03–C08), honest presentation labels (C10)                                                                                                                                           |
| H2 — Near future        | Work/release identity (N01/N02), public metadata/covers/language/warnings/dates/classification (N10), attribution/personas (N11/N12), series/related works (N13), edition/ISBN/product identifiers (N26), reader state (N05/N06), selected supplements (N15) |
| H3 — Long-term platform | Broad cross-format ecosystem (L01), shared universes (L02), full external cataloguing/distribution/import (L07), team identity/collaborative rights (L09/L10)                                                                                                |

Reviewed on 12 October 2026 against the current database, DTOs, shared response types and reviewed API contract. This is a future model analysis, not authorization to add any listed field. No schema, API or frontend metadata change is implemented.

See [creator identity research](creator-identity-research.md) for the distinction between private accounts, project ownership, public attribution and multiple pen names.

## Research basis

IFLA's Library Reference Model distinguishes the creative work from its expression, manifestation and individual item. The consulted December 2017 reference is useful conceptual background; Rawan need not reproduce a full library cataloguing model. It helps distinguish a literary identity from a particular translation, edition or copy. [IFLA LRM reference](https://www.ifla.org/wp-content/uploads/2019/05/assets/cataloguing/frbr-lrm/ifla-lrm-august-2017_rev201712.pdf).

The International ISBN Agency explains that different language editions and publication formats need separate ISBNs and that an ISBN continues to identify an edition after it goes out of print. ISBN is therefore an optional external identifier at the appropriate publication-product level, not a universal Rawan work identifier or access credential. [ISBN assignment](https://www.isbn-international.org/node/88).

Schema.org's Book vocabulary includes edition, format, illustrator, ISBN and page count alongside broader creative-work attribution and descriptive properties. It is a useful future interoperability vocabulary, not a database migration plan or proof that Rawan implements those properties. [Schema.org Book](https://schema.org/Book).

The architecture and field-placement recommendations below are Rawan-specific inferences from those references and the repository.

## Existing identity and API

The manuscript hierarchy remains User → Author → Project → Book → Chapter → Scene. Each Book has an opaque internal ID and belongs to one owned Project. Private Work identities now belong to User and connect Books through explicit WorkSource associations. Edition, Release, Publisher, Contributor, Series and reader-state models remain absent.

`ApiBook` currently returns exactly:

```text
id, projectId, title, description, position, createdAt, updatedAt
```

Create/update Book DTOs accept title, description and position. Titles are trimmed and validated to 1–200 characters; optional descriptions accept up to 10,000 characters. Unknown request fields are rejected by API validation, so unsupported metadata cannot be sent merely by adding inputs to a frontend form.

`ApiProject` additionally exposes `authorId`, but that identifies the project's ownership profile. It is not a returned list of credited authors/contributors. The database Author has display name, biography and avatar fields; no public Author CRUD/profile contract exposes a bibliographic attribution system. The Book response does not include chapters, chapter counts or a nested author; chapters/scenes have separate list/detail operations.

Timestamps describe database resource creation/update, not publication dates. Book positions order manuscript containers inside a project, not volumes or series entries. Scene content is a text string, not an edition's structured reading manifest.

## Proposed identity layers

| Layer                             | Purpose                                                                                    | Must not be confused with                    |
| --------------------------------- | ------------------------------------------------------------------------------------------ | -------------------------------------------- |
| Private source project/manuscript | Editable content, research and supporting organization                                     | A public catalogue item                      |
| Work                              | Stable identity and broad descriptive/attribution relationships across supported forms     | A mutable title, URL slug or ISBN            |
| Edition/representation            | Specific language, format or edition where the product needs that distinction              | Every routine draft save                     |
| Rawan release                     | An intentionally made-available version with readable content and access/withdrawal policy | A bibliographic edition or a draft timestamp |
| Reader relationship               | Saved work, reading status, progress, favorites and annotations                            | Shared public work metadata                  |

A minimal first publishing milestone can use Work and a supported Release without implementing a complete expression/edition/item system. It should nevertheless leave a deliberate path for edition-specific metadata. A Rawan release update does not automatically constitute a new bibliographic edition; define the relationship when external publication metadata becomes supported.

Titles can change; different works can share a title; a creator can have a pen name; one work can have several contributors. Internal identity should remain stable through those changes. Existing Book IDs must keep their manuscript meaning and remain compatible with owner APIs. A future Work-to-source association can preserve those IDs without automatically treating one project or every Book as a published work.

## Field-by-field gap analysis

**Supported** means directly represented in the current private contract. **Partial** means useful source information exists but does not fulfill the reader/publication requirement. **Missing** means no dedicated representation/API supports it.

| Future metadata             | Current database/API evidence                                 | Gap                                                                         | Suggested future responsibility                                                           |
| --------------------------- | ------------------------------------------------------------- | --------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| Title                       | Project/Book/Chapter/Scene title; Book DTO and response       | Supported privately; public identity missing                                | Work display title, with edition/release-specific variants where needed                   |
| Subtitle                    | No dedicated field                                            | Missing                                                                     | Work/edition display metadata, separate from title                                        |
| Cover                       | Private Media exists; attachment kinds exclude Book           | Partial infrastructure only; no book-cover relation/delivery                | Selected edition/release asset with public/access policy and fallback                     |
| Description / synopsis      | Nullable Book/Project description                             | Partial: no separation of private synopsis and approved public blurb        | Explicit reader-facing description; preserve private planning synopsis                    |
| Author(s)                   | Project → one Author ownership profile; `ApiProject.authorId` | Partial: ownership is not multi-author credit                               | Explicit work attribution identities, roles and ordered display credits                   |
| Contributors                | No contributor records/roles                                  | Missing                                                                     | Work or edition-specific illustrator, translator, editor and other agreed roles           |
| Series                      | Multiple ordered Books in a Project                           | Missing: containment/order is not series membership                         | Explicit related-work group and membership order                                          |
| Volume / issue              | No publication grouping fields                                | Missing                                                                     | Edition/series/serial grouping with separate display labels and ordering                  |
| Genres                      | No book/work genre field                                      | Missing                                                                     | Curated discovery classification appropriate to supported work forms                      |
| Tags                        | Project-owned Tag and bounded assignment kinds; Book excluded | Partial private organization only                                           | Separate public labels and reader personal tags; no automatic exposure of project tags    |
| Language                    | No content-language field                                     | Missing                                                                     | Readable representation/edition language, with mixed-language support when needed         |
| Edition                     | No edition identity or version metadata                       | Missing                                                                     | Explicit edition semantics; do not substitute `updatedAt`                                 |
| Publication status          | No Book/Project publication lifecycle                         | Missing                                                                     | Release publish/withdraw/access state, distinct from editorial status                     |
| Publication date            | `createdAt`/`updatedAt` only                                  | Missing                                                                     | Relevant edition publication date versus Rawan release timestamp                          |
| Publisher                   | No publisher record or publication association                | Missing                                                                     | Edition/publication attribution; self-publishing must remain possible                     |
| ISBN / other identifiers    | Opaque internal resource IDs only                             | Missing external identifiers                                                | Typed external identifiers on the qualifying edition/product; preserve Rawan internal IDs |
| Page / chapter information  | Chapter/scene hierarchy, titles and positions                 | Partial structure; no reading manifest, page count or explicit count fields | Release contents/navigation; edition-specific print/fixed page information                |
| Content warnings            | No dedicated field or classification                          | Missing                                                                     | Intentional release/edition disclosure with policy, source and spoiler treatment          |
| Reading progress            | No per-reader progress model/API                              | Missing                                                                     | Account-scoped release-aware location; never a shared Book field                          |
| Related works               | World-entity relationships exist within a project             | Missing work-to-work relationship semantics                                 | Explicit typed relations such as sequel, translation or adaptation where supported        |
| Supplementary world content | Private entities, relationships, timelines and media          | Partial source data; no reader-safe exposure                                | Selected release-safe supplementary projection and validated links                        |

The existing Tag assignment enum covers notes, characters, places, factions, artifacts, scenes, timeline events and plot points. The presence of ancestry fields on assignment records does not add Book/Chapter tagging. The media attachment role string likewise does not add Book cover support beyond its validated resource kinds.

## Ownership, attribution and presentation

Keep editing ownership separate from credited authorship. A project owner may be managing an anthology or an illustrated collaboration; crediting another person must not automatically grant edit access. Conversely, an editor's future membership must not automatically label them as the author. External contributor identities, organizations and pen names need a scoped decision rather than requiring every credited person to have a login.

Use a single work identity consistently across detail pages, reader libraries, series lists and related-work links. Use the selected edition/release for its cover, language, format and readable content. Personal progress/status appears as an account-specific overlay, not part of a cacheable public metadata object.

Creator UI may show private title/synopsis and working assets. Public discovery and reader UI must show only approved metadata. A public description cannot be copied indiscriminately from a plot synopsis containing spoilers. The same distinction applies to cover drafts, private reference art, tags and unpublished character identities.

A prose reader needs chapters and addressable sections, not a fabricated universal page count. Reflowable pages change with typography and viewport. Fixed-layout comics and print editions have different pagination semantics. Counts require a defined content/version scope and server support rather than guessing from the first paged chapter response.

## Metadata integrity and compatibility concerns

- **Identifiers:** internal IDs remain opaque and permanent for their resource. ISBN validation should distinguish syntax/checksum from verified assignment or ownership. Do not identify unrelated editions solely by matching title/author strings or use one global ISBN on all versions of a work.
- **Language and translations:** choose validated language codes and explicitly model translation relationships when supported. Language belongs to the readable representation; a work may have multiple languages/editions. Do not derive it from the user's locale.
- **Dates:** distinguish original publication, edition publication, scheduled availability and Rawan release creation. Decide how to represent unknown or year-only dates instead of inventing an exact day.
- **Status:** editorial draft/review, publication lifecycle and current reader access are different dimensions. A word such as Published must not bypass authorization or imply that all content in its source project is public.
- **Grouping:** issue labels may be textual and need not be sequential integers. Series membership, sort order and displayed volume/issue numbering should not be encoded into Book.title or its project position.
- **Provenance:** creator-entered metadata, verified external records and platform-derived values have different confidence. Metadata import/merge, attribution disputes and correction history require later scoped rules.
- **Warnings:** content warnings are not genres, private tags or formal age ratings. Define vocabulary, who supplies them, how absence is presented and whether details are spoiler-sensitive. Do not imply a warning-free guarantee when metadata is missing.
- **Access and assets:** publisher/ISBN/credit metadata is not a license. Validate release assets and reader-safe world references; never expose private storage keys, drafts or author account emails through catalogue DTOs.
- **Deletion and versions:** source cascades cannot silently break published identity. Define withdrawal/retention, redirects or merges, and edition/release relationships to library entries and annotations before migration.
- **Responses and caching:** public summaries, owner details and reader state need explicit DTO boundaries. Prefer compact bounded catalogue/library summaries rather than embedding full contributors, series, chapters and world graphs in each card.
- **Contract evolution:** changes need validated DTOs, ownership checks, forward migrations, shared types and reviewed OpenAPI updates. Do not pack unsupported metadata into descriptions, onboarding goals or arbitrary JSON to bypass the contract.

## Evolutionary scope

**Now:** preserve simple private manuscript title, description and hierarchy. Honest UI can show those fields and existing structures, with no public-book claims or fake metadata.

**First publishing proposal:** agree on stable Work identity, source associations, supported readable Release, approved title/description/attribution, suitable cover handling, language, navigation and explicit visibility. These are proposed requirements, not fields being added now. Missing covers and absent external identifiers should not block private writing.

**Later milestones:** introduce edition/product details, public creator profiles, contributor roles, series, genre classification and external identifiers as actual distribution/discovery needs require. Reader state follows the separate reader/library contract. Comics need their own content structures; nonfiction citations remain a distinct research/publishing concern.

**Avoid:** a single giant Book metadata object mixing private draft fields, public credits, all edition properties and each reader's state. Also avoid full bibliographic modelling before the first concrete publishing requirement. A small work/release boundary with explicit future extension points is sufficient for an evolutionary design.

Before implementation, resolve whether first releases are public/free only, which prose content representation is supported, whether credited people require accounts, and whether initial catalogue identity is work-level or edition-level. Those choices determine the minimal schema; the candidate field list alone does not.

## Repository evidence and related investigations

- [Database schema](../packages/database/prisma/schema.prisma)
- [Manuscript request DTOs](../apps/api/src/manuscript/manuscript.dto.ts), [response DTOs](../apps/api/src/contracts/response.dto.ts) and [shared manuscript types](../packages/types/src/index.ts)
- [Reviewed API contract](contracts/backend-v1.openapi.json) and [API behavior](api.md)
- [Work terminology](works-projects-and-content-types.md), [publication bridge](create-and-experience-bridge.md), [library research](library-system-research.md) and [reader research](reader-experience-research.md)
