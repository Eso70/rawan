# First authenticated author experience

## Scope and current state

Implemented in the existing `apps/app` starter, after inspecting the current repository. The existing shared API contracts, NestJS bearer authentication, hierarchy endpoints, ownership checks, Prisma models and migrations are reused. The marketing website, backend source, database schema, shared types, CI workflow, repository hygiene and existing dependency versions are unchanged. `packages/ui` and `packages/utils` contain only reserved placeholders; no design system was added.

## Routes and UI

| Route                                                                        | Behavior                                                                     |
| ---------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| `/`                                                                          | Redirect to projects, then sign-in if unauthenticated                        |
| `/register`                                                                  | Name, email and 12–128 character password; real registration endpoint        |
| `/sign-in`                                                                   | Email/password; real login endpoint and session-expired notice               |
| `/projects`                                                                  | Author's real projects, description/update date, empty state and create form |
| `/projects/[projectId]`                                                      | Project and its books; create book                                           |
| `/projects/[projectId]/books/[bookId]`                                       | Book and its chapters; create chapter                                        |
| `/projects/[projectId]/books/[bookId]/chapters/[chapterId]`                  | Chapter and its scenes; create scene                                         |
| `/projects/[projectId]/books/[bookId]/chapters/[chapterId]/scenes/[sceneId]` | Scene metadata and temporary plain-text textarea with explicit Save          |

The dark, restrained workspace has only Projects, the author account area and Sign out in its sidebar. Each detail page has contextual breadcrumbs using real ancestor titles. Newly created resources open immediately; subsequent navigation refetches uncached data. Child lists retain the backend's position/creation-time/ID order. No status label is invented because the current Project API has no status field. The scene form preserves text and Unicode, reports pending/error/success states, shows unsaved changes, and accepts up to 50,000 characters. It is not a rich-text editor or autosave system.

Forms have labels, native constraints, visible focus, accessible feedback and pending submission controls. Controlled inputs retain drafts after errors; credentials are never echoed back from the server. Resource, account and scene text are rendered by React with normal escaping. Loading, empty, resource-not-found, expired-session, form and API-unavailable states are provided. The sidebar simplifies into a header on small screens; creation panels stack beneath lists on tablets/mobile. JavaScript is required for interactive forms and their feedback.

## Session and security

The backend's existing `AuthResponse` supplies a bearer JWT and its seven-day lifetime. A Next.js Server Action sends registration/login details to NestJS, stores only the JWT in a host-scoped HttpOnly cookie, then redirects to Projects. Neither the action's return value nor client component props contain the JWT. There is no localStorage/sessionStorage token, browser-to-NestJS request, new JWT secret, OAuth, or refresh-token platform.

Production uses `__Host-rawan-session`, Secure, HttpOnly, SameSite=Lax, Path=/ and no Domain attribute. Development uses `rawan-session` without Secure for local HTTP. Cookie lifetime is bounded by the API's lifetime and seven days. Production requires HTTPS for the author app. Keep Next.js's built-in Server Action Origin/Host checks enabled; configure a reverse proxy to preserve the correct host instead of broadly allowing arbitrary origins.

The sidebar gets the current user through `/users/me`. Every resource read and mutation independently reads the HttpOnly cookie and forwards its bearer token to NestJS; no authorization relies solely on a layout or a visible button. NestJS verifies the JWT, account existence, current role and hierarchy ownership. Expired or rejected tokens redirect to sign-in; mutation failures clear the invalid cookie first. A read cannot delete cookies during Server Component rendering, so an invalid read-side cookie is replaced on the next successful sign-in or removed by sign-out. Logout deletes the local cookie and invalidates the router's session view.

Security limitation: the existing API has no token revocation/refresh mechanism. Logout clears this browser's session but cannot revoke an already stolen bearer token, which remains valid until expiry, account deletion or JWT-secret rotation. This task does not expand the backend auth architecture. Same-origin malicious script could still issue requests as the signed-in user even though it cannot read the HttpOnly token.

## API-client architecture

`lib/api-core.ts` provides typed JSON requests, bearer headers, no-store caching, bounded requests, redirect refusal and safe status-based errors. It rejects unsafe request paths and validates configuration. It never forwards raw upstream error bodies to the UI. `lib/api.ts` adds a server-only guard and reads `API_URL`; `lib/session.ts` owns cookies and authenticated requests; `lib/data.ts` maps read-side 401/404 to navigation states; `lib/actions.ts` handles authentication, logout, creation and scene saving. `lib/paths.ts` constructs only known hierarchy paths from constrained IDs. IDs still remain untrusted and NestJS remains the authorization boundary.

