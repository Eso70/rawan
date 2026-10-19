# Authentication feature

- `components/`: existing login/signup, email verification, Google completion UI and login artwork/CSS. Do not import server session/signing code here.
- `hooks/`: Google OAuth popup orchestration with same-tab fallback; browser code never receives Google tokens or the Rawan JWT.
- `lib/`: existing configuration, signing helpers and error text. `google-auth.ts` uses Node crypto and Google secrets and belongs on the server; `google-popup.ts` is a server signing helper. `login-errors.ts` is safe for client display.
- `server/`: existing session validation and HTTP-handler implementations. Only server route/page code may import these modules. No barrel combines client components with server helpers.

`app/auth/**/route.ts` files are URL adapters with statically declared runtime where needed. `(auth)/login` is the existing login page, `(application)` holds the existing account/workspace routes. Route groups do not alter URLs. Public pages keep their current locations and design.

Signup is a login-page state, not a new `/register` route. Email and Google sign-in default to `/account`, which checks authenticated setup, sends incomplete accounts to `/onboarding`, and redirects completed or legacy accounts to their experience. Saved purpose selects the dashboard: Read opens `/reader`; Create or Both opens `/studio`, with both routes available. Older `preferredStart` values do not override purpose. Setup finishes on preferences with no separate starting-experience question. Explicit allowlisted experience links survive setup. Old `/workspace` and `/workspace/reader` URLs redirect to `/account` and `/reader`; neither renders an empty page. Preferences select navigation, never authorization.

See [the audit and rollout considerations](../../../../../docs/frontend-foundation-parts-1-2.md). Future onboarding owns its steps and services in a separate feature; it must reuse authenticated server identity rather than infer permissions from answers.

## Standard Google sign-in

The original glass button opens Google's hosted OAuth screen directly in a browser popup from the click event. If popups are blocked or unsupported, it automatically continues in the current tab. Both paths use the existing OAuth client, PKCE, state, nonce and signed HttpOnly cookies; the safe return destination is signed into the transaction. No Google script, embedded credential form or restyled Google SDK button is used. Older browsers without `crypto.randomUUID` use secure `getRandomValues` IDs. Result checks use AbortController with a timer rather than newer AbortSignal.any/timeout browser APIs. Only signed results for that exact attempt can complete sign-in, including when Google isolates the opener. Secrets and tokens remain server-side.

Keep the existing callback redirect URI in the Google web client. The JavaScript origin added while testing the GIS button may remain; the final hosted OAuth flow does not depend on GIS origin checks. See [local Google setup](../../../../../docs/google-local-auth.md). This app is still configured for localhost; another device needs a deployed HTTPS origin and matching configuration.

## Account-service recovery

`server/account-request.ts` performs uncached, redirect-rejecting GETs for identity and setup checks. Network/timeout/malformed-response failures and temporary 500/502/503/504 responses get at most one retry, with a 250ms pause and a five-second timeout per attempt. Do not reuse this policy for login, email delivery or setup writes. A 401 still redirects to sign-in; an outage never grants access or clears the cookie. Persistent failures return an unavailable state that account, workspace and onboarding pages render normally, instead of throwing an expected connection failure into Next's development error overlay. The retry link makes a fresh server request.

`/account`, `/reader` and onboarding require the real API at `127.0.0.1:3002` and its database. The independent mock Author Studio remains available at `/studio` without those services. Both dashboard interfaces are intentionally blank for the new design; the old studio shell and reader welcome are not mounted. `test/account-request.test.mjs` covers retries, expiry, denial/rate limiting, invalid responses and a disposable real HTTP connection reset.
