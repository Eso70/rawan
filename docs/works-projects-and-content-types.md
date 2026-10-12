# Works, projects and content types

Implementation update (12 October 2026): originally Horizon 2 backend scopes N01–N26 are now implemented in bounded form; see the [current backend guide](backend-horizon-2.md) and [validation ledger](backend-horizon-2-implementation.md). These backend capabilities are available to a future frontend. Horizon 3 remains deferred and no frontend changes accompany this implementation. The study below preserves its original research baseline; its old capability gaps/horizon labels must be read alongside the current register, not as current implementation status.

## Mandatory product horizons

The [feature register](product-horizons.md) identifies current support, gaps, frontend/data implications and ADR requirements. A basic private-text fit is not specialized support for every literary form.

| Horizon                 | Major recommendations and register IDs                                                                                                                                                                  |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| H1 — Current Rawan      | Existing chaptered fiction/nonfiction text and optional private research/story tools (C02–C08); honest Manuscript UI label/local presentation (C10)                                                     |
| H2 — Near future        | Work/release identity (N01/N02), simpler/semantic prose (N08), actual classifications/series/anthology (N10/N13), structured references (N18), graphic structures (N20–N23), exports/editions (N25/N26) |
| H3 — Long-term platform | Broad work-form ecosystem (L01), independent universes (L02), wider distribution/interoperability (L07), native illustration and collaborative editing (L08/L09)                                        |

Investigated against the repository on 12 October 2026. This is an evolutionary architecture and terminology recommendation, not a new content-type implementation. Existing API names, ownership rules and database structures remain authoritative.

For the distinct visual medium, see [comic product research](comics-product-research.md) and [comic backend implications](comics-backend-implications.md).

See the [book and work identity gap analysis](book-and-work-identity-gap-analysis.md) for field-by-field metadata support, attribution, editions and reader-state boundaries.

## 1. Current architecture

```text
User → Author → Project
                 ├─ Book → Chapter → Scene.content
                 ├─ Notes and tags
                 ├─ Characters, places, factions, artifacts, relationships
                 ├─ Timelines and plots
                 └─ Private media and references
```

`Project`, `Book`, `Chapter` and `Scene` have required titles and optional descriptions. Books, chapters and scenes have nonnegative integer positions. Only scenes hold manuscript content: a text string, defaulting to empty, limited by request validation to 50,000 characters per scene. Project/book/chapter descriptions are not substitutes for manuscript content.

Every book belongs to one project, every chapter to one book, and every scene to one chapter. There is no standalone manuscript text endpoint at book or chapter level. Child collections can be empty; creating a project does not require a book, characters or a plot. Resource access is scoped to the project's author. Deletions cascade through the hierarchy.

Default manuscript ordering is position, then creation time, then ID. Positions are not unique constraints: they do not by themselves define an explicit series or publication reading order. Update endpoints can change positions, but there is no manuscript-wide atomic reorder contract comparable to the existing plot-point reorder operation.

Private Work/WorkSource identities and manuscript associations are now implemented. There is no `workType`, fiction/nonfiction field, `Series`, publication, edition, comic page/panel, bibliography or revision model. Account onboarding goals such as “novel” are preferences, not project classifications or validation rules.

## 2. Intentionally generic foundations

- Project title and description do not prescribe a novel, genre, setting or publishing format.
- A project can serve as a private research or story-organization container without a manuscript.
- The hierarchy stores text and order, not narrative rules. A chaptered nonfiction draft can use it as well as a novel.
- Characters, places, plots and timelines are optional project tools; they are not prerequisites for writing.
- A project can contain several books and shared supporting material. This is useful organization, not a declaration that those books form a series.
- Notes and media can organize reference material, but do not imply scholarly citation support or illustration production.

Keep these properties. Do not require worldbuilding, fictional entities or narrative plotting for every creator.

## 3. Prose and novel-oriented assumptions

The backend does not enforce “fictional novel.” Its specialization is **chaptered prose with scene-level text**, plus terminology and planning tools familiar to narrative writing.

| Assumption                                                       | Consequence                                                                                             |
| ---------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| Book → Chapter → Scene is mandatory ancestry for manuscript text | Short stories and essays need an artificial book/chapter container to use the current text API          |
| “Scene” names the editable text unit                             | Useful for narrative prose; not natural terminology for every nonfiction section or essay               |
| Text is an unstructured string                                   | No supported rich-text document schema, footnotes, citations, embedded figures or comic layout          |
| Plot points can link scenes and events                           | Good narrative planning, not a universal organizational model for research or essays                    |
| Entities belong directly to a project                            | Shared world organization inside a project exists; cross-project universe membership does not           |
| No dedicated contributor, source or publication records          | Anthology attribution, bibliographic research and edition management cannot be inferred from plain text |

