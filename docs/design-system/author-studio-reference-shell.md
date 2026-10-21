# Author Studio — reference shell extraction

Current Book-only visual pass: see [Book-only Studio preview](./book-only-studio-preview.md). Its confirmed scope supersedes the earlier multi-document/local-storage behavior recorded below; the reference observations are retained as history.

Reference: `vvd28.png`, 1920 × 992 pixels including approximately 48 pixels of browser chrome. Extracted before implementation. Browser tabs, address bar and VVD identity are not part of Rawan's interface.

## Layout measurements

- App fills the viewport, with no page scroll. A slim top rail starts 6–8 px from the edges; controls are about 32 px high with 8–10 px corners and 6–8 px gaps.
- Left document panel: x ≈ 6, width ≈ 256, top ≈ 46 within the app, bottom ≈ 6. Rounded corners ≈ 16 px, a fine translucent border, no heavy shadow.
- Search takes most of the panel's top row, followed by two small icon actions. Search height ≈ 32 px; icons ≈ 15–17 px.
- Empty state is near the upper quarter of the panel: 42 px muted icon tile, 14 px message, a compact outlined creation button, then a quiet import action. No statistics, feed or welcome cards.
- Panel footer is ≈ 52 px high, with a top hairline and evenly spaced small tool icons.
- Collapsed state retains a 40 px full-height glass rail at the same 6 px left/bottom insets and 46 px top inset. An expand icon sits at the top, and a plus button sits in a 44 px footer separated by a hairline. The writing area starts at x = 52 px. Both actions remain available while collapsed, including on mobile.
- Opening/closing uses a continuous 340 ms eased width transition, synchronized with the writing area's position. Content fades and slides with short staggered timings; inactive controls are inert and hidden from accessibility navigation. Reduced-motion settings remove these transitions.
- Additional navigation reference: `codex-clipboard-19db22e8-ac6e-4f0b-9877-359ae1accf25.png`. Clicking the Rawan mark reveals a separate 54 px full-height glass rail, shifting the header, document panel and writing area together. The background remains stationary. Compact document, account, active Studio and creation actions sit above bottom home/settings controls. This rail toggles independently of the document panel, closes on Escape with focus returned to the mark, and uses the same 340 ms easing and reduced-motion support. Hidden controls are inert. Settings only explains the existing automatic background, local saving and device motion behavior.
- Launcher is centered in the area to the right of the sidebar, slightly below the viewport midpoint. A muted 14 px introduction sits above a dark rounded identity pill.
- Five tools sit in one horizontal row: ≈ 60 × 60 px tiles, ≈ 70 px gaps, white icons ≈ 24 px, 13 px labels below. A small tertiary action sits underneath. Plenty of untouched space surrounds the tools.
- Small circular help control is inset ≈ 16 px from the lower right.

## Surface, color and typography

- Full-bleed heavily blurred atmosphere: desaturated sage/gray light on the left and middle, deep petrol/navy on the right and lower corners. Approximate base colors: `#071a2b`, `#132e40`, `#5b6c69`, `#737870`. Reconstruct with soft CSS gradients rather than embedding the reference screenshot.
- Glass surfaces use dark blue translucent fills, subtle backdrop blur, white borders at roughly 8–12% opacity. Large atmospheric forms, rather than glows or decorative patterns, provide depth.
- Main text is cool off-white (`#e5eaf0`); secondary labels are blue-gray (`#bbc7ce`). Soft blue identity accent, low-contrast controls, compact medium-weight sans serif. Use Rawan's existing Inter font.
- Tiles have slight diagonal lighter-to-darker shading, thin borders, ≈ 14 px corners. No saturated gold, large headings, dashboard cards or exposed editor chrome in the empty state.

## Rawan adaptation and limits

Keep the measured composition and visual treatment. Use Rawan's mark and Author Studio identity. Offer only Book, Comic, Character, Outline and More (notes and places), with an empty writing list, creation, text import and basic local editing. No seeded projects, feed, analytics, install prompt, reader interface or returning old dashboard shell. Saved drafts stay on this device and are identified as such.

The exact original background source, proprietary font and browser rendering are unavailable. Match the supplied visual proportions and atmosphere closely; an exact pixel identity is not asserted. On small screens, preserve the surfaces while adapting the panel and launcher to fit without horizontal overflow.

## Implementation and verification

Mounted at `/studio` through `features/author-desk/author-desk.tsx` and its scoped CSS Module. The previous studio implementation remains inactive. The new local storage key is `rawan-author-desk-v1`; no old drafts are removed or sample projects seeded. Creation opens a minimal title/content editor, with a role field for characters. Text import accepts `.txt` and `.md` within stated limits. Saved content is validated before loading; an unreadable store is kept rather than overwritten.

