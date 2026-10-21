# Book-only Author Studio — visual preview

## Presentation refinement

At the user's request, visible mock/preview/reset/not-saved copy has been removed from the form, sidebar, manuscript status bar, empty manuscript and Help. Introductory filler copy was trimmed. This is a production-style presentation change: the previously confirmed visual-only implementation and session-only storage behavior remain unchanged, and no success/save claims were added.

Both book type and paragraph style now consume a shared `components/ui/dropdown.tsx`, styled to the Studio glass surfaces and built on `@radix-ui/react-select`. It supports keyboard selection, typeahead, checked/highlighted/disabled states, Escape, focus return and collision-aware positioning. Dropdown content inside a native dialog is portaled into that dialog; dialog/body scrolling is separated so the menu is not clipped. After a paragraph-style change, focus returns to the Tiptap editor.

Books now carry independent front/back/spine cover images. Each slot supports add, replace and remove; validation retains PNG/JPEG/WebP and the 5 MB per-image limit. A narrow spine slot reflects its proportions. The book's empty manuscript uses its front cover and shows available back/spine thumbnails.

Browser checks verified book-type keyboard selection, Escape closing only the dropdown, all three local image inputs, independent removal, cover propagation into the created book and paragraph/heading changes in Tiptap with focus returning to writing. No console errors were reported. Type checking, lint, all 92 existing tests and production build pass. QA cover images came from existing local artwork and are not seeded into the app. Updated form screenshot: `.tmp/author-desk-qa/three-book-covers.png`.

## Agreed scope

The user confirmed **Visual-only Book flow for now** after the request included both a visual-only opening and a backend implementation brief. This pass keeps the established Studio shell and builds the book journey as an interactive design preview. The active Studio uses no book/chapter API calls, browser-storage writes, mock repositories, seeded books or fabricated save states. Books, cover previews and chapter text exist only in component state and reset on reload. Earlier saved data is left untouched and is not loaded into this preview.

Primary reference: `codex-clipboard-c294b9be-331d-443f-8363-745f686f344f.png`. Extracted details: navy translucent dialog, 16–18 px corners, compact header, left navigation strip, inset active row, thin borders, quiet labels and generous interior spacing. The form adapts this to a 740 px Book-only surface. The parent rail, nested writing screen, document sidebar, automatic artwork and outer animation remain.

## Phase 1 — architecture audit

- Active `/studio` route renders `features/author-desk/author-desk.tsx`.
- The previous desk's localStorage document records and Comic/Character/Outline/Note/Place creation actions are removed from the active UI.
- Tiptap React and StarterKit were already installed. The new manuscript reuses them with `immediatelyRender: false`.
- `ManuscriptController`, its DTOs and Prisma define Project → Book → Chapter → Scene. Content belongs to Scene. Current CreateBookDto accepts title, description and position. Subtitle, cover and type are not assumed to be existing backend fields. No contracts or schemas changed.

## Phase 2 — shared creation

Central Create Book, sidebar New Book and parent-rail New Book use one native dialog. Top + and sidebar + open a compact New Document popover containing only Book. Other tools are hidden under the Book-only scope.

Title is required, including a non-whitespace check. Subtitle is optional. Types: Novel, Novella, Short story, Nonfiction, Poetry and Other. An optional PNG/JPEG/WebP cover under 5 MB can be previewed or removed without uploading. Native close/Escape and title focus work. Metadata resets on dismissal. Type checking passed after this phase.

## Phase 3 — book workspace

Valid submission creates an in-memory book with a title in the top tab and sidebar. The empty manuscript shows its title, subtitle, type and optional cover with Create First Chapter. Closing/reopening its tab retains contents only during the current page session. The UI labels this as an unsaved design preview.

## Phase 4 — manuscript visual

The first chapter opens a Tiptap writing surface. Sidebar chapter navigation, chapter rename, paragraph/headings selector, undo/redo, bold, italic, underline, strikethrough, lists, quotations, scene breaks, focus view and word/read-time counts are connected for preview. Chapter text stays in memory during switches. No publishing, AI, collaboration, export or fake saving controls are included.

Help now describes only the Book preview. Mock-tool guides, placeholder videos and unsupported social actions are hidden.

## Phase 5 — verification

Website type checking, lint, all 92 existing regression tests and optimized production build pass. Some regression tests cover older inactive modules; they are not new persistence tests for this preview.

Browser review at 1280 × 720 verified:

- Book-only home is empty, with other tools absent.
- Central action, top menu, sidebar menu and sidebar New Book use the shared flow.
- Blank title disables creation; title and optional subtitle accept input.
- Creating a book updates its sidebar entry and named tab.
- Empty manuscript → first chapter → editor remains within the shell.
- Chapter rename updates the sidebar and breadcrumb.
- Writing updates word count; switching chapters and back retains text in memory.
- Bold formatting creates a real strong mark.
- Closing/reopening the tab retains current session text.
- Reload returns to an empty Studio, confirming no preview books were persisted or seeded.
- No browser console errors were reported during the writing flow.

