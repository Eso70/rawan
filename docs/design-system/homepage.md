# Homepage — implemented design

The marketing homepage introduces Rawan through supplied video, examples and a literary narrative. It leads visitors to the existing authenticated entry, not to an implemented editor. Promotional tool names, metrics, billing assurances and screenshots are existing presentation copy, not evidence that those services exist.

## Composition and ownership

Source root: `apps/website/src/`. The route `app/page.tsx` remains composition only:

```text
HomePage
└─ LandingScroll — Lenis context, motion preference and teardown
   ├─ LandingNavigation — fixed shared navigation and scroll visibility
   └─ main
      ├─ HomeHero
      ├─ .landing-surface
      │  ├─ ToolkitSection
      │  │  ├─ FeatureIcon / DemoVideo (toolkit/toolkit-media.tsx)
      │  │  └─ ConnectionsCanvas
      │  └─ CommunitySection
      │     ├─ community/community-data.ts — genres/reel sequence
      │     └─ Reel (community/community-reel.tsx)
      ├─ ManifestoSection
      └─ .landing-surface
         ├─ CreatorsSection → WorldScene (creators-world-scene.tsx)
         └─ ClosingSection → SiteFooter
```

All named section files and their CSS Modules live in `components/`. Media children retain their original section CSS. Shared brand and destinations live in `components/shared/`. The homepage already had section composition; no additional page wrapper or marketing package was necessary.

## Section order and behavior

| Section    | Actual design and content                                                                                           | Layout, interactions and assets                                                                                                                                                                                                                                                                                                                                     |
| ---------- | ------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Navigation | Feather/Rawan, Library, disabled Why Rawan/Pricing/Download, static EN, Login, Start Building                       | Fixed 17px from top; max inner width 1613px; desktop 34px side padding. Scroll visibility makes hidden navigation inert. Library goes to `/library`, Login to `/login`, building to `/workspace`. Only Library navigation mounts a search trigger.                                                                                                                  |
| Hero       | Made for storytellers → The modern storytelling toolkit → supporting copy → Start building / it’s free → avatar row | Full-height supplied video, shade and navy bottom fade; centered max 941px content. `/videos/homepagevid.mp4`, mobile alternative and `homepagevid-poster.jpg`. CTA is an anchor to `/workspace`; no old coming-next notice. Badge/avatars/chevron are decorative.                                                                                                  |
| Toolkit    | Organize Your World, Create Interactive Maps, Visualize Connections, Create a Custom Wiki, Collaborate in Real Time | Max 1075px flex composition, 38% sticky sidebar, 280px selectors, 16:9 previews. Click/scroll updates active feature with interruption-aware selection lock. Four local videos use `/videos/toolkit/{id}[-mobile].mp4` and posters. Connections uses its existing image-backed pan/zoom/reset canvas, including keyboard controls. These are sample demonstrations. |
| Community  | Creator eyebrow, serif heading, rotating genre pill and local reels                                                 | Eleven reel IDs repeat five times; 240 × 427px frames, 24px gaps, 17px corners, active scale 1.06. Click selects a reel. Assets `/videos/community/reel-{id}[-mobile].mp4` and posters; sequence and eighteen genre palettes stay in `community-data.ts`.                                                                                                           |
| Manifesto  | Four editorial lines, handwritten emphasis, local artist paint effect and planet interaction                        | Black 400vh sticky stage with opacity/blur/20px reveal. Earth clip `/videos/planet/earth-spinning.mp4`; eight photos under `/images/planet/{name}.avif` revealed by hover/focus/tap. The text describes the visual story; it does not configure financial allocations.                                                                                              |
| Creators   | It starts with a spark → That turns into a place → That grows into a world                                          | Reversible 400vh sticky stage; phase thresholds .33/.66; two-column desktop with local sample card/tree/map illustration. Source: `creators-section.tsx`, `creators-world-scene.tsx`, `creators-data.ts`. Folder/marker interactions change local illustration state; search/new-document/toolbars are demonstrations.                                              |
| Closing    | Feather, Ready to get to work?, five cycling tool chips, Start Building Now, three assurances                       | Min-height 100vh stage; five slots replace one chip every 2.4s while visible. CTA goes to `/workspace`. Decorative Tabler tool/check icons remain associated with existing content.                                                                                                                                                                                 |
| Footer     | Brand, Resources disclosure, unavailable links, Terms, Privacy, copyright and social channels                       | Shared `SiteFooter`; real `/terms`, `/privacy`, `/library` and homepage anchors. Discord comes from `shared/site-links.ts`; unconfigured channels, Careers and What’s new remain disabled. No URLs were invented.                                                                                                                                                   |

