# Account onboarding

After Google authentication, `/account` validates the HTTP-only session and reads private progress. Accounts without completed onboarding enter `/onboarding`; completed accounts enter `/workspace`. Existing accounts with no progress also receive the tour. `/onboarding?replay=1` reopens story selection without clearing the completion marker or saved card.

## Reference and visual details

The supplied VVD screenshots show a full-screen blurred landscape, blue glass panels, a small logo at the upper left, Skip at the upper right and Help at the lower right. The story picker has six outlined pills and reveals Begin after selection. Two tall preview windows show a canvas, character or map beside the picker. The introduction enlarges these windows into a centered frame, crossfades through five scenes and displays a current subtitle above faded previous lines. The card guide dims the surrounding page and places a roughly 336px rounded popover beside each highlighted field. It has five numbered steps, Back/Next/Finish and Close.

The reference editor redirected to login, so its live animation timing and audio could not be inspected. Rawan uses the supplied Lumia artwork and map, its existing local fonts (Space Grotesk/Inter, plus Georgia in sample cards), original tutorial writing and approximate transitions based on the screenshots. It does not embed the screenshots as an interface. Phone layouts place guide cards at the bottom and scroll targets into view; reduced-motion settings suppress animated movement.

The introduction automatically advances through the canvas, card and map examples. Optional browser speech reads the original subtitle script; narration starts off, and can be enabled, paused or skipped. This is not the reference recording. A supplied, licensed recording and its timed transcript are needed to reproduce that audio and timing.

## Persistence and scope

`UserOnboarding` stores story type, phase, step, completion, skip status and a private tutorial card (name, role, illustration choice and text), keyed to the authenticated user. GET/PATCH `/api/v1/users/me/onboarding` never accepts another user's ID. DTO validation bounds strings and restricts phase, story type, image and step. Completion cannot be cleared by the client. The website's same-origin PATCH proxy reads the session cookie server-side, limits the request body and does not expose JWTs to client JavaScript. Responses are not cached.

Typing saves after a short debounce; changing guide steps and finishing flush current edits. Failed completion saves keep the user in onboarding and show a retry message. Finish and Skip open the sample workspace. Card, Map, Canvas and Timeline controls display examples, and Notes shows the saved tutorial prose. Replay reopens the guide. These demonstration panels are not a production world editor, shared collaboration, manuscript creation or an upload system. Illustration selection cycles the three existing sample images.

## Verification

- API unit/contract tests cover authenticated identity scope, defaults, partial updates, validation and one-way completion.
- `pnpm --filter @rawan/api test:onboarding:database` requires an explicitly supplied disposable `TEST_DATABASE_URL`; it exercises real HTTP/JWT/database isolation, persistence, completion and deletion cascade in a temporary schema and cleans up that schema.
- Desktop and 390×844 browser checks cover selection, animated introduction, each guide step, editable fields, refresh/resume, Finish, returning-account routing, replay and sample tool panels.
- Run `pnpm db:deploy` and `pnpm db:generate` after pulling. The onboarding migration was applied to the current local database during implementation.

To try it, open `http://localhost:3000/login` and sign in with Google. The registered redirect URI remains `http://localhost:3000/auth/google/callback`. Real Google consent requires the user's account; local fixture tests do not establish a successful provider sign-in.
