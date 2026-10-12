# Discovery experience research

Implementation update (12 October 2026): originally Horizon 2 backend scopes N01–N26 are now implemented in bounded form; see the [current backend guide](backend-horizon-2.md) and [validation ledger](backend-horizon-2-implementation.md). These backend capabilities are available to a future frontend. Horizon 3 remains deferred and no frontend changes accompany this implementation. The study below preserves its original research baseline; its old capability gaps/horizon labels must be read alongside the current register, not as current implementation status.

## Mandatory product horizons

The [feature register](product-horizons.md) supplies support/gaps, frontend/data implications and ADR requirements. Public discovery is not current private project search; recommendations and trending are H3.

| Horizon                 | Major recommendations and register IDs                                                                                                                                                                                                      |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| H1 — Current Rawan      | Existing private project search/filtering (C08), reusable local accessibility/card/brand principles (C10)                                                                                                                                   |
| H2 — Near future        | Released-work bridge (N01/N02), Discover/search/detail/genre/topic/form/new-release views (N09/N10), creator/series routes (N11/N13), editorial/shared collections (N14), Continue Reading (N05), eligible supplements and comics (N15/N20) |
| H3 — Long-term platform | Recommendations (L04), trending/activity ranking (L05), community/follows/notifications (L03), commerce/distribution (L06/L07), independent Worlds catalogue (L02)                                                                          |

Research date: 12 October 2026. This document proposes reader discovery surfaces and their backend dependencies. It implements no catalogue, recommendation system, ranking, activity tracking or frontend screen.

## Research basis

GlobalComix's browse page separates series, releases and creators, with filters including genre, theme and reading format. This is a useful precedent for helping readers select a graphic work and understand how it can be read, rather than relying only on a cover grid. [GlobalComix browse](https://globalcomix.com/browse).

