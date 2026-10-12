# Visual identity across Rawan modes

Implementation update (12 October 2026): originally Horizon 2 backend scopes N01–N26 are now implemented in bounded form; see the [current backend guide](backend-horizon-2.md) and [validation ledger](backend-horizon-2-implementation.md). These backend capabilities are available to a future frontend. Horizon 3 remains deferred and no frontend changes accompany this implementation. The study below preserves its original research baseline; its old capability gaps/horizon labels must be read alongside the current register, not as current implementation status.

## Mandatory product horizons

The [feature register](product-horizons.md) supplies current support/gaps, frontend/data implications and ADR requirements. A mode contract is visual guidance, not evidence that its product feature exists.

| Horizon                 | Major recommendations and register IDs                                                                                                                               |
| ----------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| H1 — Current Rawan      | Shared assets/controls/accessibility and current Create/Write/private graph presentation (C09/C10), owned prose preview (C11); no new backend required               |
| H2 — Near future        | Released reader (N03), Library/Discover/public work context (N04/N09/N10), real spatial/graphic modes (N19–N23), synchronized appearance (N16)                       |
| H3 — Long-term platform | Unified visual identity across the whole ecosystem (L01), native art/advanced collaboration/adaptive UI (L08/L09/L11); do not build seven speculative mode templates |

Study date: 12 October 2026. This is a design-system direction, not an approved palette, font replacement, page design or component implementation. It makes no UI, styling or backend changes.

See [customization and preference scopes](customization-and-preference-scopes.md) for creator/reader choices, portable defaults, contextual overrides and device/session behavior.

## One identity, different environments

Rawan's identity should be recognizable through coherent typography roles, spacing rhythm, icons, control behavior, color semantics and navigation. Consistency does not require identical layouts, density or motion in creation and reading.

The work remains the connecting context. Create, Library and Discover are entry points; Write, World and comic authoring/reading are contextual task environments. These labels describe presentation needs, not seven separate applications or a mandatory route/template system. See [work-centered architecture](work-centered-product-architecture.md).

## Research basis

Carbon's typography guidance distinguishes productive and expressive use cases while allowing task-appropriate combinations. This offers a precedent for one system supporting compact tools and editorial browsing without forcing the same typography scale everywhere. Its own font and commerce objectives are not Rawan requirements. [Carbon typography](https://www.carbondesignsystem.com/building-blocks/foundations/typography/style-strategies).

Carbon's motion guidance connects movement to semantic intent and spatial continuity. Rawan can share motion meanings while varying the amount of movement by task. [Carbon motion](https://www.carbondesignsystem.com/building-blocks/foundations/motion/choreography).

