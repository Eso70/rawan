# Author Studio V1 implementation

Current status: the user requested a clean design restart. The `/studio` route no longer mounts this implementation, its provider, shell or styles. `/reader` has also been cleared. The notes below describe the earlier inactive implementation; existing browser-local drafts are preserved.

19 October 2026. Authorized scope: independent, locally persisted mock author application at `/studio`; no backend, schema, worker, auth or reader changes and no deployment.

## Audit and decisions

Existing app: `apps/website`, Next 16.3.8, React 19.3, TypeScript 7.0.2, CSS Modules, self-hosted Lora/Inter, Tabler icons and native UI primitives. No shared UI package. The current `/workspace` remains authenticated; `/studio` is an independent demonstration and does not bypass that route's gates. Existing working changes are preserved.

Design authority: all eight cumulative documents under `design-system/references/`, current implemented design docs and the master user brief. No installed Quiet Literary Studio skill exists. Use scoped charcoal/gold studio styling, opaque writing surfaces, serif prose/titles and sans controls. Retain existing navy/account/marketing recipes. New rich text, custom entity properties, activity, local feedback, graph/canvas convenience kinds and local preferences are explicitly mock capabilities; do not imply corresponding server support.

## Plan and checklist

- [x] Phase 0: repository and design audit; route/component/data plan.
- [x] Phase 1: typed deterministic seed, repository, storage adapter, provider, scoped theme and responsive shell.
- [x] Phase 2: dashboard, projects, overview, works and create/edit interactions.
- [x] Phase 3: Tiptap manuscript, chapters/scenes, local save, reorder, focus and context.
- [x] Phase 4: world collections and reusable editable entity documents.
- [x] Phase 5: plot/outline, research notes and links.
- [x] Phase 6: timelines, relationship graph, React Flow canvas and context panels.
- [x] Phase 7: media, unified search/commands, preferences, help/feedback and voluntary tour.
- [x] Phase 8: data/interaction tests, typecheck, lint, build, browser journeys and responsive review.

## Architecture and route plan

`src/features/studio/data/` owns mock-only models, deterministic seed, pure repository operations, search and storage validation. `StudioProvider` is the local repository adapter and persistence boundary. Page components consume that boundary rather than seed arrays. Later an API adapter must translate supported backend domains and explicitly reject unsupported mock features.

`src/features/studio/components/` owns shell, dialogs, palette, shared document/list recipes and guidance. `pages/` contains meaningful feature compositions; editor and visual workspaces load on demand. Studio styles are scoped under the studio root, including light/dark, motion and density preferences.

Route map: `/studio`, `/studio/projects`, `/studio/activity`, `/studio/search`, `/studio/preferences`, `/studio/help`; `/studio/projects/[projectId]` and child tools `works`, `manuscript`, `world`, `plot`, `timeline`, `relationships`, `canvas`, `research`, `media`, `settings`. Entity detail uses `world/[entityId]`; chapter/work selection uses URL query state. Deep links resolve independently of auth/API services.

## Validation plan

Use the existing Node test runner for repository integrity, mutations, persistence, search, preference validation and route behavior. Run website typecheck/lint/tests/build. Browser-check writing, entity linking and planning journeys, dialogs/palette/tour keyboard behavior, refresh persistence and desktop/mobile layout. Record actual outcomes and limitations below after validation.

## Integration boundaries

Mock Work.projectId is a convenience association; real Work identity/source links must be mapped explicitly. Tiptap JSON/HTML must never be sent directly to current scene/plain-text block endpoints. Custom property/alias/tour/activity/feedback records and arbitrary layout preferences have no implied backend contract. Graph/canvas local semantics must be translated to actual supported node kinds and ownership constraints. Reader/publication workflows remain outside this app.

## Running it

From the repository root, run `pnpm dev:website`, then open `http://127.0.0.1:3000/studio`. No sign-in, API, database, Redis or worker is needed. The existing authenticated `/workspace` route and all existing login/onboarding behavior are unchanged. Studio is deliberately separate and labeled **Local demo**.

Website validation commands already configured in the project:

```sh
pnpm --filter @rawan/website test
pnpm --filter @rawan/website typecheck
pnpm --filter @rawan/website lint
pnpm --filter @rawan/website build
```

## Delivered route map

The optional catch-all Next page dispatches through the tested `resolveStudioRoute`; these are actual navigable application URLs, not separate unrelated demonstrations:

