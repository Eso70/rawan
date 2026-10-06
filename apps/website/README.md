# Rawan home page

This website currently contains the root home-page hero, the five-feature toolkit section, and the Community reel carousel. `apps/app` and `packages/ui` remain empty. No backend or database connection is involved.

From the repository root, run `pnpm dev:website`, then open <http://127.0.0.1:3000>. For a production preview, run `pnpm --filter @rawan/website build` followed by `pnpm --filter @rawan/website start`.

The hero uses a full-screen muted looping background, centered headline and description, translucent badge, compact navigation, a white call to action and staggered entrance. Reduced-motion preferences pause the background; playback runs automatically without visible controls. Navigation for later pages is disabled. Login and building buttons currently explain that the writing workspace comes next; they do not authenticate or register users.

## Video assets

The supplied root `homepagevid.mp4` has been moved to ignored `media-source/homepagevid-original.mp4` (174,654,045 bytes, 8K HEVC, 60fps, with audio). This original is preserved outside public assets and must be backed up separately from Git.

Public playback assets are under `public/videos/`:

- `homepagevid.mp4`: desktop 1920×1080 H.264, 30fps, no audio, MP4 fast-start metadata.
- `homepagevid-mobile.mp4`: smaller 1280×720 H.264, 24fps, no audio, selected on initial phone loads.
- `homepagevid-poster.jpg`: a still from the supplied video, visible while playback loads or is unavailable.

The complete approximately 25.7-second clip is preserved; no unrelated video was downloaded. The media's original ownership and permissions remain with its source.

## Toolkit section

The supplied root `organize.mp4` and `map.mp4` are preserved in ignored `media-source/` as `organize-original.mp4` and `map-original.mp4`. Public assets are in `public/videos/toolkit/`. Desktop / laptop clips retain their original H.264 streams and complete approximately 42-second durations, with fast-start metadata. Phone clips use 1280-pixel width, 24fps, H.264, no audio; JPEG posters cover loading and reduced-motion states. Back up ignored originals separately.

The desktop feature list stays at 100px from the viewport top. Scrolling selects and expands the matching card; clicking a card scrolls to its preview. Previews fade and move horizontally as they enter. Below 1024px, the layout becomes stacked headings, descriptions and videos. Video sources are mounted near the viewport and only visible videos automatically play. Videos have no manual playback controls. Reduced-motion preferences disable scrolling animation, reveals and automatic playback.

The additional root `wikilanding.webm` is preserved as `media-source/wiki-original.webm`. Public `wiki.mp4` uses H.264 at original dimensions and 30fps; `wiki-mobile.mp4` uses 1280-pixel width and 24fps. Both preserve the complete approximately 26.3-second demonstration; `wiki-poster.jpg` is its loading still.

The supplied root `visualconnection.png` is preserved unchanged at `public/images/toolkit/visual-connections.png`. Connections draws it on a responsive, device-pixel-ratio-aware canvas. Drag / touch pans the image; wheel, buttons or plus / minus keys zoom; arrow keys pan; zero or Reset restores the fitted view. The image loads near the viewport. Its labels, nodes and edges are baked into the image; they are not live graph entities and cannot be individually selected or simulated. No graph data is fetched from the backend.

All five supplied demonstrations are included. The comparison-page link has no local destination yet. See [reference measurements](toolkit-reference.md) for the observed UI details and implementation boundaries. These are supplied demonstrations, not a live Rawan editor.

## Typography

The reference's exact fonts are Arizona Flare and Arizona Sans. Licensed font files were not supplied, so this implementation uses self-hosted Lora and Inter as visual substitutes, with Arizona family names first in the CSS for a later licensed font integration. No Arizona files were taken from the reference website.

Latin subsets were obtained through official Google Fonts on 6 October 2026:

- Inter: https://fonts.gstatic.com/s/inter/v20/UcC73FwrK3iLTeHuS_nVMrMxCp50SjIa1ZL7.woff2
- Lora: https://fonts.gstatic.com/s/lora/v37/0QIvMX1D_JOuMwr7Iw.woff2

Both use SIL Open Font License 1.1. Full notices are included beside the binaries in `public/fonts/`. There are no runtime font requests to Google. Non-Latin text uses system fallback fonts. Avatar initials are original graphics; no competitor branding, portraits or subscriber count is used.

## Brand assets

