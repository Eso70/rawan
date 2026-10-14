# Rawan frontend design reference

Baseline: the original website design reviewed on 14 October 2026, before the subsequent redesign experiments. The website source has been restored to that original version. This document describes that baseline for future frontend consistency.

## How to use this reference

Start with the current route/component code and CSS. Older section-reference notes explain visual history but sometimes describe features that changed later. Distinguish real authentication and backend behavior from landing demonstrations and unfinished workspace interfaces.

The shared visual language is cinematic navy, faint dotted surfaces, translucent rounded panels, white feather branding, literary headings and clean interface text. Writing, reading and future productive surfaces should preserve that identity while adapting density and decoration to their task.

## Current routes

| Route                   | Original presentation                                                                |
| ----------------------- | ------------------------------------------------------------------------------------ |
| `/`                     | Full landing sequence: hero, toolkit, community, manifesto, creators, closing/footer |
| `/login`                | Google and Email provider choice, email login/signup and verification states         |
| `/terms`                | Preview-draft Terms in the shared legal shell                                        |
| `/privacy`              | Preview-draft Privacy Policy in the same shell                                       |
| `/workspace`            | Session check, then an empty page                                                    |
| `/workspace/reader`     | Minimal white reader-dashboard shell with title and Sign out                         |
| `/account`              | Session check, then redirect to `/workspace`                                         |
| `/auth/google/complete` | Small popup-closing utility; requires a valid popup ID                               |

Other `/auth/*` files are handlers rather than full designed pages. There is no custom 404 page in this baseline, and no current onboarding or author-dashboard page.

Login at `127.0.0.1:3000` redirects to `localhost:3000` to keep the existing local authentication origin consistent.

## Global foundations

Sources: [global CSS](../apps/website/src/app/globals.css), [root layout](../apps/website/src/app/layout.tsx).

### Fonts

| Self-hosted font    | Declared weights | Existing use                                                               |
| ------------------- | ---------------- | -------------------------------------------------------------------------- |
| Rawan Inter         | 400–600          | Global interface default, supporting copy, legal/login headings            |
| Rawan Lora          | 400–700          | Literary hero, marketing headings and navigation serif fallback            |
| Rawan Space Grotesk | 300–700          | Login controls, legal body, manifesto, creator illustrations, footer/chips |
| Rawan Caveat        | 400–700          | Handwritten manifesto emphasis                                             |

Marketing CSS sometimes lists Arizona Flare/Sans first, but those licensed binaries are not supplied. Actual local fallbacks are Lora/Inter. Do not describe Arizona as an installed font. Inter/Lora filenames identify Latin subsets; broader script coverage needs separate verification.

### Colors and surfaces

These are observed CSS values, not a complete implemented token system.

| Role                     | Original values                                                                  |
| ------------------------ | -------------------------------------------------------------------------------- |
| Root / media fallback    | `#09090b`                                                                        |
| Landing navy             | `#0a0f1a`                                                                        |
| Shared gradient          | Navy at 0/10%, `#162535` at 30%, `#1a3045` at 50%, slate at 70%, navy at 90/100% |
| Dots                     | White `#ffffff1f`, 1px radius, 16 × 16px repeat                                  |
| Glow                     | `#3878a01f` radial ellipse                                                       |
| Main foreground          | White; login `#f6f5f7`                                                           |
| Supporting copy          | Commonly white at 70–80%                                                         |
| Muted text               | Commonly white at 40–60%                                                         |
| Standard glass           | White 10% fill, white 20% 1px border, often 8px blur                             |
| Quieter glass            | White 5% fill, white 10% border                                                  |
| Illustrated solid panels | `#171717` detail cards, `#0a0a0a` tree/map                                       |
| Primary hero/nav action  | White fill and `#171717` text                                                    |
| Signup invalid / valid   | `#eaa0ac` / `#81dcb0`                                                            |

Tool-category accents: Organization amber `#fbbf24`, Maps green `#4ade80`, Connections violet `#a78bfa`, Wiki sky `#38bdf8`, Collaboration pink `#f472b6`. Community genres have their own palettes. The login artwork swatches are copyable colors, not a theme switch.

The `.landing-surface` is shared across Toolkit + Community and again across Creators + Closing/Footer. Avoid painting separate backgrounds that create seams. The manifesto is deliberately black with transitions into and out of it.