W3C documents `prefers-reduced-motion` as a way to avoid nonessential motion when requested. Applying that preference does not by itself establish full accessibility conformance. [W3C reduced-motion technique](https://www.w3.org/WAI/WCAG22/Techniques/css/C39.html).

The recommendations below are Rawan design inferences, not tested user findings or a decision to adopt Carbon as a dependency.

## Current repository foundation and limits

The website already has local SVG/PNG brand assets, Lora and Inter Latin font files, and Space Grotesk/Caveat font files. Global CSS defines a dark root surface, uses Inter for UI, hides scrollbars globally and defines landing-specific patterned/gradient styling. The dashboard shell has separate inline light styling.

These are existing assets and styles, not a complete cross-mode token system. Their presence does not establish suitable Arabic/script coverage, sustained-reading typography, accessible contrast in every theme or standardized component variants. The current font-file names explicitly identify the Lora/Inter files as Latin resources; broader script support needs verification and appropriate fallbacks.

Existing visual choices remain untouched. The future system should scope landing behavior and decoration so that it does not automatically govern writing, research tools or the reader. A bright global focus outline may need a semantic theme counterpart on a light surface. Globally hidden scrollbars should not become an assumed pattern for long research lists or accessible reading navigation merely to resemble a marketing page.

## Mode contracts

| Mode               | Intended character                           | Layout and density                                                                                       | Typography/surfaces                                                                | Motion and interaction                                                                   |
| ------------------ | -------------------------------------------- | -------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| Create             | Powerful, focused, professional and flexible | Structured project/task navigation; enough density for metadata and tools                                | Clear UI hierarchy and restrained surfaces; inspiration through actual content     | Prompt functional feedback, predictable panels, optional supporting tools                |
| Write              | Calm, stable, fast and distraction-free      | Text as the primary column; support panels only when requested                                           | Excellent editable prose, scalable size/spacing and solid backgrounds              | No animated text/reflow or decorative motion; protect caret, selection and save feedback |
| World              | Exploratory, interconnected and visual       | Relationship/timeline views and spatial layouts where actually supported                                 | Readable entity labels, consistent node/link meanings and subdued context surfaces | User-controlled pan/zoom/navigation with focus and non-spatial alternatives              |
| Read               | Quiet, immersive, comfortable and personal   | Reflowable text column with on-demand controls                                                           | Reader-selectable typography and light/dark/warm solid surfaces                    | Natural reading/navigation; no forced smooth scroll, parallax or decorative transitions  |
| Library            | Collectible, organized and inviting          | Cover grid/list options and clear personal status/views                                                  | Visible titles/creators, consistent cover slots and clean metadata                 | Modest feedback; preserve list position and avoid constant card reordering               |
| Explore / Discover | Rich, editorial and content-first            | Curated entry points, search/results and clear metadata                                                  | Editorial hierarchy and imagery around works; compact filters                      | Limited purposeful transitions without autoplay, sale pressure or distracting movement   |
| Comics             | Visual, image-first and immersive            | Authoring organizer/script differs from the reading viewport; page/spread/vertical modes require support | Artwork dominates the reader, with legible surrounding controls                    | User-controlled navigation/zoom, optional guided panels and bounded image loading        |

World does not imply implemented maps/canvases, and Comics does not imply implemented page/panel tools. Read, Library and public Explore remain dependent on future backend contracts. Appearance should never make an unsupported capability look delivered.

## Shared system versus adaptable presentation

| Shared invariant                        | Allowed adaptation                                                                                      |
| --------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| Logo/wordmark treatment and terminology | Compact brand placement during immersion, fuller expression on discovery/landing                        |
| Typography roles and hierarchy          | Editorial titles, productive labels and sustained prose use different scales/fonts                      |
| Spacing rhythm                          | Compact tool lists, comfortable touch controls and generous reading margins                             |
| Icon meaning and style family           | Appropriate size/labels; no mixing unrelated icon metaphors for the same action                         |
| Semantic color meaning                  | Mode/theme-specific surface values while error, focus, selection and disabled meaning stay recognizable |
| Control states                          | Density/size variants appropriate to context and input method                                           |
| Navigation/return principles            | Editor rails, reader contents panels, library filters and spatial navigation patterns                   |
| Interaction semantics                   | Mode-specific gestures where necessary, with explicit alternatives and stable feedback                  |
| Motion purpose                          | Minimal in reading/writing, more continuity feedback in visual navigation and browsing                  |

The same action should have the same meaning, labeling and predictable result, even if its placement changes. Save a bookmark and save a manuscript are distinct domain actions; shared button styling does not justify ambiguous labels or identical feedback.

## Typography, spacing and iconography

Define separate roles for UI labels/body, editorial headings, editable prose, reader prose and captions/metadata. Existing Inter/Lora can be evaluated as candidates rather than discarded or mandated. Expressive fonts should not become obligatory for every title, paragraph or navigation item. Reader font selection must not be restricted just to keep all modes visually identical.

Test English, Arabic and mixed-direction text, language metadata, font fallback, diacritics and actual content density. Readers' size, width, line-height and spacing choices take precedence over an exact branding match inside prose. Typography consistency remains in control hierarchy and surrounding navigation.

Use a common spacing scale with contextual density variants. Compact is appropriate for some desktop creator tables; it must not mean tiny touch targets or cramped body text. Reading width/paragraph spacing follow readability and preferences rather than dashboard-card dimensions. Cards, tables, prose columns and image viewports need distinct compositions.

Use one coherent icon family with consistent semantics and accessible labels. Essential information cannot depend on icon recognition alone. Spatial World/Comics controls require discoverable zoom/reset/return meanings and keyboard/touch alternatives where implemented; playful visual metaphors cannot replace clear actions.

## Surfaces, controls and color

Separate semantic roles for application background, raised surface, overlay, text levels, border, accent, focus, selection and status. Theme values may differ while those roles remain stable. Do not assign unrelated brand colors to every mode simply to distinguish them, or make color the sole indicator of author/reader context.

For Write and Read, default to solid comfortable backgrounds. Decorative gradients, glass and patterns belong only in deliberate non-reading contexts, if the user later approves them. Cover art and comic pages supply their own richness; UI colors should not tint, wash out or crop the work for branding.

Light, dark and warm reading themes need explicit text/link/focus/highlight palettes and contrast checks. A system theme can guide a default, while an explicit reader choice overrides it. Keep private reader theme changes separate from authored/publication content. Error and warning feedback remains visible in every mode, including distraction-free views.

Control primitives should standardize focus, hover, pressed, selected, disabled, loading and error behavior. Disabled and unavailable capability states need honest explanation where shown; do not use beautiful placeholder controls to imply features exist. Density variants must keep touch/keyboard operability and state clarity intact.

## Motion and interaction behavior

Use motion to explain opening/closing, continuity, selection or a user-controlled spatial change. The conceptual categories are **functional**, **spatial** and **editorial**; these are documentation roles, not newly implemented animations.

- Functional transitions stay brief and do not delay typing, saving, searching or displaying content.
- Spatial transitions may preserve orientation in supported graphs/maps or guided comic navigation, but must not move the view unpredictably.
- Editorial transitions can add restrained polish outside the reading/writing surface; they cannot block access to text or information.

Reader/prose content should not fade in paragraph by paragraph or shift to accommodate decorative toolbars. Appearance changes preserve a content anchor; creator typing preserves caret/selection. Comics zoom must respect artwork and gesture intent, not use cover-like hover transforms inside the reading viewport.

Honor reduced motion by replacing unnecessary transitions while retaining equivalent state and orientation information. Do not rely on movement as the only confirmation. Scope any smooth-scroll library to intentional surfaces; marketing scroll choreography must not intercept native prose scrolling, text selection or assistive navigation.

## System layering and component boundaries

Suggested future layering is:

1. **Foundations:** approved brand assets, type roles, spacing scale, semantic colors, icon rules and interaction/motion meanings.
2. **Shared accessible controls:** buttons, inputs, menus, tabs, dialogs, tooltips and state feedback with consistent semantics.
3. **Task compositions:** creator project shell, writing surface, visual organization view, library grid/list, discovery collection and reader surface.
4. **User preferences and responsive adaptation:** reading typography/themes, creator arrangement/density and device-appropriate presentation.

Task compositions should reuse controls, not inherit one universal page frame. For example, a work card can be shared between catalogue and library, with explicitly different personal-state data/actions. A text editor and a reader can share prose styling principles while retaining separate edit/read behavior and access contracts.

Document which differences are intentional. If the same component role needs a variant, give it a meaningful density/context contract rather than unexplained CSS overrides. Do not generalize bespoke World/Comics interactions into every form or list. Prefer a few tested primitives and concrete task surfaces over a speculative component catalogue.

## Preferences and backend boundaries

Most colors, layout and component rules are frontend responsibilities. Local presentation preferences do not require new domain fields merely to use a theme. Cross-device account defaults, project-specific tool arrangements and synchronized reading preferences need explicit validated contracts when scoped; today's onboarding DTO is not a generic settings store.

Do not add visual metadata or mode enums to Project/Book simply to switch styles. Work forms, release reading modes, accessibility content and actual comic structure are product/domain capabilities, not decorative presentation toggles. Use supported response data to select the appropriate surface and maintain authorization.

Account appearance defaults, reader overrides and creator density may have different precedence. Responsive fallback must not overwrite a desktop preference when a user visits on a phone. Storage/caching must be account-scoped where preferences are private. No preference persistence or styling changes are introduced by this study.

## Evolution and validation

Start with existing brand assets and one shared control vocabulary, then validate a simple Create/Write composition and a separate future reader composition. Broaden Library/Discover and visual/graphic surfaces as their actual contracts mature. Do not build all seven mode templates as empty mock products.

Later implementation review should compare the same work across creator source, released detail, library card, prose/comic reader and selected supplementary material. Test typography overrides, light/dark/warm contrast, reduced motion, keyboard/touch focus, narrow layouts, script coverage, save failures, slow image loading and stable text/caret positions.

Success means recognizable Rawan identity with task-appropriate density and interaction—not screenshots that look identical. This study makes no accessibility-conformance or measured-performance claim and changes no current interface.

## Repository and related references

- [Existing global styles](../apps/website/src/app/globals.css), [root layout](../apps/website/src/app/layout.tsx) and [brand assets](../apps/website/public/brand)
- [Work-centered architecture](work-centered-product-architecture.md) and [information architecture](expanded-information-architecture-study.md)
- [Reader research](reader-experience-research.md), [library](library-system-research.md), [discovery](discovery-experience-research.md) and [comics](comics-product-research.md)
- [Optional creator workspaces](optional-worldbuilding-and-workspaces.md) and [current backend boundaries](product-scope-and-backend-capabilities.md)
