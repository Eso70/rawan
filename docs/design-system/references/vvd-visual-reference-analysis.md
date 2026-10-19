# VVD visual reference analysis

Updated 19 October 2026; review began 18 October 2026 · batches 1–2 · 23 inspected screenshots. [Image register and provenance](rawan-reference-image-register.md). This document describes reference evidence; [Rawan direction](rawan-visual-direction.md) supplies original interpretations. All behavioral statements are explicitly proposals unless directly visible as text or affordances. No live reference site was inspected.

## Method and limits

Images were visually inspected at their supplied attachment scale. Numbers below are approximate image-space estimates; no pixel color sampling or original CSS/font identification was performed. Browser chrome is outside the design. A dimmed tutorial state cannot establish normal text contrast. Caption-like text may be an instructional overlay or captured demonstration; its provenance is unknown. Chronological order is inferred only from visible step numbers, not filenames. Static images do not establish animation, resizing, navigation, actual collaboration or successful persistence.

## P01 — Color, type and surface families

| Visible family            | Evidence and purpose                            | Neighbor relationship                                                                      | Rawan interpretation                                                                                       |
| ------------------------- | ----------------------------------------------- | ------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------- |
| Near-black / charcoal     | 2/3/24/26/27; supporting panel or dark stage    | Separates instructional and document surfaces with modest lightness change                 | Neutral long-session surface candidate; retain existing Rawan navy while reviewing a warmer studio theme   |
| Deep navy / slate         | 12–23/25/28/29; workspace and document          | Off-white copy and pale blue borders establish depth; some green atmosphere bleeds beneath | Strong continuity with current Rawan surfaces; candidate studio context, not replacement brand             |
| Muted brown               | 1/4; graph settings and room context            | Warm highlights and cream copy reduce coldness                                             | Optional project atmosphere; no universal brown control theme                                              |
| Blue-green atmosphere     | 12–23/25/28/29                                  | Blurred landscape/room is broad low-frequency color behind sharp foreground                | Selective environment only, disabled in reading/writing focus                                              |
| Pale blue selection       | 14–18/19–21; tutorial target or enclosing panel | Light ring plus blue-tinted interior stands apart from dark dimmer                         | Separate focus, selection and tutorial-target semantics; screenshots do not prove these are keyboard focus |
| Bright visualization hues | 20/23–26/29; cyan, blue, green, violet, yellow  | Icons and dark label plates sit on multicolored art and patterned regions                  | Visualization-only categorical colors plus shapes/labels; never ordinary navigation palette                |
| Gray/off-white            | All; titles/body versus explanatory text        | Secondary tutorial/help copy is visibly quieter, some too faint                            | Preserve hierarchy but validate contrast; do not use opacity alone to encode essential state               |

Typographic variation matters. In 4/12/13–23/25/29, entity titles and body have a serif appearance; controls can also look serif in those captures. In 24/26/28, sans-serif dominates the controls and entity text. Image 27 combines a large serif marketing headline with sans product content and an italic display-like document title. The screenshots do not identify font families, user theme settings or product versions. Rawan should deliberately choose literary serif for prose and titles, UI sans for controls, rather than recreate inconsistent reference typography.

Approximate hierarchy: entity titles 24–28px in full-width captures; properties/body around 13–16px; instruction titles around 15–17px; tutorial body around 14–16px with 1.5–1.7 leading; compact metadata around 11–13px; cinematic heading around 28–34px. Image scale and source zoom make exact inference unsafe. Long full-width descriptions in 19 run much farther than a comfortable literary measure; narrower 21 wraps heavily. Rawan needs an explicit prose measure and a minimum viable document pane width. Keep normal tracking for prose; reserve compact tracking for large titles after font review.

Rounded surface hierarchy is quieter than a card-grid dashboard: small chips roughly 3–8px corners, tool buttons around 12–16px, contextual panels around 16–20px, broad document windows around 6–12px, and pills fully rounded. Header rules and delicate outlines do more work than shadows. A few bright enclosing outlines in 19–21 appear to mark emphasis; do not copy them as the permanent border of every panel.

## P02 — Shell: content gets the space

Images 4/12/28 show a roughly 40–48px application top band below browser chrome and a left panel roughly 250–260px wide within a 1920px raster. Project switcher, context selector and compact mode controls sit left; install/utility/time controls sit right. Search and create/collapse icons occupy one compact row. Bottom shortcuts repeat tool access without a large navigation rail. These approximate dimensions are composition evidence, not target sizes for touch or browser zoom.

The populated sidebar in 12 organizes tutorial, timeline and entity categories, while 4/28 give an empty document message and a single creation action. Search scope is suggested by its label. No open filter menu or folder interaction is shown. Image 27 contains a much denser nested-looking tree inside a marketing demonstration; it does not establish that the empty-state shell must expose all categories immediately.