| Routes                                | Pages                                                                                            |
| ------------------------------------- | ------------------------------------------------------------------------------------------------ |
| `/studio`                             | Your desk, continue writing, projects, recent work, writing totals, activity and quick creation  |
| `/studio/projects`                    | Search/filter/sort, grid/list, create/edit/pin/delete projects                                   |
| `/studio/projects/[projectId]`        | Scoped project overview and creative tool entry points                                           |
| `…/works`                             | Work library, metadata, creation and appropriate prose/visual entry                              |
| `…/manuscript`                        | Rich text, chapter/scene navigation, order, local autosave, find, context and focus              |
| `…/world`                             | Category collections, search, sort and grid/list                                                 |
| `…/world/[entityId]`                  | Shared editable entity document, aliases/properties/tags/images and related entries              |
| `…/plot`                              | Acts/arcs, reorderable points, statuses and chapter links                                        |
| `…/timeline`                          | Eras/events, relative ordering, filters, density, linked references and resizable details        |
| `…/relationships`                     | Deterministic graph/list, selection, linking, view controls and removal                          |
| `…/canvas`                            | Draggable notes/images/reference/plot cards, edges, pan/zoom/fit, outline and coordinate editing |
| `…/research`                          | Searchable/foldered/tagged/pinned notes, editing, creation, deletion and references              |
| `…/media`                             | Bundled studies, local image upload, category/search, detail/edit/attach/remove                  |
| `…/settings`                          | Project identity/status/goal and confirmed removal                                               |
| `/studio/search`, `/studio/activity`  | Cross-domain search/recent queries and local activity feed                                       |
| `/studio/preferences`, `/studio/help` | Theme/editor/profile/density/motion, backup/reset, guidance, local feedback, shortcuts and tour  |

Manuscript query parameters `work`, `chapter`, `scene` preserve direct locations; timeline uses `event`, research `note`, and world collections `kind`. Unknown studio paths/projects produce a safe in-app empty state. Demo creation opens real local records rather than navigating to invented IDs. Comics intentionally open visual planning; they do not receive prose scene data or a pretend native drawing editor.

## Components and state

- `StudioProvider`: data adapter, persistence status, notifications, reset and updates. Feature pages never import the seed directly.
- `StudioShell`: global/project navigation, mobile drawer focus management, breadcrumbs, project switching, local-save indicator and command palette.
- Native shared Button/IconButton are reused. Studio-owned `Modal`, `FormDialog`, `ConfirmDialog`, `SearchField`, `PageHeading`, `Badge`, `EmptyState` and collection recipes provide common semantics. Native dialogs handle modal focus, Escape and restoration.
- `RichWritingSurface` wraps Tiptap with an isolated editing buffer, formatting/undo/redo and debounce. Scene keys prevent content from leaking between chapters; related content is a read-only contextual panel with a full-document link.
- `SplitView` provides bounded pointer and keyboard resizing, explicit separator values and stacked narrow layout. This is a two-pane foundation, not a desktop window manager.
- Canvas/relationship pages use React Flow custom nodes and library pan/zoom/selection. The canvas has an outline and numeric-position alternative; graph has a readable relationship list. Heavy editor/visual modules load dynamically only when required.
- `GuidedTour` is an explanation-mode native modal with visual target highlights, step announcements, Back/Next/Skip/Finish, viewport repositioning and missing-target fallback. It starts only on an explicit user request and can restart from Help; it never blocks account setup or adds a post-setup screen.

## Mock dataset

Deterministic stable IDs connect **5 projects, 7 works, 23 prose chapters, 27 scenes, 30 entities, 10 eras, 20 events, 16 relationships, 15 arcs, 20 plot points, 20 research notes, 20 media records, 20 canvas nodes and 5 canvas edges**. Projects cover literary fantasy, historical fiction, speculative fiction, nonfiction and a comic concept. Nonfiction has no forced fantasy cast. Initial activity is sample data; subsequent writing/entity edits create actual local activity records. Writing counts derive from current content; a labeled demo milestone is not an invented productivity statistic.

`models.ts` is deliberately separate from API-generated types. `seed.ts` assembles domain relationships, `story-details.ts` contains original distinct prose/entity/event details, `repository.ts` handles immutable mutations, ownership-aware cleanup, ordering/search/serialization and recovery validation, and `routes.ts` validates dispatch. Feature-facing methods are synchronous local operations today; a later async API adapter needs deliberate save/error states, not a blind replacement of seed imports.

