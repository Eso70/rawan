# Design principles

Preserve the existing Rawan identity: literary headings, clear interface text, a white feather, navy surfaces and restrained control states. The immersive onboarding redesign uses original atmospheric backgrounds with dark overlays and quiet translucent fields. Other account surfaces retain their established presentation. Consistency does not require every page to share the same layout, font size or opacity.

The current source and this documentation are the available visual authority. The named Quiet Literary Studio skill is not installed, so no exact skill-compliance claim is made. The older [design reference](../frontend-design-reference.md) retains visual history; this directory documents the current implementation.

1. Start from a real consumer. Reuse the existing component when it solves the same problem; otherwise keep a pattern feature-owned until actual repetition justifies extraction. Do not implement the brief's entire inventory speculatively.
2. Preserve semantics. Actions use buttons, destinations use anchors, selections use native inputs/selects, disclosures use details/summary and modal search uses dialog. Shared controls pass native attributes, events and React 19 refs through.
3. Keep state in its owner. Auth credentials/provider state, onboarding revisions, media observers and scroll choreography stay feature-owned. Generic controls do not fetch, route, validate policy or change roles.
4. Reuse values before inventing them. Start with `styles/tokens.css`; retain existing context-specific recipes and breakpoints. Do not round the marketing 4.2px rhythm to a new scale or force translucent login fields onto setup.
5. Make state legible. Disabled actions remain disabled; selected choices remain distinct; busy actions expose loading state and specific text. Failure stays recoverable without discarding the user's saved work.
6. Keep motion optional. Preserve hidden-tab/off-screen cleanup and reduced-motion branches; decorative movement must not control whether a form can be completed.
7. Preserve meaning and ownership. Legal text requires authorized edits; samples remain samples; unavailable functionality stays unavailable. Neither a theme switch nor a dashboard is implied by a component inventory.

Future Author Studio and Reader Experience should compose these fonts, tokens, native controls, branding and recovery conventions, while adding their own task-appropriate density and navigation only when those features are implemented. Do not copy the landing page's long scroll stages into productive interfaces.