Rawan: project scope must be explicit in search, breadcrumbs and destination labels. Author home should list real projects and resumable work; a selected project can show writing plus optional research/world tools. Readers get Library/Discover/reading navigation, with no author task rail. Omit reference install, clock, branded path badges and importer promises unless justified by Rawan requirements. Collapsing navigation must leave a named reopen control and keyboard route.

## P03 — Atmosphere and depth

4/5 show a heavily blurred warm interior with a bright central opening; 12–23/25/29 a cool illustrated setting, muted green lower-left area and blue upper area; 28 a subdued blue field. Dots appear on some introductions and spatial workspaces. These backgrounds create identity through broad light/color rather than detailed decoration, leaving sharp documents as the point of attention.

Color bleeding could result from transparency, composited artwork or an opaque gradient; screenshots cannot distinguish the mechanisms. The useful principle is separation, not a required stack of expensive backdrop filters. Rawan should use original art, a static prepared blur/gradient, dark scrim and opaque text surfaces. Keep background independent of document contrast. Provide a plain background preference, avoid animation while typing, defer large assets, and recover to solid color when media fails. Do not put dotted texture behind ordinary book paragraphs or dense research copy.

## P04 — Documents and panels

13–19 show a centered broad entity document, roughly 64% of raster width with generous outer margins. Upper-right utilities are visually small and nearly borderless. Name and alias row occupy the upper-left; type indicator and illustration sit to the right. The portrait is about a fifth of content width in the large view. A wide gap separates header facts from the About section. A bottom content toolbar appears in 13/14. Image 19 adds a second section below the first and clips lower content at the viewport boundary; internal scrolling is plausible but not demonstrated.

21 shows canvas and entity as near-equal columns within an enclosing perimeter. 22/23/25/29 show explanatory content left and paired previews right. In narrow entity panes, the title, facts and picture compete for space; 21 truncates a property label while wrapping paragraphs. 24/26 stack property values beneath labels and use a smaller portrait, illustrating a different compact strategy. These are distinct observed variants, not proof of an automatic responsive algorithm.

Rawan: begin with standard pages plus one contextual panel. A later split view should preserve a readable primary column and independent pane headers. Collapse picture/facts into stacked content before shrinking type; never hide a property name solely behind truncation. Maximize/close labels and unsaved-state handling must be explicit. Full draggable window management is a separate architecture decision; no screenshot proves it is required.

## P05 — Facts, references and content

19/21–25/29 show aliases as small chips, property icons, textual values and entity-like chips for parents/residence. About and lower sections use thin rules, narrative paragraphs and underlined names. 27 shows longer editable-looking property fields and colored inline references in a product demonstration. 15 shows Add property, but no actual editing form.

Underlined names suggest navigation; references cannot depend on color alone. Several Arthur captures repeat entity names directly adjacent to one another inside prose (19/21/23/24), while 25 appears cleaner in places. Record this as a visible content/rendering variation with unknown cause. Rawan should display each mention label once, preserve whitespace and selection, and announce its destination. Do not replicate duplicated text, a game-stat section, arbitrary aliases or extensible property storage merely because shown here.

Backend distinction: current world entities have typed fields, descriptions, tags, relationships and media attachments. A structured WorkDocument reference block is not an arbitrary inline entity mark in a scene. Reference previews can read an authorized entity; persisting inline mention ranges, aliases and user-defined property schemas requires a proposal and contract work. Private entity IDs must never become public reader links by accident.

## P06 — Canvas, map and graph evidence

20 shows a zoomed-out dotted canvas with small notes, a named moodboard boundary, image arrangements, an outline boundary, chapter-like text cards and connecting arrows. A small graph and map appear as rectangles within it. It establishes visual coexistence and spatial grouping; neither embedded live tools nor true unbounded coordinates are proven. 21 preserves the canvas overview beside a reading-sized entity panel, exposing the need for semantic zoom: overview communicates groups, detail communicates text.

23/25/29 show an illustrated map with clustered-looking marker density, dark labels, cyan/blue pin glyphs, green trees, yellow landmarks, colored territory outlines and dotted fills. 24/26 enlarge this map. The term “clustered-looking” describes crowding, not a verified clustering algorithm. Plus/minus controls are visible in 23/25/29. Map art is sometimes sharp and sometimes obscured by overlays or loading-like state (26); no performance conclusion follows.

For Rawan propose pan/zoom, fit, selection, node drag, explicit connect mode, visual group previews and an accessible outline/list. Hide small body copy at overview zoom; keep selected-item identity readable. Maps need marker label priority and a legend, outlines/patterns independent of hue, editable coordinates and a location list. Graphs need selection, label density choices and spacing controls, with keyboard list/table parity. Only 1 shows graph settings, and 20 shows a miniature graph; no full relationship graph or timeline editor is available to analyze.

## P07 — Guided attention, steps and restart

