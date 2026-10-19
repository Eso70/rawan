# Rawan onboarding, guided tours and support

19 October 2026. Proposed guidance from [reference P07/P09/P11](vvd-visual-reference-analysis.md), preserving current account behavior. Screenshots 17/16/15/14/13 supply all five visible tutorial steps; 18 supplies tutorial-trigger evidence; 22–26/29 show introductions and demonstrations. No runtime tutorial behavior was verified.

## Three different jobs

| Job                         | Current Rawan status                                                                                                                                  | Design boundary                                                                                                                                      |
| --------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| Account setup               | Implemented authenticated five stable steps with an interests subphase, revisioned saves, required purpose for new accounts, optional profile answers | Server decides access; answers never grant roles. Existing/completed accounts bypass setup. No age question.                                         |
| Creator/reader introduction | Optional future presentation                                                                                                                          | Can explain existing tools and suggest a starting point. Does not create projects, publish content or replace account setup without explicit action. |
| Contextual tool tour        | Proposed client interaction                                                                                                                           | Optional, task-specific, restartable; completion means the explanation finished, not content was saved or an account permission changed.             |

The user explicitly removed the extra completion summary after the final setup question. Current `onboarding-page.tsx` saves completion and replaces the route with the validated return destination, keeping the last form busy/disabled while navigation starts. Preserve that direct handoff. Do not add a cinematic sentence, launcher screen, tutorial completion card or recap between final setup and workspace. A voluntary tour invitation may later live inside an implemented destination, after its content is usable.

Current account draft persistence is server-owned; browser snapshots in historical tests are not completion authority. Save failure stays on the current question with input intact; revision conflict and session expiry remain recognizable. Reuse existing safe return-path handling. This research does not alter current setup controls, questions, skip policy or backend gates.

## Creator introduction proposal

Reference 22 uses a left headline, category pills and two large previews; 23/25/29 vary preview contents and visible actions. Rawan interpretation: one short optional introduction at a natural creator entry, original text and at most one useful preview on small screens. Do not copy a three-column cinematic composition or reference artwork.

Possible choices are novel, nonfiction book, short story, comic/graphic novel, worldbuilding, research and something else. These are future organizational concepts, not accepted new project types. Current interests can suggest optional module visibility without mutating roles. A comic choice must explain imported artwork/script support rather than promise a drawing application. Research/worldbuilding can remain a project without creating a publishable Work.

Do not ask the same preferences again merely to reproduce a reference step. Offer a clear next action tied to a supported resource; preview content must be original and clearly marked if illustrative. Dismiss immediately and remember locally where appropriate. No required voice-over, timed auto-advance, loading sentence or blocking animation. Account-wide introduction completion needs its own supported contract if desired.

## Reader introduction proposal

Readers should reach their library/discovery or an intended reading destination directly. An optional small prompt can explain saving a work, adding a collection or changing reading appearance. Reuse existing saved preferences instead of requiring another questionnaire. Never ask a reader to create a project, choose worldbuilding modules or complete an author dashboard tour.

Keep appearance choices separate from authorization and availability. A saved reading preference cannot make a withdrawn release available. If no eligible catalogue content exists, show an honest empty state rather than sample works presented as real recommendations. Reader tour content is shorter and contextual to library/reading controls.

## Tour anatomy and state model

Each proposed tour has a stable ID/version, purpose, optional prerequisites, ordered steps and a named restart entry. Each step identifies a semantic target, heading, short original explanation, placement preference and completion condition. A target identifier is a frontend concern, not a new public backend ID. Define whether the step merely explains a control or asks for a real operation; do not infer an operation succeeded from a click alone.

State progression: idle → offered → active step → finished or dismissed. An active step can wait for its target, pause for a required screen or fall back when unavailable. Transient render/resize failures must not erase the user's position. Never mark finished on first open; record dismissed separately from completed if local storage is used. Store only presentation state, not private text, authentication tokens or resource contents.

Back/Next changes explanations; Finish closes a tour and returns focus. Any required save uses the actual feature save/status, not a simulated tour action. Dismiss/Skip is always reachable and must not discard edited data. If a target feature is unavailable or the user loses access, stop cleanly with a contextual explanation. Avoid repeated automatic offers; restart stays available through Help or the tool's utility menu.

## Target positioning and spotlight

Reference 17 targets a title from below; 16 targets an image from its left; 15 a property row from the left; 14 a content action from above; 13 centers the final explanation without a specific target. Reuse the targeting principle, not exact coordinates or copy.

