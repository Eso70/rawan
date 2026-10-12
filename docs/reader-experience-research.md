# Dedicated Rawan reader experience

Implementation update (12 October 2026): originally Horizon 2 backend scopes N01–N26 are now implemented in bounded form; see the [current backend guide](backend-horizon-2.md) and [validation ledger](backend-horizon-2-implementation.md). These backend capabilities are available to a future frontend. Horizon 3 remains deferred and no frontend changes accompany this implementation. The study below preserves its original research baseline; its old capability gaps/horizon labels must be read alongside the current register, not as current implementation status.

## Mandatory product horizons

The [feature register](product-horizons.md) supplies support/gaps, frontend/data implications and ADR requirements. Local text styling alone does not make a released-work reader current functionality.

| Horizon                 | Major recommendations and register IDs                                                                                                                                                                                                      |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| H1 — Current Rawan      | Calm owner-only draft preview/local typography (C11/C10), existing preferences (C01); no reader library/state                                                                                                                               |
| H2 — Near future        | Release-safe basic reader (N02/N03), library/progress/bookmarks/history (N04/N05), highlights/annotations (N06), released-text search (N07), semantic footnotes/references (N08), synchronized appearance (N16), comic navigation (N20/N22) |
| H3 — Long-term platform | Offline readable delivery (L12), automatic personalization (L04/L11), community interaction (L03), wider distribution/access models (L06/L07)                                                                                               |

Research date: 12 October 2026. This document defines a proposed prose-reading experience and its backend dependencies. It implements no reader interface, reading-state API or publication feature. Graphic reading remains a distinct rendering experience covered by [comic research](comics-product-research.md).

See [library system research](library-system-research.md) for saved works, collections, status views and the distinction between personal libraries and public discovery.

The [visual identity across modes study](visual-identity-across-modes.md) preserves shared Rawan controls and identity while allowing reader typography, themes and calm presentation to differ from creator tools.

## Research basis