Together 17/16/15/14/13 cover visible counters 1–5: name, image, properties, content action, closing instruction. The popover relocates beneath a title, beside a portrait, left of a row, above a toolbar and then centrally. A blue target interior and pale outline leave one region legible against the dimmed workspace. Popovers are roughly 330–340px wide with around 16px padding and a consistent title/body/footer. The arrow identifies the target; the footer separates step count from Back/Next/Finish. 18 visibly highlights a Tutorial trigger in the window header.

Rawan adaptation: optional, task-specific tours anchored to existing controls, with original copy, restart via Help, safe dismissal and no automatic data mutation. Tour finish closes the tour; it is not a second account setup completion screen. Interactive tutorial steps require a focus boundary containing both target and instruction. Missing/off-screen targets require measured repositioning or a skip fallback; do not leave an empty dimmed screen. Detailed state and accessibility requirements live in [onboarding and tours](rawan-onboarding-and-guided-tours.md).

## P08 — Compact view settings

1 shows a brown floating panel approximately 285×157px inside a 355px-wide crop: title/close row, Names segmented options, Spacing slider, More disclosure. Labels align left, controls right. The segmented group is about half the panel width; the slider thumb is outlined. No visible numeric spacing readout or advanced content is shown.

Rawan: original neutral settings surface with named controls, visible current values, reset and scope (“This view” versus portable preference). Inline view changes should not unexpectedly save content. Graph density is local presentation unless a specific contract supports synchronization. Reader settings may use the existing scoped preferences, subject to their actual allowlist.

## P09 — Help and feedback

2 has an approximately 340px-wide rounded feedback panel, 16–18px inset, short explanatory copy, four category chips, tall textarea and bottom-right Cancel/Send. Send appears disabled; reason and enablement logic cannot be proved. A placeholder alone is insufficient labeling for Rawan. Feedback needs a real endpoint and recoverable send state before a working Send can be promised.

3 has an approximately 340px-wide, taller help panel: heading/close, muted uppercase tutorial label, thumbnail-plus-title rows, external arrows, expansion chevron, separated assistance links and a bottom community row. Rawan should use text-first help with optional captioned media, preserve context and display only actual support destinations. Reference social brands and tutorial thumbnails are not assets to reuse.

## P10 — Empty states and launchers

4/12/28 use a compact centered row of about five square tool actions with labels below, plus a quieter exploration action. They preserve open space instead of presenting metric cards. 4/28 combine this with an empty sidebar and creation/import actions; 12 has existing content. Tool order differs between images, so a universal fixed sequence cannot be inferred.

Rawan should make the next action specific: create a project on author home, add the first scene inside a manuscript, add a character within that module, add a location on an empty map. An empty reader library should lead to eligible works and saving, not a tool palette. Never advertise broad import just because the reference does.

## P11 — Cinematic introduction versus productive interface

5 is a full-screen sentence with a spinner-like mark. 22/23/25/29 use a left introduction with choice pills and two large product previews. 22 visibly includes a Begin action and a highlighted-looking choice; 23/25/29 do not show Begin in their frames. Skip remains upper-right. 24/26 use a short collaboration-oriented statement alongside a document and map. 27 is a marketing page with an expanded toolkit feature and cropped demonstration; these promotional surfaces must not become the manuscript editor layout.

A static image does not establish automatic preview changes, voice narration or transition times. Rawan may later offer an optional creator introduction with a single preview and original categories grounded in supported resources. Preserve existing required-purpose account setup and its direct workspace transition. Reader onboarding should be lighter and should not require a project or fictional world.

## P12 — Variations, uncertainty and transfer rules

| Variation                                 | Evidence                           | Decision for Rawan                                                                   |
| ----------------------------------------- | ---------------------------------- | ------------------------------------------------------------------------------------ |
| Warm vs cool atmosphere                   | 4 vs 12/28                         | Optional context artwork; no global palette replacement                              |
| Serif navy vs sans charcoal documents     | 19/23/25 vs 24/26                  | Explicit prose/UI roles; retain both observations, choose Rawan recipe independently |
| Large portrait / narrow column            | 19 vs 21/24                        | Content-based pane minimum, stack facts and media before reducing type               |
| Dense labels and repeated mention strings | 19–26/29                           | Treat as usability risks; design collision and rendering checks                      |
| Team cursor graphics                      | 24, plus reference sync copy in 13 | Promotional evidence only; Rawan collaboration remains H3                            |
| Frame/highlight perimeter                 | 19–21 vs ordinary 13 document      | Do not mistake tutorial emphasis for permanent surface styling                       |

Recommended transfer: quiet chrome, contextual controls, clear document hierarchy, optional supporting panes, progressive disclosure, voluntary tours and separate visualization color. Modify density, contrast, target sizes, prose width and map collisions. Reject borrowed branding/art/copy, ubiquitous blur, mandatory worldbuilding, reader productivity dashboards, automatic post-setup cinematic sections and unsupported collaborative claims.