Responses use `@rawan/types` (`ApiUser`, `AuthResponse`, `ApiProject`, `ApiBook`, `ApiChapter`, `ApiScene`) rather than Prisma internals. No duplicate backend DTO library or client SDK was created. `API_URL` includes the actual `/api/v1` prefix and is kept server-side; Turbo passes it through to development and includes it in build environment hashing.

## File inventory

Created under `apps/app`:

- `.env.example`.
- `src/app/sign-in/page.tsx`, `src/app/register/page.tsx`.
- `src/app/(author)/layout.tsx`, `loading.tsx`, `projects/page.tsx` and the four nested Project/Book/Chapter/Scene detail `page.tsx` files.
- Root `src/app/loading.tsx`, `error.tsx`, `not-found.tsx`.
- `src/components/forms.tsx`, `workspace.tsx`, `hierarchy-page.tsx`.
- `src/lib/api-core.ts`, `api.ts`, `session-options.ts`, `session.ts`, `paths.ts`, `data.ts`, `actions.ts`, `form-state.ts`.
- `test/core.test.mjs`, `test/session.integration.mjs`.

Also created this document. Modified `apps/app/package.json`, `README.md`, `src/app/page.tsx`, `src/app/layout.tsx`, `src/app/globals.css`, root `README.md`, `turbo.json` and `pnpm-lock.yaml`. Formatting only was applied to the existing `docs/manuscript-domain.md` so the repository formatting check passes.

Dependencies: `@rawan/types` is an existing workspace link; `server-only@0.0.1` is the only new external package and prevents server session/API modules from entering browser bundles. No existing dependency version was upgraded. The package manager normalized several existing peer-dependency snapshot labels while adding the package. Tests use Node's existing test runner; no frontend testing framework, editor or state library was installed.

## Verification and practical limits

Eight Node tests cover JSON/bearer behavior, anonymous requests, safe error mapping, network/parse failures, URL/transport validation, constrained hierarchy paths and cookie options. `pnpm --filter @rawan/app test:session` runs a focused test against a real built Next.js process with an isolated upstream fixture: anonymous/invalid-token protection, register/login cookies, absence of JWT in rendered HTML/RSC, logout and missing-resource handling. This verifies session plumbing, not PostgreSQL or the complete real product flow.

Browser checks confirm the register/sign-in rendering, service-unavailable feedback with retained form fields, unauthenticated navigation to sign-in, and mobile sign-in at 390px with no horizontal overflow. The authenticated workspace's live browser flow is pending database configuration. No fake project data or fixture responses are used by the application itself.

Final checks pass: app/root lint, root typecheck, root build (all six active packages), eight frontend tests, the focused session integration check, 29 API unit tests, 35 API HTTP tests, repository formatting and `git diff --check`. Existing backend architecture and authentication are unchanged, but the root build and tests still verify them. A root-build issue exposed a caught Next.js dynamic-rendering signal; the data helper now preserves framework control flow, allowing private pages to remain dynamic and builds to succeed without a live API.

Known limitations: explicit save with no autosave/version/conflict handling; unsaved scene drafts are lost on navigation; no rich text, deletion/editing of hierarchy metadata, drag-and-drop, pagination or future worldbuilding features. The API's existing JSON body limit still applies, so a large encoded scene can receive a friendly content-too-large error before reaching the character limit. Dates are displayed in UTC to remain consistent across server/client rendering.

## Manual attention: real PostgreSQL flow

This checkout has a running PostgreSQL service but no local `apps/api/.env` or `packages/database/.env`. Real database verification cannot run until the local credentials are supplied. No secrets were invented, inspected from unrelated locations, or committed, and no application migrations or database data were changed by this task.

1. Configure the API and database package local environment files from their existing safe examples with the same development PostgreSQL URL, and generate/configure the API JWT secret. Keep real secrets out of chat and Git.
2. Apply the committed migrations with `pnpm db:deploy` to the intended development database.
3. Copy `apps/app/.env.example` to `.env.local` only if it does not already exist; set the server-side `API_URL` if your API does not use the local default.
4. Run `pnpm dev` from the root. Open the author app on port 3001.
5. Register, sign out, sign in, create a Project, Book, Chapter and Scene, save scene text, navigate away and reopen it, then sign out. Each successful create opens the new resource automatically.
6. Confirm another author's account cannot see/access the first author's resources. Existing API tests cover the backend ownership contract; this manual step verifies the configured deployment too.

Stop at this first author slice; future worldbuilding features remain out of scope.
