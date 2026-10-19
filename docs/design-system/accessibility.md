# Accessibility and interaction contracts

This is implementation guidance, not a WCAG certification. Browser keyboard/DOM checks are recorded in `verification.md`; no screen-reader/OS matrix or universal contrast certification is claimed.

## Native foundations

Use the shared Button/IconButton, TextInput, Checkbox, Radio, Select and FieldError where their behavior matches. They render real native elements with no extra wrapper and preserve native props/ref handling. Every input still needs a visible or visually hidden label. Choice labels provide the larger hit area. Do not replace selects or radios with clickable divs.

The global cursor recipe gives enabled buttons, linked anchors, disclosure summaries, selects/options, actionable input types, selection labels and semantic action roles a pointer cursor. Disabled controls and labels containing disabled inputs use the default cursor. Text fields retain their text cursor; specialised canvas grab interactions keep their feature-owned cursor. Cursor styling does not create click handlers or replace real disabled behavior.

An icon-only action must have a meaningful accessible name (`IconButton.label`) and decorative SVG content marked hidden. Disabled is an actual native state, not only reduced opacity. Form submission requires explicit `type="submit"`; Button otherwise defaults to `button`. Use its `loading` state with descriptive text, plus a form-level live status where appropriate. Avoid adding spinners that move layout or replace an accessible label with nothing.

## Errors and focus

Keep IDs stable. Associate errors/help through `aria-describedby`, mark affected text controls invalid, and render field errors as alerts. Onboarding focuses its error paragraph or new step heading and preserves native radio grouping. A generic FieldError does not perform validation, move focus or decide which field failed; its consumer owns that behavior. Provider notices/copy feedback may use polite status instead of interruptive alerts.

Global button/link focus is a 2px white outline with 5px offset. Login and onboarding text inputs/selects share the login focus border/fill recipe in `components/ui/form-input.module.css`. Choice/chip `:has(input:focus-visible)` outlines the larger label. Preserve local outlines, especially on controls inside translucent backgrounds. Keep the onboarding skip link keyboard-visible.

## Dialogs and disclosures

Library search retains native `dialog.showModal()`, which supplies top-layer modal behavior. It labels the dialog, focuses the search input on open, supports Escape/backdrop/close-button dismissal, native Tab traversal and arrow-key result selection, restores body scrolling and resets the query on close. Do not copy the search-specific query/keyboard code into a generic modal framework. Search mounts only on Library.

`LoginLanguage` and Footer Resources retain native details/summary. Summary is the trigger; no ARIA menu role is invented for an ordinary list of links. Language supports Escape with summary-focus recovery and outside-pointer dismissal. Only English is offered. If a future complex combobox/menu is needed, evaluate a proven accessible primitive before writing focus logic from scratch.

## Motion, touch and themes

Global reduced-motion CSS removes transitions/keyframes; feature Motion/Lenis/media logic also checks preferences, visibility and unmount cleanup. Current tests inspect CSS and exercise available keyboard/viewport behavior; OS preference combinations need manual coverage.

Onboarding actions, labels/chips and utility links have 44px targets. Older marketing/login/search controls have some smaller existing dimensions; consolidation deliberately preserves them and does not claim a universal 44px minimum. Review target sizes in context when those features are changed. Mobile hover cannot be the only way to reach essential controls.

The immersive onboarding background is `aria-hidden`, pointer-inert and uses empty image alternatives. Dark overlays support text readability; image failure leaves a static navy atmosphere and never blocks form interactions. Scene changes are opacity-only, without parallax or video. Reduced-motion rules remove background transitions and question/field entrances. Browser keyboard/focus and loaded CSS rules were checked; an OS reduced-motion and screen-reader matrix remains manual verification. See [the redesign report](immersive-onboarding.md).

Dark surfaces are implemented; there is no general light-theme toggle. The old reader shell explicitly sets light color scheme. Respect native color-scheme declarations and do not invert sample art, legal text or selection-state meaning automatically. Unsupported RTL languages remain absent.

## Review checklist for future changes

Test keyboard-only entry, visible focus, labels, heading order, Escape, Tab/Shift+Tab, radio arrows, checkbox Space and native select interaction. Exercise missing/invalid input, loading, network error, session expiry, stale revision and recovery. Check narrow width/zoom, reduced motion and a real screen reader before claiming release-level accessibility. Never rely solely on a screenshot or static markup test.
