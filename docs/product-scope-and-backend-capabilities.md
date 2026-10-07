# Rawan product scope and backend capabilities

Reviewed against the working repository on 7 October 2026. This is a product and architecture scope audit, not a new feature implementation or a production readiness certification.

## Product definition

Rawan is a platform for creators and readers around writing, books, literature, storytelling, comics and graphic narratives, fiction and nonfiction, research, authorship, libraries, publishing workflows, discovery, and experiencing written works. Writing novels and organizing fictional worlds are parts of this platform, not its entire identity.

The intended lifecycle is idea → research → plan → write → organize → illustrate/visualize → edit → prepare → publish/share → discover → read → collect → discuss/engage → explore. V1 does not need to implement every stage. Premium describes the intended product positioning; it does not mean subscriptions or payments already exist.

The [Prisma schema](../packages/database/prisma/schema.prisma), API controllers/services/DTOs, [shared API types](../packages/types/src), and [reviewed OpenAPI contract](contracts/backend-v1.openapi.json) determine what is supported now. Product language and landing-page demonstrations cannot extend that contract. The current contract contains 116 HTTP operations, including health and authentication operations; this count does not represent 116 product features.

## 1. Functionality supported by the current backend

| Area                     | Available now                                                                                    | Boundary                                                                                                       |
| ------------------------ | ------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------- |
| Accounts                 | Password registration/login, Google login, authenticated current user, admin user reads          | No public author profile API, refresh-token API, or reader entitlement system                                  |
| Experience preferences   | Current-user author/reader/both/explore choice, optional interests and goal, onboarding progress | Preferences guide the website; they are not authorization roles or reader functionality                        |
| Private manuscripts      | Owned projects → books → chapters → scenes; titles, descriptions, ordering and scene text        | A `Book` is a private manuscript container, not a published catalogue item or edition                          |
| Research and notes       | Project notes with text, tags and private media                                                  | No structured sources, citations, bibliography, or research import                                             |
| Planning                 | Plots, plot points, linked scenes/events/entities; timelines, eras and events                    | Timeline chronology uses exact decimal strings, not a general calendar system                                  |
| Story/world organization | Characters, places, factions, artifacts and typed relationships                                  | No independent world model, map coordinates, persisted canvas layout, or shared world access                   |
| Private search           | Project-scoped search across 12 supported resource kinds, filters and bounded snippets           | No public book discovery, cross-author catalogue search, or semantic retrieval                                 |
| Reference media          | Private project uploads, downloads and attachments to supported resource kinds                   | No illustration generation, comic page structure, publishing asset pipeline, or public media delivery          |
| Background work          | Media cleanup, optional AI generation infrastructure, queue health                               | No publishing/export pipeline or generic client job-status API                                                 |
| AI proposals             | Brainstorm, summarize and rewrite requests with durable status and selected owned context        | Disabled by default; only a development/test simulator exists. Proposals do not automatically edit manuscripts |

Ownership checks protect private resources on reads and writes. References must remain within the same owned project. Admin access does not bypass project ownership. “Public contract” and “public response DTO” mean a client-facing interface, not publicly readable manuscripts.

The security roles are currently `ADMIN` and `AUTHOR`. Registration and Google account creation provision an author profile. Choosing Reader does not change that role, remove author permissions, or create access to other people's books. The website's author and reader dashboard routes currently have empty main content; separate routes are not separate completed backend products. See [account experience](account-experience.md).

Scene and note content are text strings. Basic fiction and nonfiction drafting can use them without requiring a worldbuilding workflow. Specialized nonfiction metadata, illustrated storytelling structures, editorial revisions, and publication formats are not implemented.

Tag assignments support notes, characters, places, factions, artifacts, scenes, timeline events and plot points. Media attachments support projects, notes, characters, places, factions and artifacts. Do not infer book/chapter tagging or scene/book media attachment support from the broader product vision.

## 2. Functionality appropriate for the next frontend

These are possible clients of existing endpoints, not claims that those screens already exist.

| Experience               | Implementable using today's contract                                                             |
| ------------------------ | ------------------------------------------------------------------------------------------------ |
| Creator workspace        | List/create/manage owned projects and their manuscripts                                          |
| Writing                  | Navigate books/chapters/scenes, edit text and ordering, show save pending/success/failure states |
| Research                 | Private notes, reference uploads, permitted attachments and tags                                 |
| Planning                 | Plot outlines, linked scenes, timelines and event organization                                   |
| Story organization       | Entity detail pages and a graph rendered from existing relationships                             |
| Finding private material | Project search and supported list filters                                                        |
| Personal preferences     | Optional questions, saved experience choice and switching for Both                               |
| Reading one's own draft  | A read-oriented presentation of owned manuscript text                                            |

A client can schedule saves through existing update endpoints. It must not describe that as conflict-free collaboration, durable revision history, or guaranteed offline synchronization. A relationship graph can be rendered in the browser, but saving arbitrary canvas positions needs a new backend contract.

The reader dashboard should remain an honest empty shell until reader capabilities exist. It must not show fabricated published books, library membership, reading progress, or purchase access. Reading an owned draft is different from a reader discovering and reading a published work.

Frontend terminology should leave room for Writing, Research, Planning, Story/World Organization and Assets. Worldbuilding should be optional for a prose or nonfiction project. No design changes are required by this audit.

## 3. Functionality requiring future backend and product work

