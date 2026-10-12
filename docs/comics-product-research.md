# Comics and graphic narratives: product research

Implementation update (12 October 2026): originally Horizon 2 backend scopes N01–N26 are now implemented in bounded form; see the [current backend guide](backend-horizon-2.md) and [validation ledger](backend-horizon-2-implementation.md). These backend capabilities are available to a future frontend. Horizon 3 remains deferred and no frontend changes accompany this implementation. The study below preserves its original research baseline; its old capability gaps/horizon labels must be read alongside the current register, not as current implementation status.

## Mandatory product horizons

The [feature register](product-horizons.md) supplies the required support, gap, frontend/data and ADR analysis. No comic creation/reading system is H1 merely because notes and image uploads exist.

| Horizon                 | Major recommendations and register IDs                                                                                                                                                                            |
| ----------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| H1 — Current Rawan      | Unstructured private scripts/notes, story planning and permitted visual references (C03–C08); local creator presentation (C10)                                                                                    |
| H2 — Near future        | Work/release bridge (N01/N02), reader state and attribution/series (N05/N11/N13), imported comic reader (N20), page/script/appearance organization (N21), vertical/guided panels (N22) and artwork pipeline (N23) |
| H3 — Long-term platform | Native drawing/layered lettering/visual AI/OCR (L08), shared production/review (L09), community/commerce/distribution (L03/L06/L07)                                                                               |

Research date: 12 October 2026. Product implications are recommendations, not implemented functionality. [Backend implications](comics-backend-implications.md) are documented separately. The current manuscript editor contract is not a comic system.

## Research basis and limits

Clip Studio's official workflow describes story and character planning, panel thumbnails, dialogue placement and finished artwork, with output size/resolution chosen for the destination. Its page manager and story editor treat page organization and lettering as distinct concerns. This supports a comic workflow broader than prose text entry. [Creation workflow](https://www.clipstudio.net/en/comics-manga/comic-creation/), [Page Manager](https://help.clip-studio.com/en-us/manual_en/570_pages/Page_Manager.htm), [Story Editor](https://help.clip-studio.com/en-us/manual_en/570_pages/Use_Story_Editor.htm).

Clip Studio's webtoon tools preview a phone viewport and split long canvases into export images. Vertical content should therefore be considered an intentional composition, not automatically converted from print pages. [Webtoons](https://help.clip-studio.com/en-us/manual_en/540_comic/Webtoons.htm).