## Local persistence and recovery

The versioned `rawan-author-studio-v1` localStorage record holds edits and preferences. Repository changes save after approximately 350ms. The manuscript buffers edits and updates shared data after approximately 600ms, on explicit Ctrl/Command+S or on scene departure. A small independent per-scene recovery record under `rawan-author-studio-draft:` is written during editing so a fast reload before the debounce can recover newer text. Successful repository saves clear matching recovery copies. Page-hide attempts to flush are an extra safeguard, not the only protection.

Malformed/wrong-version records are rejected; an original unreadable record is retained under `rawan-author-studio-recovery` where browser storage permits. A storage/quota failure keeps the working state open and displays a warning/retry. Export backup in Preferences downloads the current local dataset as JSON. Reset demo uses a confirmation, clears recovery drafts and restores the original seed/preferences. Export is a backup artifact; this phase does not implement a backup importer.

Uploads accept PNG/JPEG/WebP up to 1 MiB per image and store a data URL locally. No upload request is made. Browser total storage quotas still apply. Feedback is explicitly **saved locally, not sent**, and appears in Help. Tour completion, recent queries and preference values persist with the local dataset. Graph view knobs and split proportions are per-visit presentation; canvas node coordinates/edges persist.

Use one editing tab at a time: no conflict-safe multi-tab merge or cross-device synchronization is provided. Clearing browser storage removes edits. This is a prototype store, not a substitute for durable server persistence.

## Dependencies and original assets

Added `@tiptap/react` and `@tiptap/starter-kit` 3.32.0 for a schema-based, undoable editor rather than a custom contenteditable implementation; added `@xyflow/react` 12.12.0 for both graph and canvas rather than creating an infinite-canvas engine. No other UI kit or icon family was added. Integration follows the [official Tiptap Next guidance](https://tiptap.dev/docs/editor/getting-started/install/nextjs) and [React Flow controlled interaction guidance](https://reactflow.dev/learn/concepts/adding-interactivity).

`public/studio/covers/` and `public/studio/art/` contain original vector compositions created for this demo. No VVD artwork or external hotlinked media is used. Existing self-hosted Lora/Inter and the Rawan brand mark are reused.

## Validation results

- Website tests: **74 passed, 0 failed**, including 18 new studio tests covering deterministic data, project-scoped references, create/edit/reorder/delete, rich-content round-trip, immediate draft recovery, corrupted storage, search, preferences, route dispatch and comic/prose separation.
- Website lint: passed without warnings. Type checking: passed. Production build: passed; studio resolves as a dynamic optional catch-all. Existing public/auth routes remain in build output.
- Browser Journey A: edited a scene, explicitly saved, switched chapter, returned through dashboard Continue Writing, reloaded, and confirmed the edited scene remained available.
- Journey B: opened Mira, edited Role, followed Residence to the correct location, returned, and confirmed the changed property remained.
- Journey C: moved a canvas note with coordinate input and pointer drag, reloaded and confirmed its saved X coordinate, inspected timeline events and followed the related entity.
- Additional browser checks: project→work creation→editable opening chapter; graph rendering; command-palette search; tutorial Back/Next/Finish; light/dark preference; keyboard split resizing; mobile drawer and dashboard at 390px without horizontal overflow. No console errors were observed during checked editor/graph paths.
- Desktop and mobile visual review used 1440px, 390px and 320px breakpoint overrides. This is a practical review, not a full screen-reader/accessibility certification or exhaustive browser matrix. Browser checks used the connected browser tools; no new automated browser framework was added.

## Known limitations and next integration work

All domain operations remain mock-only. No real login/session/account mutation, publishing, reader UI, collaboration, external feedback delivery or deployment was added. Timeline numbers are approximate relative mock order, not the backend's exact decimal chronology. Custom entity aliases/properties/sections, note folders/pins, activity and richer canvas types require mapping or future contracts. Dedicated comic editing, true floating multi-window management, persisted canvas groups, automatic map/graph embeds and backup import remain outside this V1.

Next: choose one real prose source workflow, implement an explicit API adapter with auth and ownership, map Tiptap content to an approved content format, add genuine asynchronous save/conflict handling, and retain this mock adapter for demonstrations/tests. Then integrate worldbuilding and reference/media contracts separately. Do not POST mock convenience objects directly to Nest endpoints.
