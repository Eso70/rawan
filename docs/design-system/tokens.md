# Design tokens

The immersive onboarding presentation consumes the existing navy, paper, font, radius and control tokens. Feature-local atmospheric overlays and the 900ms scene crossfade remain in its CSS Modules; they are not a new global theme or competing primitive system. See [onboarding](onboarding.md).

Registry: `apps/website/src/styles/tokens.css`, imported by `styles/globals.css` before the shared reset. These are observed existing values, not a new theme. CSS Modules consume them without changing the effective value. Font-face declarations retain literal family names; callers retain their original fallback stacks.

## Rules and scope

Use role colors for the actual surface: canvas, landing navy, solid setup, selected setup and paper foreground remain distinct. White/black alpha tokens preserve exact hex alpha values; `a70` is a readable name for `#ffffffb3`, not a rounded opacity conversion. The 4/8px interface rhythm coexists with decimal marketing spacing. Numeric size/radius names preserve existing geometry rather than inventing a universal semantic size.

Shared typography includes family, repeated text sizes, 400/500/600 weights and recurring leading/tracking. Unique title clamps, line heights, illustration colors, artwork gradients and Motion springs remain owned by their feature. Do not replace all unique values simply to grow the registry. Icon sizes remain explicit numeric Tabler/SVG props (commonly 14/16/17/20/21/28px); CSS variables cannot directly substitute for those typed numeric props.

Borders remain 1px; focus outlines preserve the existing global 2px/5px and local setup/auth treatments. Search shadow has its existing 0 24px 80px geometry. Layer tokens preserve navigation=100 and skip-link=10; local illustration stacking remains local. Native dialog uses the browser top layer, not a guessed giant z-index.

CSS duration tokens cover fast/UI/content/step transitions. Existing feature-specific JavaScript motion durations and springs remain in their animation owner, with reduced-motion guards; there is no new motion runtime. Breakpoints stay literal in media queries and are documented in responsive-design.md.

Only current dark presentation is supported. There is no theme switch or complete light token set. The existing reader shell explicitly uses light styling locally; do not interpret it as a site-wide light theme. Artwork palettes are content, not theme tokens.

```css
/* In a real feature CSS Module, retaining its existing layout recipe. */
.input {
  color: var(--color-paper);
  background: var(--white-a10);
  border: var(--border-width) solid var(--white-a20);
  border-radius: var(--radius-14);
  font-family: var(--font-ui), Arial, sans-serif;
}
```

## Complete consumed registry

| Token                    | Existing value                 |
| ------------------------ | ------------------------------ |
| `--black-a27`            | `#0004`                        |
| `--black-a40`            | `#0006`                        |
| `--color-black`          | `#000`                         |
| `--color-canvas`         | `#09090b`                      |
| `--color-choice-border`  | `#b7cbd7`                      |
| `--color-choice-check`   | `#d7e5ed`                      |
| `--color-focus-auth`     | `#d3c2f5`                      |
| `--color-focus-setup`    | `#c3d8e8`                      |
| `--color-ink`            | `#171717`                      |
| `--color-invalid`        | `#eaa0ac`                      |
| `--color-landing`        | `#0a0f1a`                      |
| `--color-landing-blue`   | `#1a3045`                      |
| `--color-landing-slate`  | `#162535`                      |
| `--color-muted`          | `#b3becb`                      |
| `--color-paper`          | `#f6f5f7`                      |
| `--color-selected-setup` | `#152232`                      |
| `--color-setup`          | `#0c131e`                      |
| `--color-subtle`         | `#a1adbc`                      |
| `--color-valid`          | `#81dcb0`                      |
| `--color-white`          | `#fff`                         |
| `--duration-content`     | `0.3s`                         |
| `--duration-fast`        | `0.15s`                        |
| `--duration-step`        | `160ms`                        |
| `--duration-ui`          | `0.2s`                         |
| `--font-display`         | `"Rawan Space Grotesk"`        |
| `--font-handwritten`     | `"Rawan Caveat"`               |
| `--font-literary`        | `"Rawan Lora"`                 |
| `--font-ui`              | `"Rawan Inter"`                |
| `--radius-12`            | `12px`                         |
| `--radius-12-6`          | `12.6px`                       |
| `--radius-14`            | `14px`                         |
| `--radius-18`            | `18px`                         |
| `--radius-18-6`          | `18.6px`                       |
| `--radius-22`            | `22px`                         |
| `--radius-25`            | `25px`                         |
| `--radius-4`             | `4px`                          |
| `--radius-8-4`           | `8.4px`                        |
| `--radius-99`            | `99px`                         |
| `--space-1`              | `4px`                          |
| `--space-2`              | `8px`                          |
| `--space-3`              | `12px`                         |
| `--space-4`              | `16px`                         |
| `--space-5`              | `24px`                         |
| `--space-6`              | `32px`                         |
| `--space-m1`             | `4.2px`                        |
| `--space-m10`            | `134.4px`                      |
| `--space-m2`             | `8.4px`                        |
| `--space-m3`             | `12.6px`                       |
| `--space-m4`             | `16.8px`                       |
| `--space-m5`             | `25.2px`                       |
| `--space-m6`             | `33.6px`                       |
| `--space-m8`             | `67.2px`                       |
| `--space-m9`             | `100.8px`                      |
| `--white-a05`            | `#ffffff0d`                    |
| `--white-a07`            | `#ffffff12`                    |
| `--white-a10`            | `#ffffff1a`                    |
| `--white-a12`            | `#ffffff1f`                    |
| `--white-a20`            | `#ffffff33`                    |
| `--white-a40`            | `#ffffff66`                    |
| `--white-a50`            | `#ffffff80`                    |
| `--white-a60`            | `#ffffff99`                    |
| `--white-a70`            | `#ffffffb3`                    |
| `--white-a80`            | `#ffffffcc`                    |
| `--text-31-5`            | `31.5px`                       |
| `--text-12-6`            | `12.6px`                       |
| `--text-14-7`            | `14.7px`                       |
| `--text-25-2`            | `25.2px`                       |
| `--weight-regular`       | `400`                          |
| `--weight-medium`        | `500`                          |
| `--weight-semibold`      | `600`                          |
| `--border-width`         | `1px`                          |
| `--text-37-8`            | `37.8px`                       |
| `--text-21`              | `21px`                         |
| `--text-14`              | `14px`                         |
| `--text-50-4`            | `50.4px`                       |
| `--text-18`              | `18px`                         |
| `--text-11`              | `11px`                         |
| `--tracking-brand`       | `-0.6px`                       |
| `--layer-navigation`     | `100`                          |
| `--text-12`              | `12px`                         |
| `--text-13`              | `13px`                         |
| `--leading-relaxed`      | `1.7`                          |
| `--leading-prose`        | `1.8`                          |
| `--tracking-literary`    | `-0.8px`                       |
| `--tracking-compact`     | `-0.3px`                       |
| `--layer-skip-link`      | `10`                           |
| `--leading-ui`           | `1.5`                          |
| `--leading-comfortable`  | `1.6`                          |
| `--text-16`              | `16px`                         |
| `--text-10`              | `10px`                         |
| `--shadow-search`        | `0 24px 80px var(--black-a40)` |

All registry entries have consumers. Feature-local variables such as `--search-top`, `--control-right`, `--reveal-opacity` and `--reveal-offset` retain their local CSS/inline owners; they are not missing global theme definitions. Add a token only for a repeated value or an established shared role, then verify resolved style/geometry in its consumers.
