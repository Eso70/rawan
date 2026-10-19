# Consolidation verification and handoff

This records the earlier consolidation baseline. The later user-requested immersive onboarding redesign and its current gates are documented in [immersive onboarding](immersive-onboarding.md); other page guidance remains unchanged.

Date: 18 October 2026. Scope: existing frontend design foundation, practical extraction and documentation. No redesign, deployment, dashboard, asset replacement, legal-text edit, backend behavior change or migration was performed.

## Per-part outcomes

| Part                               | Result                                    | Completed work and actual gate                                                                                                                                                                                                                                                                            |
| ---------------------------------- | ----------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1 — Full audit                     | PASS within available source              | Saved supplied brief/audit before implementation; inventoried routes, native controls, existing shared/feature owners and dependencies. Baseline website 32 tests, lint, types and build passed. Captured desktop/mobile public-page baselines. Named skill unavailable, explicitly recorded.             |
| 2 — Practical extraction           | PASS                                      | Extracted toolkit icon/video, community data/reel and onboarding fields. Retained composed home route, original CSS and cohesive animation/auth state owners. 32 website tests, lint, types and production build passed before shared-control work.                                                       |
| 3 — Native component consolidation | PASS                                      | Seven consumed, typed native primitives adopted by auth, setup and library search. Added seven rendered-contract tests. All 39 website tests, lint, types and production build passed.                                                                                                                    |
| 4 — Token consolidation            | PASS after repair                         | Centralized 92 exact existing values and adopted them in CSS Modules/global styles. An initial generator map collision prevented the token file from being written; the build caught it. Fixed the generator output and reran tests/lint/types/build successfully. No unresolved token reference remains. |
| 5 — Homepage documentation         | PASS                                      | Actual composition, six sections/footer, media/assets, fonts, navigation, animation and responsive behavior documented. 39 website tests, lint, types and build passed.                                                                                                                                   |
| 6 — Auth/setup documentation       | PASS                                      | Added UI trees, fields, state/validation/accessibility and API boundaries; linked canonical guides. 39 website tests, lint, types and build passed.                                                                                                                                                       |
| 7 — Legal pages                    | PASS for existing UI/content preservation | Reused the already shared LegalPage. Both route sources are byte-identical to pre-phase snapshots. Shared CSS values tokenized without rewriting text. 39 website tests, lint, types and build passed. Approved final production policy text remains outside this phase.                                  |
| 8 — Component reference            | PASS                                      | Documented APIs/types/recipes/examples, full owner inventory, token registry and accessibility/responsive rules. Added a token-resolution/consumption regression check. All 40 website tests, lint, types and build passed.                                                                               |
| 9 — Final QA                       | PASS within tested local scope            | Root lint/typecheck/build/test passed: 516 unit tests. Disposable setup/legacy/email suites passed; email suite 81 contract checks. Running Next/Nest suite passed 51 status/value checks plus rendered assertions. Browser checks and preservation evidence below passed.                                |
| 10 — Handoff                       | PASS                                      | Current documentation index/tree, implementation summary, verification, limits and future-development guidance completed. Formatting, documentation/source links, legal preservation and whitespace checks passed. Final website build/type gates passed.                                                 |

## Changes and preserved boundaries

- New `components/ui/controls.ts`: Button, IconButton, TextInput, Checkbox, Radio, Select and FieldError. Native props/events/refs are preserved. Button loading/submit behavior is shared; the established feature CSS still determines exact geometry and variants.
- Extracted `toolkit/toolkit-media.tsx`, `community/community-data.ts`, `community/community-reel.tsx` and `features/onboarding/components/onboarding-fields.tsx` from existing owners. No section order, field ID, media path, copy or save/routing policy was changed.
- Added `styles/tokens.css`; common palette/opacity/family/size/weight/leading/tracking/spacing/radius/duration/border/shadow/layer values now have one consumed definition. One-off illustration colors, motion springs, local variables and breakpoints remain intentionally feature-owned.
- Added native-contract/token tests and this documentation set. Existing legal-page composition was retained because it already removes duplication. Unsupported inventory components and themes were not created.

## Automated evidence

Commands actually run successfully from the repository root:

```powershell
pnpm lint
pnpm typecheck
pnpm build
pnpm test
node apps/api/test/run-setup-validation.mjs

$env:SETUP_LOCAL_HTTP_TEST = 'true'
node apps/api/test/setup-routing-local-smoke.mjs
Remove-Item Env:SETUP_LOCAL_HTTP_TEST
```

Unit totals: **40 website + 376 API + 68 backend + 32 worker = 516 passed**. New website tests check native submit/loading/disabled behavior, accessible icon names, input validation attributes, native selections/options, field error targets and shared token integrity. Root Turbo reused valid cache entries for unchanged packages; tests executed. Each major implementation part also ran direct website test/lint/typecheck/build gates.