Novel, novella and short-story length categories are not enforced. Do not invent word-count thresholds or classify existing records automatically.

## 4. Broader formats: honest current fit

“Basic fit” below means generic private text/organization can be used, not that a dedicated format feature exists.

| Candidate format       | Current fit                                            | Future change when that format becomes real scope                                                    |
| ---------------------- | ------------------------------------------------------ | ---------------------------------------------------------------------------------------------------- |
| Novel, novella         | Basic chaptered prose fit                              | Optional literary classification; no structural change solely for the label                          |
| Book                   | Existing private manuscript container                  | Separate published work/edition meaning when publishing is implemented                               |
| Nonfiction book        | Basic chaptered prose fit                              | Sources/citations, figures, notes or other structures according to agreed needs                      |
| Short story            | Text is possible through current ancestry              | A simpler single-document or section-based authoring flow, with a deliberate backend representation  |
| Essay / long-form work | Same ancestry limitation                               | Section-oriented prose and research features if required                                             |
| Book series            | Several books can coexist in a project                 | Explicit work membership and ordering; source positions are not series semantics                     |
| Comic / graphic novel  | Notes and permitted reference media only               | Pages, panels, dialogue, reading order, accessible descriptions and corresponding media associations |
| Comic series           | No series or comic structure                           | Series/issue membership plus a supported comic content structure                                     |
| Anthology              | Several manuscript containers can be organized         | Selected constituent works, ordering, attribution and permissions; prose compilation delivery        |
| Story universe / world | Entities, relationships and timelines within a project | Explicit cross-work/cross-project associations and selected released lore if needed                  |
| Research project       | Notes, tags, private references and search             | Structured sources, citations and provenance when required                                           |

Do not offer these as persisted project types in the next frontend. Naming a project “My anthology” is possible; it does not create an anthology data model. Uploading reference art does not create comic pages or panels.

## 5. Separate classification from structure and grouping

The proposed choices mix different dimensions. A single large enum would make overlapping choices unnecessarily exclusive: a nonfiction book can belong to a series, and a graphic novel can be a book-form comic.

When supported features need metadata, distinguish:

1. **Literary form/classification:** novel, novella, short story, essay, nonfiction and other agreed categories. These describe the work; they do not automatically define storage or permissions.
2. **Content structure:** chaptered prose, sectioned/single-document prose or page/panel graphic content. These determine editor and reader behavior and require explicit supported contracts.
3. **Grouping:** series, anthology and shared-universe associations. These express relationships among works, not a replacement for content structure. An anthology may also be a readable compiled work.
4. **Creative purpose:** research or world development. A project may support these purposes without producing a publishable work.
5. **Publication representation:** release and, when needed, edition. This is separate from editable source and reader library entries.

This separation is a Rawan design inference. Schema.org distinguishes general creative works from ordered related-work series, while W3C EPUB describes publication resources, reading order and navigation separately. Neither standard specifies Rawan's private editor schema or requires adopting its full vocabulary. See [CreativeWork](https://schema.org/CreativeWork), [CreativeWorkSeries](https://schema.org/CreativeWorkSeries) and [EPUB overview](https://www.w3.org/TR/epub-overview-33/).

## 6. UI terminology by level

| Level                                   | Recommended term                                | Use and limit                                                                                                              |
| --------------------------------------- | ----------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| Main product experiences                | Create / Experience                             | Creator and reader areas of one product                                                                                    |
| Private creative container              | Project                                         | “New project” and “Your projects”; may hold writing, research and supporting material                                      |
| Existing Book resource                  | Manuscript                                      | “Add manuscript” in a writing interface can map clearly to the current `Book` API without changing the schema              |
| Existing Chapter resource               | Chapter                                         | Preserve the actual structure today; section-based editing requires an explicit future mapping/contract                    |
| Existing Scene resource                 | Scene                                           | Preserve in the current chaptered workflow; broader “text section” terminology should accompany a designed prose extension |
| Future creative identity across formats | Work                                            | Useful umbrella for catalogue/release identity once a Work contract exists; not a claim that a Work API exists now         |
| Reader-facing item                      | Actual supported form: book, story, comic, etc. | Readers should not need the private project/chapter/scene hierarchy                                                        |
| Related works                           | Series                                          | Use only with explicit series membership when implemented                                                                  |
| Shared fictional material               | World / universe                                | Optional context; do not substitute it for every project or work                                                           |
| Reader collection                       | Library / collection                            | Distinct from an author's private project list; requires future backend support                                            |

