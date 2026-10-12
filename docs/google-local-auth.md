# Google authentication on localhost

## Google Cloud configuration

Use an OAuth client of type **Web application**. Register this exact authorized redirect URI:

`http://localhost:3000/auth/google/callback`

If the Google project restricts access to test users, add the Google account used for testing. Open the website at `http://localhost:3000/login`. Google chooses an account and asks for basic profile access. The first successful authorization creates an AUTHOR and author profile; subsequent authorizations use the same Google subject. Successful sign-in or sign-up opens `/workspace`, which validates the session and renders an empty page. `/account` redirects there as well. The onboarding questionnaire, experience-based redirects and author dashboard route have been removed. The reader dashboard shell remains separately accessible. Backend account preferences are retained; this website no longer reads or edits them.

## Credentials and processes

- `apps/website/.env.local`: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `AUTH_ORIGIN=http://localhost:3000`, `RAWAN_API_URL=http://127.0.0.1:3002/api/v1`.
- `apps/api/.env.local`: `GOOGLE_CLIENT_ID` plus existing database/JWT configuration.
- Both files are ignored by Git. Templates contain no credentials. Replace the secret shared in chat before use outside local testing.
- Run `pnpm db:deploy` and `pnpm db:generate` after pulling migrations. These add an optional unique Google subject and account-scoped onboarding progress; they do not delete existing users.
- Run `pnpm --filter @rawan/api dev` and `pnpm dev:website` in separate terminals. PostgreSQL and any configured Redis must be available. Restart the website after changing credentials.

## Security and limitations

The Google button requests a centered browser popup and leaves `/login` open. The popup uses the existing registered callback and closes after completing authentication; the original page then opens `/workspace`. The localhost login page is canonical: visiting the login page through `127.0.0.1` redirects to `localhost` so both windows share cookies. Blocked popups produce an inline retry message, and a Cancel control lets the user leave the pending flow. Browsers control popup presentation and may choose a tab/fullscreen view on mobile; Google authentication is never embedded in an iframe.

The signed transaction includes a random popup identifier. Completion sets a five-minute signed HttpOnly outcome cookie with only status/error and that identifier. The original window polls a same-origin, no-store endpoint for its own outcome; it never receives provider tokens or the session JWT in JavaScript. The popup has no `window.opener`, and completion does not depend on cross-window messaging or `window.closed`, which can behave differently under opener isolation policies. The existing direct redirect flow remains available to direct `/auth/google` navigation.

The website uses authorization code flow with PKCE, cryptographic state, nonce, and a signed ten-minute HTTP-only transaction cookie. The backend verifies Google's token signature, issuer, audience, expiration, verified email, and expected nonce using Google's authentication library. Google credentials are never placed in client JavaScript. Google access/refresh tokens are not persisted. Rawan's JWT is stored in an HTTP-only, SameSite=Lax cookie, never in local storage or a redirect URL. Session lifetime matches the existing backend's seven-day JWT lifetime. The account page rechecks the current database user; logout uses an origin-checked POST and removes browser session cookies. The existing JWT architecture does not maintain a revocation list; a copied token remains usable until expiration. Google login shares the existing login request budget.

Email-only matching does not attach Google to existing password or administrator accounts. Those collisions return a safe account-linking message. A separate authenticated linking flow is required later. Concurrent first sign-ins are guarded by database uniqueness. The provider identifier is not included in public user responses.

The website explicitly permits only the documented localhost origin and loopback API URL. HTTP cookies are intentionally not Secure on local HTTP. Production deployment needs separate configuration, HTTPS/Secure cookies, a reviewed session/revocation policy, and finalized legal/contact details. The website now also offers [verified email signup and password login](email-auth.md), using the same session cookie. Email sessions do not require Google credentials; the old unverified registration endpoint is retired.

## Verification

Local credentials are loaded from `apps/website/.env.local` and the matching audience/client ID from `apps/api/.env.local`. The supplied Google Web application JSON lists the exact localhost callback; its client ID/secret were transferred only to ignored local files. The API JWT secret was regenerated for local development. Restart the services and sign in again after this change. Example files remain credential-free templates.

`pnpm --filter @rawan/api test` covers the Google service, existing authentication and API contracts. Five website tests cover transaction/outcome integrity, expiry, attempt isolation, malformed IDs and local restrictions. Website build/type checks/lint passed. Live localhost HTTP checks verified authorization URL PKCE/state/nonce, signed HttpOnly cookies, pending/cancellation outcomes and tampering/mismatched-attempt rejection without requesting Google tokens. Browser inspection was unavailable in this session; full successful Google consent still requires the user's account and is not claimed by these checks.

References: [Google server-side OAuth](https://developers.google.com/identity/protocols/oauth2/web-server), [Google ID token validation](https://developers.google.com/identity/gsi/web/guides/verify-google-id-token), [browser popup behavior](https://developer.mozilla.org/en-US/docs/Web/API/Window/open), [opener isolation](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Cross-Origin-Opener-Policy).
