# Rawan workspace layouts

19 October 2026. Proposed layouts informed by [reference patterns P02–P12](vvd-visual-reference-analysis.md). Backend-supported means the data contract exists; none of these proposed application screens is claimed implemented. Existing `/workspace` is an authenticated empty shell, `/workspace/reader` a minimal header shell and `/library` a public sample catalogue.

## Layout levels and default recommendation

| Level                        | Scope                                                                                             | Appropriate first use                                       | Storage / horizon                                                                                                  |
| ---------------------------- | ------------------------------------------------------------------------------------------------- | ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| 1 — pages + contextual panel | One primary document, one on-demand reference surface; ordinary navigation                        | First author shell, manuscript, entity detail and reader UI | H1 client composition using supported resources; local geometry only                                               |
| 2 — resizable split          | Two named panes with minimum widths, independent scrolling, keyboard separator, explicit collapse | Writing+note or map+place after one real task is validated  | H1 for client-only layout and authorized data; H2 for account-synchronized pane geometry/new workspace persistence |
| 3 — advanced workspace       | Several movable/dockable windows, restoration, window navigation, layout conflict policy          | Only after evidence that Level 2 blocks needed workflows    | H2 for deliberate bounded infrastructure and persistence; shared live workspace is H3                              |

Recommend Level 1 first. Images 21–26 demonstrate the value of comparison, not the necessity of arbitrary windows. Avoid route/session/focus complexity before Rawan has a functional manuscript workflow. SavedView module arrangements do not provide arbitrary window placement or collaborative layout.

## Author dashboard / project selection

**Reference:** 4/12/28 leave room around a small tool launcher. **Rawan:** a clear author heading, create-project action and real owned project list; optional supported work identity links. Let people resume a selected manuscript without navigating a visual world. A quiet project identity area can use original cover-driven atmosphere, but list text sits on a reliable surface. Do not invent global recent-activity metrics, deadlines or streaks from dates alone.

On an empty account, explain that a project holds writing and optional support material and offer creation. On a populated account, search/filter only to actual contract support. Future project-type choices are organizational defaults, not new permission roles or promised format-specific engines. No creator task board appears on reader home.

## Project workspace

Compact header names the project and, where relevant, linked Work and current private source. Contextual navigation prioritizes manuscripts, then optional notes/research/world tools. Tags/filter views can use real SavedView support, including the module allowlist. Do not present editable arbitrary folder nesting as implemented: the hierarchy is explicit resources, not a generic document tree.

An empty project offers an initial manuscript or relevant supported material. Preserve direct source navigation and safe auth/setup gates. Publishing has an explicit prepare/preview/publish sequence from owned Work content; a navigation preference never publishes a project.

## Manuscript workspace

Primary area is a solid, readable text surface with Lora prose, modest title and visible save status. A chapter/scene list is contextual and collapsible. Keep tool controls near the relevant task and put advanced worldbuilding away until requested. A secondary note/entity panel should not reduce the main column below a comfortable measure; open full detail when it cannot fit.

Two content models must remain distinct: Book → Chapter → Scene text, and optional WorkDocument sections with supported semantic plain-text blocks and revision checking. They are not interchangeable IDs or a universal rich HTML editor. Choose the target for the first workflow deliberately. Do not promise inline rich entity mentions, block embeds, tracked changes or cross-device drafts unless their contracts are added.

Saving must communicate dirty, saving, saved and failed honestly. Use revisions where supported; do not claim conflict-safe simultaneous editing for endpoints without it. Preserve unsaved local text through recoverable errors. Existing media endpoints do not make images inline scene blocks automatically. Focus mode hides optional chrome and atmosphere, not save/error state.

## Entity document

Adapt 19's hierarchy: name/type, optional private image attachment, concise typed facts, narrative description, related entities and supported event/plot references. Rawan uses its own entities and copy. Characters expose role/status; places/factions/artifacts use their actual type fields. Do not show every entity the same invented “age/allegiance” form. Events remain timeline resources with time and entity associations rather than a fifth WorldEntityKind.

Full page can place portrait beside facts; contextual panel stacks them at a content threshold. Reduce image prominence before body text. Facts use visible full labels, wrap values and include explicit edit entry. Descriptions remain within their actual plain-text format. Custom fact schemas, aliases and arbitrary section blocks inside an entity are H2. A presentation heading such as Description can organize the current field without claiming stored section support.

## Canvas

Adapt 20's overview and 21's comparison: named bounded project canvas, stable pan/select/add/connect toolbar, readable fit/zoom controls and an accessible content outline. Current node kinds are TEXT, IMAGE, CHARACTER, PLACE, FACTION and ARTIFACT. Text notes, image inspiration and supported entity references can serve moodboard/research/plot-planning use cases.

Coordinates are bounded (-100000 to 100000); node dimensions are bounded (20–4000), so “infinite canvas” is only a presentation metaphor. No current persisted GROUP, CHAPTER, MAP, GRAPH or live embedded document node exists. Use a text planning card for a concept without falsely binding it to a chapter. Temporary multi-selection/group outlines are possible local presentation; persisted grouping or live nested tools need H2.

At overview zoom show group-like spatial relationships, titles and image thumbnails, not unreadable tiny paragraphs. At detail zoom enable text editing in an actual DOM editor. Selection has visible boundary and an equivalent outline item. Offer pan/select modes, zoom/fit/reset, coordinate edit and keyboard move. Preview drag locally and persist actual node updates with failures surfaced; avoid request-per-pointer-event. Referenced media/entities can become unavailable and must show that state safely. Fetching limits are real; a bounded response must not be advertised as unlimited content.

