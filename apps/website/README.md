# Rawan home hero

This website currently contains only the root home-page hero. `apps/app` and `packages/ui` remain empty. No backend or database connection is involved.

From the repository root, run `pnpm dev:website`, then open <http://127.0.0.1:3000>. For a production preview, run `pnpm --filter @rawan/website build` followed by `pnpm --filter @rawan/website start`.

The hero uses a full-screen muted looping background, centered headline and description, translucent badge, compact navigation, a white call to action and staggered entrance. Reduced-motion preferences pause the background; a labeled control allows playback or pause. Navigation for later pages is disabled. Login and building buttons currently explain that the writing workspace comes next; they do not authenticate or register users.

## Video assets

The supplied root `homepagevid.mp4` has been moved to ignored `media-source/homepagevid-original.mp4` (174,654,045 bytes, 8K HEVC, 60fps, with audio). This original is preserved outside public assets and must be backed up separately from Git.

Public playback assets are under `public/videos/`:

- `homepagevid.mp4`: desktop 1920×1080 H.264, 30fps, no audio, MP4 fast-start metadata.
- `homepagevid-mobile.mp4`: smaller 1280×720 H.264, 24fps, no audio, selected on initial phone loads.
- `homepagevid-poster.jpg`: a still from the supplied video, visible while playback loads or is unavailable.

The complete approximately 25.7-second clip is preserved; no unrelated video was downloaded. The media's original ownership and permissions remain with its source.

## Typography

The reference's exact fonts are Arizona Flare and Arizona Sans. Licensed font files were not supplied, so this implementation uses self-hosted Lora and Inter as visual substitutes, with Arizona family names first in the CSS for a later licensed font integration. No Arizona files were taken from the reference website.

Latin subsets were obtained through official Google Fonts on 6 October 2026:

- Inter: https://fonts.gstatic.com/s/inter/v20/UcC73FwrK3iLTeHuS_nVMrMxCp50SjIa1ZL7.woff2
- Lora: https://fonts.gstatic.com/s/lora/v37/0QIvMX1D_JOuMwr7Iw.woff2

Both use SIL Open Font License 1.1. Full notices are included beside the binaries in `public/fonts/`. There are no runtime font requests to Google. Non-Latin text uses system fallback fonts. The emblem and avatar initials are original inline graphics; no competitor branding, portraits or subscriber count is used.

## Checks

`pnpm --filter @rawan/website build`, `typecheck` and `lint` verify compilation and code. Preview checks cover desktop/phone overflow, actual muted video playback, pause/resume and honest button feedback. Browser checks are manual; no automated accessibility certification is claimed.
