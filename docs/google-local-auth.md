# Google authentication on localhost

The original glass-style button opens Google's hosted sign-in page in a browser popup. If popups are blocked or unsupported, sign-in automatically continues in the current tab. The login design has no Google SDK button or extra fallback link.

## Existing Google configuration

Use the existing **Web application** OAuth client with the same `GOOGLE_CLIENT_ID` in the website and API. Keep the authorized redirect URI `http://localhost:3000/auth/google/callback`. Open `http://localhost:3000/login`; loopback-IP login URLs redirect to this canonical origin.

The authorized JavaScript origin `http://localhost:3000`, added while evaluating the GIS button, can remain. The final hosted OAuth flow does not depend on GIS origin checks. If the Google project restricts access to test users, add the account used for testing.

- Website ignored `.env.local`: existing `GOOGLE_CLIENT_ID`, server-only `GOOGLE_CLIENT_SECRET`, `AUTH_ORIGIN=http://localhost:3000`, `RAWAN_API_URL=http://127.0.0.1:3002/api/v1`.
- API ignored `.env.local`: matching `GOOGLE_CLIENT_ID` and existing database/JWT settings.
- Restart the website after credential changes. No new credentials are needed for the button restoration.
- Run the local API, website and database. Sign-in creates or loads the account using the verified Google subject.

Successful sign-in continues through `/account` to onboarding or the saved `/studio` or `/reader` experience. Explicit safe destinations survive both popup and same-tab authentication. See [experience routing](experience-routing.md).

## Browser compatibility

The button opens `/auth/google` directly from the user click rather than first creating a blank window and then navigating it. Blocked or unsupported popups automatically use ordinary OAuth in the current tab. Mobile browsers may choose a tab or full-screen window.

Secure random attempt IDs work on browsers without `crypto.randomUUID` using `getRandomValues`. Result requests use AbortController with timers, without newer AbortSignal.any/timeout dependencies. Temporary connection failures do not discard the pending sign-in. Cancel stops the checks and releases the pending state. Completion does not depend on opener messages or `window.closed`, which can change under provider isolation.

The app is still configured for localhost. Testing from another device requires a deployed HTTPS origin, matching Google redirect configuration and Secure cookies; a phone's localhost refers to the phone itself.

## Identity and session protection

Both paths use authorization code flow with PKCE, random state, nonce and a signed ten-minute HttpOnly transaction cookie. The safe return path is signed into that transaction. The callback exchanges the code server-side; the API verifies Google's signature, issuer, audience, expiration, verified email and expected nonce before issuing a Rawan session.

For popup completion, a short-lived signed HttpOnly result cookie contains success/error and the random attempt identifier. The original page reads only the result for its own attempt from a no-store endpoint. The popup opener is cleared before leaving Rawan. No Google tokens, credentials, client secrets or Rawan JWTs cross windows, enter local storage or appear in redirect URLs. Google access/refresh tokens are not persisted. Failed login writes are not retried and never grant access.

Rawan sessions remain in the existing HttpOnly SameSite=Lax cookie. Session lifetime matches the backend token. Account pages recheck the database user. Logout is an origin-checked POST. The existing JWT architecture has no revocation list; a copied token remains usable until expiry.

Google is never silently linked to an existing password or administrator account by matching email. Conflicts retain the linking message, and login shares the existing rate limits. No backend, role or schema changes were introduced for this update.

## Verification

Website tests cover signed transaction/result integrity, expiry, attempt isolation, safe destinations, older-browser secure IDs and automatic popup fallback. Local HTTP checks verify Google authorization redirects, PKCE/state/nonce, signed cookies, callback failure, tampering and destination preservation. Browser inspection verifies the restored button and the Google-hosted sign-in screen. Full successful consent requires the user's Google account and is not claimed by these checks.

References: [Google server-side OAuth](https://developers.google.com/identity/protocols/oauth2/web-server), [Google ID-token validation](https://developers.google.com/identity/gsi/web/guides/verify-google-id-token), [browser popup behavior](https://developer.mozilla.org/en-US/docs/Web/API/Window/open).
