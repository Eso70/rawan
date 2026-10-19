# Sign-in recovery and verification — 18 October 2026

The reported generic Google sign-in failure was investigated locally. The website was listening on port 3000, but no authentication API was listening on port 3002. Starting the existing compiled API restored its health endpoint (`status: ok`). PostgreSQL and Redis were already listening. The reason the earlier API process stopped was not established; no account records, credentials or database schema were changed.

Website/API Google client IDs match; required website credentials are present and the configured local origin/API destination match the existing allowlist. No credential values were printed or changed. Browser navigation reached Google's normal “Sign in … to continue to Rawan” page without an OAuth configuration error. A complete real Google account authorization/token exchange was not performed, so universal/live-provider success is not claimed.

## Error handling change

`features/auth/server/google-callback-route.ts` now distinguishes API fetch failures and 5xx responses from Google identity failures. API outages use the existing server/session-unavailable message. `googleApiError` in `features/auth/lib/login-errors.ts` preserves distinct conflict (409), rate-limit (429) and identity-rejection states. State, nonce, PKCE, token validation, cookie protection and existing account-linking policy are unchanged. An email/password account is still never silently attached to Google based on email alone.

## Checks actually run

- Root lint, type checks and production build passed.
- All 526 tests passed: website 50, API 376, backend 68, worker 32. The new regression covers outage/error classification; existing Google tests cover new/returning users, stable subject, invalid signatures/claims, audience, nonce and account-link conflicts.
- Disposable PostgreSQL setup/legacy suites passed. The email suite passed 81 local contract cases, including registration, sign-in, completion and next login for Create/Read/Both, wrong/expired/replayed codes, failures and account preservation. No external email was sent.
- Running-server suite passed 51 status/value checks plus rendered screens for new/existing accounts, cookie authentication, expiry, CSRF, revisions, safe redirects and loop prevention.
- Final local checks confirmed ports 3000/3002 listening and the API healthy.

## Local use

Keep the website and API running together using the existing `pnpm dev` workflow. If Google authorization completes but Rawan reports the server unavailable, check `http://127.0.0.1:3002/api/v1/health` and restart the existing API with `pnpm --filter @rawan/api start:prod` after a build (or its existing dev script). Run one API listener on port 3002. This investigation restored the current API process; it did not add a permanent OS service.

Retry sign-in from `http://localhost:3000/login` with a fresh Google attempt. Live Google account consent/token exchange, provider-side audience/publishing restrictions and real mail delivery remain outside the verified local test scope.
