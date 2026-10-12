# Expanded information architecture study

Implementation update (12 October 2026): originally Horizon 2 backend scopes N01–N26 are now implemented in bounded form; see the [current backend guide](backend-horizon-2.md) and [validation ledger](backend-horizon-2-implementation.md). These backend capabilities are available to a future frontend. Horizon 3 remains deferred and no frontend changes accompany this implementation. The study below preserves its original research baseline; its old capability gaps/horizon labels must be read alongside the current register, not as current implementation status.

## Mandatory product horizons

Use the [feature register](product-horizons.md) for every recommendation's support, gap, frontend/data and ADR analysis. The complete Create/My Library/Discover map is a long-term hypothesis, not a launchable H1 sitemap.

| Horizon                 | Major recommendations and register IDs                                                                                                                                                                       |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| H1 — Current Rawan      | Existing author/reader shell routing (C01), private creator tools (C02–C09), local navigation/brand/progressive disclosure and owned preview (C10/C11)                                                       |
| H2 — Near future        | Work/release bridge, basic reader/library/catalogue and state (N01–N10), identities/series/collections (N11–N14), supplements (N15), persisted customization (N16/N17) and actual graphic surfaces (N20–N23) |
| H3 — Long-term platform | Whole ecosystem/three-destination hypothesis and cross-task Home evaluation (L01), independent worlds (L02), engagement/recommendations/commerce/distribution (L03–L07), adaptive navigation (L11)           |

Research date: 12 October 2026. The proposed Create / Read / Explore / Account hierarchy is evaluated as a hypothesis, not a required sitemap, route plan or database design. This study implements no navigation or product feature.

The [work-centered product architecture](work-centered-product-architecture.md) is the connecting principle: navigation areas are entry points around works and their development/release/reading relationships, not unrelated applications.

## Evidence and evaluation approach

Nielsen Norman Group distinguishes information architecture—the organization and relationships of content—from navigation, the interface used to reach it. A product's conceptual areas therefore need not become equally prominent top-level buttons. [IA versus navigation](https://www.nngroup.com/articles/ia-vs-navigation/).

