# Toolkit reference measurements

Observed directly at [vvd.world](https://vvd.world/) on 6 October 2026 at 1280×720 and 390×844. Measurements reflect those viewports; the reference can change.

| Element          | Reference detail                                                                                                                               | Rawan implementation                                                                     |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| Background       | Near-black navy; evenly spaced faint dots; blue lower tint                                                                                     | Navy surface, 16px dotted grid and gradient                                              |
| Container        | Approximately 1075px including 34px side padding at desktop                                                                                    | Same maximum width and padding                                                           |
| Columns          | 38% left, 62% right, about 34px gap                                                                                                            | Same split; left sticky at 100px                                                         |
| Heading          | Arizona Flare, regular; 50.4px / 63px on desktop; 31.5px / 39.375px on phone                                                                   | Matching sizes; self-hosted Lora substitute                                              |
| Supporting text  | Arizona Sans; cards around 14.7px with relaxed line spacing                                                                                    | Self-hosted Inter, 14.7px / 24.255px                                                     |
| Toolkit label    | Small amber outlined pill; approximately 12.6px type; briefcase icon                                                                           | Same amber label with original inline icon                                               |
| Cards            | 280px wide; translucent fill; light border; rounded corners; approximately 13px vertical gaps                                                  | Same geometry; inactive opacity 0.4                                                      |
| Active card      | Expanded description, brighter title, colored icon; Organization amber, Maps green                                                             | Animated expansion and matching accent colors                                            |
| Desktop previews | Approximately 1200px wide, 16:9, 2px translucent border, 25px rounding; extend beyond viewport right edge                                      | Viewport-scaled overflow, clipped at section boundary; no page-wide horizontal scrolling |
| Scroll motion    | Left stays pinned; videos move through document; active feature follows visible preview; preview opacity and horizontal offset change on entry | 30px reveal to viewport center, center-band tracking, eased click navigation             |
| Phone / tablet   | Sticky list disappears; section heading then each feature's heading, copy and full-width video                                                 | Stacked below 1024px; smaller video source below 768px                                   |

The reference uses five features. This section contains the supplied Organization, Maps, Wiki and Collaboration videos plus the supplied Connections image rendered on canvas. No comparison page or link to the competitor is added to the product. Licensed Arizona fonts were not supplied; local font substitutes remain. The motion recheck below replaces the initial approximation with the measured reveal ranges and public spring configuration.

Videos pause outside the viewport and expose pause / play controls. Reduced motion shows static posters by default and disables animated reveals and smooth scrolling. Manual playback remains available.

## Motion recheck

Rechecked the live site's public behavior and animation configuration on 6 October 2026. The reveal belongs to the video frame, not the mobile heading / description. Its progress runs from the frame's top reaching the viewport bottom to the frame's center reaching the viewport center. Horizontal offset interpolates from 30px to 0; opacity interpolates through 0.3, 0.7 and 1 at progress 0, 0.5 and 1. Motion reverses naturally when scrolling back.

Active panels are detected using an IntersectionObserver with `rootMargin: -40% 0px -55% 0px`. Card clicks activate immediately, hold selection until scrolling completes (1.5-second fallback), and center the chosen preview. Wheel / touch movement releases that hold. Page-level wheel smoothing uses Lenis with 1.2-second duration and exponential ease-out; touch and reduced-motion use native scrolling. The sidebar no longer creates a nested scroll area.

Description height uses Motion's spring with stiffness 300, damping 36, mass 1. Description opacity takes 0.24 seconds with cubic-bezier 0.22, 1, 0.36, 1 and a 0.12-second entrance delay. Icon sizing uses stiffness 520, damping 30, mass 0.7, changing between 24px and 28px. The desktop video width grows with the viewport using the reference's half-viewport overflow instead of a fixed 1200px. The image-backed Connections canvas and substitute fonts remain intentional content differences. Playback stays automatic without manual controls. Normal graph wheel input scrolls the page; Control/Command-wheel zooms.