The StoryGraph describes discovery by mood, topics and themes and identifies its recommendations as a machine-learning capability. This illustrates the distinction between descriptive filtering and a personalized recommendation system; Rawan has neither public metadata filtering nor recommendations implemented today. [StoryGraph](https://www.thestorygraph.com/).

These are primary product references, not endorsements or a request to copy their commercial features. The recommendations below are Rawan-specific inferences. No logged-in interface inspection, user interviews or usability testing was performed. Standard Ebooks search results offered another collection-browsing reference, but direct pages could not be read by the research tool, so their detailed UI is not used as evidence here.

## Purpose and information architecture

Discovery should help someone choose a work, meet a creator or follow an interest. It is distinct from buying a product, managing a manuscript and reading the work itself. A small useful catalogue is preferable to many repetitive empty rails.

| Surface            | Purpose                                       | Proposed behavior and dependency                                                                                 |
| ------------------ | --------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| Experience Home    | Orientation and a next action                 | Returning-reader activity plus a limited editorial/browse selection; needs reader state and released works       |
| Explore / Discover | Find something new                            | Curated entry points and a browse-all path; choose one primary navigation label, not two duplicate destinations  |
| Search             | Find known titles/creators or explore a query | Explicit catalogue scope, bounded results, useful metadata and filters                                           |
| Genres             | Browse literary conventions                   | Controlled public metadata; allow multiple genres without forcing every work into one                            |
| Topics             | Browse subjects, themes or interests          | Especially useful for nonfiction; do not conflate topics, genres and private tags                                |
| Collections        | Human-selected groups of works                | Editorial or explicitly shared collections, labeled by who curated them                                          |
| New releases       | Find newly available reading material         | Sort by a defined release event; distinguish first publication, new Rawan availability and updated content       |
| Series             | Follow connected works                        | Explicit membership/order and availability, with a recommended entry point where supplied                        |
| Authors / creators | Discover through people                       | Public attribution/profile and eligible works, including illustrators and other credited creators when supported |
| Comics             | Browse supported graphic formats              | Show readable format/direction capabilities; depends on a real comic publication contract                        |
| Books / prose      | Browse supported prose works                  | Form-aware filters without excluding stories, essays and nonfiction through novel-only terminology               |
| Recommendations    | Personalized suggestions                      | Future capability requiring data, policy, explanations and evaluation                                            |
| Trending           | Time-bounded activity ranking                 | Future capability requiring reliable signals and abuse controls; not an arbitrary label for editorial picks      |
| Continue reading   | Resume an existing work                       | Account-private reading state; a return mechanism, not a discovery algorithm                                     |

Use Discover as the primary new-work destination, consistent with [library terminology](library-system-research.md). Search can live within it. Genres, Topics, Authors, Series and Collections are views or entry points, not necessarily separate top-level apps. Keep the public marketing Home distinct from a signed-in Experience Home.

## Proposed reader journeys

**Known work:** query a title or creator → inspect a matching work → understand format, synopsis and availability → Read or Save to Library.

**Interest-led browsing:** choose a genre/topic → narrow by supported format/language → inspect works or a curated collection → choose a work.

**Creator-led discovery:** open a public creator page → browse credited eligible works → inspect a work or series. Following creators and notifications are later features, not necessary for this journey.

**Exploration-led discovery:** discover a work with explicitly released supplementary content → read or inspect selected lore/media → navigate verified related works. Maps/timelines/graphs must not be advertised as universally available.

**Returning reader:** choose Continue Reading → restore a release-aware location. After completing or deliberately leaving a work, related eligible works or a series continuation may be offered without interrupting the reading surface.

Do not autoplay previews, put popups over prose, or insert discovery widgets mid-chapter. Expressive catalogue presentation can surround reading; the [reading surface](reader-experience-research.md) remains calm.

## Editorial discovery before algorithms

A minimal future catalogue can support curated collections, a deterministic new-release view, verified series links and metadata browsing. These are valuable without learning a reader's behavior. Label a selection **Editor's picks** or **Selected works**, not **Recommended for you** if everyone sees the same list.

Editorial collections need a title, short curatorial explanation, accountable curator and explicit ordered membership. A collection should answer why these works belong together. Themes can connect fiction, essays, nonfiction and graphic narratives when the metadata and supported formats permit it. Do not automatically publish a reader's private collection as editorial content.

A small catalogue should consolidate entry points and omit empty shelves. Early curation can be simple, but durable website collections still require a persistence/content-management contract and authorization. Hardcoded fake covers, randomized manuscripts or client-only arrays are not an implemented public catalogue.

## Cards and work detail

Cards should emphasize cover, readable title, credited creator and limited relevant context. Show an honest supported form, a concise collection reason or release context where useful. Do not overload every card with badges, scores and progress bars. Provide a list alternative for dense search results and missing-cover cases.

A work detail destination connects discovery to Experience through synopsis, attribution, available release/language, series context, content warnings where supported, and clear Read / Save actions. Owners may have a separate link back to Create, subject to existing ownership. Private project metadata is not the reader detail contract.

Availability must be understandable before opening the reader. Catalogue eligibility and permission to read are separate decisions. If a future model allows discoverable restricted metadata, it needs an explicit discoverability policy and clear availability text; metadata visibility must not imply full-content access. The simpler initial scope can limit discovery to eligible public/free releases.

Avoid checkout-like product density, sales countdowns, urgency banners, discount grids, purchase-first CTAs and forced subscription interruptions. If commerce is introduced later, explain access at the appropriate decision point without making literature discovery a sales funnel. No commerce backend exists now.

## Search, filters and ranking

Separate public catalogue search, personal-library search, search inside a released work and private project search. An author searching research should not receive a public reader result set, and a reader query must never return drafts or planning snippets.

Initial proposed public search prioritizes understandable title/creator matching, with synonyms or richer relevance only when supported and tested. Filters may include public genre/topic, supported content form, language and availability. Show active filters, clear/reset actions and no-results recovery. Preserve results and scroll position when returning from details.

Do not treat account onboarding interests as complete genre preferences or recommendation consent. The current interests list is narrow and does not populate work metadata. Genre/topic vocabulary needs classification ownership, validation and correction rules. Content warnings are not automatic genre exclusions or inferred age ratings.

Use deterministic sort/tie-break rules, bounded result summaries and explicit pagination. Group duplicate editions under work identity when appropriate, while allowing the reader to select a language/release. Every search suggestion, count, facet, related-work link and public creator page must enforce the same discoverability policy as results.

## Recommendations and trending: future work

| Capability                     | Required product/backend decisions                                                                                                             |
| ------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| Metadata-based related works   | Supported classification/relations, explanation of matching basis and eligibility checks; a future deterministic service, not assumed existing |
| Preference-based suggestions   | Validated optional preferences, exclusions, cold-start behavior and transparent explanation                                                    |
| Behavior-based recommendations | Explicit data collection/retention scope, consent/privacy decisions, model/service support and evaluation                                      |
| Trending                       | Named signals, time window, deduplication, bot/manipulation controls and defined ranking freshness                                             |
| Popular/all-time ranking       | A separate interpretation from trending; avoid presenting old accumulated activity as recent momentum                                          |

A page view, save, completed read and reread express different behavior. No single metric proves quality, and clicks or raw reading time alone should not define literary value. Evaluate relevance, diversity, languages, new creators and less-exposed works rather than only conversion or session length. Provide ways to dismiss suggestions and reduce unwanted recommendations when such features exist.

Do not fabricate user counts, review scores, trending positions, personalized explanations or a “people like you” claim. If there is insufficient trustworthy activity, omit Trending. Recommendations should supplement browsing rather than become the only way to discover works.

## Responsive, accessible and performant discovery

Desktop/laptop can show broader results with compact filters. Tablet/phone should use an accessible filter sheet and readable covers/titles, preserving search and navigation history. Avoid endless horizontal carousels as the only path into each genre; provide a clear view-all destination.

Use keyboard-operable cards and filters, visible focus, readable contrast and touch-accessible actions. Hover can add polish but cannot be required to reveal essential titles, availability or controls. Minimize card motion and retain reduced-motion behavior. Distinguish loading, no eligible results, missing metadata and network error states.

Use server-side authorization/filtering, compact result pages and responsive cover renditions. Avoid fetching complete books, every creator profile or every supplementary entity for a discovery grid. Bound home-section queries and search/autocomplete work. Cache public eligibility-aware summaries separately from account-private Continue Reading and library state; account-specific caches must not leak across sessions.

Release withdrawal and visibility changes need catalogue/index/cache invalidation, plus read-time checks. A stale search hit must not grant access. Low catalogue size can use ordinary validated database queries; a separate search engine or recommendation infrastructure should follow actual scale and requirements rather than the word Discover.

## Backend gap analysis

| Area                    | Current Rawan support                                                      | Missing dependency                                                    |
| ----------------------- | -------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| Content eligibility     | Owner-scoped private resources                                             | Work/release identity, discoverability and authorized reader delivery |
| Search                  | JWT-protected `/projects/:projectId/search`, literal project text matching | Public catalogue queries, metadata relevance and public facets        |
| Genre/topic/form        | No public work classifications                                             | Validated released metadata and classification relationships          |
| Attribution/series      | One project owner profile; ordered manuscript containers                   | Public creator pages/credits and explicit series membership           |
| Editorial collections   | No public collection model/API                                             | Curation permissions, membership/order and public representations     |
| New releases            | Database creation/update timestamps                                        | Defined publication/release events and eligible ordering              |
| Continue Reading        | No reader progress API                                                     | Account-scoped release locators and recent reading state              |
| Recommendation/trending | No ranking, recommender or supporting reader-activity contract             | Separately scoped signals/services, privacy rules and evaluation      |

The optional text-AI simulator is not a recommendation engine. Private Tag records are not public genre metadata. The current Book `createdAt` cannot drive an honest New Releases view. Existing landing-page claims or media demonstrations do not alter those limitations.

## Evolutionary recommendation

1. Implement the agreed work/release/reader-access foundation first; keep today's private author API unchanged.
2. Add a modest eligible catalogue with work details, title/creator search, supported language/form filters and a clear browse order.
3. Add editorial collections and correctly labeled new-release views once their metadata/events exist.
4. Connect My Library and Continue Reading through identity-scoped reader state. Add explicit creator/series routes as their contracts mature.
5. Research recommendations and trending as separate later capabilities. Graphic format discovery follows actual comic reading support.

Before implementation, choose the initial eligibility policy, minimum released metadata, curation owner and what New means. Those decisions determine the first discovery API; the full possible surface list is not a launch checklist.

Future evaluation should cover new/returning readers, sparse catalogues, Arabic/English queries, mixed formats, incomplete series, duplicate editions, withdrawn releases, anonymous versus signed-in access, slow networks and keyboard/touch browsing. Assess whether readers find suitable works without sale pressure or repetitive rankings. No discovery UI or ranking experiment was built during this research.

## Repository references

- [Search controller](../apps/api/src/search/search.controller.ts), [database schema](../packages/database/prisma/schema.prisma) and [reviewed contract](contracts/backend-v1.openapi.json)
- [Work metadata gap analysis](book-and-work-identity-gap-analysis.md), [publication bridge](create-and-experience-bridge.md) and [library research](library-system-research.md)
- [Dedicated reader experience](reader-experience-research.md) and [comic product research](comics-product-research.md)