Its hierarchy research explains the tradeoff between deep generic categories and overly broad menus. Rawan should seek understandable task destinations, not the fewest labels or a link for every future tool. [Flat versus deep hierarchies](https://www.nngroup.com/articles/flat-vs-deep-hierarchy/).

Notion's documented sidebar separates workspace navigation from account/workspace switching and settings. This provides an example of contextual and utility navigation without requiring Rawan to copy its sidebar or workspace model. [Notion sidebar](https://www.notion.com/help/navigate-with-the-sidebar).

This recommendation is a qualitative design inference using primary references, Rawan's repository and earlier investigations. No card sort, tree test, prototype comparison or measured user preference has been performed. Simplicity is assessed through clear task destinations, limited overlap, low configuration burden and room for supported features to grow.

## What the hypothesis gets right

- Separates private creation from reading and public discovery.
- Recognizes that the reader needs collections and reading state, not a writing workspace.
- Gives creator tools room to grow beyond novel writing.
- Includes account administration without requiring it to be a public creator identity.
- Can express a broad platform without assuming every project has a fictional world.

Its four major areas are reasonable responsibilities. The question is whether those responsibilities should be the same as the visible primary navigation.

## Ambiguities to resolve

| Hypothesis element                       | Potential overlap or confusion                                                     | Recommended treatment                                                                               |
| ---------------------------------------- | ---------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| Projects / Works                         | Private project containers and future publication identity differ                  | Projects/Manuscripts in Create; released work identity shared across catalogue, library and reading |
| Writing / Comics                         | Content forms and authoring surfaces, not necessarily separate global destinations | Open the appropriate supported editor in project/work context                                       |
| Worldbuilding / Research / Creator tools | Optional supporting tools; Creator tools duplicates the others                     | Progressive disclosure within a project; concise task groups, no mandatory worldbuilding setup      |
| Read                                     | Could mean resume reading, manage a library or enter an active reader              | Use My Library as the saved-work destination and Read/Continue as work actions                      |
| Collections                              | Private reader collections and editorial/shared collections differ                 | Private under My Library; public editorial/explicitly shared collections under Discover             |
| Highlights / Notes                       | Reader annotations and private creator research notes differ                       | Scope annotations to a readable work; later aggregate under Library if useful                       |
| Reading History                          | Personal activity, not public catalogue information                                | Library view when supported, private by default                                                     |
| Explore                                  | Could mean find works or explore released lore                                     | Use Discover for finding works; Explore inside a work for available supplementary content           |
| Books / Comics                           | Supported format facets, not separate copies of the catalogue                      | Filtered views in Discover; actual editors/readers still differ                                     |
| Authors / Worlds                         | Public identities and optional selected material, not private project owners       | Eligible creator pages and released work/universe associations only                                 |
| Account / Profile                        | Private account details and public persona are different                           | Account settings versus explicit creator identity management/public profile preview                 |
| Appearance                               | Global UI, writing layout and reading typography have different scope              | Account defaults plus contextual overrides; reader settings reachable from the reader               |

## Alternative architectures

| Alternative                                                              | Strengths                                                                                      | Tradeoffs                                                                                    | Assessment                                                     |
| ------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| Four areas: Create / Read / Explore / Account                            | Closely follows the hypothesis; familiar separation of intents                                 | Read is overloaded, Account occupies equal task prominence, tools may become competing silos | Useful conceptual map, heavier as global navigation            |
| Two modes: Create / Experience, with Account utility                     | Consistent with Rawan's two-experience definition; very few global choices                     | Experience is abstract; library/discovery may be buried behind a mode switch                 | Strong product model, less clear as the only navigation labels |
| Three destinations: Create / My Library / Discover, with Account utility | Direct task labels; separates saved material from finding new works; reader opens contextually | Needs clear bridge between discovery and library; unavailable features must remain absent    | Recommended long-term navigation hypothesis                    |
| One Home with a flat list of all tools and formats                       | Everything appears immediately reachable                                                       | Clutter, draft/public confusion, weak reader/creator separation and poor scalability         | Reject as the universal application shell                      |

The recommendation combines the two-experience product model with three understandable destinations. **Create** is the creator experience. **My Library and Discover** together form Experience. The immersive reader is a task surface entered from an eligible work, not a fourth application competing with those destinations.

Account remains easily reachable utility navigation. It is still a substantial information area, even though it does not need equal prominence with everyday literary tasks.

## Recommended conceptual structure

Every future leaf below is conditional on a supported backend/product milestone. The tree does not imply routes or features exist today.

```text
Rawan
├─ Create
│  ├─ Projects and private manuscripts
│  │  └─ Selected project / manuscript
│  │     ├─ Supported authoring surface
│  │     └─ Optional notes/references, planning and story/world tools
│  └─ Published works and release management [future]
├─ My Library [future]
│  ├─ Continue reading / saved-work views
│  ├─ Personal collections and favorites
│  └─ Personal annotations/history when supported
├─ Discover [future]
│  ├─ Eligible catalogue search and browsing
│  ├─ Genres/topics and supported format views
│  ├─ Editorial or explicitly shared collections
│  └─ Public creator and series destinations
└─ Account [utility]
   ├─ Private account and preferences
   ├─ Creator identities and public profile management [future]
   └─ Appearance defaults

Released work detail → supported reader → optional released supplementary exploration
```

Do not add a Home merely to duplicate these destinations. A returning reader can land in My Library with Continue Reading; a creator can land in Create; anonymous visitors can enter Discover when a public catalogue exists. A later Home is justified only if a meaningful cross-task overview is demonstrated. Marketing landing Home remains distinct from a signed-in application's start destination.

The order and prominence of destinations can be evaluated for reader versus creator use, but labels and resource meanings must remain consistent. A preference guides the landing destination; it should not become a permanent account identity or replace backend permission checks.

## Shared destinations, contextual navigation

A strict tree cannot capture every useful relationship. One released work can be found through search, an author page, a series, a collection or a personal library. Those paths should converge on the same stable work destination rather than duplicating records for each branch.

| Entry/context                | Shared destination and behavior                                                             |
| ---------------------------- | ------------------------------------------------------------------------------------------- |
| Discover result              | Work detail, with approved metadata and clear access/read/save actions                      |
| My Library entry             | Same work identity plus private status/progress and Continue action                         |
| Creator's released-work list | Same public work identity, with an owner-only path to its private source/release management |
| Creator page / series        | Eligible work list; public attribution and order do not grant draft access                  |
| Active reader                | Contents, appearance, search and annotations on demand; retain a return-to-origin path      |
| Supplementary exploration    | Selected lore/media linked to a released work; preserve reader position on return           |

The editor and reader can reduce global chrome to protect focus while keeping an accessible escape/return path. A writing sidebar should not appear beside prose merely because both screens belong to Rawan.

Search scope remains explicit: private projects, saved-work metadata, public catalogue and inside-work content are different queries. A single search control could select scopes later, but it must not silently union private and public results or imply a global search API exists now.

## Progressive disclosure and scale

Within Create, show the selected manuscript/task and a small stable set of tools; More tools and reversible pins can reveal supporting capabilities. Do not require a genre preset, worldbuilding checklist or comic mode before a creator can create a project. Existing project ownership and content remain independent of navigation visibility.

My Library's collections, status, series/author groupings and history can be views, not permanent top-level tabs for every possible feature. Discover's Books/Comics, genres and topics can be filters or entry points. Separate pages are justified when their task or metadata requires them, not merely because a noun appears in the product vision.

Keep Worlds contextual initially. Private world organization lives in a project; public exploration requires explicit released data and, later, defined universe relationships. A global Worlds catalogue should only appear if independent world identity, discoverability and reader need are established.

Desktop can show contextual secondary navigation; narrow laptop windows/tablets/phones can collapse it into accessible drawers or view selectors. The content structure should remain the same across devices. Avoid reproducing the complete conceptual tree as permanent mobile navigation, and do not hide navigation behind hover alone.

Appearance scope should be clear: global UI theme, creator tool arrangement and reading typography need not be the same preference. Account management of personas must not publicly reveal their shared private manager. “Profile” should not link a logged-in user to a public page unless that public identity actually exists.

## Existing support versus long-term map

The current backend supports private projects/manuscripts, entities, relationships, timelines, plots, notes/tags, private media and project search. Accounts and author/reader experience preferences exist. Author and reader routes are dashboard shells, with preferences currently controlling the destination and Both offering a switch.

The backend has no public released-work catalogue, reader library, reading progress, annotations/history, series, comic content structure, public creator identity management or public worlds. Account Appearance and saved configurable workspaces also have no general preference contract. Do not display unsupported map destinations as completed features.

This recommendation does not change `/workspace/author`, `/workspace/reader`, current preference gating or authorization. Moving to a future task-oriented navigation would require a separately scoped routing/UX decision. Existing preferences could remain migration inputs for landing selection; no role rename or additional security role follows from this tree.

## Evolutionary rollout

1. Preserve the backend-first baseline and implement only the agreed private Create workflow using existing contracts.
2. Add the work/release and reader-access bridge. Establish an appropriate reader surface before adding every Library/Discover subsection.
3. Introduce My Library and a modest eligible Discover catalogue when their APIs exist. Keep account settings as utility navigation.
4. Add collections, series, creator profiles and annotations as their contracts mature, primarily through views and contextual destinations.
5. Reconsider a cross-task Home, standalone Worlds catalogue or other primary areas only when user tasks and content scale justify them.

Navigation labels should not force database tables to mirror the tree. Private projects, published works/releases, identities, reader state and discovery eligibility remain distinct domain responsibilities connected through explicit IDs/access policies.

## Validation plan before implementation

Compare the four-area hypothesis and the recommended three-destination alternative through card sorting and task-based tree testing, with readers, prose/nonfiction creators, comic creators and people using both sides. Include Arabic/English label testing instead of assuming direct translation preserves meaning.

Tasks should include resume a work, find an unfamiliar book/comic, organize a personal collection, draft an essay without worldbuilding, find a historical research note, add a supporting character, manage a pen name, inspect public series order, return from lore to reading and change typography. Include new/returning users, narrow/mobile layouts and keyboard access.

Observe first destination choice, successful finding, wrong-context jumps, unnecessary mode changes and interpretation of Project/Work/Library/Profile. Set acceptance thresholds before collecting results; do not invent numerical scores to validate this recommendation. Revisit whether users understand My Library, Discover and Create without explanation.

Until tested, the conclusion is a design hypothesis: **two product experiences, three main task destinations, contextual editors/readers and one account utility area**. It offers a small understandable starting structure without constraining the long-term ecosystem.

## Related repository investigations

- [Current capability audit](product-scope-and-backend-capabilities.md) and [current experience routing](../apps/website/src/lib/experience.ts)
- [Create/Experience bridge](create-and-experience-bridge.md), [work terminology](works-projects-and-content-types.md) and [work identity](book-and-work-identity-gap-analysis.md)
- [Library system](library-system-research.md), [discovery](discovery-experience-research.md) and [reader experience](reader-experience-research.md)
- [Optional worldbuilding/workspaces](optional-worldbuilding-and-workspaces.md) and [creator identities](creator-identity-research.md)
