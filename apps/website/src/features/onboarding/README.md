# Account setup — Parts 3–10

The later immersive presentation redesign adds `components/onboarding-background.tsx`, its CSS Module and a pure `background.ts` reducer. These own decorative media readiness only. Original responsive WebP artwork, static fallback, centered Lora questions and translucent native controls retain all five steps and existing data behavior. See [the current design and verification](../../../../../docs/design-system/immersive-onboarding.md).

`/onboarding` is authenticated and loads account state from NestJS. New accounts resume the five-step frontend from Parts 3–5. Existing accounts bypass onboarding. New-account completion is enforced at the server; browser drafts and answers never grant roles.

- Shared catalogues, contracts and access policy: `packages/types/src/onboarding.ts`.
- `model.ts`, `validation.ts`: preference changes and frontend validation.
- `flow.ts`: stable steps plus the historical preview snapshot parser retained for its regression tests; browser snapshots are not used by the live flow.
- `hooks/use-onboarding-draft.ts`: current account draft, sequential saves, busy state, optimistic revision, retryable failure, session-expiry and conflict handling. Saves on Continue/Back, not on every keystroke. Skipping preserves previously saved answers.
- `server/setup.ts`: no-cache authenticated state loading and workspace routing. Failure produces a retry screen; only session expiry redirects to login.
- `routing.ts`: allowlist for existing destination paths; external, encoded and onboarding/login targets rejected.
- `onboarding-page.tsx`: existing five-step flow, real saved completion and safe destination navigation.
- `app/api/setup/route.ts`: origin-checked, bounded, cookie-authenticated PATCH proxy. The token stays server-side. Nest validates all fields and derives identity from the JWT.

Purpose is required for newly created accounts. All other profile questions remain optional. Only English is implemented. No age declaration is collected or required. Users can leave or sign out without completion. Preferred name never overwrites an account name when blank. Preferences never change `User.role`.

Both auth providers retain the existing workspace entry point, where the server selects setup or the existing shell. Cookie sessions, provider verification and ownership controls are preserved. Completed users bypass setup. Direct reader links survive the gate. No dashboards were implemented.

See [architecture, migration and verification](../../../../../docs/onboarding-persistence-parts-6-7.md). Website checks: test, lint, typecheck and build. API verification includes new setup tests, legacy onboarding, email signup and protected-domain regressions in a disposable database. The opt-in local HTTP suite creates/removes only its own synthetic accounts.

## Final UX and save behavior

Part 8 retains the existing design and adds accessible form groups, a skip link, focused field errors, saving announcements, consistent disabled states, 44px targets and reduced-motion-aware opacity transitions. `SetupError` uses Next's `retry()` to refetch state.

Part 9 introduces `services/save-setup.ts` (typed retry/expiry/conflict failures), `state.ts` (safe parsing shared by server/client loads), and `submission.ts` (optional Skip preserves saved answers without submitting unsaved values on that step). Name/note limits count Unicode code points consistently with Nest. These have ten additional Node tests. The unused historical snapshot parser remains only for earlier regression tests and is never account-completion authority.

The canonical [implementation/API/manual test guide](../../../../../docs/onboarding-guide.md) and [Parts 8–10 completion record](../../../../../docs/onboarding-finalization-parts-8-10.md) document supported behavior and limits. No post-completion preferences editor or dashboard is claimed.