The supplied `logo.svg` and `logo.png` live in `public/brand/`, preserved unchanged. The SVG is the system brand mark used in the header and hero badge; CSS renders the black artwork white over the video. The PNG provides the browser-icon fallback and Apple touch icon. `favicon.svg` is a derived version of the same mark that adjusts to light/dark browser themes. `BrandMark` is the reusable display component for this artwork.

## Community

The 11 supplied reels are preserved in ignored `media-source/reels/`. Public desktop / phone clips and posters live in `public/videos/community/`. The carousel uses the measured 240×427px tiles, 24px gaps, enlarged active reel, dimmed neighbors, four-second advance and a themed rotating genre badge. Only the active reel plays. Advancement and playback are automatic, with no pause or arrow controls; hovering highlights a reel and clicking selects it. Reduced motion and off-screen sections stop automatic playback and advancement. The reference's 250,000+ heading is retained as explicitly requested static copy, not a Rawan usage statistic.

See [Community measurements and media details](community-reference.md). The existing local font substitutes remain in use.

## Checks

`pnpm --filter @rawan/website build`, `typecheck` and `lint` verify compilation and code. Preview checks cover desktop/phone overflow, actual muted video playback, automatic reel advancement and honest button feedback. Browser checks are manual; no automated accessibility certification is claimed.

## Collaboration video

The root collab1.mp4 is preserved at media-source/collaborate-original.mp4. Public videos/toolkit/collaborate.mp4 retains the complete 18.7-second H.264 stream at 1916 by 1080, 30fps, with fast-start metadata. collaborate-mobile.mp4 uses 1280-pixel width, 24fps and no audio. collaborate-poster.jpg is the loading still. The pink Collaboration card uses the existing scroll, selection and reduced-motion behavior. This is a demonstration recording, not a live collaborative editor.

## Human creativity and planet

The section after Community uses a black 400-viewport-height stage with four scroll-driven text reveals, animated artist/planet underlines, an automatic spinning Earth and eight supplied AVIF photographs that appear on planet hover, focus or tap. Photos are under `public/images/planet/`; the silent Earth clip is under `public/videos/planet/`, with its original preserved in ignored `media-source/planet/`. Space Grotesk and Caveat are self-hosted with their licenses. The artist palette enables a decorative mouse paint effect. Reduced motion disables extended scrolling and video playback. Full measurements, asset mapping and differences from the reference are in [manifesto-reference.md](manifesto-reference.md). Reference percentage copy is design text; it does not configure financial allocation.

## Spark, place and world

After the planet section, a sticky scroll sequence changes three illustrated cards into a place entry, then reveals the world map and folder list. Clicking the six map markers or folder entries updates the local sample preview; folders expand. The layout stacks below 1024px. The five supplied images live in `public/images/creators/`. Reduced motion shows the completed world without extended scrolling. This is a landing-page demonstration, with no backend writes. Measurements and animation timings are recorded in [creators-reference.md](creators-reference.md).

## Closing section and footer

The final viewport centers the Rawan logo, “Ready to get to work?” heading, five automatically changing tool badges, a building button and three checkmark assurances. A responsive footer adds local Resources links, Rawan copyright and placeholders for later pages and social destinations. The building button explains that the workspace comes next. Reduced motion disables badge cycling and logo sway. See [closing-reference.md](closing-reference.md) for measured styling, font substitutions and approximate motion timings.

## Landing motion audit

Smooth scrolling is owned by one page-level controller; mouse wheels and trackpads use easing, including on touch-capable laptops, while touch gestures stay native. Footer anchors ease to their sections. The graph accepts normal page scrolling and uses Control/Command-wheel for zoom. Nested preview content hands scrolling back at its boundaries. A single navbar hides on downward scroll, returns on upward scroll and remains visible at the final CTA. Two continuous backgrounds span adjacent sections. Videos and rotating content pause in hidden tabs. Full findings, verification and remaining visual differences are recorded in [landing-ui-audit.md](landing-ui-audit.md).

Navigation now responds to upward wheel/touch/keyboard intent before remaining downward momentum finishes. Navigation styles and visibility behavior live separately from hero styles. `creators-section.tsx` owns the sticky stage and a single transitioning heading; `creators-world-scene.tsx` owns its visuals/interactions, and `creators-data.ts` owns the local sample lore. Story previews clip overflow so wheel gestures always continue the narrative into the final CTA. Mobile visuals stay below the heading. No new route or backend behavior is introduced.