## Typography and surfaces

- Root interface font is `--font-ui` (self-hosted Inter). Hero/toolkit/community/closing literary headings use Lora through `--font-literary`, with the existing unsupplied Arizona family fallback retained in marketing CSS. Do not claim Arizona binaries are installed.
- Space Grotesk (`--font-display`) serves manifesto, creator illustration and footer/chip roles. Caveat (`--font-handwritten`) supplies handwriting. See [typography](typography.md) for actual weights and sizes.
- Hero desktop title is 50.4px with matching line height; toolkit title 50.4px/1.25; community 37.8px/1.25; creator heading 37.8px/42px; closing 31.5px/1.2. Their responsive values remain in section CSS.
- Toolkit/community and creators/closing share uninterrupted dotted navy `.landing-surface` backgrounds: `--color-landing`, slate and blue stops, 16px dot grid and restrained blue radial glow. Manifesto remains black. Do not give every section a separate surface and create seams.
- Marketing retains its observed 4.2px rhythm (`--space-m*`) alongside the existing 4/8px interface rhythm. Borders, opacity fills and radii use the central [token registry](tokens.md) where repeated; illustration/category colors remain local data.

## Responsive behavior

At 1023px and below, toolkit hides desktop selectors and renders heading/copy with each preview; creators stack headings above clipped visuals. At 767px and below, hero typography and section spacing reduce and information navigation links disappear. At 639px and below, the separate Login link hides while Start Building remains. There is no hamburger menu. Footer wraps below 960px; assurances stack below 640px. Short desktop hero layouts have their own ≤600px height rule. See [responsive rules](responsive-design.md).

## Motion, states and accessibility

Hero CSS uses a .48s entrance with staggered delays; its feather drifts/shimmers. Toolkit springs resize icons and expand descriptions. Community cycles every four seconds. Manifesto responds to scroll; creators transition headings in .18s; closing has .6s entrance and .3s chip changes. These are feature-owned Motion timings, not global action-button presets.

Media/loading is owned by each feature: hero/video observers, lazy toolkit loading with 200px preload margin, community loaded/active reels, dynamic creator world scene and visibility hooks. Video playback stops according to existing visibility/reduced-motion logic; reduced-motion modes also shorten the long sticky narrative stages. No new playback control or service loading state was added.

Use the supplied native button/anchor interactions and existing `aria-pressed`, `aria-controls`, labels and focus states. Disabled placeholders remain visibly unavailable. Decorative media/icons are hidden where appropriate. Preserve image alt text and visible asset attribution; the login GLB attribution is documented separately. Do not put clickable behavior on an unlabeled div or interpret an illustrated control as a product action.

## Safe extension

Keep the route as composition, feature animation state with its section, and server access decisions outside marketing components. Reuse navigation, footer, brand and tokens. Shared controls may use the established local CSS recipes; do not force the denser onboarding geometry onto hero actions. Retain supplied assets, local mobile variants, observer cleanup, hidden-tab behavior and reduced-motion handling. Test scroll behavior on real desktop and mobile sizes after touching sticky stages, and compare static geometry plus screenshots. Moving video frames, typing and springs prevent a blanket pixel-identical claim.