### Type sizes

| Role              | Desktop                            | Smaller layouts                                       |
| ----------------- | ---------------------------------- | ----------------------------------------------------- |
| Hero title        | 50.4px / 50.4px, regular Lora      | ≤767px: 37.8px / 42px; ≤639px: 31.5px / 37.8px        |
| Hero description  | 16.8px / 25.2px Inter, 500         | ≤767px: 14.7px / 21px; ≤639px: 12.6px / 18px          |
| Toolkit title     | 50.4px / 63px Lora                 | ≤1023px: 37.8px; ≤767px: 31.5px                       |
| Community title   | 37.8px / 47.25px Lora              | ≤1023px: 31.5px; ≤767px: 25.2px                       |
| Creator heading   | 37.8px / 42px Space Grotesk, 500   | ≤1023px: 25.2px / 33.6px                              |
| Manifesto         | 31.5px / 37.8px Space Grotesk, 500 | ≤767px: 25.2px / 33.6px                               |
| Closing heading   | 31.5px / 37.8px Lora               | ≤767px: 25.2px / 33.6px                               |
| Login heading     | 37.8px / 1.33 Inter, 500           | Intermediate desktop: 30px; phone: 28px; ≤360px: 25px |
| Legal title       | 36px / 40px Inter, 600             | ≤360px: 30px / 36px                                   |
| Legal body        | 14px / 20px Space Grotesk          | Same size                                             |
| Common controls   | Frequently 14.7px / 21px           | Context-specific                                      |
| Metadata / badges | Frequently 12.6px / 16.8–17px      | Context-specific                                      |

### Geometry and global behavior

The original spacing rhythm frequently uses 4.2, 6.3, 8.4, 12.6, 16.8, 21, 25.2, 33.6, 50.4, 67.2, 100.8 and 134.4px. Legal pages also deliberately use 24/32px spacing.

Radii vary by role: small chips 4.2–6.3px, detail panels 8.4px, main buttons 12.6px, reels 17px, legal panel 18px, login fields/providers 18.6px, toolkit cards 22px, media frames 25px, capsule badges 99px.

Global styles apply border-box sizing, zero body margin, inherited button fonts and link colors, hidden scrollbars, and a 2px white focus outline with 5px offset. Inputs/graph controls have local focus treatments. Reduced-motion CSS removes transitions/keyframes, with component logic additionally handling media and long stages.

## Original homepage structure

Source: [home route](../apps/website/src/app/page.tsx).

1. `LandingScroll` owns the page-level Lenis controller and contains one `LandingNavigation`.
2. `HomeHero` introduces the product over the supplied full-screen video.
3. Toolkit and Community share the first dotted navy gradient.
4. Manifesto provides the black creativity/planet stage.
5. Creators and Closing/Footer share the second dotted gradient.

### Navigation

Sources: [component](../apps/website/src/components/landing-navigation.tsx), [styles](../apps/website/src/components/landing-navigation.module.css), [visibility hook](../apps/website/src/components/use-landing-navigation.ts).

A compact fixed header sits 17px from the top, with 34px desktop horizontal padding and a maximum inner width of 1613px. Brand is 18px Inter beside a 28px feather. Navigation labels use the literary serif fallback at 12.6px.

Why Rawan, Pricing and Download are disabled; EN is a static indicator. Login opens `/login`. Start Building shows workspace-coming-next status feedback. Navigation hides downward, returns on upward intent, and stays visible at the top and final CTA/footer. Hidden navigation is inert. At ≤767px information links hide; at ≤639px the separate Login link hides. There is no mobile disclosure menu in this version.

### Hero

Sources: [component](../apps/website/src/components/home-hero.tsx), [styles](../apps/website/src/components/home-hero.module.css).

Full-viewport muted looping video, dark shading and a 269px fade into navy. Centered content has a 941px maximum width and is lifted 134px on desktop, 34px on phone, 24px on short desktop screens.

Order: “Made for storytellers” feather badge, “The modern storytelling toolkit”, supporting description, white Start building CTA, decorative avatar row and “A home for your stories”. A bottom chevron indicates scrolling. The CTA displays a status message; it does not navigate to signup.

Entrance uses .48s opacity/20px rise with staggered delays, a six-second feather drift and periodic badge shimmer. Video pauses off-screen, in hidden tabs and for reduced motion. It has no rendered playback control in the original version.

