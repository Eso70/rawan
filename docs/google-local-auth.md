# Google authentication on localhost

## Google Cloud configuration

Use an OAuth client of type **Web application**. Register this exact authorized redirect URI:

`http://localhost:3000/auth/google/callback`

If the Google project restricts access to test users, add the Google account used for testing. Open the website at `http://localhost:3000/login`. Google chooses an account and asks for basic profile access. The first successful authorization creates an AUTHOR and author profile; subsequent authorizations use the same Google subject. Success opens `/account`, which checks the session against `/api/v1/users/me`. This is an account confirmation page; a writing workspace is not implemented here.

## Credentials and processes

- `apps/website/.env.local`: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `AUTH_ORIGIN=http://localhost:3000`, `RAWAN_API_URL=http://127.0.0.1:3002/api/v1`.
- `apps/api/.env`: `GOOGLE_CLIENT_ID` plus existing database/JWT configuration.
- Both files are ignored by Git. Templates contain no credentials. Replace the secret shared in chat before use outside local testing.
- Run `pnpm db:deploy` and `pnpm db:generate` after pulling the migration. The migration adds an optional unique Google subject; it does not delete existing users.
- Run `pnpm --filter @rawan/api dev` and `pnpm dev:website` in separate terminals. PostgreSQL and any configured Redis must be available. Restart the website after changing credentials.

## Security and limitations

The website uses authorization code flow with PKCE, cryptographic state, nonce, and a signed ten-minute HTTP-only transaction cookie. The backend verifies Google's token signature, issuer, audience, expiration, verified email, and expected nonce using Google's authentication library. Google credentials are never placed in client JavaScript. Google access/refresh tokens are not persisted. Rawan's JWT is stored in an HTTP-only, SameSite=Lax cookie, never in local storage or a redirect URL. Session lifetime matches the existing backend's seven-day JWT lifetime. The account page rechecks the current database user; logout uses an origin-checked POST and removes browser session cookies. The existing JWT architecture does not maintain a revocation list; a copied token remains usable until expiration. Google login shares the existing login request budget.

Email-only matching does not attach Google to existing password or administrator accounts. Those collisions return a safe account-linking message. A separate authenticated linking flow is required later. Concurrent first sign-ins are guarded by database uniqueness. The provider identifier is not included in public user responses.

The website explicitly permits only the documented localhost origin and loopback API URL. HTTP cookies are intentionally not Secure on local HTTP. Production deployment needs separate configuration, HTTPS/Secure cookies, a reviewed session/revocation policy, and finalized legal/contact details. Existing backend email/password routes remain available for compatibility; the website exposes only Google.

## Verification

`pnpm --filter @rawan/api test` covers the Google service, existing authentication and API contracts. `pnpm --filter @rawan/website test` checks transaction integrity/expiry and local configuration restrictions. Build/lint and live negative-path checks cover routes and cookie behavior. Completing Google consent requires the user's account and the registered callback; simulated unit tests do not establish a successful real Google login.

References: [Google server-side OAuth](https://developers.google.com/identity/protocols/oauth2/web-server), [Google ID token validation](https://developers.google.com/identity/gsi/web/guides/verify-google-id-token).
