# Rawan onboarding — implementation and local testing

This is the current guide for master-prompt Parts 1–10. The [master prompt](rawan-master-onboarding-prompt.md) preserves the original requirements; [phase verification](onboarding-finalization-parts-8-10.md) records the ordered gates. The [final end-to-end audit](onboarding-final-audit.md) records the latest tested results, intermittent regression finding and remaining verification gaps. The two future product experiences remain unimplemented frontend shells.

## Organization and design

- `apps/website/src/app/(auth)` and `features/auth`: existing sign-in UI, provider verification, callbacks, cookies and session handling.
- `app/(onboarding)/onboarding/page.tsx`: thin authenticated server route; `features/onboarding`: form, interest picker, styles, validation, state parser, submission rules and routing.
- `features/onboarding/hooks/use-onboarding-draft.ts`: current account draft, last saved answers, revision, pending/expiry/conflict state. `services/save-setup.ts`: bounded-time client request and typed failures. No browser storage controls completion.
- `features/onboarding/server/setup.ts`: no-cache load and workspace access gate. `app/api/setup/route.ts`: same-origin cookie-authenticated PATCH proxy.
- `app/(application)`: existing account/workspace/reader shells and recovery boundary. No new dashboard is included.
- `apps/api/src/users/setup.dto.ts`, `setup.persistence.ts`, `onboarding.service.ts`, `users.controller.ts`: validated, identity-scoped storage. `auth/guards/jwt-auth.guard.ts`: protected product access.
- `packages/types/src/onboarding.ts`: actual shared draft/state contracts, option catalogues and access rule. Tests use the existing Node/Vitest stacks.

