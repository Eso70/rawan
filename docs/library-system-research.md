# Library system research

Implementation update (12 October 2026): originally Horizon 2 backend scopes N01–N26 are now implemented in bounded form; see the [current backend guide](backend-horizon-2.md) and [validation ledger](backend-horizon-2-implementation.md). These backend capabilities are available to a future frontend. Horizon 3 remains deferred and no frontend changes accompany this implementation. The study below preserves its original research baseline; its old capability gaps/horizon labels must be read alongside the current register, not as current implementation status.

## Mandatory product horizons

The [feature register](product-horizons.md) provides all six required fields. My Library, collections, status/progress and public Catalog are future features even though the creator owns Book records.

| Horizon                 | Major recommendations and register IDs                                                                                                                                                                     |
| ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| H1 — Current Rawan      | Private Projects/Manuscripts and unstructured References (C02/C03/C07/C08), local grid/list/accessibility rules (C10)                                                                                      |
| H2 — Near future        | Work/release/library/state (N01–N05), catalogue/metadata (N09/N10), creator/series grouping (N11/N13), editorial/shared collections (N14), synchronized view preferences (N16/N17), edition identity (N26) |
| H3 — Long-term platform | Public universe ecosystem (L01/L02), external-book import, ownership/loan tracking and institutional distribution (L07), commerce and offline delivery (L06/L12)                                           |

Research date: 12 October 2026. This document recommends product terminology, browsing behavior and future backend boundaries. It introduces no library model, public catalogue, creator screen or collection API. Existing repository contracts remain the implementation baseline.

See [discovery experience research](discovery-experience-research.md) for eligible catalogue browsing, editorial collections and future recommendation/trending requirements.

## Research basis

The StoryGraph's official getting-started guide distinguishes reading-status lists, owned books and personal tags. Rawan should likewise avoid treating reading status, ownership/access and custom organization as one field. [StoryGraph guide](https://thestorygraph.freshdesk.com/support/solutions/articles/79000142013-getting-started-with-storygraph).