The disposable database runner verifies actual setup migration/data preservation, authenticated ownership/validation, partial saves, concurrency and idempotency, legacy onboarding and registration/code verification with a fake local mailbox. Its 81 email-contract checks include complete Create/Read/Both registration → login → setup → completion → next-login journeys. The 51-check running-server suite covers real website cookies/proxy/routing, conditional rendered fields, safe return paths, stale revisions, signed expired tokens, logout and next login. Neither suite sends external email or resets a real account.

## Browser and appearance checks

Baseline/final measurements covered `/`, `/login`, `/terms`, `/privacy` and `/library` at **390 and 1280px**. The sampled geometry, fonts, colors, backgrounds, borders and radii matched except for frame-dependent values: the login typewriter text and initial spring-driven toolkit cards. Inactive cards measured the original **42px** after settling. No sampled public page had horizontal overflow. This is evidence of sampled preservation, not a pixel-perfect visual-regression claim.

The repository has no established deterministic screenshot-diff harness. Baseline snapshots and final computed-style comparison data are saved locally under `.tmp/design-system-baseline/` and `.tmp/design-system-final/comparison.json`. Videos, typed headings and springs were not frozen by changing product behavior. A stable [homepage viewport image](../../.tmp/design-system-final/homepage-proof.jpg) was saved from the browser screenshot surface; it is a local QA artifact, not a public asset. Full-page capture of the narrow setup view produced an unreliable capture artifact; the live viewport was inspected instead and measured a 350px content column within a 390px page, with the intended navy surface and typography. No product styling was changed to compensate for a screenshot-tool artifact.

Actually exercised:

- Homepage toolkit selection changes `aria-pressed`, mounts the original nearby video sources and scrolls to the selected preview. The existing closing CTA redirects signed-out visitors to login through `/workspace`. Shared footer Resources disclosure exposes real homepage/library anchors.
- Library Ctrl+K opens only its mounted native dialog. Search filters to Allegiant, arrow navigation focuses that result, no-match text appears, Escape/close dismiss, body overflow restores and a clicked trigger regains focus. Native modal/disclosure infrastructure was retained.
- Login/signup mode switch, native invalid-email focus/validation, password show/hide action/name, language disclosure Escape/summary focus and real synthetic-account login worked. The API was initially stopped, so the existing temporary-unavailable message appeared; retry worked after starting the local API. No auth product fix was needed.
- Onboarding required-purpose error receives focus. Native Both selection, Novels/Manga checks, optional Other note and native Select worked after extraction. Back/refresh preserved saved selections. **All five steps × 320/390/1280px = 15 layout checks** had no horizontal overflow. Completion reached the existing workspace and revisiting setup bypassed it. The final screen contains no age checkbox. A second synthetic run also exercised skipping optional name/interests/preferences and inspected the live narrow layout.
- Terms/Privacy sources remained byte-identical, their public routes rendered and shared navigation/footer links remained real. Font/color/width checks matched the baseline. No consent, policy text or date was rewritten.

Synthetic browser/HTTP users and throwaway databases/schemas were cleaned up. Browser was signed out and viewport override reset. The local API was left available after testing. No existing account or project was reset.

## Limits and open issues

| Item                                                                | Status and impact                                                                                                                                                                                                                                             |
| ------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Named Rawan Design Skill                                            | BLOCKED: not installed/supplied. Current source and checked-in design reference were used. Exact compliance with the missing skill cannot be certified.                                                                                                       |
| Live external SMTP/Google                                           | Not exercised in this phase. Local integration and provider/mail unit tests passed; real provider callbacks/delivery still need release verification.                                                                                                         |
| Screen readers, OS reduced motion, browser zoom/full browser matrix | Not exercised as a complete matrix. Native keyboard/focus/labels and source reduced-motion rules were checked. No full accessibility certification or universal minimum target-size claim is made.                                                            |
| Light theme/RTL                                                     | No general light theme or RTL interface is implemented. Existing dark presentation and the explicit old light reader shell are preserved. No unsupported toggle/language was advertised.                                                                      |
| Production legal text                                               | Existing pages remain explicitly Preview drafts. No final binding terms/effective policy version was invented; approved production text remains a release requirement.                                                                                        |
| Wider plot regression                                               | Earlier onboarding audit found an intermittent concurrent plot creation 409/201 mismatch; its isolated rerun passed. This unrelated broader suite was not rerun or modified during the frontend design phase. See [that audit](../onboarding-final-audit.md). |
| Redis background jobs                                               | Existing local Redis 5.0.14.1/cleanup-schedule warnings remain; documented environment requires 6.2+. Onboarding persistence checks passed. No unrelated environment change was made.                                                                         |

## Handoff

Use [the index](README.md), [component APIs](components.md) and [tokens](tokens.md) for the next feature. Keep one account and existing auth/setup boundaries; add actual Studio/Reader layouts only in their authorized development phase. Do not copy promotional illustrations into functional controls or assume future preferences/editors already exist. No consolidation-related failing check or confirmed frontend defect remains within the tested scope.
