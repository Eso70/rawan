# Frontend consolidation audit and implementation plan

Date: 18 October 2026. Written before implementation. The [supplied brief](brief.md) defines this phase. Preserve all current visuals, assets, routes, copy, auth, onboarding and legal text. No deployment or dashboard work.

## Current findings

- One Next.js application, `apps/website`, uses CSS Modules, four self-hosted fonts and shared global CSS. There is no shared UI package, Storybook, theme switch or installed component kit. Keep reusable components local to the real consumer app.
- `/` is already a 36-line composition of navigation, six named sections and the footer inside ClosingSection. Do not move it merely to imitate a marketing directory. Toolkit contains a meaningful media child; Community contains reel playback and genre data. These can be extracted without changing DOM or playback logic.
- `/login` contains provider choice, email login, signup and verification-code states. There is no `/register` or password recovery route. Feature-owned hooks/server adapters preserve popup correlation, cookies, origin checks and credential validation.
- `/onboarding` has five grouped steps, server-owned account state, required purpose, optional profile preferences and safe existing destinations. Its 581-line controller also renders all fields; extract the field presentation while keeping submission/session/revision logic in its owner. No age declaration exists following the latest user request.
- `/terms` and `/privacy` already use the same `LegalPage`, typography module, navigation and footer. Reuse this correct abstraction; do not rewrite policy children or create another legal shell. Both policies explicitly say Preview draft, with October 2026 display date.
- `/library` has 12 sample covers, BookCard, shared navigation/footer and a route-local native dialog search. Keep native `showModal`, Escape, arrow/Tab navigation and dismissal behavior. No global search is mounted elsewhere.
- `/account`, `/workspace`, `/workspace/reader` are guarded existing shells/redirects; do not build them. `/auth/google/complete` is a popup utility. Other `/auth/*` and `/api/setup` are handlers, not designed pages. Root layout sets English and imports font/reset/Lenis CSS; application and onboarding error boundaries are shared recovery consumers.
- Existing reusable components: BrandMark, LandingScroll, LandingNavigation, SiteFooter, LegalPage, InterestPicker, BookCard, LibrarySearch, LoginHeading, LoginLanguage, LoginScene, SetupUnavailable/SetupError, media/canvas scenes and visibility/navigation hooks.
- Repetition: native action/loading/disabled handling, text controls, error paragraphs, onboarding purpose/start radio rows, font families, white opacity fills, navy backgrounds, focus colors, common spacing/radii/durations. Local CSS Modules intentionally retain distinct marketing/auth/onboarding geometry.
- Large files: onboarding page 581 lines; Community 416; Toolkit 405; Manifesto 367; EmailSignin 322. Size alone does not justify splitting a cohesive animation or authentication state machine.
- Native controls currently used: buttons/links, text/email/password/search/code inputs, checkboxes, radios, selects, details/summary disclosures, dialog and progress indicator. Tooltips are native titles or local copy feedback. There are no product switches, comboboxes, tablists, breadcrumb systems, textarea forms, toast queues, skeleton systems or confirmation dialogs to abstract.
- Complex presentation already uses Motion, Lenis, Three.js and Tabler icons. Keep these installed dependencies; do not introduce another accessibility/animation/UI framework. Decorative content and sample demonstrations must not be documented as working product features.
- Focus, labels, busy states, native semantics and reduced motion already exist. Browser-check the real dialog focus return, library-only shortcut, login language dismissal, auth errors and onboarding preservation after refactoring. Dark presentation is supported; the old reader shell is explicitly light. A full dual theme system does not exist.

## Ordered implementation

1. Save this audit, original request and baseline source/legal hashes; record route/UI inventory and baseline screenshots/measurements.
2. Extract Toolkit media, Community reel/data and onboarding field presentation. Keep original CSS modules, element order, copy, identifiers and behavior. Preserve the composed homepage and existing legal shell.
3. Add only consumed, typed native-control primitives: shared loading Button/IconButton, TextInput, Checkbox, Radio, Select and FieldError. Preserve feature styling through className, event handlers, refs and native attributes. Adopt across actual auth/onboarding/search consumers; keep dialog/disclosure infrastructure in place. Test rendered native contracts and real browser behavior.
4. Centralize observed, exactly matching font/color/spacing/radius/focus/motion values with CSS custom properties. Keep distinct role values, unusual marketing rhythm, literal media-query breakpoints and all asset palettes. No theme or typography redesign.
5. Document the actual homepage tree, content, media, animation and responsive behavior.
6. Document auth/signup and onboarding UI with links to existing canonical workflow/security guides rather than duplicating those specifications.
7. Verify existing shared legal layout and byte-identical policy source; document dates, hierarchy, links, mobile layout and draft status.
8. Publish shared component APIs/examples, feature ownership and accessibility/responsive rules. Do not add unused inventory categories or a preview framework.
9. Run relevant unit/integration/browser checks and root lint/types/build/tests. Compare baseline/final static/computed geometry and screenshots; report dynamic-media limits rather than claiming pixel equality. Keep external providers and wider plot-regression caveats explicit.
10. Finish the documentation index, implementation inventory, verification evidence and next-phase guidance.

## Verification gates

After each implementation part, run website tests, lint, typecheck and production build before proceeding. Documentation-only parts use formatting, source/link verification and the applicable existing build/type gates; final QA runs root checks plus local onboarding/HTTP regressions. Baselines live in ignored `.tmp/design-system-baseline`; persistent outcomes belong in `verification.md`.

The named Rawan Design Skill is absent from the supplied catalog/local repository. The current source and [existing design reference](../frontend-design-reference.md) are the available visual authority. Exact compliance with the absent skill, live SMTP/Google and a full screen-reader/OS matrix cannot be claimed.