GlobalComix documents creator-defined interactive panel-to-panel reading. Guided navigation is additional authored metadata, not something every uploaded page automatically provides. [GlobalComix FAQ](https://globalcomix.com/support/faq).

W3C EPUB distinguishes fixed-layout behavior, page progression and spread presentation. Its fixed-layout accessibility guidance addresses the problems of visual layouts and accessible reading order. These inform Rawan's reading requirements without requiring an EPUB implementation during research. [EPUB 3.3](https://www.w3.org/TR/epub-33/), [Fixed-layout accessibility guidance](https://www.w3.org/TR/epub-fxl-a11y/).

This is desk research of official creator tools, a reader platform and publishing specifications. It is not user-interview evidence, a usability test, or proof that every comic creator follows the same workflow. The recommendations below are Rawan design inferences.

## Concepts and boundaries

| Concept               | Product meaning                                                                                             |
| --------------------- | ----------------------------------------------------------------------------------------------------------- |
| Series                | Related works or installments under a shared identity; not necessarily a mandatory root                     |
| Volume                | A labeled grouping or collected publication; meaning must be explicit because publishers use it differently |
| Issue / episode       | A released installment; a standalone graphic novel need not have issues                                     |
| Chapter               | An optional narrative subdivision, independent of issue numbering                                           |
| Page                  | A composed visual reading surface; not a prose chapter or scene                                             |
| Spread                | An intentional composition spanning facing pages; different from merely displaying adjacent pages together  |
| Panel                 | A visual narrative region with an authored reading sequence, potentially irregular or overlapping           |
| Scene                 | A narrative event/location/time segment that may span panels or pages; not a synonym for panel              |
| Script                | Instructions and narrative text for the comic, commonly organized by page/panel or episode                  |
| Dialogue              | Spoken text associated with a speaker where known                                                           |
| Caption               | Narration or other contextual text, distinct from spoken dialogue                                           |
| Sound effect          | Visual/textual sound representation, potentially part of artwork or lettering                               |
| Appearance / location | References connecting story entities to depicted content; not necessarily public metadata                   |
| Visual reference      | Supporting material for creating art; distinct from released page artwork                                   |
| Draft / revision      | Working states and changes to script, artwork or lettering; distinct from published release versions        |

Do not mandate Series → Volume → Issue → Chapter → Page for every work. A standalone graphic novel, serialized comic and vertical episode have different grouping needs. Covers, credits and other front/back matter also need intentional handling rather than arbitrary panel numbering.

## Comic creation experience

A candidate workflow is concept/research → script → thumbnails/layout → draft artwork → finished artwork → lettering → review → reader preview → release preparation. Creators may revisit these stages, combine them or produce finished artwork externally.

Suggested interfaces when supported:

- **Project planning:** reuse notes, characters, places, relationships, timelines and plot tools without requiring all of them.
- **Comic script:** page/panel or episode outline with action descriptions, dialogue, captions and sound effects; preserve a text-writing experience distinct from drawing.
- **Page organizer:** thumbnails, order, cover roles and intentional spread relationships; show missing artwork and revision status.
- **Artwork management:** import externally created pages, distinguish references from publishable art, compare replacements and retain selected revisions.
- **Lettering review:** inspect readability and text order. Dialogue may be baked into art or separately editable; the product must declare which it supports.
- **Appearance linking:** connect a character/place to a depicted page or panel without claiming automated visual recognition.
- **Reader preview:** check page/spread/vertical presentation, direction, phone viewport, legibility, and optional guided-panel sequence before release.

Rawan should first decide whether its comic scope is planning and organizing finished artwork or a full drawing/lettering application. A practical initial direction is planning plus imported artwork, while dedicated illustration software handles drawing. Layer editing, brushes, balloon placement and collaborative production are separate major products, not minor manuscript-editor additions.

AI might later assist scripts, summaries or descriptions only through an explicitly supported capability and creator review. Today's disabled development/test text simulator is not comic generation, artwork generation, OCR or visual understanding.

## Comic reading experience

| Requirement      | Recommended behavior and implications                                                                                                             |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| Page reading     | Respect authored order; provide page navigation, fit-to-page/width and a clear return to work details                                             |
| Spreads          | Preserve intentional two-page compositions; support a usable single-page view on small screens without destroying access to the whole spread      |
| Vertical reading | Preserve pacing, gaps and segment order; do not treat each exported image as an independent print page                                            |
| Panel navigation | Optional when creator-defined regions/order exist; provide full-page escape and contextual transitions, without forcing arbitrary automatic crops |
| Zoom             | Pan and pinch zoom with a reset action; avoid interpreting every drag while zoomed as a page turn                                                 |
| Image quality    | Keep lettering legible and aspect ratios intact; choose suitable delivery sizes and avoid cropping art to fill the viewport                       |
| Preloading       | Load the visible item first and a bounded neighbor window; provide retry states instead of advancing into blank content                           |
| Direction        | Separate page progression from text language/direction; RTL comics must not mirror their artwork automatically                                    |
| Fullscreen       | Offer a user-triggered reading mode with reachable exit/navigation and a fallback when browser fullscreen is unavailable                          |
| Progress         | Resume at an identified page/panel or vertical segment location; loading an image alone should not count as reading it                            |
| Mobile           | Account for portrait/landscape, gestures, safe areas and memory limits; preserve position through viewport changes                                |

Guided panels, two-page display and vertical scrolling are different reading strategies. Store what the release supports, then let the reader choose available modes. Do not promise that one mode converts all formats without creator review.

Accessibility must be part of the content workflow: ordered textual descriptions/transcripts, speaker attribution where available, keyboard controls, screen-reader-compatible navigation, meaningful focus and reduced-motion transitions. Zoom alone does not make image-only storytelling accessible. Text embedded in artwork may need separately supplied accessible text; OCR cannot be assumed accurate or available.

## Shared Rawan ecosystem

Use one account, project ownership, creator identity and future work/release identity across prose and comics. Share characters, places, relationships, timelines, plots, notes, reference media, tags and private search where their existing contracts apply. Sharing infrastructure does not mean today's reference kinds already include comic pages or panels.

Reader exploration of selected lore must use release-safe content, not private creator entity endpoints. Scripts, thumbnails, private references, character spoilers and working revisions remain private unless explicitly released. Series navigation should show only accessible released installments.

## Proposed scope progression

1. Establish prose publishing/reader access foundations or a format-neutral release foundation before exposing any comic art publicly.
2. Scope imported page artwork with explicit order, reading direction, page/spread preview and creator-supplied accessibility content. Keep optional series/chapter structures out of the required creation path.
3. Add series/issue organization and supported vertical episodes when concrete requirements are agreed.
4. Add manually authored guided-panel metadata and richer script/appearance linking as independent milestones.
5. Consider native drawing, layered lettering, collaboration and specialized AI only after separate research and product decisions.

Potential future validation should include a standalone graphic novel, an RTL installment with a cover, an intentional spread, a phone-oriented vertical episode, and an irregular panel sequence. Test weak connectivity, zoomed navigation, image failure, accessible text order and resuming after a release update. These are proposed evaluation scenarios, not tests run during this research.

No comic interface or functionality is implemented by this document.
