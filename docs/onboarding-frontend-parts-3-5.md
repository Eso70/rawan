# Onboarding frontend — Parts 3, 4 and 5

> Historical phase record: the age declaration was subsequently removed at the user’s request. Existing accounts now bypass setup; new accounts finish without age confirmation. See the [current guide](onboarding-guide.md).

> Historical phase record. The current completed implementation, API contract and manual test instructions are in [the onboarding guide](onboarding-guide.md).

Date: 18 October 2026. Follow the [master prompt](rawan-master-onboarding-prompt.md) and [foundation audit](frontend-foundation-parts-1-2.md). This pass stops after Part 5. No backend persistence, migration, auth callback/session/redirect modification or dashboard is authorized here.

## Plan and scope

1. Part 3: pure frontend account-preference model with Create/Read/Both purpose, exactly two starting experiences, separate draft state, and tests. Keep identity/roles and server-owned completion/age timestamps out of this model.
2. Part 4: standalone `/onboarding` preview with all applicable logical sections, optional skip/back/continue, validation, accessible inputs, English-only language, and an honest preview-completion screen. No login gate or automatic appearance after auth: that is explicitly deferred. Do not call old onboarding endpoints with an incompatible new object.
3. Part 5: consolidate into a manageable four/five-step flow, grouped expandable interests, retained answers on purpose changes, optional tab-only refresh recovery, privacy copy and responsive/keyboard polish. Browser progress is a disposable preview draft, not account persistence or evidence of onboarding completion.

After each part, review its requirements and pass website tests, lint, typecheck and build before beginning the next. Verify UI behavior in the local browser for Parts 4/5. Record outcomes below.

## Constraints and decisions

- Existing design source: self-hosted Lora, Inter/Space Grotesk, dark navy, restrained white controls and established sizing. Use a calm solid form surface without decorative marketing video, new illustration or glass layers. The named Quiet Literary Studio SKILL.md is still unavailable after searching project and installed skills. Do not claim to have applied that missing skill.
- Policy: current preview Terms do not establish adults-only access; no 18+ gate or consent declaration is invented. No birthdate or government ID is requested. No age eligibility or policy acceptance is recorded. Revisit with a real policy before Part 6 integration.
- English is the only implemented interface language; no nonfunctional language options or RTL claims.
- Both is an interest choice, not a third experience. Preferences never grant/revoke permissions. Existing auth security roles remain untouched.
- The future Studio/Reader destinations are preferences only. Finish at an in-page preview summary and link back home, never to nonexistent dashboards. Do not mark the actual account completed or change its name.
- Existing account name can later be provided through a prop; skipped/empty preferred name preserves it, with a neutral fallback. Do not fetch or expose an account in this standalone preview.
- Master prompt remains unchanged. Parts 1/2 and other local changes remain intact.

## Part 3 implementation and review

`features/onboarding/model.ts` separates the frontend draft, purpose and preferred start from identity and security. Two experience constants supply future labels/descriptions without URLs. Purpose changes preselect Studio/Reader as appropriate, preserve both sets of interests, and keep a prior preference when choosing Both. Preferred name is normalized with an existing-name fallback. No privileged or server-owned fields are accepted or returned.

Review: all Part 3 concepts are represented without implementing product destinations, mutations, routing or permissions. The existing authentication system is unchanged.

Part 3 verification: 10/10 website tests passed (4 new model tests plus 6 auth tests); lint, explicit typecheck and production build passed. Review passed. Proceeding to Part 4.

## Part 4 implementation and review

Added `/onboarding` as a standalone, noindex frontend preview with thin route, feature-owned UI/CSS, grouped interest options and field validation. The initial flow contains the applicable logical sections: optional preferred name, required single purpose, conditional creative/reading interests, optional language/discovery and optional future starting preference. Optional sections can be skipped; native radio/checkbox/select/details elements provide keyboard behavior. The completed preview remains on-page and states that the actual account is unchanged. Back navigation preserves answers.

Eligibility was reviewed against current policy: no established adult-only restriction, so no misleading age checkbox or declaration is introduced. Only English is shown. Existing display name can be supplied without any request or mutation. No APIs, session logic, destinations or redirects were added or modified. Appearance uses the existing typography/navy foundation with solid form surfaces; the absent named skill is not claimed.

Part 4 verification: 14/14 tests passed (including 4 new validation/catalogue tests), lint, explicit typecheck and production build passed. Browser checks passed for skipped name, required purpose error, Both’s conditional creative/reading sections, grouped multi-select, skipped optional questions, and completion without choosing a future destination; completion remained `/onboarding`. Review passed. The following Part 5 revision consolidates and polishes this working flow.

## Part 5 implementation and review

The final flow contains five stable steps for Create, Read and Both: Welcome/name → Purpose → conditional Interests → Language/discovery → Starting preference. Both's creative and reading interests share one step but remain separate labelled sections and grouped expandable controls. Reading formats, fiction genres and non-fiction topics remain distinct. Purpose changes retain previous selections; only relevant sections are visible. Optional fields can be skipped; a hidden previous Other note cannot block another discovery-source choice.

A versioned, bounded `sessionStorage` draft restores answers, current step and the frontend preview summary after refresh in the same tab. This does not create a user record, call the API, mark actual onboarding complete or store a security/eligibility decision. Corrupt/unknown/oversized drafts are rejected; unavailable browser storage shows a nonblocking notice and leaves the form usable in memory. The page states this scope plainly and includes a clear-draft/start-again control. No notification, file, microphone or other permission is requested. The effect reads storage only after hydration and does not overwrite an existing draft before restore.

Native controls remain keyboard accessible. Step headings receive focus and the page returns to the top on transitions. Labels, descriptions, error alerts, group legends, progress, selected states and 44–48px controls support access on small screens. Solid navy/Lora/Inter styling follows the supplied system reference without marketing decoration; the missing named design skill remains a limitation. Global reduced-motion rules remove transitions.

Part 5 browser review passed: Create-only and Read-only interest visibility; Both contains both sections; creative Novels and reading Manga survive purpose changes and refresh; normalized preferred name survives; overlong name/note errors are announced; optional note can be skipped; native arrow-key starting selection works; completion remains `/onboarding` and refresh restores the preview summary; clear/reset stays cleared after refresh. At 320px and 390px there was no horizontal overflow. Auth callbacks/redirects and backend models/routes remain unchanged. Final automated results follow after the final pass.

### Final Part 5 gate

Passed: 20/20 website tests (14 onboarding tests plus the existing 6 auth tests), oxlint, explicit `tsc --noEmit`, Prettier check, production build and `git diff --check`. HTTP smoke checks: `/onboarding` and `/login` return 200; signed-out `/workspace` still redirects to `/login`. The final build adds only `/onboarding` to the route inventory. All three part reviews/gates passed before proceeding; work stops here after Part 5.

The preview has no HTTP submissions, backend mutations, database migration, login callback change, first-time-user routing, dashboards or permission requests. Session storage is solely disposable preview UX; no server persistence or production eligibility/completion enforcement is claimed. Future policy/design-skill and account migration decisions from the audit remain unresolved for the later, unauthorized integration phases.
