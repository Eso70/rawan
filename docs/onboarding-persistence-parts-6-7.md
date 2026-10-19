# Onboarding persistence and routing — Parts 6–7

> Historical phase record: the age declaration was subsequently removed at the user’s request. Existing accounts now bypass setup; new accounts finish without age confirmation. See the [current guide](onboarding-guide.md).

> Historical phase record. The current completed implementation, API contract and manual test instructions are in [the onboarding guide](onboarding-guide.md).

Date: 18 October 2026. Baseline Parts 3–5 reverified: 20 tests, lint, explicit typecheck and production build pass. Existing frontend code will be integrated, not rebuilt.

## Confirmed product decisions

The user explicitly requires an unchecked 18+ declaration. All new accounts must complete the required purpose question and declare adult eligibility. Existing accounts keep optional profile questions but must make the age declaration before workspace access. Their data, roles and legacy tutorial preferences remain intact. This is a self-declaration, not age verification. No birthdate, identity document, marketing consent or terms acceptance is collected. Server records first confirmation time and policy version `18-plus-v1`; browser timestamps are never accepted.

## Part 6 implementation plan

Extend `UserOnboarding` additively with versioned setup fields, separate creative/reading preferences, progress/revision and server-owned eligibility/completion timestamps. Keep every legacy field and endpoint intact. Existing rows default `setupRequired=false`; new signup transactions explicitly create required setup rows. Missing setup rows represent pre-rollout accounts and require only eligibility. Use authenticated `/users/me/setup` GET/PATCH in the existing users/onboarding module. Validate partial updates strictly and merge them inside serializable transactions. Reject revision conflicts, preserve first completion/confirmation timestamps and make repeated completion harmless. Shared actual contracts/options live in `packages/types`; no privileged user properties are client writable. Test migrations in isolated schemas before deployment; never reset the user's database.

## Part 7 implementation plan

Use existing cookie/JWT/session handling. `/workspace` decides required setup server-side. Existing accounts get declaration-only onboarding; new/incomplete accounts resume saved state; completed accounts bypass setup. Direct `/onboarding` is authenticated and uses server state. Save progress through a same-origin, bounded authenticated Next handler; remove preview sessionStorage authority. Save failures stay retryable in place; failed state loads show a retry screen, not redirect loops or unrestricted access. Completion goes to a safe existing workspace shell. Validate any return URL against a small existing-route allowlist; no external URLs or nonexistent Studio routes. Keep callbacks/provider verification unchanged and reuse their existing `/workspace` entry.

Review and run tests/lint/typechecks/build after Part 6 before any routing changes. Repeat after Part 7. No dashboards or Parts 8–10 scope.

## Part 6 review and verification

Implemented additive setup fields and constraints, shared option/response contracts, authenticated partial GET/PATCH, revision conflict protection and idempotent completion. Both email verification and Google account creation atomically mark new accounts as requiring setup. Existing rows/missing rows require declaration only. Existing tutorial endpoints and fields are unchanged. OpenAPI export and operation inventory updated.

Passed: 367 API tests, 20 website tests, API/website lint, explicit typechecks, API/database/website production builds, Prisma schema validation. A throwaway local database replayed all migrations with a pre-rollout account and prose; verified preservation, declaration-only completion, new-account purpose/age requirements, ownership isolation, server-owned dates, invalid payload rejection, partial merge/resume, stale and concurrent revisions and repeat completion. Legacy onboarding smoke and all 45 email verification HTTP checks also passed without external delivery. Throwaway database removed. Part 7 started only after this gate passed.

## Part 7 implementation and review

The existing `/workspace` and `/workspace/reader` shells now read setup server-side and route only accounts requiring it to authenticated `/onboarding`. The account route retains its existing workspace redirect. New accounts resume the five-step flow; existing accounts see the declaration alone. Old profiles and legacy tutorial fields remain untouched. The final declaration starts unchecked and never accompanies marketing or agreement consent. Both explicit age and completed required setup are enforced by the Nest JWT access guard on protected product APIs, using current database state rather than JWT/browser claims. Identity/setup/legacy account endpoints remain reachable; their existing role checks remain in place.

Both providers retain their existing verification/cookie behavior and workspace entry point. Normal email and Google-popup sign-in preserve allowlisted existing reader return paths. Provider full-page fallback retains the existing workspace default. Only `/workspace` and `/workspace/reader` are eligible return paths; public Library fragments, unknown routes, external URLs and login/onboarding loops cannot become redirect targets. These existing destinations are unfinished shells; no dashboard or Studio route was created.