“Manuscript” is a frontend label recommendation for an existing resource, not a new persisted type. Document the Book-to-Manuscript mapping in the client adapter and API documentation if adopted. Avoid alternating “Book”, “Work” and “Story” for the same object without a consistent mapping. “Story” is useful in general copy but excludes some nonfiction/research purposes as a universal container label.

No frontend terminology is changed by this investigation. Keep API field names and routes stable, even if a future UI uses a friendlier label.

## 7. Evolution without replacing the current workflow

**Now:** retain Project → Book → Chapter → Scene and its owner APIs. Build a straightforward private manuscript editor using the existing hierarchy. Keep research and world tools optional. Do not add a format-selection wizard that promises unsupported features.

**When publishing is scoped:** introduce a stable work/release boundary connected to existing source manuscripts. An initial supported prose release can assemble ordered scene text into reader-facing sections, with explicit reading order and versioning. Preserve old Book IDs and routes. Do not expose private Project records as catalogue items. See the [Create/Experience bridge](create-and-experience-bridge.md).

**When simpler prose authoring is scoped:** decide whether a single-document UI can use documented private containers or needs an additive section/document model. A hidden single chapter/scene can reduce UI friction for bounded text, but it still has a 50,000-character limit and the existing ancestry; it is an adapter choice, not true backend support for unlimited documents. Do not hide arbitrary splitting, ordering or deletion semantics from users.

**When illustrated formats are scoped:** add a dedicated graphic-content structure rather than treating panels as scenes or reference attachments as page layouts. Keep the prose editor unchanged. Reuse account identity, project ownership and appropriate media infrastructure, while extending association kinds and reader delivery deliberately.

**When grouping and research are scoped:** add explicit series/anthology/universe relationships and research sources according to concrete requirements. Do not derive series from positions, contributor attribution from descriptions, or citation provenance from tags.

Avoid a speculative generic node/tree/content table that replaces all existing models. Shared ownership, identifiers, metadata and release conventions can coexist with format-specific structures. Generalize only when at least a concrete second workflow demonstrates the shared behavior and migration benefit.

## 8. Future compatibility concerns

- **Routes and ancestry:** existing nested IDs, client types and ownership checks assume the current hierarchy. Moving scenes to another content system requires explicit compatibility handling, not a table rename.
- **Dependent references:** plot-point scene links and tag assignments contain book/chapter/scene ancestry. A prose migration must preserve or deliberately migrate those references and project-isolation constraints.
- **Deletion:** private children cascade on source deletion. Define independent release retention, withdrawal and account-deletion behavior before published content depends on that source.
- **Ordering:** define a total release reading order. Duplicate editable positions, paging and concurrent updates cannot be treated as an immutable publication order.
- **Text representation:** any rich-text migration needs a versioned representation, plain-text search projection and safe rendering. Do not silently interpret existing strings as trusted HTML or structured documents.
- **Version anchors:** reader progress and later annotations must identify released content/version locations; mutable scene offsets alone are unstable after edits.
- **Metadata:** preserve unknown/unclassified existing records. Fiction/nonfiction, language, contributors and bibliographic identifiers require validation and migration decisions when introduced.
- **Media and tags:** existing association enums are bounded. New book, document, page or panel associations need schema, validation, serialization and ownership changes.
- **Shared lore:** project-scoped entities cannot be made cross-project or publicly visible by changing a label. Introduce explicit associations and access checks.
- **Contract stability:** review additive API fields and forward migrations against the checked-in OpenAPI baseline; do not rewrite the contract just to conceal a breaking change.

The near-term recommendation is therefore **Project for the private container, Manuscript for writing within it, and Work for the future cross-format publication identity**. Preserve the current chapter/scene authoring path. Add supported structures incrementally when a real product milestone needs them.

## Repository evidence

- [Database schema](../packages/database/prisma/schema.prisma)
- [Manuscript DTO validation](../apps/api/src/manuscript/manuscript.dto.ts), [controller](../apps/api/src/manuscript/manuscript.controller.ts) and [service](../apps/api/src/manuscript/manuscript.service.ts)
- [Shared HTTP types](../packages/types/src/http.ts) and [reviewed API contract](contracts/backend-v1.openapi.json)
- [Current preference labels](../apps/website/src/components/preferences/preferences-form.tsx)
- [Capability audit](product-scope-and-backend-capabilities.md) and [Create/Experience bridge](create-and-experience-bridge.md)
