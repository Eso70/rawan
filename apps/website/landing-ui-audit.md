# Landing-page UI and motion audit

Date: 6 October 2026. Reference: [vvd.world](https://vvd.world/). Scope: the existing Rawan home page, retaining supplied Rawan assets and branding.

The live reference was reviewed through the hero, toolkit, reels, creativity statement, spark/place/world sequence and closing CTA. Layout measurements were compared with the existing section reference notes. This is a visual and interaction audit, not a claim of pixel-identical output or a backend audit.

## Findings and changes

| Area | Finding | Applied fix / result |
| --- | --- | --- |
| Wheel smoothing | Lenis was owned by the toolkit, disabled on every touch-capable computer, and its duration competed with the default interpolation setting. | One page-level Lenis owner; explicit 1.2-second exponential easing with duration mode, including mouse/trackpad input on touchscreen laptops. Touch gestures stay native. |
| Anchors | Every hash change immediately snapped the Lenis position. | Footer anchor clicks use the same smooth scroll controller, retain URL fragments and respect modifier clicks. Incoming deep links align immediately. Reduced motion uses instant navigation. |
| Connections | Canvas consumed every wheel event and blocked vertical touch gestures. | Ordinary wheel scroll continues down the page. Control/Command-wheel zooms; buttons and keyboard zoom remain. Vertical touch scrolling is allowed; dragging can pan the illustration. |
| Nested content | Blanket scroll exclusions on reels, folder tree and detail card interrupted smoothing or trapped page scroll at their boundaries. | Removed blanket exclusions. Lenis checks actual nested scroll capacity, letting readable inner content scroll and returning to page scrolling at its edge. |
| Toolkit sidebar | A capped inner scrolling area clipped expanded descriptions and captured wheel input. | Uncapped sticky list, matching the reference's 100.8px top offset. Feature selection stays locked until its animation completes, with an interruption/fallback path. |
| Backgrounds | Each section painted its own dotted background, producing seams and inconsistent color transitions. | One shared gradient spans toolkit plus community; another spans creators plus closing/footer. Measured stops: navy at 0/10%, slate at 30%, blue at 50%, slate at 70%, navy at 90/100%, with the reference's faint radial glow and uninterrupted 16px dots. Hero fade ends in the same navy. |
| Navbar | Hero and closing rendered separate navigation; the middle sections could not reveal it when scrolling upward. | One fixed navbar. It slides away on downward scroll, returns on upward scroll, and stays visible at the top and final CTA/footer. A small direction threshold avoids jitter. Hidden navigation is inert. |
| Media and timers | Hero video continued decoding off-screen; visible-section timers could advance in a hidden tab. | Hero, toolkit and Earth pause when hidden/off-screen; reel playback/advancement and closing badges pause in hidden tabs. Media resumes through existing visibility handling. |
| Existing choreography | Sticky stages, card transformations, reel dimensions/springs and text blur reveals already track the reference closely. | Retained the established sequence rather than layering a second scroll-animation system on it. Scroll motion now follows the shared controller. |

Lenis integration follows the [official setup and nested-scroll guidance](https://github.com/darkroomengineering/lenis), including its stylesheet, native touch handling and cleanup. Smoothing duration is a tuned local value; the reference's exact wheel easing constants were not recovered.

## Section review

- **Hero:** full viewport video, centered upper desktop copy, badge, staggered entrance, white action, scroll cue and supplied feather brand. Heading remains 50.4px on desktop and 31.5px on narrow phones. The supplied video intentionally differs from VVD's scene.
- **Toolkit:** desktop 38% sidebar / 62% previews, wide overflowing demonstrations, expanded selected card, scroll-driven reveal and stacked mobile headings/videos. All five supplied demonstrations remain. No hidden sidebar scroll area.
- **Community:** 240×427px reels with 24px gaps, active scaling, dimmed neighbors, hover/focus highlight, automatic advancement and animated genre pill. The user's requested heading count remains static copy. No manual pause/arrow UI was introduced.
- **Manifesto:** black sticky stage, progressive blur/opacity reveals, handwritten phrase, Earth video, artist underline/paint and planet photo reveal. Black-to-navy transitions remain continuous with surrounding surfaces.
- **Creators:** reversible 400vh spark/place/world sequence, illustrated cards, folder tree and map markers, desktop side-by-side and mobile stacking. Inner previews no longer prevent continuing the main scroll.
- **Closing/footer:** centered logo, serif heading, revolving colored badges, CTA/checkmarks, shared fixed navbar and wrapping footer. The page-wide gradient replaces the previous patch at the boundary.

## Validation

- Website production build (including TypeScript) and lint pass.
- Manual browser checks at 1280×720, 1440×900 and 390×844: no horizontal document overflow in sampled hero, toolkit, community and final views.
- Ordinary wheel over the graph moved page scroll from 2705px to 3245px; it did not zoom/trap the page.
- Feature selection landed on the map, kept the corresponding active card and played the visible map video.
- Footer community navigation was observed starting at 12424px and settling at 5227px, with the destination within one pixel of the viewport top; it did not immediately jump.
- Final shared navbar was observed at −43px / hidden on downward scroll and 17px / visible on upward scroll, with exactly one main navigation landmark.
- Sampled browser error log contained no errors. Native phone gesture feel and reduced-motion operating-system settings were reviewed in code, not tested on physical hardware.

## Follow-up scroll correction

The narrative previews now clip their inner overflow instead of consuming page wheel input. This supersedes the nested-scroll treatment above for the spark/place/world section. One heading transitions at a time (0.18-second exit/entry), preventing stacked heading fragments and blank boundary stops. Mobile visual clipping keeps moving cards below the heading.

The navbar responds to upward input immediately, including while Lenis is finishing downward momentum; a 350ms intent window and an 8px native-scroll threshold prevent oscillation. Top/final-section visibility still takes precedence. Its styling and visibility hook are separate from hero styling. Story sample data, scene rendering and section orchestration now have separate files.

## Remaining differences

Licensed Arizona Flare/Sans fonts were not supplied; Lora/Inter remain substitutes. Space Grotesk is self-hosted. Exact line wrapping therefore differs in some places. Caveat substitutes for the reference's handwritten artwork.

The connections view is an image-backed canvas, not VVD's live entity simulation. Supplied videos, photos and local sample lore remain demonstrations. Authentication, external destinations and unbuilt pages remain placeholders; this audit does not add competitor account links or claim working integrations. Some badge/brand animation timings are local approximations documented in the section notes.