The cookie-authenticated `/api/setup` PATCH proxy requires the configured origin and JSON and limits its streaming body to 8 KiB. Identity/roles/timestamps are not writable. The frontend uses shared contracts and saves on Continue/Back, preserves prior answers when optional steps are skipped and resumes the server's last saved step. Local/session storage cannot mark a real account complete. Controls disable during a save; a failed save keeps choices and a retryable error, a conflicting revision requires reload, and expired sessions offer sign-in. Failed setup loads show a retry page. Session lookup failures use an error boundary rather than redirecting repeatedly; actual 401s return to login. All server reads bypass caches.

Age and completion timestamps are one-way server-owned records. Repeated completion returns the existing result. Preferences remain separate from authorization roles and names; a blank preferred name never erases the existing account name. Profile-edit screens after completion are future work. Only English is offered. Public legal drafts were minimally corrected to describe the actual local email/setup flow and the approved declaration/data collection; they remain drafts, and no legal acceptance step was added. Existing visual design is retained, including borderless outer fieldsets; this is not a Part 8 redesign.

## Verification record

- Baseline Parts 3–5: all 20 tests, lint, typecheck and build passed before backend work.
- Part 6 gate: 367 API and 20 website tests; API/website lint/typecheck/build, database build/schema validation; isolated setup migration/HTTP, legacy onboarding and 45 email verification contract checks passed before routing began.
- Part 7: 375 API tests (including eight access-guard cases) and 22 website tests passed. Final root lint, typecheck and build passed across all six packages. Final root tests passed: 375 API + 22 website + 68 backend + 32 worker = 497 tests.
- Disposable database regression: auth/transactions, email verification, manuscript ownership/cascades, works, publishing/reader/creation/graphics (159 HTTP cases), worldbuilding, relationships, timeline, plot, organization, search and media (106 requests) passed. Shared domain fixtures now start with eligible accounts. The hardening fixture was updated for the new declaration and its 16 HTTP pagination cases and five query-plan checks passed on rerun. Existing PostgreSQL concurrent-query deprecation notices were non-fatal. No external email was sent.
- Local cookie-to-Next-to-Nest HTTP suite: final 34 status/value checks passed, including direct protected API denial before declaration and access afterward. new and legacy rendered flows, authentication, direct navigation, refresh/resume, partial progress, CSRF, JSON/body bounds, validation, stale revisions, duplicate completion, returning accounts, expired tokens and safe return targets passed. All synthetic accounts were removed in finally blocks.
- Browser: new email sign-in entered the five-step flow; required purpose blocked empty Continue; saved progress resumed on refresh; a refresh during a pending save produced a safe conflict/reload state; reloading restored the saved next step. Final age started unchecked and blocked completion; explicit confirmation reached the existing workspace. Existing account sign-in displayed only the declaration and allowed safe sign-out. Browser fixtures were removed afterward. Screenshots are in `.tmp/onboarding-declaration.png` and `.tmp/onboarding-existing-account.png`.

## Rollout and remaining scope

Applied only `20261018010000_account_setup` locally after migration tests. No database reset, destructive schema change, user-name change, role reassignment, project deletion or migration of manuscript content. Existing rows/missing rows default to declaration-only setup; signup transactions create required setup. Deploy the additive migration before the updated API, regenerate/build workspace packages, then update the website. `pnpm db:deploy` and `pnpm db:generate` are the existing commands for other environments; this task does not publish or deploy remotely.

Reproduce normal checks with `pnpm lint`, `pnpm typecheck`, `pnpm build`, `pnpm test`. After building, `node apps/api/test/run-setup-validation.mjs` creates/removes a dedicated local throwaway database and runs setup/legacy/email checks; `SETUP_FULL_REGRESSION=true` additionally runs the existing domain regression collection, and `SETUP_HARDENING_ONLY=true` selects only that suite. These runners reject production/non-loopback targets. For tests against the local running website/API, explicitly set `SETUP_LOCAL_HTTP_TEST=true` and run `node apps/api/test/setup-routing-local-smoke.mjs`; it creates/removes only its own synthetic accounts.

Stop at Part 7. Parts 8–10, dashboards and new product experiences remain unimplemented. No real Google account was used during regression verification; provider signature/nonce/account-creation behavior was covered by its automated tests, while browser and HTTP end-to-end checks used synthetic email accounts.

Final result: all required checks passed. Root lint/typecheck/build/test completed successfully (497 tests). The live HTTP suite passed after the development API watcher settled following the builds; transient restart failures were not treated as authentication failures or bypassed. Database schema is up to date. All synthetic browser/HTTP/diagnostic accounts and disposable validation databases were cleaned up. Parts 8–10 remain outside this implementation.