The DAISY Consortium's Thorium guide documents a reader with navigation, bookmarks, annotations/highlights, search and presentation settings. This establishes useful reader functions, not a reason to reproduce a desktop application's toolbar in Rawan. [Thorium guide](https://daisy.org/guidance/info-help/guidance-training/reading-systems/thorium-epub-reader-quick-start-guide/).

W3C's text-spacing criterion requires content to tolerate applicable user overrides without losing content or functionality: line height 1.5 times font size, paragraph spacing 2 times font size, letter spacing 0.12 times font size and word spacing 0.16 times font size. These are override test values, not mandated default styles or proof of a universally best font. [Text spacing](https://www.w3.org/WAI/WCAG22/Understanding/text-spacing.html).

W3C reflow guidance addresses reading text without scrolling in two dimensions at a width equivalent to 320 CSS pixels, except content genuinely requiring two-dimensional layout. Reflowable prose should remain usable under browser zoom and larger text. [Reflow](https://www.w3.org/WAI/WCAG22/Understanding/reflow.html).

Readium's locator model associates a location with a publication resource and optional location/text context. It provides a reference for content-based navigation instead of treating viewport-specific page numbers as permanent locations. This informs the position design below; it does not mean Readium is installed in Rawan. [Readium locators](https://readium.org/architecture/models/locators/).

The remaining recommendations are Rawan design inferences from these sources and the repository. This is desk research, not a tested interface or a claim of accessibility conformance.

## Separate reading from writing

Create exposes tools for modifying and organizing material. The reader surface exists to sustain attention on a released work. It should not display manuscript trees, scene editing controls, author planning panels, worldbuilding tools, save buttons or project management navigation around the text.

Separate three environments:

1. **Discovery/library/work detail:** can express Rawan's brand and support browsing, collecting and choosing a work.
2. **Reading surface:** solid background, readable text, quiet navigation and optional small progress context.
3. **On-demand controls:** contents, appearance, search, bookmarks and notes, opened intentionally and dismissed without losing position.

No glass surfaces, moving gradients, parallax, 3D, animated text or decorative effects behind prose. Brand expression belongs outside the reading column. Use limited functional transitions only where they clarify a control opening; respect reduced-motion preferences. Avoid automatic scrolling or page-turn animations that move the text without a reader action.

## Typography and personalization

Start with a single reflowable column. The following values are prototype starting points, not accessibility standards: roughly 20 CSS pixels for body text, 1.6 line height and a width near 60–70 Latin characters where practical. Test with actual works and scripts; a Latin `ch` measure is not a universal Arabic/CJK readability target. Phone width and reader preferences take priority over a rigid target.

| Control                       | Recommended behavior                                                                                                                                      |
| ----------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Font family                   | A small set of legible serif/sans options with appropriate script coverage and reliable fallbacks; no claimed universally optimal or dyslexia-curing font |
| Font size                     | Accessible increase/decrease controls plus browser zoom compatibility; do not prevent enlargement to preserve pagination                                  |
| Line height                   | Adjustable independently; avoid clipping diacritics, ascenders or larger fallback fonts                                                                   |
| Content width                 | Narrow/standard/wide options, bounded by available viewport; preserve an intelligible reading position on change                                          |
| Paragraph spacing             | Adjustable; respect meaningful paragraph breaks and avoid adding blank paragraphs as spacing                                                              |
| Margins                       | Responsive padding plus a reader adjustment where useful; large preferences must not shrink the text into an unusable column                              |
| Alignment                     | Start alignment by default, respecting language direction; optional justification only after language-aware testing                                       |
| Light                         | Solid light reading background and contrasting text                                                                                                       |
| Dark                          | Solid dark reading background; verify text, links, focus and selected/highlighted text contrast                                                           |
| Sepia / warm                  | A restrained warm background/text pair with verified contrast; not a medical claim or automatic night schedule                                            |
| Fullscreen / distraction-free | Optional, user-triggered; an accessible exit and a browser fallback are essential                                                                         |

Group common controls into Appearance, with more spacing options available progressively. Include Reset to reading defaults. Apply previews immediately while retaining the current content anchor. Keep appearance preferences distinct from the author's manuscript styling: presentation changes must not modify the work.

A reader may prefer local/device-specific layout while using account defaults elsewhere. Decide which settings synchronize; do not copy a desktop width or fullscreen state blindly onto a phone. Apply stored appearance early enough to avoid a flash of the wrong theme or a large font-driven jump.

Arabic and mixed-direction text require language/direction metadata, suitable font shaping and punctuation handling. Do not force artificial letter spacing in scripts where it disrupts shaping. Headings, lists, quotations, poetry and tables need supported semantic presentation rather than every block becoming an indistinguishable paragraph.

## Calm navigation and controls

Show a small identity/navigation area and, optionally, a quiet progress line. Keep the text's position stable when controls are shown. Controls may be collapsed intentionally; never make mouse movement or hover the sole way to recover them, and do not hide controls while they hold keyboard focus. Avoid a toolbar that constantly appears and disappears during ordinary reading.

| Function              | Interaction recommendation                                                                                                                                                    |
| --------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Chapters and contents | A labeled, hierarchical contents panel; indicate current location and preserve a return path after jumps                                                                      |
| Progress              | Show an approximate whole-work percentage and chapter context; distinguish last position from completion and avoid gamified pressure                                          |
| Bookmarks             | Save a named/identifiable location; bookmark action need not require text selection                                                                                           |
| Highlights            | A compact action near deliberate selection; multiple colors may be optional but must not be the only category signal                                                          |
| Annotations           | A note attached to a stable text/location anchor; editing and deleting should remain explicit and private by default                                                          |
| Search inside book    | Search released readable content, show snippets/context and support return to the pre-search position                                                                         |
| Footnotes             | Accessible inline disclosure or a small panel with return-to-reference behavior; never hover-only                                                                             |
| References            | Distinguish internal navigation from external links; retain the reading position and make destination understandable                                                          |
| Keyboard              | Keyboard access to contents/settings/search/bookmarks, logical focus, Escape dismissal and discoverable shortcuts; avoid intercepting typing or assistive-technology commands |
| Touch                 | Natural scrolling and selectable text; avoid edge gestures that conflict with system navigation and selection handles                                                         |

Start with continuous scrolling for reflowable prose because it keeps the initial implementation simpler. Pagination is a future presentation choice, not a content model: available pages change with font, spacing and viewport. If introduced, preserve the same locator system and do not conflate generated pages with print page numbers. Do not force two columns simply because a display is wide.

## Responsive behavior

| Device/context | Reading surface                                                                    | On-demand controls                                                              |
| -------------- | ---------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| Desktop        | Centered bounded column with generous outer space; keyboard/mouse support          | Optional side panel if room exists, with retained reading anchor                |
| Laptop         | Same bounded column, accommodating short viewport height and browser zoom          | Compact panel/drawer; avoid squeezing text between permanent sidebars           |
| Tablet         | Single column by default in either orientation; text selection and touch scrolling | Drawer or sheet with clear close action; preserve position on rotation          |
| Phone          | Full available column with safe padding, scalable text and unobscured final lines  | Accessible sheet/panel, large practical controls and no permanent contents rail |

Layout should respond to available space, text scale and input methods rather than device labels alone. A narrow desktop window should behave like a narrow viewport. Browser UI, the phone keyboard, safe areas and open annotation panels must not cover the current text or prevent access to the end of a chapter.

## Accessibility and performance

Use semantic text and headings, declared language, meaningful links, visible focus and accessible names. Preserve text selection, copy where access policy permits, browser zoom and native scrolling. Do not render prose into a canvas or image to simplify pagination. Dialogs need appropriate focus handling and restoration; decorative chrome must not interrupt screen-reader reading order.

Test all themes and annotation colors for contrast, including hover/focus and selection. Test user spacing overrides, large text, keyboard-only use and screen-reader navigation. Avoid interpreting a platform's accessible reputation as certification of Rawan.

Deliver the current reading section first, then preload a bounded neighboring section. Fetching every scene separately in the reader is not a suitable future publication contract. Avoid loading an entire large work or decorating every paragraph with expensive components. Keep geometry stable while fonts and supplementary images load; fallback typography must remain usable.

Large chapters require an explicit performance strategy. Do not choose aggressive text virtualization that removes selection or screen-reader context solely to reduce DOM size. If sectioning/virtualization becomes necessary, validate search, selection, anchors, history navigation and accessibility together. Network failure should preserve visible content and provide a retry, not move the reader into a blank screen.

Offline downloads and service-worker caching require a deliberate privacy, access and invalidation policy. They are not implied by preloading or saved preferences. On shared devices, clear account-specific state appropriately on sign-out and account switching.

## Backend dependencies and current limits

| Requirement              | Current backend                                  | Needed for a released-work reader                                                                                 |
| ------------------------ | ------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------- |
| Content and contents     | Owned books/chapters/scenes with text            | Authorized release content, explicit reading order, semantic structure and navigation metadata                    |
| Appearance               | Account experience preferences only              | Separate validated reading preferences if account sync is required; layout controls alone can remain client-local |
| Progress and bookmarks   | No reading-state models/routes                   | Identity-scoped release-aware locators and saved locations                                                        |
| Highlights/annotations   | Private project notes are not reader annotations | Text-range anchoring, personal visibility, CRUD and stale-anchor behavior                                         |
| Book search              | Private project search across multiple kinds     | Search only readable released content, return navigable positions and enforce release access                      |
| Footnotes/references     | Scene strings; no structured footnote model      | Semantic content and addressable note/reference targets                                                           |
| Position synchronization | No progress-sync contract                        | Update/concurrency policy, timestamps/revisions, retry behavior and version migration                             |
| Reading history/library  | No reader collection/history contract            | Separate scoped reader records and agreed retention/privacy policy                                                |

An owned-draft reading preview can use today's text without publishing it, but cannot substitute for a dedicated reader backend. The current `UserOnboarding` DTO accepts only defined preference/progress fields; it is not a generic storage object for reading settings. Do not hide typography JSON or reader annotations in manuscript notes to bypass the missing contract.

## Position and synchronization design

A proposed locator identifies a work/release version, readable section and stable block/range when available, with contextual text/progression as a fallback. Progress percentages are approximate presentation data, not the sole identity of a location. Screen pixels, browser scroll height and generated page numbers do not survive font changes, different screens or updated releases.

Retain the same content anchor through appearance changes, orientation, opening panels and returning from footnotes/search. Highlights need a range plus context and an explicit strategy for unmatched anchors. Reflow changes presentation; editorial release updates change content. Treat these differently.

For synchronization, define last-read position separately from furthest-read progress. A deliberate reread or bookmark jump should not be overwritten by always taking the largest percentage. Throttle/coalesce updates, save at sensible boundaries and make failed saves retryable. Returning to another device may offer its newer position; synchronization should not jump a currently active reader unexpectedly. Do not promise delivery based only on an unload event.

Reader state must be scoped to the authenticated account and access-checked against its release. Keep annotations private unless a later explicit sharing model exists. Withdrawal, content updates, deleted accounts and missing access must each have defined behavior for library entries and saved positions.

## Evolution and evaluation

First establish release-safe content and a calm scrolling reader with contents, basic appearance, keyboard/touch access and reliable position restoration. Add synchronized progress/bookmarks when their API is ready. Add released-content search, semantic footnotes and anchored annotations as separate increments. Keep comic image navigation distinct while sharing identity, library and locator conventions.

Before approving a reader implementation, evaluate:

- English and Arabic prose, mixed-direction passages, long headings, poetry and nonfiction references.
- All themes, custom fonts, larger text, spacing overrides and a 320 CSS-pixel reflow viewport.
- Desktop/laptop narrow windows, tablet rotation, phone browser UI and annotation keyboard appearance.
- Font/theme changes, contents jumps, footnote return and search return without losing position.
- Keyboard-only and screen-reader operation, native selection and reduced motion.
- Slow/reconnecting networks, failed preload, long chapters and large works.
- Two-device position conflicts, rereading, release updates and account isolation.

These are future acceptance scenarios; no reader UI or user testing was performed in this research phase.

## Repository references

- [Current capability audit](product-scope-and-backend-capabilities.md) and [Create/Experience bridge](create-and-experience-bridge.md)
- [Database schema](../packages/database/prisma/schema.prisma), [manuscript DTOs](../apps/api/src/manuscript/manuscript.dto.ts) and [API behavior](api.md)
- [Account experience](account-experience.md) and [comic reader distinctions](comics-product-research.md)
