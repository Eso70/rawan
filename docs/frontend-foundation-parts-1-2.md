# Frontend foundation — Parts 1 and 2

Date: 17 October 2026. Scope: audit and structure only. The complete supplied brief is saved unchanged in [rawan-master-onboarding-prompt.md](rawan-master-onboarding-prompt.md). Parts 3–10 are future requirements, not implemented by this pass.

Follow-up: [Parts 3–5 frontend preview](onboarding-frontend-parts-3-5.md) was implemented on 18 October 2026. The audit below remains the pre-implementation snapshot; `/onboarding` now exists as a standalone preview, with no authentication integration.

## Part 1: verified current state

### Repository and runtime

- pnpm 11.8 workspaces (`apps/*`, `packages/*`), Turbo build graph; Node 24/26. Root scripts delegate build, typecheck, lint and test to workspaces.
- `apps/website` is the only populated frontend: Next 16.3.8 App Router, React 19.3, TypeScript 7, CSS Modules and self-hosted fonts. `apps/app`, `packages/ui` and `packages/utils` contain only `.gitkeep`; do not move the working app there.
- `apps/api`: Nest 12 with JWT, Prisma 7/PostgreSQL, class-validator/class-transformer and Swagger. `apps/worker` and `packages/backend` support background domains; `packages/database` owns schema/migrations/generated Prisma; `packages/types` supplies actual API and password contracts.
- Existing website routes: `/`, `/library`, `/terms`, `/privacy`, `/login`, `/account`, `/workspace`, `/workspace/reader` and `/auth/*`. There is no `/register`, `/onboarding` or `/workspace/author` route. Signup is a mode of `/login`. `/workspace` validates the session then renders nothing; `/workspace/reader` is an existing mostly empty shell, not a completed reader product.

### Authentication and account identity

- Google authorization-code + PKCE/nonce/state transaction runs through Next handlers, then `/api/v1/auth/google`. HMAC-signed transaction/result cookies correlate popup completion. Successful popup polling and non-popup callback both end at `/workspace`.
- `/auth/email` is a same-origin Next handler proxying login, signup request/resend and code verification. It forwards only expected fields, bounds body size, uses timeouts/no-store responses and places the resulting token in an HttpOnly cookie. Email signup creates an account only after verification; direct backend registration is retired.
- Both signup implementations create a `User` plus nested `Author`; Google refuses silently linking to existing email accounts. `AuthResponse` has token/expiry/user but no `isNewUser` marker. Both new and returning users receive the same response shape.
- Session cookie `rawan_session` is HttpOnly, SameSite Lax, scoped to `/`; `secure: false` and exact localhost configuration are deliberate current local-only limitations. `requireSession()` reads it server-side, calls `/users/me` without caching, then redirects missing tokens to login and failures/invalid sessions to the existing session-error login. This pass preserves these behaviors.
- Backend JWT strategy checks that the user still exists and reads their current role from the database. Security roles are `ADMIN`/`AUTHOR`. Onboarding `experience` is a separate preference. Do not add `READER`/`BOTH` security roles or derive permissions from answers.

### Existing onboarding, preferences and constraints

Sources: `apps/api/src/users/{users.controller,onboarding.dto,onboarding.service}.ts`, `packages/database/prisma/schema.prisma`, migrations `20261007010000_user_onboarding` and `20261007020000_account_experience`.