Responsive CSS supports smaller screens; a separate mobile browser session was not tested.

QA screenshots in `.tmp/author-desk-qa/`: `create-book-dialog.png`, `book-empty-manuscript.png`, `book-manuscript-editor.png`, `book-only-home.png`. Example titles and text were entered during testing and are not seeded.

## Deferred by the confirmed scope

Real project/book/chapter/scene persistence, account loading/error/save states, persisted route identities, reload recovery and backend metadata support. This preview intentionally resets on reload.

## Open book-creation workspace — 19 October 2026

### Shared dropdown and scrollbar refinement

The user requested the exact existing language-selector style for all current dropdowns. LanguageDropdown now wraps the same shared Radix-based Dropdown used by book type, paragraph style, text size, line spacing and writing width. The shared CSS carries the original language field's 18 px rounding, translucent charcoal surface, blur/saturation, soft border/shadow and restrained row highlight. Compact language and editor triggers retain their necessary dimensions while consuming the same menu design and behavior. The obsolete separate language-selector stylesheet and bespoke disclosure logic were removed.

Studio scrollbar tracks/thumbs are hidden for the creation workspace, editor, Styling, sidebar and Help while overflow remains scrollable. Shared dropdown viewports also hide scrollbar chrome. Browser inspection confirmed creation overflow remains auto with computed scrollbar-width none, book-type selection works and language choices still open. No book data or persistence behavior changed.

Reference register additions: `codex-clipboard-640e8f01-14a5-4053-90d2-8293f8244da0.png` and `codex-clipboard-c1c28b73-81c9-4b1f-8504-9d98afecc53c.png`. Both show the same spacious book-creation composition, with a large dimensional book on the left, atmospheric background, title and compact setup tabs on the right, and a return action beneath the top bar. The first emphasizes the spine; the second shows the front and page block. The useful pattern is immediate correspondence between book identity, artwork and its physical visual.

This refinement supersedes the earlier native Create Book dialog presentation; the earlier findings remain recorded above. All existing creation entry points now open one full child-workspace setup screen. The outer navigation, top bar, automatic background and Help remain available. Document navigation returns when creation finishes or is cancelled.

Rawan keeps only Book details and Cover artwork tabs. Details retain required title, optional subtitle and the shared book-type dropdown. Artwork retains independent optional front/back/spine uploads with validation and removal. A CSS 3D book updates live with title, subtitle and artwork. Front/Spine/Back controls rotate the book with reduced-motion support; this adds no rendering library. Uploaded artwork occupies its own cover surface without automatic text being placed over the image.

The user was told before implementation that publishing settings, usernames and print-production options would be left out. Hardcover/Paperback/Paper cover selectors, redundant text-design tabs, external-product labels and invented author identities were not added. There are no new backend calls or persistence claims.

Keyboard setup tabs support arrows/Home/End. Creation focuses the title; Back and Escape cancel; Escape in the custom dropdown closes only that dropdown. Cancelling returns focus to the entry action. Browser checks at 1280 × 720 verified live lettering, three independent artwork uploads and corresponding book views, details retained across tabs, required-title disabling, custom dropdown dismissal, creation into the book tab/sidebar, and Escape returning to the existing book with focus restored. No browser console errors were reported. Responsive CSS stacks the composition on narrow screens; a separate mobile browser run was not performed.

QA screenshot: `.tmp/author-desk-qa/book-creation-workspace.png`. Test titles and local artwork were entered through the browser only and are not seeded into the product. Type checking, lint, all 92 existing tests and production build pass.

## Writing-screen refinement — 19 October 2026

Reference register addition: `codex-clipboard-cc53c8f1-18d6-4f0f-8938-c5dea337fff8.png`. The reference introduces a three-part composition: chapter navigation, a translucent manuscript surface, and a separate appearance inspector. Distinctive reusable patterns are the centered chapter title, a small ornamental divider, an optional landscape header image, a compact formatting bar below that image, quiet status information and grouped typography controls. Rawan retains its own identity, existing parent/child shell, book navigation and automatic seasonal background system.

Implemented a softer glass writing surface with a collapsible Styling panel. Useful author controls include Serif/Sans/Mono, five text sizes, four line spacings, three writing widths, optional pale Page view, focus view, and left/center/right/justified paragraph alignment through the Tiptap TextAlign extension. Appearance menus reuse the shared custom dropdown. Formatting still changes real editor content within the agreed in-memory scope. Appearance settings affect the writing view, rather than claiming to change published output.

Chapter header images support add, replace and remove, with PNG/JPEG/WebP validation and a 5 MB limit. Images belong to individual chapters and remain when switching between chapters during the page session. Reading order, accessible action names, pressed states, keyboard dropdown controls and reduced-motion styling are retained. On narrower layouts, Styling overlays the editor rather than compressing both panels into unusable columns.

