# Onboarding finalization — Parts 8–10

> Historical phase record: the age declaration was subsequently removed at the user’s request. Existing accounts now bypass setup; new accounts finish without age confirmation. See the [current guide](onboarding-guide.md).

## Scope and baseline

Continue the existing Parts 1–7; preserve authentication, schema, roles, existing data and blank application shells. The named Quiet Literary Studio skill was searched in the repository and installed Codex skill/plugin locations and is absent. Use `docs/frontend-design-reference.md` and current Rawan Lora/Inter typography, navy palette and native components as the available design authority. No dashboards, new product experiences or unsupported languages.

## Ordered implementation plan

8. Preserve the five-step structure and declaration-only legacy flow. Improve focus/error associations and announcements, tap targets, busy/disabled states, controlled mobile spacing and quiet motion with reduced-motion support. Correct the error-boundary retry callback according to installed Next.js docs. Verify tests/lint/typecheck/build and browser layouts before marking complete.
9. Reuse existing logic, authentication, migration and HTTP regression suites. Fill gaps in save failures, retries, preserved answers and stale-tab/session handling; exercise real browser keyboard/mobile flows and authenticated persistence. Verify all checks before marking complete.
10. Document final architecture, steps, required fields, contracts, rollout, policy limits, preference editing limitations and reproducible local/manual tests. Record actual verification outcomes and known limits. Verify links/format and relevant checks before marking complete.

Baseline verified: 497 root tests; root lint, typecheck and production builds; disposable setup/legacy/email migration tests; 34 local cookie/routing checks. Parts 1–7 are reused.

## Part 8 — completed

Preserved the existing navy/Lora/Inter layout and five-step flow. Added skip link, named forms/fieldsets, progress description, native required radios, field-specific invalid states, focused screen-reader errors, saving announcements, consistent disabled/recovery states, 44px targets and a short opacity transition only when reduced motion is not requested. Updated the installed Next.js error boundary to use `retry`, which refreshes server data as well as resetting the boundary. Corrected a 320px overflow caused by the screen-reader legend inheriting a full-width visible-legend rule.

Passed: 22 website tests, lint, explicit typecheck and production build. Browser checked 320px, 390px and 1280px: no horizontal overflow after the fix; keyboard Tab/Enter name entry, disclosure and Space checkbox selection; error receives focus; all inputs have labels and age starts unchecked. Small-phone interest labels meet 44px height. Reduced-motion coverage at this gate is CSS inspection (existing global disable + feature no-preference media), not an OS-level assistive-technology certification. No RTL language is enabled. Screenshots: `.tmp/onboarding-final-mobile.png`.

## Part 9 — completed

Added ten Node-runner tests for the real save transport, non-JSON 401/409 handling, network/timeouts/5xx privacy, corrected retries, incompatible 200 payloads, state/eligibility consistency, optional skip preservation and Unicode limits. The same response parser is used by server loading and client saves. Failed requests never overwrite the draft/revision or complete setup. Skip ignores unsaved values on the skipped optional step while keeping account-saved answers. Unicode code-point length now matches backend MaxLength behavior; HTML bounds allow surrogate pairs and custom validation enforces 80/120 characters.

Expanded local HTTP coverage to 45 checks: actual Create/Read/Both section visibility, preserved hidden interests, starting preference persistence, final unchecked checkbox, plus previous login/routing/ownership/validation/body/CSRF/idempotency cases. Disposable setup, legacy onboarding and 45 email verification HTTP checks passed again without external delivery. The existing API/backend/worker tests remain passing (375/68/32); website tests now total 32. Combined total: 507. Root lint/typecheck/build passed; latest affected website test/lint/typecheck/build passed after the Unicode fix with no warnings.

Browser: 320/390/1280 widths; keyboard name entry/Continue, native disclosure and Space selection; named inputs, error focus and associated invalid age; actual disabled Saving state and live announcement; Back preserves name/purpose/interests; invalid unsaved optional name Skip succeeds and earlier saved name returns; refresh resumes; explicit age completes to existing workspace. A controlled stop of the test-owned local API displayed the recovery screen; after restoration, Try again re-fetched and recovered the saved final step without sign-in or redirect loops. No real account was changed. Final screenshots are `.tmp/onboarding-final-mobile.png` and `.tmp/onboarding-final-desktop.png`.

## Part 10 — completed

Created `docs/onboarding-guide.md` as the canonical architecture, five-step/conditional flow, required/optional fields, migration/default strategy, API contract, server routing, age-policy/limitations, preference-editing limits, local startup and full manual test guide. Updated the root/website/feature READMEs and design reference to link to it. Earlier phase records are explicitly marked historical.

Final verification: formatting passed for changed onboarding source/tests/new guide and completion record; documentation links resolved. Root lint, typecheck, production build and `pnpm test` all passed across the monorepo. Tests: 375 API + 32 website + 68 backend + 32 worker = **507 passed**. Disposable setup/legacy/email database checks and the expanded **45-check** running-server routing suite passed. Prisma reports the local schema up to date. No additional migration was needed. Synthetic browser/HTTP accounts and throwaway databases were removed; browser viewport override was reset.

Confirmed additional browser coverage: the existing-account page also focuses declaration errors and signs out safely. The new-account flow completed using the refactored real client transport and server-owned dates. Retry was tested against an actual temporary outage of only the test-owned API process, not just a mock; recovery restored the saved final step. No real account was changed.

Known limits: the named Rawan skill is not installed, so the repository design reference remains the available authority. Live external email/Google login and a screen-reader/OS matrix were not exercised; their provider/mail logic is covered by automated tests. The local Redis service emitted existing version/cleanup-schedule warnings (5.0.14.1 versus the documented 6.2+ requirement); Redis background jobs are outside this onboarding change and were not reconfigured. No onboarding check remains failing. Completed preference-edit UI and author/reader product experiences are future work, with no new dashboard or unrelated backend feature introduced.

All Parts 8–10 are complete. Stop here.