Ten original seasonal and time-of-day backgrounds are applied automatically by the backend. Optimized artwork, thumbnails, a collection preview and verbatim generation prompts are stored in `apps/website/public/assets/studio/backgrounds/`. The API uses UTC hour and northern-hemisphere season, with a five-minute refresh. There is no user-facing background control or saved appearance preference. The original navy-and-sage atmosphere is the initial fallback; the previous view stays visible while the next image loads. Full-size artwork loads only for the server-selected scene. Blur and dark overlays keep the reference's quiet visual treatment.

Checked at the reference's 1920 × 944 app viewport and at 390 × 844. The mobile layout has no horizontal overflow and retains its top rail after dialog focus changes. Creation dialog and close behavior checked in the browser. Unit checks cover supported document round trips and corrupt storage rejection. Website tests, type checking, lint and production build validate the integration. Reader remains blank; auth and onboarding are unchanged.

The added Rawan rail was checked in the browser at 1280 × 720: logo toggle, Escape/focus return and independent document-panel collapse/expand. Type checking and lint pass for this addition.

## Full expanded shell refinement — October 19, 2026

Reference register addition: `codex-clipboard-f7cef034-1a0e-4813-ba90-ada22cb95edf.png`, 1920 × 944. This is the complete expanded shell, building on the preceding navigation and hover references.

- Outer writing surface: x ≈ 54, y ≈ 2, ending 4–6 px from right/bottom; 16 px rounded frame with a barely visible cool-white hairline. The independent global rail remains 54 px wide.
- Header controls: top ≈ 10, height ≈ 30. First project chip ≈ 108 px; primary workspace tab ≈ 200 px; small identity tabs ≈ 30 px; secondary empty tab ≈ 200 px with a dashed edge. Keep 7–9 px gaps. A compact utility capsule sits at the upper right.
- Document panel remains x ≈ 60, y ≈ 46, width ≈ 256, bottom ≈ 15, with rounded glass corners. Its blue-gray fill has fine, very low-opacity grain. Search is 31 px high. Empty-state icon begins near y ≈ 134; the message and outlined action are centered below it. Footer has a hairline and small pale icons; its final chevron points upward.
- Main launcher: center x ≈ 1115; introduction near y ≈ 380, identity pill near y ≈ 400, tool tiles near y ≈ 474. Preserve the existing 60 px tile size and 70 px gaps. Bottom-right help circle is ≈ 34 px.
- Background treatment: sage-gray light to the left/middle, deep navy to the right. Apply a stable directional navy overlay to the automatically selected artwork so time/season imagery retains the reference's restrained contrast.

Applied those frame, header, secondary creation tab, utility capsule, grain, directional shading and control details. The secondary tab opens the real creation dialog; Help opens existing Studio help; the clock displays the device's local time. Rawan branding, author-specific tools, automatic backgrounds and prior sidebar/rail behavior remain the adaptation. Mobile hides secondary header controls to preserve room for the primary actions. Earlier measurements and observations remain above; this batch refines the expanded state rather than replacing the original reference.

Validation for this refinement: website type checking and lint pass. Browser review at 1280 × 720 confirmed the expanded shell and the new header action's creation dialog and close/focus return. Preview saved as `.tmp/author-desk-qa/refined-studio-shell.png`. The reference's artwork and identity are not embedded; the seasonal artwork continues to vary automatically.

### Parent shell / child writing dashboard correction

User clarification: the curve describes the entire writing screen nested inside a parent dashboard, not a decorative outline over a shared canvas. Replaced the decorative frame with an actual `Writing dashboard` section containing the artwork, top tabs, document sidebar, writing area, help and dialogs. The global navigation and Rawan toggle are siblings outside that child section. The parent's sage-to-navy background shows around the child's clipped 20 px corners; expanded bounds are 54 px left, 2 px top, 4 px right, 5 px bottom. All writing controls are positioned relative to the child, so the whole screen resizes as one surface. Opening/closing animates the surface bounds and radius for 340 ms; reduced motion removes the transition. This supersedes the earlier decorative-frame approach while retaining the previous reference observations.

Animation simplification: reused the installed Motion library. A single MotionConfig supplies the same 340 ms easing to the parent rail, nested-screen bounds/corners, brand, header spacing and document-panel content fades. Removed the overlapping CSS transitions and staggered visibility delays for those elements. Controls stay mounted and inert while hidden, and interrupted toggles can animate from their current position. Native buttons, links and dialog remain in use. The document-panel width still uses a simple CSS transition, with its matching reduced-motion override. Type checking and lint pass; browser checks covered opening, closing with Escape, document-panel collapse/expand and the creation dialog.