Before implementation, the user was told that Play, Audio, Publish, draft-version menus and World theme controls would be omitted because these are outside the current Book-writing scope. No global background picker, publishing claims, fake save indicators or unsupported actions were introduced. Backend persistence remains deferred under the previously confirmed visual-only scope.

Verification: browser review at 1280 × 720 checked real writing, paragraph alignment, font/size/line-spacing/width selections, Page view, focus view and return to Styling, header-image upload/removal and chapter switching with retained text/alignment/artwork. Computed editor styles confirmed 18 px Sans with 32.4 px line height after selection. No browser console errors were reported. Responsive rules were inspected; a separate mobile browser run was not performed. Website type checking, lint, all 92 existing tests and the production build pass. Screenshot: `.tmp/author-desk-qa/book-writing-styling.png`. QA titles and prose are entered only in the browser, never seeded into the product.

## Advanced fonts and book design — 19 October 2026

The user requested additional fonts, uploads, device fonts and practical Word/InDesign-style book controls, authorizing libraries. This pass builds on the existing Tiptap editor and shared language-style dropdown. It does not introduce a separate canvas engine or change the confirmed session-only book storage.

Typography now includes bundled Lora, Inter, Space Grotesk and Caveat plus Fontsource variable Source Serif 4, Literata and Noto Naskh Arabic. Familiar platform families remain available with browser fallbacks. WOFF2/WOFF/TTF/OTF upload validates a 10 MB size limit and decodes through FontFace before registering. Device-font discovery uses queryLocalFonts only on an explicit click; access is controlled by the browser. Unsupported, denied, timed-out and invalid-font cases have visible messages. Loaded font data remains local to this page session and can be embedded in the typeset document.

Book design is stored on each in-memory book, independently of chapter text and workspace toggles. Its inspector groups typography, paper/margins, paragraphs and book layout. Controls include document font, point sizes, line/letter spacing, language and LTR/RTL direction; six physical book/paper sizes and landscape orientation; page zoom, ivory/white paper, top/bottom/inside/outside margins and binding gutter; paragraph spacing, first-line indent, optional opening drop cap and browser hyphenation; running headers, page numbers, right-hand chapter starts, title page and generated contents. Writing page view is continuous for editing; Book view is actually paginated.

Official Tiptap TextStyleKit, Highlight, TableKit, Image, Subscript and Superscript extensions provide selection formatting, ink/highlight, editable resizable tables and images. Insert/Table exposes only actionable operations; table-dependent actions disable outside a table. A small atomic page-break node carries forced breaks into output. The existing manuscript remains mounted while switching to Book view, retaining current undo history.

Paged.js 0.4.3 provides client-side book pagination, mirrored margins, generated running chapter strings, folios, chapter breaks and contents target page counters. Its locally served minified build retains the MIT license under public/vendor/pagedjs; a regression check compares it with the installed dependency. Output runs in a sandboxed iframe without same-origin access. DOMPurify sanitizes manuscript HTML, titles are escaped, uploaded image data is checked, fonts are embedded as data, and print/zoom messages require the correct frame and a per-generation token. Print / PDF calls the browser print dialog with physical page dimensions. Browser print settings and PDF destination remain user controlled; no PDF file was saved during QA. This is not a CMYK/PDF-X prepress pipeline.

Browser QA at 1280 × 720 verified font-file upload and selection, computed Source Serif 4 body styling at 12 pt, live paper view and 75% zoom, a 3 × 3 table with nine editable cells, image insertion with two library resize handles, chapter text retained when returning from Book view, two real manuscript pages, separate title/contents pages and a generated contents reference to chapter page 3. Permission-granted device enumeration could not be completed in the automated in-app browser; the permission request was exercised, and the implementation includes timeout/failure recovery. No console errors appeared during page generation. A separate mobile browser and native print/save run were not performed.

New tests cover physical page dimensions/orientation, unknown-preset fallback, safe CSS font quoting and the served pagination library's integrity. All 96 tests, type checking, lint and optimized build pass. Screenshots: .tmp/author-desk-qa/book-typeset-pages.png and .tmp/author-desk-qa/book-advanced-design.png. Browser test content/artwork is not seeded into the product.

