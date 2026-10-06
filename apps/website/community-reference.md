# Community section reference

Measured directly at [vvd.world](https://vvd.world/) on 6 October 2026 at 1280×720 and 390×844, and checked against its public animation configuration.

| Element            | Observed reference / implementation                                                                                               |
| ------------------ | --------------------------------------------------------------------------------------------------------------------------------- |
| Surface            | Navy-black, 16px faint dotted grid; full-width clipped reel row                                                                   |
| Heading container  | Approximately 1075px including 34px side padding; left aligned                                                                    |
| Community label    | Amber outlined pill, people icon, 12.6px / 17px type                                                                              |
| Heading            | Arizona Flare regular; desktop 37.8px / 47.25px, tablet 31.5px, phone 25.2px / 31.5px                                             |
| Genre pill         | Semibold, colored outline and translucent fill; desktop 31.5px, tablet 25.2px, phone 21px; themed Tabler icon                     |
| Genre entrance     | 10px upward reveal; spring stiffness 420, damping 26, mass 0.9; opacity 0.24s with cubic-bezier 0.22, 1, 0.36, 1                  |
| Reel geometry      | 240×427px, 24px gaps, 17px corners; same tile size on phones                                                                      |
| Active reel        | Scale 1.06; full brightness and saturation; only active reel plays                                                                |
| Neighbor treatment | Left brightness falls by 0.55 per step, right by 0.3; saturation falls by 0.55 / 0.4; floors 0.1 / 0.2; hover restores full color |
| Timing             | Advance every 4000ms; track spring stiffness 300, damping 36, mass 1; filter / scale transition 500ms ease-out                    |
| Track alignment    | Active tile starts at max(32px, (viewport width − 1008px) / 2), accounting for its scaled half-width (7.2px)                      |
| Loop               | Five repeated sets; recenters by two sets after 700ms outside the middle three sets, without an animated reset                    |
| Swipe              | Horizontal gesture of at least 40px advances one reel; vertical phone scrolling stays native                                      |
| Reel order         | 02, 05, 01, 08, 03, 07, 04, 06, 09, 10, 11                                                                                        |
| Starting frames    | Reels 01, 02, 03, 05 and 07 start halfway through; reel 08 uses left-aligned cropping                                             |

The heading keeps “Join 250,000+ creators telling … stories” at the user's explicit request. It is static reference copy, not a measured Rawan user count. All 18 reference genres rotate, including Alternate History. Licensed Arizona fonts were not provided, so this section uses the existing self-hosted Lora substitute.

The carousel runs automatically without pause, previous / next or swipe controls. Hovered reels brighten and enlarge with a hand cursor; clicking a reel selects it while automatic advancement continues. Automatic advancement and playback stop outside the viewport and with reduced-motion preferences. Videos are silent public previews; original audio is preserved only in ignored originals. Reels do not open third-party profiles.

## Local assets

All root `reel-01.mp4` through `reel-11.mp4` are moved unchanged to ignored `media-source/reels/reel-NN-original.mp4`. Back them up separately from Git.

Public `videos/community/` contains a fast-start H.264 stream-copy version without audio for each reel, a 480px-wide / 24fps H.264 phone version, and a JPEG poster. Complete durations are retained. Only nearby reel components mount; sources load when the section enters the viewport. No competitor CDN is needed at runtime.
