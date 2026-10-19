# Experience routing

Current behavior, 2026-10-19. This supersedes earlier references to an empty workspace or an unconnected reader shell.

After clearing both previous dashboards, the user requested a new reference-based Author Studio shell. `/studio` now mounts `features/author-desk`, with an empty glass sidebar and author tools; authenticated `/reader` remains blank. The old studio shell, provider, demo content and styles stay unmounted. Sign-in, setup completion, purpose-based routing and reader access checks remain connected. Earlier browser-local drafts have not been deleted; the new desk uses a separate local storage key.

- Author destination: `/studio` (new reference-based author desk).
- Reader destination: `/reader` (authenticated and empty, ready for the new design).
- `/account` checks session and setup, then redirects based on the saved Create/Read/Both purpose. Incomplete accounts go to onboarding; outages show recovery controls.
- Onboarding finishes directly at the selected experience after the API confirms the save. No completion/intermediate section is rendered. Reopening onboarding after completion uses the same destination logic.
- `read` opens Reader Experience; `create` and `both` open Author Studio. Both can use either experience; its starting destination is Author Studio. Legacy unset purposes default to Author Studio. Older `preferredStart` values never override purpose.
- The visible setup has four steps: welcome, purpose, interests and preferences. The language/preferences screen finishes setup directly. There is no separate starting-experience question. Persisted `begin` drafts resume at preferences; the API's completion step remains compatible without a migration. New submissions derive the legacy `preferredStart` field from purpose.
- Explicit `/reader` or `/studio` return links are retained. Only these destinations and `/account` are allowlisted; unsafe targets fall back to the preference resolver.
- Landing entry links and default sign-in paths use `/account`, never `/workspace`. Old `/workspace` bookmarks redirect to `/account`; `/workspace/reader` redirects to `/reader`.
- Preferences do not grant roles or change authorization. `/studio` retains its standalone mock access and browser-local data. The Reader Experience entry does not claim live reading history or recommendations.

Validation: website unit tests, type checking, lint and production build; local HTTP integration with disposable accounts covers both starting experiences, incomplete setup, legacy accounts, repeat sign-in, old URLs, explicit reader returns, unsafe targets, session expiry and API setup protection. The fixture removes only accounts it creates.