### Toolkit

Sources: [component](../apps/website/src/components/toolkit-section.tsx), [styles](../apps/website/src/components/toolkit-section.module.css), [graph](../apps/website/src/components/connections-canvas.tsx).

A 1075px maximum container uses 34px side padding/gap, a 38% sidebar and 62% previews. The sidebar sticks at 100.8px. Five 280px selector cards have 13px vertical gaps; the active card expands its copy and shows a category-colored icon. Inactive opacity is .4.

Features: Organize Your World, Create Interactive Maps, Visualize Connections, Create a Custom Wiki, Collaborate in Real Time. Rounded 16:9 media previews extend rightward and clip locally. Panel spacing is 134px. Below 1024px the selector list disappears and each full-width preview gets its own heading/copy, with 67px spacing.

Scroll position selects the active feature. Click navigation centers the selected preview with an interruption-aware selection lock. Reveal moves 30px to zero with opacity .3 → .7 → 1. Expansion spring is 300 stiffness / 36 damping / mass 1.

Four features use supplied videos. Connections uses the supplied image-backed canvas with pan/zoom/reset and keyboard controls. Ordinary wheel input scrolls the page; Control/Command-wheel zooms. These remain demonstrations, not a connected authoring or live collaboration service. Original rendered videos have no playback controls.

### Community

Sources: [component](../apps/website/src/components/community-section.tsx), [styles](../apps/website/src/components/community-section.module.css).

Amber eyebrow, serif heading and rotating genre pill above silent local reels. Reels are 240 × 427px with 24px gaps and 17px corners; active scale is 1.06. Neighbors dim/desaturate, hover/focus restores emphasis, and clicking selects a reel.

Eleven supplied reels repeat to form the loop. Advance cadence is four seconds; eighteen genre labels rotate. Advancement/playback pause off-screen, in hidden tabs and for reduced motion. There are no rendered previous/next/pause buttons or custom swipe handler in this original version.

“250,000+ creators” is retained design copy, not a verified Rawan usage metric.

### Manifesto

Sources: [component](../apps/website/src/components/manifesto-section.tsx), [styles](../apps/website/src/components/manifesto-section.module.css).

Black 400vh stage with centered sticky copy. Four lines reveal through opacity, 20px movement and blur. Space Grotesk carries the main text; Caveat supplies handwritten emphasis. Artists/palette enables a local paint effect; planet text and a small Earth clip reveal eight supplied photos through hover/focus/tap.

Photos have thin white borders, rounded corners and spring entrance. Reduced motion removes the long sticky stage, reveals the text and pauses Earth playback. The 10%/1% copy is decorative content and does not configure financial allocation.

### Creators: spark → place → world

Sources: [section](../apps/website/src/components/creators-section.tsx), [scene](../apps/website/src/components/creators-world-scene.tsx), [sample data](../apps/website/src/components/creators-data.ts), [styles](../apps/website/src/components/creators-section.module.css).

A reversible 400vh section contains one 100vh sticky stage. Headings switch at .33 and .66 progress: “It starts with a spark”, “That turns into a place”, “That grows into a world”. Only one heading transitions at a time (.18s).

Desktop uses a 1344px two-column composition, 67.2px padding and 33.6px gap; the scene scales to .85. Below 1024px headings stack above clipped visuals. Supplied illustrated cards become a detail panel, then a tree/map arrangement. Folders expand; six markers select matching local entries. Search, New Document and map toolbar are illustrations. Changes never write to the backend. Reduced motion shows the completed world without the extended sequence.

### Closing and footer

Sources: [closing](../apps/website/src/components/closing-section.tsx), [footer](../apps/website/src/components/site-footer.tsx), [styles](../apps/website/src/components/closing-section.module.css).

A minimum-100vh closing stage centers a feather, “Ready to get to work?”, five colored cycling tool chips, glass CTA and three assurances with green checks. One chip changes every 2.4s; entrance is .6s, replacement .3s. Cycling pauses hidden/off-screen or for reduced motion. The CTA shows workspace-coming-next feedback. Badges and assurances do not establish integrations or billing.