- Existing authenticated `GET/PATCH /api/v1/users/me/onboarding` scope identity from the JWT. GET returns defaults without creating a row. PATCH upserts by unique `userId`, merges supplied values, and retains an existing completion timestamp for repeated sequential completion. No browser-provided user ID or role is exposed by this DTO. Concurrent completion timestamp behavior still needs review for the future workflow.
- `UserOnboarding` stores `experience` (`author/reader/both/explore`), a single legacy `interests` array, `goal`, `completedAt`, `skipped`, tutorial `phase/step/storyType` and example-world draft fields. The sample draft name is NOT the user's preferred name. DTOs bound steps, enums, string lengths and arrays. Global API validation rejects non-whitelisted properties.
- The new brief's version/status, separate create/read interests, preferred name, discovery source, interface language, preferred start and age-policy declaration are NOT implemented by this legacy contract. Do not submit the conceptual new object to the old endpoint.
- `UserPreference` already stores account-scoped JSON with scope/context/revision; the creation API implements GET/POST `/preferences` (under `/api/v1`) with authenticated identity and revision checking. Its existing DTO permits appearance/reader settings (theme, motion, fonts, spacing, accent, focus/comic mode), not arbitrary onboarding answers; extend that whitelist deliberately before adding account settings. Do not duplicate this store speculatively.
- No generic profile-name update route was found in `UsersController`; `User.name` and `Author.displayName` already exist and must not be overwritten with empty onboarding input. There is no website preferences proxy currently, despite historical docs describing one.
- Current login language menu exposes English only. No translated interface, enabled RTL language flow or age declaration timestamp/policy version exists. Current Terms are preview drafts and do not establish an adults-only restriction; no explicit age/terms checkbox is rendered in signup. An 18+ restriction and final consent policy need a product decision before implementing eligibility. No restriction is introduced now.
- No current frontend gate reads onboarding completion after auth. `completedAt`/`skipped` describe legacy setup, not whether a person just registered. A missing row or null completion cannot reliably distinguish older accounts from new users. Do not infer newness from an empty workspace, missing author profile, role or a heuristic age of `createdAt`.

### Reliable new/returning strategy for the future phase

1. Decide a new onboarding version and explicit completion semantics separate from the legacy tutorial. Continue using server-owned identity.
2. At future rollout, preserve legacy answers/completion and deliberately backfill or exempt existing accounts. Record this in a migration/rollout policy; a null legacy row alone must not trap old users.
3. Initialize new-version state transactionally when Google/email creates a genuinely new account, or return a server-owned creation signal from those branches. Persistent per-account status remains the routing authority after refresh and returning login.
4. Completed/exempt accounts bypass setup; an actual in-progress version resumes. Unknown state/network failures need an explicit recovery policy and must not silently grant restricted access. Preserve valid deep links and use existing `/workspace` as the safe destination until real experiences exist.

These are implementation recommendations for later parts, not new fields, routes or behavior added here.

### UI, dependencies and verification inventory

- Shared pieces already include BrandMark, navigation, footer, site links and landing scroll/visibility hooks. Login owns its scene, heading, provider state, language disclosure and email/password/code flow. Library owns its sample catalogue/cards/search. Legal owns its document shell. No general Button/Input component library exists; do not prematurely convert every control.
- Fonts/reset/dark theme live in one global stylesheet; feature styling uses CSS Modules with literal values rather than a populated token system. `docs/frontend-design-reference.md` documents the established visual baseline. Keep it intact during this structure pass.
- The prompt names “Rawan Design Skill — Quiet Literary Studio”, but no matching SKILL.md was found in the project or installed skills/plugins. It cannot be treated as a source already read. This is a prerequisite for later onboarding visual work, not a blocker for a nonvisual refactor. No skill is invented or substituted as authoritative.
- Website has Node built-in tests (6 Google flow/popup/configuration cases), TypeScript and oxlint. API/backend use Vitest, isolated HTTP/e2e and separate PostgreSQL smoke scripts; onboarding unit/database tests already exist. No frontend Playwright test harness is configured. Browser QA is manual.
- Historical `docs/account-experience.md` describes a removed questionnaire and redirects; `docs/customization-and-preference-scopes.md` mixes historical research with implementation updates. Current source and migrations take priority. Database migration files were inspected; this audit does not claim a live DB has every migration applied.

## Architecture plan written before implementation

### Part 2 changes

- Retain `apps/website`, existing public routes and all URL paths. Use `(auth)` and `(application)` App Router groups for login vs authenticated shells; keep existing `/auth/*` handler paths.
- Create `features/auth/components` for existing login UI and colocated CSS/scene, `features/auth/hooks` for popup orchestration, `features/auth/lib` for existing configuration/signing/errors, and `features/auth/server` for session validation and existing HTTP handler implementations. Route files become thin adapters. Do not introduce an auth replacement or change callback semantics.
- Put the existing cross-feature BrandMark and site links in `components/shared`. Leave marketing/legal/library implementations in place to avoid unrelated churn. Move only the actual global stylesheet into `styles` and update its import.
- Do not create empty onboarding/preferences folders or placeholder routes: later work should add `features/onboarding` and an onboarding route when there is actual code. Feature-specific steps/schema/service logic belongs there, rather than in `components/shared` or route files. Generic `components/ui` starts only when actual reusable controls exist.
- No new dependencies, schema changes, migration execution, onboarding gates, dashboards, destination pages, API changes or public redesign.