Proposed positioning logic measures the target after layout and chooses a side that keeps the popover and focus indicator inside the viewport. Keep a small gap and optional arrow; the arrow is decorative. Recalculate on pane resize, scroll, viewport/keyboard changes and content expansion. Scroll the target into view only when necessary, without smooth camera movement under reduced motion. If the target would be covered, reposition or use a compact sheet with a target summary.

A missing target gets a bounded readiness wait followed by Skip step, open required view, or exit—not endless polling under a dimmer. A disabled target gets an explanation; a hidden conditional feature must not be made available by the tutorial. Tutorial highlighting uses a distinct ring from keyboard focus, and the actual focused element retains its own indicator.

## Focus and keyboard design

Choose one interaction mode for each step:

- **Explanation mode:** a modal instructional surface, focus inside it, background inert, Next/Back/Skip reachable. The spotlight is a visual explanation and must not suggest an operable background control.
- **Try-it mode:** the focus boundary deliberately includes both the target control and instructional actions; irrelevant regions are inert. The real target stays operable by keyboard. The visual hole alone does not establish focus access.
- **Nonmodal hint:** no global dimmer/inert content; clearly related instructions and ordinary page tab order. Appropriate for a quiet optional tip that should not block work.

Announce tour title and “step X of Y” concisely. Use logical headings and descriptions. Escape dismisses the active tour or its current nested task according to a documented stack; it does not close the underlying document unexpectedly. Restore focus to the start trigger if it still exists, otherwise the current document heading or stable tool entry. Do not trap a keyboard user between an inaccessible target and a popover. Screen readers need the target's name and text instructions without having to interpret the spotlight. Do not overwrite native editor arrow keys with global tour shortcuts.

Prefer 44px targets for navigation actions. Under reduced motion, move highlighting immediately or use a simple brief fade; no animated zoom/pan. At text zoom, let the popover scroll without hiding its footer. Mobile sheets must leave the target and virtual-keyboard interaction intelligible. Never require a hover to advance.

## Candidate tours and support classification

| Tour             | Suggested useful sequence                                                                   | Backend boundary                                                            |
| ---------------- | ------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| First project    | Create owned project → open manuscript → optional support modules                           | H1 operations; no new project-type discriminator or account-wide tour state |
| Manuscript       | Navigate chapters/scenes → edit → understand save/retry → focus mode                        | H1 text editing; rich mention/track-change demonstrations excluded          |
| Character        | Name → optional owned image attachment → existing typed facts → description → relationships | H1 within real fields; reference aliases/custom properties are not copied   |
| Worldbuilding    | Find entity types → create one → connect an existing relationship → return to writing       | H1 private project isolation, no mandatory shared World                     |
| Canvas           | Add supported text/image/entity node → move → connect → fit → outline alternative           | H1 bounded nodes/edges; no live embedded map/group type                     |
| Timeline         | Create event → exact chronology → optional era → entity links → list view                   | H1; no calendar engine implied                                              |
| Reader library   | Save eligible work → status/favorite → collection → continuation                            | H1 release/library contracts, no recommendation engine                      |
| Reading controls | Contents → appearance → bookmark → optional private annotation → resume                     | H1 locator/revision policy; no offline sync claim                           |

Client-only tour engine and per-device dismissal are H1 presentation proposals; they still require frontend development. Durable account-synchronized tour/version/progress records are H2: current account setup completion and UserPreference allowlists do not contain a tutorial progress contract. Collaboration training remains H3 along with collaboration itself.

## Help, feedback and updates

Help can be a small contextual panel with a clear heading, a short text guide, optional captioned tutorial links and verified support destinations. A full help page becomes appropriate as content grows. Reference 3's community footer is optional and should include only Rawan's real destinations. Do not copy social icons as unimplemented links. Keep Help discoverable after dismissing a tour.

Feedback uses an explicit category, visible text label, retained draft and Cancel/Send. Existing email signup delivery is not a feedback-submission API. Before implementation, choose an approved support link or design a real bounded submission workflow with status, abuse limits and privacy. The latter is H2. Never display a working Send that only clears the form locally. Do not automatically attach private manuscripts, screenshots, environment credentials or logs. User-initiated attachments need their own defined policy.

Release notes can begin as maintained static documentation with real links (H1 content). Personalized unread/update tracking and notification delivery require explicit persistence/contracts (H2). Contextual assistance is not an AI chat feature; AI remains disabled by default and proposal-only within the existing configured scope.

## Acceptance and review

Verify start, dismiss at every step, restart, Back, Finish, missing/disabled/deleted target, expired session, save failure, pane collapse, narrow viewport, keyboard-only, screen-reader announcement order, text zoom and reduced motion. A new browser/device may legitimately lack local completion state; do not label it synchronized. No tour should reappear after each route change or obstruct a person already writing. Review candidate tours only after the corresponding real feature is usable.