Footer uses brand left, navigation/copyright center and social icons right. Resources is a native disclosure linking to the original toolkit/community/creators anchors. Terms and Privacy work; Discord uses the shared supplied destination. What’s new, Careers and unconfigured social channels are disabled. Footer wraps below 960px; assurances stack below 640px.

## Login and verification

Sources: [page](../apps/website/src/components/login/login-page.tsx), [styles](../apps/website/src/components/login/login.module.css), [email flow](../apps/website/src/components/login/email-signin.tsx).

The desktop composition keeps decorative artwork across the page and a form panel beginning at 55% width. Form content is at most 400px; the feather sits above, and Help/Terms/Privacy/English utilities sit near the bottom. There is no enclosing glass form card.

Background: 25% black shade, purple/teal/warm radial glows and a 160° `#1d2c50` → `#263e63` gradient. Dots use a 15px grid; an SVG grain layer has .3 opacity with overlay blend.

The supplied Dragonspire Library Monk GLB keeps its materials. Three.js adds gentle motion and pointer response, procedural flowers/paper and a moving yellow backdrop. Palette controls copy hex values and show “COPIED!”; they do not change theme. Preserve visible source attribution and [the model license record](../apps/website/public/models/login/ATTRIBUTION.md). Desktop art loads dynamically, caps pixel ratio at 1.5, handles failures and releases resources.

At ≤767px art/swatches/credit/year hide; the form centers with 33.6px side padding, falling to 22px at ≤360px. Short screens can scroll. Provider controls are minimum 46.2px high, 18.6px radius, white 10% fill / 20% border and 8px blur. Inputs are minimum 46px high; password visibility has a 40px target. Submit is minimum 36px, 12px radius and translucent white.

States: provider choice → Email login or signup → verification for new email accounts → `/workspace` on success. Google uses the existing popup flow. Heading types at 32ms per character with a stable accessible label; login says “Step back into creation”, signup “Your imagination’s new home”. Google and Email are the only providers shown.

Keep existing password-policy feedback, paste/autocomplete, visibility toggle, pending/disabled states, inline alerts, eight-digit code auto-submit plus explicit Verify, resend cooldown and Back behavior. No working password-recovery view is rendered. JWTs remain in HttpOnly cookies, not client storage.

## Terms and Privacy

Sources: [LegalPage](../apps/website/src/components/legal/legal-page.tsx), [styles](../apps/website/src/components/legal/legal.module.css).

Both use the original navigation, page scroll controller, navy patterned surface and footer. Reading column is `min(768px, calc(100% - 48px))`, with 128px top / 96px bottom padding. Centered 36px title precedes the muted “Last updated: October 2026 · Preview draft” row and a 48px document gap.

Document: white 10% fill, white 20% border, 18px radius, 8px blur, 32px desktop padding and 24px phone padding. Body is 14px / 20px Space Grotesk; section labels are 16px / 24px Inter. Sections have 24px separation, paragraphs 8px, list items 4px. Links are white and underlined, turning `#93c5fd` on hover.

The original Terms has 12 numbered sections; Privacy has 10. Both are preview drafts with search indexing disabled. There is no policy tab bar or sidebar in this baseline. Their original text contains outdated email/onboarding descriptions; restoring the original design also restores that original copy. Correcting policy copy would be a separate change.

## Assets and future consistency

### Library addition

The public `/library` route extends the original design without changing the homepage. The shared navigation includes a Library link that remains visible on phones, with an underlined current-page state; Resources also links to it.

Sources: [page](../apps/website/src/app/library/page.tsx), [library component](../apps/website/src/components/library/library-page.tsx), [styles](../apps/website/src/components/library/library.module.css), [sample catalogue](../apps/website/src/components/library/books.ts).

Reuse the original navy dotted `landing-surface`, Lora editorial headings, Inter controls, Space Grotesk introduction, scroll controller and footer. The Library uses a compact, left-aligned 50.4px heading (40px on phones), a short introduction. Avoid a large marketing hero on this browsing page. Content is limited to 1143px including 34px side padding, reduced to 24px below 768px and 20px below 480px.

Reusable book cards live in [BookCard](../apps/website/src/components/library/book-card.tsx). Cards use 14px corners, a subtle white 10% border, a faint navy/translucent surface, a centered cover stage and separate metadata. Covers retain their proportions through `object-fit: contain` and stay small (120 by 168px desktop, 100 by 142px phone). The grid uses four columns, three below 901px, and two below 768px. The Library shows all 12 books in original order, with no category controls, sorting or inline search.