| Capability                | Decisions and missing backend support                                                                                               |
| ------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| Publishing/sharing        | Draft versus released content, visibility, explicit access policy, release/version records and withdrawal behavior                  |
| Public works and editions | Stable work identity, authorship/contributors, bibliographic metadata, format/type, editions, release assets and public identifiers |
| Reader access             | Readable released content, access permissions/entitlements and appropriate delivery APIs                                            |
| Personal/public libraries | Collections or shelves, saved works, collection privacy and ownership; separate from creative projects                              |
| Reading experience        | Per-user progress, bookmarks and any highlights/annotations with their privacy rules                                                |
| Discovery                 | Public catalogue queries, searchable released metadata, public author profiles and eligibility/visibility rules                     |
| Publishing preparation    | Supported exports/rendering, validation, formatting and durable job results                                                         |
| Comics/graphic narratives | Pages, panels, reading order, text/illustration relationships and accessible reader delivery                                        |
| Structured research       | Sources, citations, bibliography and provenance rather than only unstructured notes                                                 |
| Editorial collaboration   | Memberships, scoped permissions, invitations, revisions, comments/review and concurrency behavior                                   |
| Maps and canvases         | Persisted layouts, coordinates and map-specific structures beyond text places and relationships                                     |
| Discussion/engagement     | Comments, reviews or discussions with moderation, reporting and visibility policies                                                 |
| Paid offerings            | Billing, subscriptions or purchases, entitlement enforcement and financial lifecycle handling                                       |

These areas are absent from the current API contract. Existing queues, uploaded images, manuscript CRUD and experience preferences do not supply them implicitly. Optional interests and goals are currently narrow validated lists oriented toward fiction/worldbuilding; expanding those choices is a deliberate contract and product change, not a capability automatically granted by a new label.

## 4. Long-term product possibilities

Rawan can grow into a connected literature ecosystem spanning prose and illustrated works, private and public libraries, creative research, publishing, reader discovery and communities around works. Creators may use only part of the lifecycle, and readers may never create a manuscript. Fictional world exploration can complement reading without defining every work.

These are directions for future product decisions, not delivered features, promised milestones, or authorization to implement new endpoints. Each should become a scoped proposal with access rules, data ownership, API contracts and validation before implementation.

## Lifecycle coverage

| Stage                | Current foundation                                        | Missing specialization                       |
| -------------------- | --------------------------------------------------------- | -------------------------------------------- |
| Idea                 | Notes, scene text, plot points                            | Specialized ideation workflows               |
| Research             | Notes, private references, tags                           | Sources/citations/bibliography               |
| Plan                 | Plots, timelines and links                                | Additional planning formats as required      |
| Write                | Private book/chapter/scene text                           | Additional content formats                   |
| Organize             | Entities, relationships, tags and search                  | Shared organization and saved visual layouts |
| Illustrate/visualize | Reference uploads and client-rendered relationship graphs | Illustration tools, comic layout and maps    |
| Edit                 | Update owned text                                         | Revisions, review and concurrent editing     |
| Prepare              | Organize draft content                                    | Exports and release preparation              |
| Publish/share        | No release or sharing contract                            | Explicit publication and access model        |
| Discover             | Search one's private project                              | Public catalogue and discovery               |
| Read                 | Present one's own text                                    | Released works and reader state              |
| Collect              | No work-library contract                                  | Private/public libraries                     |
| Discuss/engage       | No engagement contract                                    | Discussion and moderation                    |
| Explore              | Navigate one's linked project material                    | Public work/world exploration                |

## Architecture and terminology guardrails

1. Keep account identity, experience preferences and authorization separate. A reader/author choice is not an admin permission and should not permanently prevent a user from using the other experience.
2. Preserve the current private creative project/manuscript boundary. Future Publishing, Published Works/Editions, Reader Libraries/Reading, Discovery and Engagement should have explicit responsibilities and access policies. These are proposed boundaries, not modules implemented now.
3. Model publication as an intentional release of selected content. Do not expose private drafts by reusing owner endpoints as public endpoints, or automatically publish subsequent edits. Decide how releases and editions relate to the editable source before adding public reads.
4. Use “work” as a broad product concept. Today's `Book` retains its precise manuscript API meaning. Do not rename database tables/routes or create a generic content megamodel merely to reflect the expanded vision.
5. Treat a `Project` as an owned creative container. “World” currently describes its entities and links; “story” has no separate backend model. A future library collection, published edition or comic page is not a project, scene or media attachment by default.
6. Extend prose, nonfiction and comics according to their actual data and reading needs. Do not force panels into scenes or infer citation support from note content.
7. Review intentional API changes against the versioned OpenAPI contract and add forward migrations when persistence changes. Historical implementation reports remain historical evidence, not the current capability specification.

## Backend-first next steps

The immediate baseline is the existing private creator backend. A sensible next reader milestone starts with a defined published-work/release model and controlled readable content, then reader access, libraries and progress. Public discovery should only index content explicitly eligible for public access. Engagement needs moderation before being exposed. Comics, structured research, collaboration and commerce each need separately agreed scope.

Before coding the first publishing/reader milestone, agree on the minimal supported work format, release semantics, public/private access, and whether the first reader library saves only Rawan publications or also external bibliographic records. Those decisions cannot be inferred from the existing `Book` model.

This audit adds no speculative routes, security roles, database models or migrations.

## Supporting references

- [API behavior and conventions](api.md) and [complete route inventory](api-route-inventory.md)
- [Registered contract controllers](../apps/api/src/contracts/controllers.ts)
- [Manuscript routes](../apps/api/src/manuscript/manuscript.controller.ts)
- [Account preferences DTOs](../apps/api/src/users/onboarding.dto.ts)
- [Media backend](media-domain.md), [background jobs](background-jobs.md) and [AI backend](ai-backend.md)
