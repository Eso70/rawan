# Typography

Definitions: `apps/website/src/styles/globals.css` (`@font-face`) and `tokens.css` (consumed family/size/weight values). All four fonts are self-hosted and use `font-display:swap`.

| Family token         | Supplied font                                   | Declared weights | Actual roles                                                            |
| -------------------- | ----------------------------------------------- | ---------------- | ----------------------------------------------------------------------- |
| `--font-ui`          | Rawan Inter, `/fonts/inter-latin.woff2`         | 400–600          | Root UI, login/legal headings, onboarding controls and copy             |
| `--font-literary`    | Rawan Lora, `/fonts/lora-latin.woff2`           | 400–700          | Marketing and onboarding editorial headings, search text                |
| `--font-display`     | Rawan Space Grotesk, `/fonts/space-grotesk.ttf` | 300–700          | Login controls, legal body, manifesto, creator illustrations and footer |
| `--font-handwritten` | Rawan Caveat, `/fonts/caveat.ttf`               | 400–700          | Manifesto handwriting                                                   |

Family tokens intentionally hold the named face only. Callers keep their original Georgia/Arial/sans-serif fallback lists. Some marketing stacks list Arizona first, but its font binaries are not supplied. Do not replace that history with a claim that Arizona is installed. Latin font files do not establish support for Arabic or Kurdish scripts; only English is enabled.

| Context            | Existing desktop typography         | Responsive adjustment                                              |
| ------------------ | ----------------------------------- | ------------------------------------------------------------------ |
| Hero h1            | Lora 50.4px/50.4px, regular         | ≤767: 37.8px/42px; ≤639: 31.5px/37.8px                             |
| Toolkit heading    | Lora 50.4px/1.25                    | ≤1023: 37.8px; ≤767: 31.5px                                        |
| Community heading  | Lora 37.8px/1.25                    | ≤1023: 31.5px; ≤767: 25.2px                                        |
| Creators heading   | Space Grotesk 37.8px/42px, medium   | ≤1023: 25.2px/33.6px                                               |
| Manifesto          | Space Grotesk 31.5px/37.8px, medium | ≤767: 25.2px/33.6px                                                |
| Closing heading    | Lora 31.5px/1.2                     | ≤767: 25.2px/33.6px                                                |
| Login heading      | Inter 37.8px/1.33, medium           | Intermediate: 30px; phone: 28px; ≤360: 25px                        |
| Onboarding heading | Space Grotesk 24px/1.35, semibold   | Purpose 28px desktop / 26px at ≤600px; other questions remain 24px |
| Legal h1           | Inter 36px/40px, semibold           | ≤360: 30px/36px                                                    |
| Legal body         | Space Grotesk 14px/20px             | Retained                                                           |

Common size tokens retain exact numeric values (`--text-12-6`, `--text-14-7`, etc.). Weight tokens are 400/500/600, and shared leading/tracking tokens retain existing values. Unique headings and animation styles remain local. A numeric token is a value, not permission to use the largest heading everywhere.

Use real heading levels and preserve readable body measure. Keep hidden fieldset legends clipped to 1px; a visible label's width rules must not unclip them. Do not use decorative handwriting for controls or remove fallback families. Verify wrapping with real content at 320px, desktop and browser zoom after typography changes.