The [LibrarySearch](../apps/website/src/components/library/library-search.tsx) modal is mounted only on `/library`. Ctrl+K or Cmd+K opens it there; a search button appears in the shared navbar only when viewing Library. Other routes have no search trigger or shortcut listener. It searches only the mock books (title, author, genre), never website pages or private content. Results link to stable book-card fragment IDs on `/library`, with a subtle target border. The Library itself shows the full collection without filters or sorting.

Modal styling follows the supplied compact search reference while retaining Rawan's palette: a translucent white 5% surface (`#ffffff0d`, matching login inputs), 24px backdrop blur, faint white outer outline and 18px corners. Width is at most 560px and height at most 560px, capped below the top offset with 24px bottom clearance. Keep 12dvh top positioning (8dvh on phones). The compact search row has a borderless input, Lora type and a small Esc control; the modal title and result count remain available to assistive technology without adding visible chrome. Results use small supplied covers, Lora titles and muted Inter author text. The footer shows arrow-key navigation and Enter-to-open hints. Avoid section dividers, prominent outlines and extra headers.

Mouse and keyboard use one shared `activeBook` state. A row receives a soft background only when `data-active` is true; do not add independent CSS hover/focus backgrounds that can highlight multiple rows. Tab or arrow keys update the active row; pointer movement takes over. Leaving results restores the focused row if applicable. The previous row clears immediately and only the newly active row fades in over 120ms. Four-pixel row gaps keep highlights separated. Arrow Up/Down wrap through visible books and keep the focused result in view; Enter follows the focused link. Preserve native modal focus containment, input focus on opening, Escape/close/backdrop dismissal, focus restoration and background scroll locking. Query resets on close. Results scroll to the top on each opening and query change; keep the result count outside the scrolling region. Use 8px scroll-edge fading/padding to avoid harshly clipped rows, while leaving search and keyboard hints fixed. There is no backend search.

All 12 supplied root JPEGs were moved unchanged into `apps/website/public/images/library/` with descriptive filenames, in original numeric order: mestra, the-book-of-chaos, book-of-days, old-phuul, allegiant, all-the-light-we-cannot-see, paradox, a-million-to-one, harry-potter-and-the-cursed-child, a-sunny-place-for-shady-people, catching-fire, fahrenheit-451. Titles and authors follow the supplied cover artwork; genres are sample catalogue labels. Library search matches this mock catalogue without case sensitivity. Result counts announce changes through a live status.

This is explicitly a mock collection: no book files, purchase, reading, download, authentication or backend catalogue integration is implied. Preserve that distinction until real catalogue contracts exist. Book covers are display content, not buttons with unavailable actions.

Keep supplied brand files, hero video variants/poster, four toolkit recordings, relationship image, eleven reels, Earth clip, eight planet photographs, five creator/map images, login model and self-hosted fonts. Large originals under ignored `media-source/` need separate backup. No generated artwork belongs to this original design.

Future productive screens should share brand, font roles, spacing and control-state semantics, while reducing marketing decoration around sustained writing/reading. The empty workspace and white reader shell are unfinished, not a finished application design system. No populated shared UI-kit package exists.

Use actual backend contracts before advertising a capability. Separate private drafts from released content and personal reader data. Optional preferences do not grant permissions. See [backend scope](backend-horizon-2.md) and [cross-mode visual research](visual-identity-across-modes.md).

Historical detail: [toolkit](../apps/website/toolkit-reference.md), [community](../apps/website/community-reference.md), [manifesto](../apps/website/manifesto-reference.md), [creators](../apps/website/creators-reference.md), [closing](../apps/website/closing-reference.md), [legal](../apps/website/legal-reference.md), [login](../apps/website/login-reference.md), [landing audit](../apps/website/landing-ui-audit.md). Some earlier passages describe preview authentication, manual playback or swipe behavior that no longer match the baseline source.

Follow [website AGENTS.md](../apps/website/AGENTS.md), including reading relevant bundled Next.js guides before code changes. Validate affected routes with build/typecheck/lint and browser checks for desktop/phone overflow, keyboard focus, forms, reduced motion and hidden-tab media behavior. Do not infer exhaustive accessibility certification from visual similarity.