Toolbar alignment refinement: all top controls share a 32 px height and a single horizontal row. Text tabs share a 160 px desktop width, narrowing together responsively; icon buttons share a 40 px width. The Rawan button uses that same 40 px width as the collapsed document sidebar. Header top position compensates for the child screen's inset so its controls remain aligned with the outer logo when the parent rail opens. Browser measurements confirmed the logo at 40 × 32 px and the writing tab at 160 × 32 px, both y = 8 px when closed; collapsed sidebar width is 40 px. Type checking and lint pass.

## Help panel reference

Register addition: `codex-clipboard-fadc8fc9-ce9e-44e1-a980-b602b0d2b241.png`. A 340 px floating panel sits above the lower-right question button. Extracted styling: 17 px corners, thin cool-blue border, dark translucent navy gradient and blur, 50 px heading row, faint section dividers, 10 px uppercase muted labels, 29 px tutorial icon tiles, 13 px titles and 11 px descriptions. Video rows pair 66 × 38 px rounded thumbnail tiles with titles and subdued arrows. Support links occupy 40 px rows; community links share a quiet footer.

Implemented as a native auto popover, shared by the header and corner Help buttons, with outside-click/Escape dismissal and a short reduced-motion-aware transition. Built-in Rawan guides open in the panel, with a back action and optional fourth lesson. “What’s new” describes the current Studio. Support, feedback and Discord use the existing Rawan community invite. Video lessons and unconfigured social channels are explicitly marked coming soon and disabled rather than given invented destinations. On shorter screens, the bounded panel can scroll. Verified the visual layout and tutorial/back interaction at 1280 × 720; type checking and lint pass.

## Creation panel and Help interaction refinements

Register additions: `codex-clipboard-c33bd96c-c81c-43d0-b06c-bf50fc86b695.png` (two-column world-information panel) and `codex-clipboard-5d188a25-eb9e-4c12-b761-d2ddbbc3e741.png` (Help hover/active state).

Creation adaptation: retain the native modal opened by +, replacing the type grid with a 650 px rounded glass surface. Its 180 px left navigation lists the six supported author document types, with a dark inset selected row and import at the bottom. The main pane pairs a 125 × 134 px illustrated type tile with a pill title input and rounded description field, then a small type badge, a quiet information card and bottom-right create action. Inputs feed the existing local document creation flow; description becomes the opening document text. No wiki publishing, domain, collaboration or other unsupported settings are copied from the reference. On narrow screens the navigation becomes 125 px, the decorative type tile is hidden and form fields retain the available width.

Help refinement: video rows have a 55 px minimum height and 20 px rounded highlights extending into the section gutters. Tutorials and support rows share that blue-gray hover/focus treatment. The corner Help button gains the reference's dark-blue active surface and soft blue ring while open, hovered or keyboard-focused. Coming-soon video rows retain their disabled action while receiving the visual hover treatment. Browser checks covered modal open/close, Book/Character selection and the Help keyboard-focus highlight. Website type checking, lint and all 92 existing tests pass. Previews: `.tmp/author-desk-qa/creation-panel.png` and `.tmp/author-desk-qa/help-row-highlight.png`.

Popup correction, reference `codex-clipboard-36929812-1dcf-4346-bd7f-ec171ec2d892.png`: the creation surface is a native auto popover, not a centered modal. It opens directly below the child dashboard's toolbar at its left inset, keeps the dashboard visible without a dimmed/blurred backdrop, and dismisses on outside click or Escape. Its bounds are clamped to the viewport and updated on resize. The same two-column creation form remains inside. This supersedes the native-modal behavior described above. Browser checks confirmed placement, outside dismissal, reopening and Escape; type checking and lint pass. Preview: `.tmp/author-desk-qa/creation-popup.png`.

Outer-shell animation performance correction: the main writing screen now uses Motion layout projection for its bounds change, replacing frame-by-frame left/top/right/bottom animation. The browser lays out the destination once while transforms animate the visual transition; the large blurred background no longer needs a fresh geometry change on every frame. Header, sidebar and workspace participate in position-only layout correction to avoid scaling their contents. These layout measurements depend on the outer toggle, while the document sidebar retains its existing collapse transition. Reduced motion disables projection. Browser inspection confirmed an interpolated transform while layout left was already at its final 54 px, and outer open/close was checked with both child-sidebar states. Type checking and lint pass; no cross-device frame-rate claim is made.

User-requested follow-up supersedes layout projection: the outer rail and nested screen now use the same native CSS transition mechanism as the inner document sidebar. Shared duration/easing tokens are 340 ms and cubic-bezier(0.22, 1, 0.36, 1). Removed outer Motion projection and child position correction, retaining Motion only for existing inner content fades. Blurred artwork/atmosphere layers now keep viewport-based dimensions rather than resizing their textures during the outer slide. Browser computed-style checks confirmed the shared timing curve and duration; repeated outer open/close works. Type checking and lint pass. Preview: `.tmp/author-desk-qa/matched-sidebar-animation.png`.