## Map

Adapt 23–26's visual layers: original/private uploaded map image at base, labeled regions next, marker symbols and dark readable label plates above, selected marker last. Provide legend, fit/zoom, place list and details panel. Coordinates are normalized 0–1, region polygons have 3–200 points and color, and pins can reference current character/place/faction/artifact kinds. Initial UI should emphasize locations while allowing supported links intentionally.

H1: owned media background, label/coordinate pins, supported entity links, bounded colored polygons, client pan/zoom and safe approved release map projections. H2: new persistent marker icon/category/layer schemas, event-specific pin references, arbitrary map annotations beyond existing fields, synchronized camera and grouped map controls. H3: geographic GIS, terrain generation and collaborative cartography. Client-only label collision/temporary decluttering need no new data schema. A selected character's connection to a place can be displayed from actual relationships, not inferred from proximity on a map.

Provide a form alternative to dragging pins/polygon vertices. Region name and shape/pattern supplement hue. At low zoom prioritize selected/important labels and offer the full list; the dense overlap in the reference is a problem to solve, not a target.

## Timeline and plot

Timeline UI itself is unobserved in the supplied images; launchers in 4/12/28 and graph settings in 1 cannot prove its layout. Rawan H1 has timelines, eras, events, exact decimal chronology and entity links. Start with a readable event list, optional proportional overview, era filters and a context detail panel. Preserve exact chronology and do not invent a Gregorian calendar or geographic time model. Empty timeline offers an event; empty plot offers a plot point. Plot sequence is a separate narrative ordering with scene/event/entity links, not automatically timeline time.

Relationship graph uses current typed relationships and directions with ephemeral layout. Provide selected-neighborhood exploration, density/spacing view controls and a relationship table. Canvas-edge positions and graph force-layout coordinates are different concepts. Persistent graph geometry requires contract work; a full graph was not supplied as evidence.

## Research workspace

Use structured sources, provenance and citations beside optional owned documents. A source list with filters and a detail/reference panel is more useful than a compulsory canvas. Show authors, identifier, URL, date and actual citation locator as supported. URLs are metadata, not permission to scrape or fetch remotely. Bibliography publication is deliberate and excludes private provenance/files/quotes according to release rules. Long research copy uses opaque text surfaces. Notes remain usable without formal citations.

## Split-view behavior

Preferred first task: manuscript + private note. Later: map + place or canvas + entity. Put context and close/open-full in each pane, preserve focused document and independent scroll, and avoid duplicate editor instances for the same unsaved content. Switching project closes or clearly re-scopes supporting panes so stale references cannot appear to belong to another project.

Start around a 2:1 primary/reference ratio for writing; comparison tools can use equal panes. Proposed minimums: 560px primary writing area and 340px reference area plus gutters/chrome, adjusted through real text testing. These are design thresholds, not persisted backend values. If minimums fail, use tabs/sequential pages instead of shrinking fonts. Resizing changes geometry only; a local preference may restore it on one device, but cross-device geometry is H2.

## Reader library and discovery

Use a cover grid or accessible list with title, public credit, supported status/favorite and continuation. Collection navigation is optional, with unavailable-work states that distinguish removal/withdrawal from load failure. Empty library offers eligible discovery and saving; it does not offer character creation. Current public `/library` sample cards are not real account library data and must not be treated as fixtures for production behavior.

Discover supports actual eligible catalogue filtering, work/version lookup and supported editorial/shared collections. Do not introduce recommendation, popularity or commerce modules. Work detail ties metadata, credits, editions and eligible releases together; a private source Book is not a public catalogue entry.

## Book and comic readers

Book reader: calm solid backdrop; 55–75-character prose measure; adjustable typography and contents; optional bookmark/highlight/note controls and lightweight progress. Hide chrome without making it undiscoverable. Progress/annotation locators belong to a release; stale progress revisions must resolve explicitly, and source edits must not move a reader silently to private content. Handle withdrawn/unavailable releases and resume fallback. Accessible text search consumes released blocks only.

Comic reader: approved processed artwork, safe aspect-ratio layout, page/spread/vertical/guided choices within manifest capabilities, explicit reading direction and authored panel navigation. Avoid forcing portrait prose measures onto images. No native drawing, OCR, automatic panel detection or offline distribution is inferred.

## Responsive and accessibility matrix

| Context                | Proposed layout response                                                                 | Input/focus implications                                                          |
| ---------------------- | ---------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| Large desktop          | Fixed comfortable prose measure; optional reference pane; extra outer space              | No need to stretch paragraphs or open more tools automatically                    |
| Laptop                 | Slim contextual navigation; one primary task; split only when minima fit                 | Pane controls remain labeled and focus visible at zoom                            |
| Tablet                 | Primary view plus supporting tab/drawer; avoid free floating windows                     | Touch selection distinct from pan; explicit close/return                          |
| Mobile                 | Full-page document, navigation drawer, settings/detail sheets, list-first timeline/graph | Safe areas/keyboard clearance; coordinate forms and named gesture alternatives    |
| Text zoom / low vision | Reflow to one column even on physically wide screens                                     | No clipped facts, inaccessible toolbar overflow or sticky controls covering focus |

Do not claim these responses were observed: all supplied product screenshots are desktop or desktop crops. Reading and writing need actual narrow-width testing before approval. Every spatial view has an ordered list/form alternative, and all async views distinguish loading, empty, failed, unavailable and conflict states.