The named Quiet Literary Studio skill is absent from the repository and installed skills. Implementation follows [Rawan's checked-in design reference](frontend-design-reference.md): navy surface, Lora headings, Inter controls, restrained borders and grouped native selections. Mobile controls have 44px targets; errors are focused and linked to affected controls; saving is announced. The immersive presentation adds original responsive atmospheric artwork, dark overlays, centered Lora questions and translucent native controls. Scene crossfades (900ms), question entrances (360ms) and field entrances (160ms) respect reduced motion. See [the current onboarding design](design-system/onboarding.md) and [redesign verification](design-system/immersive-onboarding.md). English is the only enabled interface language; no RTL support or translated language is advertised.

## Steps and requirements

| Step        | Contents                                                                           | Required                                  |
| ----------- | ---------------------------------------------------------------------------------- | ----------------------------------------- |
| Welcome     | Preferred pen name, normalized whitespace, up to 80 Unicode code points            | No; existing account name is never erased |
| Purpose     | Create, Read or Both, exactly one                                                  | New accounts only                         |
| Interests   | Creative formats for Create/Both; reading formats, genres and topics for Read/Both | No                                        |
| Preferences | English interface; discovery source and optional Other note, up to 120 code points | No                                        |
| Begin       | Future starting preference                                                         | No                                        |

Back/Continue save partial progress. Refresh restores the last saved step and answers. Skip ignores unsaved answers on that optional step while preserving the account's previously saved answers. Changing purpose preserves hidden creative/reading interests. Names and future starting choices never change authorization roles. Both represents interest in two experiences, not a third destination.

## Persistence and migration

The additive migration is `packages/database/prisma/migrations/20261018010000_account_setup/migration.sql`. It extends the existing unique-per-user `UserOnboarding` record with setup version/status/required flag, revision, current step, preferred name, purpose, separate creative/reading preferences, English interface language, discovery fields, starting preference and completion timestamps. Existing tutorial fields, names, roles, author profiles, projects and prose are preserved.

Existing rows and missing setup rows retain access without onboarding (`setupRequired=false`). Both new email verification and Google account-creation transactions explicitly create a required setup row. New accounts need a purpose and completed setup; existing accounts bypass setup. This is independent of historical tutorial completion.

Server updates merge only submitted fields in serializable transactions. `expectedRevision` rejects stale/concurrent writes with 409. Completion is idempotent; the first completion date remains unchanged on a retry. Database checks prevent inconsistent completed state. The legacy `/users/me/onboarding` endpoint retains its original tutorial contract.

The migration is already applied locally. Other environments use the existing commands, with the additive migration deployed before the new API:

```powershell
pnpm db:deploy
pnpm db:generate
pnpm build
```

The later `20261018020000_remove_age_requirement` migration removes the age prerequisite from the completion constraint. Historical age columns remain untouched to preserve data; they are no longer read, returned, written or used for access. Deploy this migration before the updated API. A reset is not part of installation or testing.

## API contract

Authenticated Nest endpoints: `GET /api/v1/users/me/setup` and `PATCH /api/v1/users/me/setup`. Identity comes from the validated bearer token. Browser code uses `PATCH /api/setup`; its HTTP-only cookie remains server-side. The proxy requires the configured Origin, JSON, a maximum 8 KiB body and a valid session.

PATCH requires an integer `expectedRevision`; all answer fields are optional. Allowed fields are the shared draft fields plus `step` and `complete` (true only). Example partial save:

```json
{
  "expectedRevision": 0,
  "preferredName": "River",
  "purpose": "both",
  "creativeInterests": ["novels"],
  "readingFormats": ["comics"],
  "step": "interests"
}
```

Response envelope:

```ts
type SetupState = {
  version: 1;
  status: "not_started" | "in_progress" | "completed";
  required: boolean;
  revision: number;
  step: "welcome" | "purpose" | "interests" | "preferences" | "begin";
  draft: {
    preferredName: string;
    purpose: "create" | "read" | "both" | null;
    creativeInterests: string[];
    readingFormats: string[];
    readingGenres: string[];
    readingTopics: string[];
    interfaceLanguage: "en";
    discoverySource: string | null;
    discoveryOther: string;
    preferredStart: "studio" | "reader" | null;
  };
  completedAt: string | null;
};
```

Finish with the latest revision and `complete:true`. Timestamps, policy version, user IDs and roles are not accepted from the client. Input enums, array membership/uniqueness/limits and string lengths are validated by Nest. See the [OpenAPI contract](contracts/backend-v1.openapi.json) and shared TypeScript contract for exact fields/catalogues.

Errors: 400 validation, 401 expired/missing session, 403 rejected origin or product eligibility, 409 stale revision, 413 body too large, 415 non-JSON, 5xx temporary service failure. Client failures retain draft/revision and allow retry. Expiry offers sign-in; conflicts require explicit reload. Incompatible responses fail safely rather than becoming completion or redirect decisions.

## Routing and access

Both providers retain the existing `/workspace` entry. Server pages read current account state. Unauthenticated users go to login; new/incomplete users go to onboarding; existing accounts and completed new accounts bypass it. `/workspace/reader` survives setup as an allowed return destination. Only existing workspace paths are allowed; external, encoded, unknown, login and onboarding targets cannot create an open redirect or loop. Normal email and Google-popup login preserve safe return paths; the full-page Google fallback preserves its existing workspace default.

Protected Nest product APIs independently require completed setup for new accounts. Existing accounts retain access. Identity/setup endpoints remain reachable to finish setup. Failed state loads show a recovery page; session service errors have a Retry boundary, and actual 401s return to sign-in. Retry refreshes server data using the installed Next.js API. Public homepage and sample Library browsing remain public.

The age declaration and its completion/access requirement were removed at the user’s request. There is no age confirmation UI or age input in the setup API. Home/leave and sign-out remain available. The public legal pages remain preview drafts.

## Changing preferences later

Before completion, use Back to revise answers; saved interests survive purpose changes. After completion, there is currently no profile-edit UI, and setup PATCH rejects edits except harmless repeat completion. A later account-preference editor is separate future work; it must preserve account history and roles. There is no advertised dashboard setting or invented edit endpoint. Future starting preferences are stored but currently finish at an existing workspace shell; full Studio/Reader interfaces are not delivered here.

## Start locally

From the repository root, use Node 24/26 and the pinned pnpm version. Preserve existing `.env.local` files. For a fresh checkout, copy the corresponding `.env.example` files only where local configuration is missing, then configure PostgreSQL and authentication using those examples. `packages/database/.env.local` and `apps/api/.env.local` must point to the same intended local database. Website authentication currently deliberately accepts only:

```text
AUTH_ORIGIN=http://localhost:3000
RAWAN_API_URL=http://127.0.0.1:3002/api/v1
```

Email signup requires the API's configured SMTP/code secret and sender settings; Google requires the existing OAuth credentials and localhost callback. No secrets belong in documentation. See [email verification setup](email-auth.md) and the actual `.env.example` comments for supported settings. Redis 6.2+ is needed for background jobs; onboarding persistence itself uses PostgreSQL.

```powershell
pnpm install --frozen-lockfile
pnpm db:deploy
pnpm db:generate
pnpm build
pnpm dev
```

Open `http://localhost:3000/login`. `/onboarding` requires a real session; there is no public bypass preview. Build before starting watchers for predictable verification. If testing production output locally, run `pnpm --filter @rawan/api start:prod` and `pnpm --filter @rawan/website start` in separate terminals instead of `pnpm dev`. Run only one API and one website server on ports 3002/3000. The current local auth configuration is not a public production deployment configuration.

## Automated checks

```powershell
pnpm lint
pnpm typecheck
pnpm build
pnpm test
node apps/api/test/run-setup-validation.mjs
```

The database runner creates/removes its own dedicated loopback database and isolated migration schemas. It covers setup migration/ownership/validation/resume/concurrency/idempotency, legacy onboarding and email verification with a local fake mailbox (no external email). The email suite now runs 81 contract-checked requests, including registration through next login independently for Create, Read and Both. It requires local database credentials with permission to create a throwaway database and rejects production/remote targets. To include the wider existing domain regressions, set `SETUP_FULL_REGRESSION=true` for that invocation after building the worker. See the latest audit for its intermittent plot concurrency failure; a full green wider run is not claimed.

With stable local API and website servers running:

```powershell
$env:SETUP_LOCAL_HTTP_TEST = 'true'
node apps/api/test/setup-routing-local-smoke.mjs
Remove-Item Env:SETUP_LOCAL_HTTP_TEST
```

This opt-in suite creates and removes its own synthetic accounts and runs 51 status/value checks plus additional cookie/security and rendered-screen assertions. It verifies the cookie-to-Next-to-Nest path, all purpose branches, stored interests/start preference, existing-account access, a correctly signed expired JWT, incomplete-account re-login, logout and completed-account next login, malformed bodies, CSRF, timestamp/identity rejection, repeated completion and loop/open-redirect prevention. It does not reset a real account. Avoid rebuilding the API during this running-server test: a watcher restart intentionally produces the service-unavailable path.

## Manual test walkthrough

1. Use a separate new test email, sign up at `/login` and enter the delivered code. Confirm setup opens after authentication. Alternatively use the configured Google flow; provider account creation is atomic with required setup.
2. Leave the name blank or enter a pen name. On Purpose, try Continue with no selection: the error should be announced/focused. Use separate test journeys for Create, Read and Both; the corresponding interest categories should appear.
3. Select broad categories using Space, then Continue to a flat screen containing only their concrete choices. No selection advances directly past optional interests. Select concrete choices and Continue to save. Back and Skip controls are intentionally removed. Existing hidden saved answers remain intact; filtering categories never clears them.
4. On Preferences, confirm only English is offered. The discovery question and note are no longer displayed; existing saved values and API validation remain intact. Check the 80-code-point name limit, including supplementary Unicode characters.
5. Refresh after a successful Continue save. Confirm the last saved step/answers return. Interests reopens at category selection and infers categories from saved concrete answers. Unsaved category-only filters and unsaved edits are not persisted. Incomplete setup resumes after a later sign-in.
6. At Begin, confirm there is no age checkbox. Choose either optional future starting preference or leave it empty, then finish: the existing workspace shell opens without an age declaration; no new dashboard should appear.
7. Revisit `/onboarding` and sign in again after completion: both should bypass setup. Visit `/workspace/reader` directly to verify that existing path survives an incomplete setup gate and completed accounts do not loop.
8. With a pre-rollout test account, confirm onboarding is bypassed and existing names/projects remain. If none is available, the automated database/HTTP suites construct and clean up a legacy fixture rather than changing your account's rollout classification.
9. In two tabs on an unfinished test account, save in one and submit stale progress in the other: the second should offer Reload saved setup without silently overwriting the first. After session expiry, a save should offer sign-in. A service outage should retain entered answers/show a retry message; after recovery, Retry should restore the saved flow.
10. Check 320px, 390px and desktop widths plus keyboard-only navigation and browser zoom. All inputs need labels; focus must remain visible and follow step headings/errors. With OS reduced motion enabled, transitions should stop. No RTL languages are enabled. Sign out and confirm direct setup/submit returns to sign-in/401.

## Verification limits

Latest results and category statuses are in [the final audit](onboarding-final-audit.md); the earlier [completion record](onboarding-finalization-parts-8-10.md) is historical. Real browser checks used synthetic email accounts. Mail handling and Google signature/nonce/identity logic are covered by automated provider/mail tests; this run did not use a real Google account or send external email. Actual external delivery remains unverified. Reduced motion was checked in CSS; an assistive-technology/OS matrix and public deployment audit are not claimed. The wider regression run exposed an intermittent plot race that passed a separate rerun but remains unresolved. No product policy decision remains open for onboarding. Preference editing and the two future experiences remain explicitly outside this delivery.

## Age requirement removal verification — 2026-10-18

Removed the final declaration checkbox, declaration-only existing-account page, age input/output fields, backend age validation and age-based access checks. The safe follow-up migration is applied locally; historical declarations and account data are preserved without collecting new declarations.

Verification passed: repository lint, type checks, production build and all 508 unit tests (website 32, API 376, backend 68, worker 32). Disposable PostgreSQL tests passed for setup migration/data preservation, completion without declaration, required purpose, revisions, ownership and legacy onboarding; the email suite passed 45 local contract cases without external mail. The running-server suite passed 42 status/value checks plus rendered-screen assertions, including no final checkbox, existing-account bypass, cookie authentication and redirect-loop prevention.