### Affected files and risks

Moves affect login UI/hooks, four auth libraries, session utility, five auth handler implementations, login and authenticated page paths, BrandMark/site-link imports, global CSS import and auth test imports. Update direct docs links. Preserve recent Start Building routing work and all other local changes. Avoid broad mechanical moves of backend, public assets and marketing sections. Risks are relative imports, client/server crossings, broken handler exports and accidental URL changes; verify the build route table and source import graph.

### Verification strategy

Run website format checks, lint, typecheck, existing tests and a production build. Confirm the same route inventory. Check login, home, library, Terms/Privacy, signed-out workspace/account redirect and auth method/origin validation in a local preview. Do not send real signup emails, access credentials, create users, mutate project data or claim an end-to-end provider sign-in without doing it. No database migration is required. Record outcomes below after implementation.

## Part 2: final folder guide

```text
apps/website/src/
  app/
    (auth)/login/page.tsx
    (application)/account/{page.tsx,account.module.css}
    (application)/workspace/page.tsx
    (application)/workspace/reader/page.tsx
    auth/{email,logout,google}/...       # existing URL adapters and popup page
    {page.tsx,layout.tsx,library/,terms/,privacy/}
  features/auth/
    components/                        # existing login UI + scene/CSS
    hooks/use-google-popup.ts
    lib/{google-auth,google-popup,login-errors}.ts
    server/{session,email-route,logout-route,google-route,
            google-callback-route,google-result-route}.ts
    README.md
  components/shared/{brand-mark.tsx,site-links.ts}
  components/                          # retained marketing/legal/library components
  styles/globals.css
```

All existing HTTP handlers are now imported through thin App Router adapters; runtime remains explicitly `nodejs` on the same four handler entry points. No mixed client/server barrel was introduced. The only shared extraction is existing brand/site-link code; there is still no general UI toolkit. Existing authenticated shell guards remain at their original page execution points.

When later phases start, add actual onboarding code under `features/onboarding` and its thin route in a dedicated route group. Add account preference modules only for implemented consumers/contracts. Studio and Reader can receive separate route groups/features when real pages are authorized. Avoid empty directory scaffolding. No data migration or environment change is required for this refactor.

## Outstanding decisions for later parts

- Supply or locate the actual Quiet Literary Studio design skill before applying its claimed visual rules.
- Decide the adult eligibility and acceptance policy; the current draft does not establish 18+ access.
- Agree the rollout treatment for old accounts without a legacy row, the new onboarding version and required fields; legacy completion is not proof of new-flow completion.
- Extend actual API contracts safely for preferred name, split interests, language/discovery and preferred start; do not fabricate frontend-only persisted fields or duplicate scoped preferences.
- Keep returning/deep-link access and existing owned projects safe. Current workspace destinations are empty shells and are not redesigned here.

## Verification results

- Supplied master prompt copied byte-for-byte; SHA-256 matches the attachment. The copy is not autoformatted or edited.
- Production website build passed; the existing route inventory remains unchanged, with no new onboarding/register/studio routes.
- Website typecheck and oxlint passed; all six existing Node authentication tests passed after imports moved.
- Relative source import scan passed with no missing targets.
- Thirteen local HTTP smoke checks passed: five public-page 200s; unauthenticated `/account`, `/workspace` and `/workspace/reader` redirect to login; malformed popup result returns 400; invalid popup completion returns 404; wrong-origin email/logout POST requests return 403; GET on email POST handler returns 405. These requests did not submit signup data or send emails.
- Browser: login provider choice, Email login form, signup mode and back controls checked after refactor; visual design preserved. Production sign-in with provider credentials and authenticated account data was not exercised.
- `git diff --check` and formatting checks cover affected files. No database or API-domain files changed; no migration or live database smoke test is required for this structure-only pass. No onboarding behavior tests are claimed because onboarding implementation is outside Parts 1–2.