Calibre documents metadata browsing by authors, tags and series, plus virtual libraries that restrict a view through search criteria. These provide precedents for faceted browsing and saved views rather than copying files into multiple physical-looking shelves. [Calibre interface](https://manual.calibre-ebook.com/gui.html), [Virtual libraries](https://manual.calibre-ebook.com/virtual_libraries.html).

Kobo's official support documents library filtering and user-created collections. This supports distinguishing personal grouping from a work's bibliographic identity. [Kobo filtering](https://help.kobo.com/hc/en-us/articles/360017676993-Use-the-search-filter-on-your-Kobo-eReader), [Collections](https://help.kobo.com/hc/en-us/articles/360017865193-Add-a-collection-to-your-Home-screen-on-iOS).

The recommendations below are Rawan design inferences, not a reproduction of these products. This is official-documentation research and repository analysis, not usability testing or an evaluation of their current interfaces on all devices.

## Four meanings, clearer names

| Meaning                     | Recommended primary label                                             | Scope and boundary                                                                           |
| --------------------------- | --------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| Reader's personal works     | **My Library**, or **Library** inside Experience                      | Saved works, reading state, favorites and personal collections                               |
| Creator's private material  | **Projects** and **Manuscripts** inside Create                        | Drafting and organization; not a reader catalogue                                            |
| Creator's released material | **Published Works** when publishing exists                            | Releases managed by their creator, distinct from private drafts                              |
| Discoverable Rawan works    | **Discover**, with **Catalog** for explicit browse-all/search context | Eligible released works; not an institutional borrowing library                              |
| Research/reference material | **References** within a project; **Assets** for all project media     | Documents, images and source material; structured bibliography still requires future support |

Do not present four top-level “Libraries” differentiated only by context. Reserve the emotional collecting meaning for the reader. “Creator Library” can be descriptive prose, but is not a useful primary navigation label for a mixture of projects, drafts and releases.

“Public Library” risks implying loans, library institutions or unrestricted access. A public catalogue is not the same as a publicly shared personal collection. If public collections are added later, use **Shared Collections** or a clear visibility label; do not expose personal reading history automatically.

Projects can contain multiple manuscripts and research without a published work. References can be unpublished files or notes, not readable books. One account can use all these areas without mixing their access rules.

## My Library information architecture

The reader's saved works form one underlying collection. Built-in views and custom collections are ways to browse it, not separate copies of a book.

| View              | Meaning                                                                 |
| ----------------- | ----------------------------------------------------------------------- |
| All works         | Every saved work, including entries with no reading status              |
| Currently Reading | A chosen/recorded reading state, separate from merely opening details   |
| Want to Read      | Explicit reading intent                                                 |
| Finished          | Completed reading, with an explicit correction/reopen action            |
| Favorites         | An independent personal preference, compatible with any reading status  |
| Collections       | Named, user-curated groupings; a work can belong to several             |
| Series            | Grouping by actual series metadata when supported                       |
| Authors           | Grouping by creator attribution; collaborators need deliberate handling |
| Recently Opened   | Reader activity ordered by a defined last-opened timestamp              |

Pause/Did Not Finish may be useful future status choices, but do not implement every tracking preference at the first milestone. Define mutually exclusive current reading statuses separately from reread history. A reader can save a work without being forced to choose a status.

Recently Opened should distinguish opening readable content from viewing its metadata, importing a file or a background preload. Status must not become Finished merely because the last section loaded. Progress and manual status need a defined relationship with reversible controls.

Favorites are not ratings; collections are not genres; personal tags are not the creator's private project tags. Saving a work, owning a physical edition, downloading a file and having permission to read a Rawan release are separate relationships. Never label a saved free catalogue entry “Purchased” or “Owned.”

## Browsing without a physical bookshelf imitation

Use covers as visual identity, supported by readable titles, creator names and concise state. Preserve the appeal of collecting through recognizable works, curated groups and continuity—not wooden shelf graphics, book spines, 3D rotations or heavy decorative shadows.

| Presentation        | Best use                                         | Behavior                                                                                                        |
| ------------------- | ------------------------------------------------ | --------------------------------------------------------------------------------------------------------------- |
| Cover grid          | Visual browsing, small/medium collections        | Consistent cover slots, preserved artwork, short visible metadata and stable layout                             |
| List                | Finding, sorting and managing larger collections | Clear text, optional small cover, status/progress and useful metadata                                           |
| Compact list        | Dense libraries and accessibility preferences    | Minimal imagery with readable titles and keyboard navigation                                                    |
| Collection overview | Choosing a personal group                        | Name, count where supported and a small honest preview; no random cover collage presented as collection artwork |

Offer a persistent grid/list preference. Do not make cover hover the only route to title, status or actions. Missing covers need a restrained fallback with visible title/creator; placeholders must not pretend to be actual artwork. Keep mixed prose/comic cover proportions readable without cropping identifying artwork.

Use one clear item action appropriate to context: Continue for a readable in-progress work, Read for an accessible unread release, or View details when access is unavailable. “Remove from Library” removes a personal association; it must not delete the creator's work or silently erase annotations/history unless an explicitly scoped operation does so.

Small and empty libraries should not show a wall of empty shelves. Provide a clear path to Discover when a catalogue exists, with honest empty/no-results/error states. Do not insert fabricated books to fill the interface.

## Sorting, filtering, search and metadata

Recommended initial sorts are recently opened, date added, title and creator name. Later expose series order, completion date or other fields only if reliably stored. Define locale-aware sorting, missing-value behavior and deterministic tie-breakers; display titles and identity must not depend on filename sorting.

Filters can include reading status, favorite, collection, supported content form, language, series and author. Show active filters, a clear-all action and search scope. Preserve filters and list position when returning from a work. Do not overload the first view with every facet or display counts that the backend cannot compute.

Search My Library should query the reader's saved-work metadata. Discover searches eligible public catalogue metadata. References searches permitted private project resources. Search inside a work is a fourth distinct operation, covered by [reader research](reader-experience-research.md). Label scope so a user knows what was searched.

Useful item metadata may include stable work identity, title, creators, cover, supported form, language, series membership/order, selected readable release and current availability. User-specific metadata includes date added, current state, progress, favorite, collection membership and last opened. Release/edition information belongs to a version/edition boundary rather than being overwritten by personal notes.

Do not require all metadata for initial browsing. Genre and nonfiction subject classifications differ from private custom tags. Contributors need identities and roles if grouping must be reliable; grouping by a free-text display name alone can merge different people or split the same person.

## Collections, grouping and reading state

Collections should be private by default and contain references to works, not duplicate manuscripts. Explicit collection ordering and automatic sort are different modes. Later saved-filter views can coexist with manually curated collections if clearly labeled; do not silently move items because a user assumed membership was manual.

Series and author views are derived bibliographic groupings, not necessarily user-authored collections. A library may contain only part of a series; label saved members separately from available catalogue installments. Do not expose inaccessible/private works just to complete a sequence. One work can have multiple creators or grouping relationships; a rigid one-author/one-series assumption needs review before implementation.

A library entry should normally identify a work while a selected release/edition identifies what the reader reads. Decide this before adding progress: saving multiple editions may be allowed, but should not accidentally duplicate the same work in every view or erase edition-specific annotations. Work-level status and version-specific locations must have explicit semantics.

Keep reading history, last position, furthest progress and manual completion distinct. Rereading should not destroy prior completion records if history is supported. If that history is outside initial scope, say so rather than inferring it from timestamps.

## Responsive and accessible organization

Desktop and laptop can use a bounded navigation rail with filters and grid/list controls; a narrower viewport should collapse this progressively. Tablet and phone can use a simple view selector and an accessible filter sheet. Avoid forcing sideways carousels for every status category or miniature shelves on phones.

Use readable cover-adjacent labels, meaningful action names, visible focus and keyboard-operable controls. Bulk selection needs explicit mode and keyboard/touch alternatives. Do not nest conflicting click targets across an entire card. Series expansion, action menus and collection reordering require non-drag alternatives when implemented.

Preserve normal document access and focus when loading more items. If virtualization is required, validate screen-reader navigation, browser find expectations, selected rows and return positions. Premium should mean fast, clear and carefully finished, not visually elaborate at the expense of usability.

## Large-library performance

Future personal-library endpoints should perform authorization, sorting, filtering and search on the server, returning bounded compact summaries. Do not fetch every work and filter in the browser. Choose pagination deliberately: stable cursor/keyset paging can suit large changing collections; an ID tie-breaker alone does not guarantee a snapshot while mutable sort values change.

Prefer responsive thumbnails over full-size covers, lazy-load below the viewport and reserve image dimensions to prevent jumps. Fetch details on demand. Avoid one progress/author/series request per card; return authorized summary data in a bounded query or batching contract. Global counts/facets can be deferred or cached with an explicit freshness policy.

Index identity-scoped library membership and chosen filter/sort keys based on actual queries. Validate query limits, bulk-operation bounds and concurrency semantics. A Recently Opened update can move an item while browsing; restore focus/position sensibly rather than constantly reordering an active list under the pointer.

Private-library caches must be account-scoped. Invalidate after mutations, permissions changes and account switches. Public catalogue caching and personal annotations/progress have different privacy requirements. Do not promise offline availability just because cover thumbnails are cached.

## Current backend versus future requirements

| Area       | Exists now                                                                 | Missing for the proposed library system                                                        |
| ---------- | -------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| Create     | Owned projects and Book/Chapter/Scene manuscript hierarchy                 | Public works/releases and published-work management                                            |
| References | Project notes, private media, allowed attachments, tags and project search | Structured citations/bibliography and any cross-project reference catalogue                    |
| My Library | No library entry/collection/reader-state API                               | Saved-work identity, personal statuses, favorites, collection membership, progress and recency |
| Discover   | No public catalogue                                                        | Released metadata, eligibility/access rules, covers and discovery queries                      |
| Grouping   | Author profile records; books ordered within projects                      | Public creator attribution and explicit series/volume/issue relationships                      |

The existing list infrastructure has bounded limit/offset queries and domain sort/filter allowlists. Those are useful conventions, not a reader-library endpoint. `Tag` is project-owned and cannot be reused as an unrestricted account-wide personal tag by changing the frontend label. Media files are private reference assets, not public covers. Current manuscript Book records are not published works or imported library editions.

A proposed future LibraryEntry associates account and stable work identity, with a uniqueness policy and optional reader metadata. Collections have their own account ownership and memberships. Progress/annotations identify readable release content. Public/shared collections require separate access and privacy decisions; do not derive publicity from the word Library.

Source deletion or publication withdrawal should follow a defined policy: a saved entry may retain minimal allowed metadata with an unavailable state rather than becoming a broken link. Reading rights must still be checked when Read is selected. Collections and favorites confer no publishing rights or entitlement.

## Evolutionary recommendation

1. Preserve Projects/Manuscripts and project References as clients of existing creator APIs; no fictional-novel assumption is required.
2. Establish stable published-work and reader-access foundations from the [Create/Experience bridge](create-and-experience-bridge.md).
3. Introduce My Library with save/remove, bounded browsing and clearly scoped status/progress. Prefer a minimal dependable collection over every possible shelf.
4. Add favorites and manual collections, then reliable author/series facets when metadata exists. Personal tags and saved-filter views can follow concrete demand.
5. Consider shared collections, external-book records, import, ownership tracking and institutional lending as separate future products—not consequences of calling the view Library.

Before implementation, decide whether the first library contains only Rawan works or also external bibliographic records, whether entries are work-level or edition-level, and what removal retains. These decisions materially affect identity, permissions, duplicate handling and reader state.

Future evaluation should cover empty/small libraries, thousands of entries, missing covers, mixed-language titles, multi-author/partial-series groups, rereading, withdrawn releases, slow loading, combined filters, keyboard/touch bulk actions and account isolation. No interface or performance testing has been carried out in this research phase.

## Repository references

- [Database schema](../packages/database/prisma/schema.prisma) and [query conventions](../apps/api/src/query/query.dto.ts)
- [Current capability audit](product-scope-and-backend-capabilities.md)
- [Work terminology](works-projects-and-content-types.md), [reader experience](reader-experience-research.md) and [publication bridge](create-and-experience-bridge.md)
