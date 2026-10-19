# Rawan design tokens proposal

19 October 2026. All future values are **proposed**, not committed CSS. Existing values below are **established in source**, not inferred from screenshots. Reference estimates appear in the [analysis](vvd-visual-reference-analysis.md); no screenshot color was pixel-sampled or asserted to be a VVD token.

## Status and migration rule

The current [tokens.css](../../../apps/website/src/styles/tokens.css) and [token reference](../tokens.md) document consumed implementation values. This proposal creates no aliases, theme switch, CSS variables or shared package. Future work should map semantic roles to approved existing values where possible and add only consumed roles. Do not replace the marketing rhythm or account recipes with a speculative studio scale.

## Color foundations

| Role                            | Value                 | Status / intended use                                                                                       |
| ------------------------------- | --------------------- | ----------------------------------------------------------------------------------------------------------- |
| Current canvas                  | `#09090B`             | Established `--color-canvas`                                                                                |
| Current setup                   | `#0C131E`             | Established `--color-setup`                                                                                 |
| Current landing                 | `#0A0F1A`             | Established `--color-landing`                                                                               |
| Current blue/slate              | `#1A3045` / `#162535` | Established landing surface values                                                                          |
| Current secondary / subtle      | `#B3BECB` / `#A1ADBC` | Established text roles; preserve context                                                                    |
| Current setup focus             | `#C3D8E8`             | Established `--color-focus-setup`                                                                           |
| Current auth focus              | `#D3C2F5`             | Established `--color-focus-auth`; do not silently unify                                                     |
| Studio application background   | `#0B0B0C`             | Proposed from user's brief                                                                                  |
| Studio secondary surface        | `#151515`             | Proposed navigation/quiet panels                                                                            |
| Studio elevated surface         | `#1D1D1F`             | Proposed popovers/dialog content                                                                            |
| Studio hover surface            | `#252525`             | Proposed interactive hover, not selected alone                                                              |
| Studio primary / secondary text | `#E9E5DD` / `#A6A39D` | Proposed warm literary defaults                                                                             |
| Studio muted                    | `#777570`             | Proposed decorative/secondary metadata candidate; validate before text use, especially on elevated surfaces |
| Studio border                   | `#292929`             | Proposed subtle separator; insufficient alone for essential input/focus distinction                         |
| Brand accent candidate          | `#E8CF85`             | Proposed sparse emphasis; avoid entire paragraphs and large gold surfaces                                   |
| Studio focus candidate          | `#C3D8E8`             | Proposed reuse of existing setup focus for future studio only                                               |
| Selected surface candidate      | `#203446`             | Proposed blue-tinted interaction surface with outline and semantic selected state                           |
| Error / success candidates      | `#EAA0AC` / `#81DCB0` | Values established in current tokens; future studio uses still require contrast checks                      |

Core palette and contrast are unresolved design choices, not a claim of accessible certification. Normal text target is at least 4.5:1, large text 3:1, essential control boundaries/focus 3:1 against relevant neighbors. These are project acceptance targets. Test actual compositing, states and font sizes; a token name cannot certify a translucent result. Do not use the muted candidate for disabled text as the sole explanation of an unavailable action.

Visualization candidates: cyan `#5DD6D0`, blue `#75B8F2`, green `#A5CE7F`, violet `#B5A0E6`, amber `#E8CF85`. These are original proposed values, not sampled source colors. Each category also needs a name and icon/pattern. Map fill may use 12–24% opacity with a stronger outline, but label plates must remain legible over pale and dark art. Warning/error semantics must not depend on a category hue.

## Typography

| Role              | Family                     | Proposed size / leading / weight | Constraints                                                |
| ----------------- | -------------------------- | -------------------------------- | ---------------------------------------------------------- |
| Document title    | Existing Rawan Lora        | 28–36px / 1.2–1.3 / 600          | Clamp to available width; no required huge hero            |
| Section heading   | Lora or UI sans by context | 20–24px / 1.35 / 600             | Hierarchical headings, not bold paragraphs                 |
| Literary body     | Lora                       | Initial 18px / 1.7 / 400         | Reader can adjust; approximately 55–75 characters per line |
| UI body           | Existing Rawan Inter       | 15px / 1.5 / 400                 | Clear labels, no stylized prose face on dense controls     |
| Button/navigation | Inter                      | 14–16px / 1.4–1.5 / 500–600      | Avoid arbitrary uppercase and compressed tracking          |
| Property values   | Inter, prose may use Lora  | 14–16px / 1.5 / 400              | Wrap multiple chips; never shrink to fit                   |
| Metadata          | Inter                      | 13–14px / 1.4–1.5 / 400–500      | Essential instructions stay at body size                   |