References: [Tiptap TextStyle](https://tiptap.dev/docs/editor/extensions/marks/text-style), [TableKit](https://tiptap.dev/docs/editor/extensions/functionality/table-kit), [Image resizing](https://tiptap.dev/docs/editor/extensions/nodes/image), [Paged.js](https://pagedjs.org/en/documentation/4-how-paged.js-works/), [Local Font Access](https://developer.chrome.com/docs/capabilities/web-apis/local-fonts).

### Interactive 3D cover and creation refinement

The next request explicitly asked for a different book design, freely rotatable 3D, shared login inputs, a right-aligned creation action and easier artwork management. Three.js (already installed) now renders a real rounded book with separate cover boards, page block and spine. Official OrbitControls provides drag/touch orbiting and zoom; quick Front/Spine/Back actions, reset and zoom buttons supplement keyboard arrow/+/-/Home controls. Rendering runs on demand, pixel ratio is capped, resources are disposed, and unsupported/lost WebGL shows a usable flat artwork fallback. The viewer is loaded only in the browser through a dynamic import.

The reference's navy title-only cover is replaced by an original jade arched composition. Alternative Editorial and Orbit layouts, five colors, linen/matte finishes and three thicknesses update the 3D object. Front/back/spine uploads map to separate surfaces, and custom artwork replaces generated lettering on that surface. Cover appearance is included in the in-memory created book.

Artwork now uses explicit Front/Back/Spine selectors with Added/Optional status and one large drop/browse target for the selected side. Uploaded images show a thumbnail with Replace and Remove actions; all sides remain optional and retain the existing file validation. The Create Book action aligns to the right of its form.

A reusable FormInput wraps the existing native TextInput with the exact login form-input CSS. Email sign-in and the active Studio now consume it for title/subtitle, chapter title, search and numeric document settings; compact document-title/search layouts retain their necessary sizing. File pickers remain hidden native inputs.

Type checking, lint, 96 existing tests and optimized build pass. Browser visual/interaction QA for this particular refinement could not run: the browser tool reported that local browser use is disabled in Work settings. Earlier screenshots document earlier versions and must not be presented as the new 3D result. No new screenshot was generated. Browser drag/touch/WebGL rendering remain unverified in this environment.

Implementation reference: [Three.js OrbitControls](https://threejs.org/docs/pages/OrbitControls.html), [RoundedBoxGeometry](https://threejs.org/docs/pages/RoundedBoxGeometry.html), [CanvasTexture](https://threejs.org/docs/pages/CanvasTexture.html).

## Studio light mode — 21 October 2026

Added a Studio-only light appearance that retains the existing nested shell, atmospheric artwork, translucent surfaces, spacing, rounding and restrained hover states. The palette uses pale sage/blue-grey surfaces and dark blue-grey ink. The current dark appearance remains the default. The top-bar Light mode switch remembers only the theme preference under rawan:studio:theme, with safe storage failure handling and cross-tab preference updates. Book data and uploaded assets remain session-only.

The theme covers the outer rail, tabs, sidebar, home launcher, creation metadata and artwork, 3D-viewer UI, book/chapter navigation, manuscript tools and prose, Book design inspector, shared inputs, native popovers and Help. The shared dropdown receives theme context explicitly on its portal content, keeping menus consistent without changing login/onboarding/reader styling. Typeset book paper, ink and artwork remain document-controlled; only the Book view desk background follows Studio appearance.

Switching uses the browser View Transition API where available, with reduced-motion handling and ordinary state updates otherwise. Shared inputs also transition colors in supported motion settings. Existing sidebar/layout animations remain in place. The theme toggle stays visible when compact breakpoints hide the time and other utilities.

Browser QA at 1280 × 720 verified dark/light switching, book creation and 3D display in light mode, portaled dropdown contrast and selection surface, manuscript entry with the Book design panel, Help appearance, retained manuscript text across theme switches, and preference restoration in a new Studio tab. Compact layout CSS was reviewed; a separate mobile browser session was not run. Screenshot: .tmp/author-desk-qa/studio-light-writing.png. Test manuscript content is entered only in the browser, not seeded into the product.
Verification for this refinement: all 96 tests, type checking, lint and optimized production build pass.

### Light-theme interaction audit — 21 October 2026

Reviewed the active Studio shell and its creation, writing, design, Book view and Help surfaces. Fixed the collapsed-sidebar expand control's dark hover, fixed-background actions that suppressed light hover feedback, and selected/hover/focus states on navigation, book/chapter rows, cover-view buttons, artwork controls and shared dropdowns. Disabled actions retain a quiet readable treatment. Shared inputs now include light hover, disabled, invalid and browser-autofill treatments. Changes remain scoped to Studio light mode.

Extended the light palette to editor table headers/borders, selected cells, column and image resize handles, page breaks, focus outlines and caret/selection colors. Book view's iframe placeholder and loading/error overlay now use light surfaces; the generated paper and the author's artwork retain their chosen colors. Help links and close actions, design-section headings/toggles, font actions, and the 3D viewer controls receive consistent light interaction feedback. Color transitions respect reduced motion and retain the existing sidebar motion.

Browser QA at 1280 × 720 checked the expanded outer rail, collapsed/expanded book sidebar, the collapsed control's actual pointer-hover computed colors, New Document popup, required-title disabled/enabled creation action, artwork side controls, shared dropdown selection and disabled table actions, manuscript entry and pressed formatting, inserted table, Book design inspector, paginated Book view and Help. Keyboard focus remained visible; a fresh Studio tab restored light mode and reported no console errors. During CSS editing, the older test tab logged a development hot-reload chunk error; it did not recur on the clean load. Responsive rules were reviewed without a separate mobile-device run. Screenshot: `.tmp/author-desk-qa/studio-light-audit.png`.

Verification: all 96 existing tests, type checking, lint and production build pass. QA text and book remain temporary browser-session content. No backend or document-persistence scope changes.

## Shared Studio tooltips — 21 October 2026

Added a reusable custom Tooltip, StudioButton and StudioLink on Radix Tooltip primitives, with one provider for the active Studio. As-child composition retains native button/link elements, caller refs, CSS relationships, form submit intent and existing actions. Native title attributes become custom tooltips rather than appearing as a second browser tooltip. Accessible names remain on icon controls, with Radix managing the tooltip's described-by association. Obvious text fields and tutorial rows retain their visible labels/descriptions rather than acquiring redundant hints.

Coverage includes the outer navigation, home/tabs, collapsed/expanded sidebar controls, full titles on book/chapter rows, creation and artwork actions, cover swatches and 3D viewer tools, manuscript formatting/alignment, shared Studio dropdowns, font actions, book-design switches, Book view/print controls and Help/support icons. Shared dropdowns outside Studio retain their existing behavior. Tooltips carry the current theme explicitly through portals, including when rendered within native popover/dialog top layers.

The custom appearance uses compact rounded translucent navy or pale sage surfaces, matching ink, subtle borders/shadows and an arrow. Viewport collision padding, available-width constraints and a smaller-screen width cap keep hints readable near edges. Hover opens after 450 ms; keyboard focus opens immediately. Escape dismisses the tooltip without closing its parent popup. Touch pointer events retain normal click behavior; no essential instruction relies on hover. Motion respects reduced-motion settings and closed hints unmount without an exit animation that could overlap the next hint.

Browser QA verified pointer hover (including the disabled title-required Create Book action), keyboard focus and described-by links, removed native titles, Escape while Help remained open, Help's top-layer placement, dropdown opening without a lingering hint, book/chapter creation and formatting actions. Verified both palettes at 1280 × 720 and narrow placement at 390 × 844; restored the viewport and the original light preference. No console errors occurred. Physical touch hardware and assistive-technology speech were not tested. Screenshots: `.tmp/author-desk-qa/studio-tooltip-light.png` and `.tmp/author-desk-qa/studio-tooltip-dark.png`. All 96 existing tests, type checking, lint and optimized production build pass.

Implementation reference: [Radix Tooltip](https://www.radix-ui.com/primitives/docs/components/tooltip).

### Ink-blue palette and light scene treatment — 21 October 2026

The user refined light mode to use ink blue instead of jade UI accents, then clarified that the background should be a light version of the same scene (or a suitable light image), rather than the dark-mode rendering. The final implementation reuses the server-selected seasonal image with light-specific overlay variables, increased brightness, softened saturation/contrast and a pale blue veil. The scene remains more visible than the earlier heavily faded light background. Dark mode retains its existing image masking, blur and colors; seasonal scene selection remains automatic.

Recolored light-only shell, selection/hover/focus/disabled states, dropdown portals, shared inputs, artwork controls, editor/inspector, table handles, Help and tooltips into pale blue-grey surfaces and ink-blue detail. Document paper, warning colors and the book's chosen cover/artwork retain their meaning and chosen colors. No temporary dark-background styling or additional creation form panel remains in the final result.

Browser review at 1280 × 720 checked the scene, outer navigation, creation form and dropdown selection, and Help contrast. Light mode still uses the same autumn-morning asset selected for dark mode, with different light rendering. Screenshot: `.tmp/author-desk-qa/studio-light-ink-blue.png`. Type checking, lint, all 96 existing tests and optimized build pass. No backend/storage changes.

## Writing ribbon and live paper preview — 21 October 2026

The user requested a Word-style top ribbon using Rawan's own tools, then refined the scope to continuous writing with an optional paper preview at the right and removal of the old Book design sidebar. The final editor retains the existing Studio shell and both themes. A quick-access row contains undo/redo, title and view actions. Home, Insert, Design, Layout, View and Help tabs show grouped commands with captions, a heading-style gallery, shared dropdowns and tooltips. Tabs support arrow/Home/End navigation, and the ribbon can collapse. Groups scroll horizontally in constrained space.

All former inspector controls now live in Design and Layout: document fonts, uploads/device access, body/line/letter spacing, paragraph gap/indent, drop caps, hyphenation, language/direction, writing width, trim/orientation/paper, every margin and binding gutter, title/contents pages, running heads, folios and chapter-start policy. The old BookDesignPanel component and its opening actions are removed. Help instructions now describe the ribbon. Header-image insertion moves to Insert so an unused upload area does not interrupt an empty manuscript.

The writing area has no physical-paper framing. The toggleable right preview reuses the installed Paged.js engine and sandboxed print iframe, regenerating after a 500 ms pause in edits rather than estimating pages from word counts. It uses actual fonts, paper dimensions, margins and explicit breaks across the entire book. The footer reports total Book pages, including when preview is hidden. The preview header reports its own visible page and total; previous/next actions and scroll position messages update it. Fit-width zoom, optional fixed zoom and print/PDF remain available. Page position in the preview is not presented as a cursor location in the continuous editor.

Insert Page and Ctrl/Command+Enter add a real manuscript break node. Automatic overflow generates additional pages. A zero-height break marker forces the following block onto a new page, with an empty paragraph preserving a deliberate blank page. During QA, combining both break-after on the marker and break-before on its successor produced an extra blank page; the final rule applies only the successor break. The iframe bridge retains source-window and per-generation token checks, with bounded page/zoom values. Light frames start with the correct theme instead of flashing a dark desk. Hidden pagination remains rendered but inaccessible/noninteractive so browser visibility throttling does not prevent counting.

Desktop browser QA at 1280 × 720 verified book/chapter creation, continuous text editing, ribbon tab keyboard navigation, migrated Design/Layout controls, preview show/hide, live text updates, seven naturally overflowing pages, exactly three pages for two explicit breaks, the keyboard break shortcut, and page 2 of 3 after preview navigation. Both light and dark appearances were inspected. Earlier development pagination attempts logged Paged.js repeated-layout diagnostics; the final short-document layout and navigation produced the expected totals. Physical touch, speech output, a separate mobile run and native print/PDF saving were not exercised. Screenshots: `.tmp/author-desk-qa/studio-ribbon-preview-light.png` and `.tmp/author-desk-qa/studio-ribbon-preview-dark.png`.

All 96 existing tests, type checking, lint and production build pass. Book data remains session-only as previously requested; no backend contracts or storage scope changed. The browser pagination engine provides actual Rawan page layout, not a promise of identical Microsoft Word pagination.

## Fitted right preview and independent paper colors — 21 October 2026

The user clarified that preview stays on the right, then requested that an entire page fit the preview viewport without overflow. This supersedes the earlier fit-width behavior: the right child panel now uses width-and-height fitting with the physical book aspect ratio preserved. One page is visible at a time, centered with a quiet gutter; page arrows navigate the full book. Other pages retain layout/counters but stay offscreen and inaccessible. Printing restores every page to normal document flow. The editor remains available beside preview, and show/hide preserves writing state. Panel sizing and frame swaps use restrained transitions and respect reduced motion.

Layout → Paper appearance adds a native custom print-color picker and the shared dropdown for Follow theme / Use print color. Default paper follows the Studio theme (white in light, navy in dark) with readable ink. Print color defaults to white and remains separate from theme changes. Use print color displays the actual chosen color in either theme. Print-only overrides are injected after Paged.js pagination, because its print-CSS processing otherwise applied print colors to the screen. Browser print preferences and printer capabilities still govern physical background output; native printing/PDF saving was not exercised.

Removed the fixed preview debounce. New pagination starts on each edit, with cached embedded font data and two sandboxed iframe buffers retaining the previous complete page until the next layout is ready. Source/token checks remain. This removes an intentional wait, not browser layout time. Screen theme is reapplied when a buffer becomes active. No backend/storage changes.

Browser QA at 1280 × 720 verified right-side placement, editing while preview remains open, show/hide with text retained, immediate generation updates, custom cream print color, dark theme-following paper with light ink, white light-theme paper, and exactly two pages after one manual break. Page 2 retains its correct printed folio, and navigation restores page 1. The visible page measured 336 × 504 within a 430 × 540 preview viewport, with an 18 px vertical gutter and no scroll-height overflow. Screenshot: `.tmp/author-desk-qa/studio-fitted-paper-preview.png`. Type checking, lint, all 99 tests and optimized production build pass. Separate mobile and physical printing checks remain unperformed.

## Immediate manuscript reflection — 21 October 2026

The user asked that typing reflect immediately, rather than waiting for complete pagination. The fixed debounce was already gone, but replacing a sandboxed document still waited on font loading and Paged.js. The right-hand preview now has an additional authenticated live-update message sent during React's layout effect. It applies sanitized source blocks, chapter titles and header images directly to the current rendered document; complete pagination continues in the background. Text changes within split paragraphs map UTF-16 offsets across page fragments, including insertions/deletions, and inline prose formatting is carried across those fragments when their text mapping matches. Unsupported complex fragment layouts fall back to the complete pagination rather than guessing at a mismatched mapping. Printing stays unavailable until accurate pagination completes.

The fast view and final typeset document share the same sanitized chapter snapshot. Source-window and generation-token checks apply to live messages too. Serialized snapshots escape HTML delimiters before inclusion in the sandbox script. The editor and its undo state are unchanged; no backend/storage changes or dependencies added.

Browser QA verified character-by-character writing, a single appended character appearing while the active iframe source remained unchanged, deletion within a multi-page paragraph before replacement layout, chapter-title changes, and formatting changes across paginated prose. A 630-word paragraph exercised later-page edits and final pagination. Screenshot: `.tmp/author-desk-qa/studio-immediate-typing-preview.png`. Added eight focused text-mapping tests for insertion, deletion, replacement, empty content, unchanged text, and Arabic/emoji UTF-16 offsets. All 107 tests, type checking, lint and optimized build pass. Content reflection no longer waits for the complete book rebuild; pagination, page count, overflow redistribution and complex layout changes still require browser layout time. No claim of literally zero rendering milliseconds or identical pagination to Word.

## Neighboring writing and preview panels — 21 October 2026

The user requested moving preview outside the writing card and retaining one open/close control. BookWorkspace now owns preview visibility and pagination status. Its layout contains two sibling panels: the existing writing section, with its own breadcrumb/ribbon/editor/footer, and the independent preview aside. A 10 px scene-visible gutter separates their rounded borders. Preview retains the existing width share, full-page fitting, theme behavior, live-update bridge and pagination. The single Preview toggle remains in the editor's top quick-access row with an expanded state and controlled-panel association. Duplicate toggles in the footer, View ribbon and preview header are removed; print/PDF and page navigation remain separate actions.

Show/hide animates the neighboring panel's width and gutter while preserving the mounted editor and preview. Narrow layouts stack the siblings instead of overlaying writing. Reduced-motion preferences disable these transitions. Full Book view still temporarily hides the side preview and restores its previous visibility when returning to writing. Zoom's automatic option is now correctly named Fit page.

Browser QA confirmed that the preview is not a descendant of the writing section, shares its parent, and has the expected 10 px gap. Checked creation, live text reflection, hide/show with content retained, the View ribbon without a duplicate toggle, and both themes from a clean session at 1280 × 720. Screenshots: `.tmp/author-desk-qa/studio-neighbor-preview-light.png` and `.tmp/author-desk-qa/studio-neighbor-preview-dark.png`. All 107 tests, type checking, lint and optimized build pass. Mobile stacking was reviewed in CSS but not separately exercised in this pass. No backend/storage or unrelated shell changes.

## Matching preview surface — 21 October 2026

The preview panel now shares the writing panel's surface and border variables, including the same 28 px backdrop blur. Light uses the existing pale ink-blue surface; dark uses the existing translucent navy. The preview iframe's surrounding desk is transparent in side-preview mode, so its previously opaque blue background cannot cover the shared surface. Paper appearance and print color remain independent; the full Book view retains its own desk background.

Browser QA confirmed identical computed writing/preview background and border colors in light mode, identical backgrounds in dark mode, transparent iframe HTML/body around the paper, white light paper and theme-following dark paper. Screenshot: `.tmp/author-desk-qa/studio-matching-preview-surface.png`. Type checking, lint and optimized build pass. This is an appearance-only refinement with no data or navigation changes.

## Theme-aware preparation state — 21 October 2026

The user reported a white preview area behind Preparing your book in dark mode. The initial active iframe had an empty about:srcdoc document before its generated theme was ready. Preview frames now remain visually hidden and inaccessible until the first successful pagination; completed pages remain visible during subsequent repagination. A navy preparation/error status surface complements the existing light treatment. Iframe color-scheme overrides were removed to retain transparent surroundings after loading. The surrounding panel is still the shared Studio surface and paper/print preferences remain unchanged.

Browser QA verified normal dark preview rendering and captured the actual Preparing your book state by opening full Book view with a longer manuscript. The loading area remained navy with readable status text and no white iframe. Screenshot: `.tmp/author-desk-qa/studio-dark-preparing-preview.png`. Type checking, lint and optimized build pass. No timing simulation, backend or persistence changes.

## Explicit dark preview canvas — 21 October 2026

The user's screenshot showed the paper itself correctly dark but its surrounding embedded-document canvas still white. This supersedes the earlier transparent-desk approach: side-preview HTML/body and the iframe/container fallback now use explicit matching navy in dark mode and pale blue-grey in light mode. Background values are applied initially and on theme messages. Paper and print colors remain separately controlled.

Browser QA verified the loaded dark iframe HTML and body both compute to rgb(13, 34, 54), with the paper at rgb(24, 43, 61); the screenshot confirms no white gutter. Screenshot: `.tmp/author-desk-qa/studio-dark-preview-canvas.png`. Type checking, lint and optimized build pass. No content, persistence or pagination changes.

## Forward and reverse theme motion — 21 October 2026

The user requested a smooth theme-change effect, then explicitly requested its reverse. Studio now uses a 720 ms native View Transition circular reveal anchored at the theme button center. Light expands outward from the button; returning to dark contracts the outgoing light snapshot back toward it. The sun/moon icon enters with a small opposing rotation/scale motion. Keyboard activation uses the same button-center origin. Root snapshot layers have explicit stacking and isolation, avoiding a blank corner during the reveal; the existing Studio composition and palette remain intact.

Theme updates synchronously preserve React/editor state and the saved preference. A generation guard skips superseded transitions, handles cross-tab preference changes, and cleans up on completion/unmount. Reduced motion and browsers without View Transitions apply the theme directly. Failed/skipped native animations retain the requested theme. Snapshot-specific rules are active only while Studio theme motion is running; they suppress partially transitioned control palettes during capture, without changing motion on unrelated routes. Native document snapshot capture can briefly suspend interactions; the animation is intentionally short.

The sandboxed book preview acknowledges a theme message before the new snapshot is captured, bounded at 120 ms if a frame cannot reply. Message source, token and theme are checked. This coordinates paper/desk colors without repaginating or changing text or print colors. No animation library or additional dependency was needed.

Browser QA captured outward and contracting reveals, verified the animated circular clip and reversed snapshot stacking, exercised keyboard activation, and checked that manuscript text remains intact. A clean-session loaded preview changed to white paper / pale desk with the light reveal, with the same book and page count. Screenshots: `.tmp/author-desk-qa/studio-theme-forward.png` and `.tmp/author-desk-qa/studio-theme-reverse.png`. Reduced-motion/unsupported-browser branches were reviewed in code but not separately emulated. Type checking, lint, all 107 existing tests and optimized build pass.

Implementation reference: [MDN — ViewTransition.ready and circular reveal](https://developer.mozilla.org/en-US/docs/Web/API/ViewTransition/ready).

## Softer motion in both directions — 21 October 2026

At the user's request, the reveal and its reverse now share a slower 1050 ms symmetric ease-in-out curve, cubic-bezier(.45,0,.55,1), replacing the earlier fast-start 720 ms timing. Both ends gently accelerate/decelerate, and reversed clip paths follow the same timing profile. The opposing sun/moon entrance uses a matching curve over 620 ms. Existing preview synchronization, cleanup, reduced-motion behavior and browser fallback are retained.

Browser QA checked the contracting dark reveal and expanding light reveal at the original button origin, and confirmed theme completion. Screenshots: `.tmp/author-desk-qa/studio-theme-smooth-reverse.png` and `.tmp/author-desk-qa/studio-theme-smooth-forward.png`. Type checking, lint and optimized build pass. No layout, palette, content or persistence changes.

## Simplified theme transitions and repeated-toggle fix — 21 October 2026

The user reported a black screen on a subsequent light-mode switch and explicitly requested simple, smooth motion in both directions. This supersedes the circular-reveal entries: all Studio View Transition snapshots, animated clip paths, direction-dependent layers, async capture coordination and related message acknowledgments have been removed. The theme hook now directly updates React state and the saved preference, with a current-value ref to handle consecutive clicks. Cross-tab synchronization remains.

Theme motion is now 320 ms ease-in-out color/filter/opacity transitions on actual Studio surfaces and controls. Registered sidebar gradient colors interpolate without a snapshot overlay; the scene's light veil fades through a simple existing background layer. The sun/moon change uses only a small 260 ms fade/scale. Paper and desk colors transition inside the iframe using the existing theme message. Sidebar geometry transitions and the separate paper print color remain intact. Reduced motion disables these effects using the existing media preference rules.

Browser QA clicked the switch six consecutive times and observed false/true/false/true/false/true checked states, ending in light mode with the Studio visible and no transition overlay attribute. This directly covers repeated light-mode activation. Screenshot: `.tmp/author-desk-qa/studio-simple-theme-light.png`. Type checking, lint and optimized build pass. No backend/storage scope, manuscript or layout changes.

## Circular reveal restored with simpler lifecycle — 21 October 2026

The user clarified that they wanted the original circular reveal and reverse, rather than only color fades. Studio now uses native View Transitions with a single CSS-owned 900 ms ease-in-out clip animation per switch. Light expands the incoming snapshot; dark contracts the outgoing light snapshot. There are no JavaScript-created persistent Web Animation effects and no async acknowledgment registry. Root origin/radius variables and the reveal marker are removed on completion, storage synchronization and unmount.

A version guard prevents older update callbacks from overriding newer intent. An interrupted transition is skipped and the latest theme applied directly; this avoids capturing a partly clipped screen as the next old snapshot. Reduced motion and unsupported APIs retain the direct theme update with existing fallback styles. The sandbox receives an instant-palette flag during a native reveal so its normal color fades do not conflict with the snapshot. One zero-delay event-loop yield gives that message a chance to arrive before capture. No library added and no manuscript, print-color or layout changes.

Browser regression QA completed six full alternating cycles, observing studio-theme-close/open in the expected order, ending in light mode with no residual marker or origin styles. The sixth reveal screenshot retained the actual outgoing UI instead of a black canvas: `.tmp/author-desk-qa/studio-css-reveal-repeated.png`. A click followed by keyboard activation during an active transition returned safely to light mode with no reveal marker. Type checking, lint, all 107 tests and optimized build pass. Other browser engines and reduced-motion emulation were not separately exercised in this pass.
