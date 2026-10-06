# Closing call to action and footer

Reference: https://vvd.world/, inspected 6 October 2026, plus the supplied desktop screenshot. The section follows the spark/place/world sequence.

## Observed layout

- Full viewport-height stage, centered content, navy background and subtle dots on a 16px grid.
- Small animated brand mark above “Ready to get to work?”. Desktop heading: 31.5px, 37.8px line height, regular serif; phone: 25.2px, 33.6px line height.
- Five compact colored tool badges with thin tinted borders, translucent backgrounds, icons and soft glow. Text: 12.6px / 16.8px, semibold; horizontal padding 8.4px, vertical padding 2.1px; row gap 8.4px. Badges cycle through different tools.
- “Start Building Now” button with right arrow, white 10% background, white 20% border, 12.6px corner radius, 14.7px / 21px medium text and 10.5px by 16.8px padding.
- Three muted assurances with green checkmarks, 12.6px / 16.8px text, 16.8px gaps. They stack on narrow phones.
- Footer: brand at left, compact resources/legal navigation and copyright at center, four social icons at right. Horizontal padding 25.2px, vertical padding 8.4px. Footer navigation: 14.7px / 21px; social icons: 21px.

## Rawan implementation

`ClosingSection` uses the supplied Rawan feather mark, preserved in `public/brand/`. CSS makes the original black artwork white. The footer uses Rawan branding and copyright.

The reference heading uses licensed Arizona Flare; the existing self-hosted Lora is the visual substitute. Space Grotesk supplies the interface text. No reference font binaries or social account links are copied.

Motion recreates the observed entrance and badge replacement: a 0.6-second fade/20px rise, a 0.3-second fade/vertical slide/blur for each replacement, and one badge changing every 2.4 seconds across five slots. Exact reference timer values were not recovered; these timings are local approximations. The feather gently sways over six seconds. Badge cycling stops off-screen; reduced-motion preferences disable cycling and feather motion.

Resources opens native disclosure links to the existing toolkit, community and creators sections. Unbuilt pages and unconfigured social destinations are disabled. The main button displays workspace-coming-next feedback, consistent with the hero; it does not register users. Tool badges and assurance copy are landing-page design text, not connected integrations or billing configuration.

The footer wraps into two rows below 960px; badges wrap on phones. Existing global scrollbar hiding remains in effect while normal scrolling stays available.

Creators, closing and footer share one continuous dotted gradient measured from the live reference; the boundary has no separate paint layer or abrupt color edge. See the full landing audit for its color stops.

One fixed navigation serves the whole page. It returns on upward scroll and remains visible once the closing section reaches 80px from the viewport top, through the footer. Downward scrolling in earlier sections hides it. Its slide/fade lasts 0.35 seconds, disabled for reduced motion.