Families are established; these studio role assignments are proposed. Current Space Grotesk and Caveat remain in existing marketing/account contexts. No new font download or licensing claim. Use normal prose tracking; optional title tracking down to approximately -0.02em needs actual font review. Reader preferences must stay within current validated values (font size 12–40, line height 1.2–2.5 and width 320–1200); offered presets can be narrower. Effective width always fits the viewport even when the saved preference is wider. Existing Latin subsets require fallback and future language review; English is the currently implemented interface.

## Spacing and geometry

| Foundation       | Proposed future role values                                      | Established context / caution                                                                           |
| ---------------- | ---------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| UI spacing       | 4, 8, 12, 16, 24, 32, 48, 64px                                   | 4–32 already exist as values; 48/64 are proposals                                                       |
| Control interior | 12–16px horizontal, 8–12px vertical                              | Hit area and text determine final size                                                                  |
| Panel interior   | 16px compact / 24px regular / 32px spacious                      | Keep consistent within one surface                                                                      |
| Pane gutter      | 16–24px                                                          | Shrink secondary chrome before document width                                                           |
| Radius           | 4px chip, 8px control, 12px pane, 16px popover/dialog, full pill | Proposed role mapping; current exact values include 8.4/12.6/18.6px and must be retained where consumed |
| Border           | 1px separators, 2px focus ring with 2px offset                   | Existing border width 1px; focus geometry proposed                                                      |
| Pointer hit area | Prefer 44×44px, including transparent padding                    | Icon can remain visually 16–20px; prevent overlapping hit areas                                         |
| Prose padding    | 24–48px desktop, 16–24px narrow                                  | Reader margins adjustable and clamped to viewport                                                       |

Marketing's existing 4.2px-derived scale stays where used. Do not reinterpret `--space-5` as 20px: it is currently 24px. Future semantic naming should clarify purpose instead of silently changing numerical token meaning.

## Surface, elevation, opacity and blur

| Layer      | Surface / treatment proposal                                                | Use                                           |
| ---------- | --------------------------------------------------------------------------- | --------------------------------------------- |
| Base       | Opaque application background                                               | Workspace / reader stage                      |
| Content    | Opaque secondary or approved navy surface, subtle edge                      | Main document, side navigation                |
| Raised     | Elevated surface, 1px edge, optional shadow `0 8px 24px #00000033`          | Local popover, small tool panel               |
| Blocking   | Opaque elevated surface, shadow `0 20px 64px #00000066`                     | Actual modal dialog                           |
| Dimmer     | Start at 50–65% black, evaluate visibility and focus                        | Modal/tutorial background only                |
| Atmosphere | Original preblurred still; optional prepared blur equivalent around 20–40px | Project/world context, never the text surface |

Shadow values and blur range are proposals, not measured source behavior. Prefer a border/surface shift over stacking shadows. Default opacity for body text and controls is 100%; assign semantic colors rather than dim the whole content subtree. Blur must be optional, static where possible and removed without layout changes. Existing search shadow is `0 24px 80px` with current black-alpha token; no migration is implied.

## Motion and layers

Established duration tokens: 150ms fast, 160ms step, 200ms UI, 300ms content. Proposed studio use: 120–160ms small state fades, 160–200ms popover/pane transitions, at most 240ms a nonblocking layout settle. Use a simple ease-out curve; no bounce, perpetual float or automatic camera flight. These are design proposals, never claimed screenshot timings. Reduced motion removes spatial travel and decorative animation; preserve immediate state changes and status messages. Loading time is real task state, not an animation delay.

Proposed studio relative layers: content 0, sticky pane tools 10, contextual popover 30, blocking dimmer/dialog 60/70, tutorial dimmer/target/instruction 80/81/82, global critical notice 100. Existing navigation already uses layer 100 and skip link 10; do not apply these future numbers globally or mix page controllers. Review stacking contexts and native dialog top-layer behavior before implementation. A tutorial above an actual modal must be deliberately scoped to that modal rather than layering arbitrary portal numbers.

## Icons and breakpoints

Reuse installed Tabler icons at 16–20px for controls, 24px for launchers, with consistent stroke treatment. Pair unfamiliar tools with labels. A label and icon share one action; decorative SVGs are not extra tab stops. No reference glyph exports are required.

Proposed content thresholds: below 640px one content column and sheets/drawers; 640–959px one primary pane plus on-demand supporting view; 960–1279px persistent navigation where comfortable, split only if minimum widths fit; 1280px+ optional split views; 1600px+ extra outer breathing room, not longer prose lines. These are future layout bands, not observed responsive VVD behavior. Current pages retain their own verified breakpoints. Text zoom, coarse pointers and keyboard must override density assumptions independently of width.

## Validation before adopting values

Review candidate navy/neutral recipes using the same document, property form and reader sample. Check contrast in default/hover/selected/focus/error states, 320px layout, 200% text scaling, keyboard use, long names and plain-background mode. Reconcile with actual preference allowlists. Only then promote consumed values into the implemented token reference; keep rejected candidates recorded as research history.
