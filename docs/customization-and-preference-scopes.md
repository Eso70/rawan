# Customization and preference scopes

Implementation update (12 October 2026): originally Horizon 2 backend scopes N01–N26 are now implemented in bounded form; see the [current backend guide](backend-horizon-2.md) and [validation ledger](backend-horizon-2-implementation.md). These backend capabilities are available to a future frontend. Horizon 3 remains deferred and no frontend changes accompany this implementation. The study below preserves its original research baseline; its old capability gaps/horizon labels must be read alongside the current register, not as current implementation status.

## Mandatory product horizons

The [feature register](product-horizons.md) supplies all six required fields. Local presentation, synchronized settings and algorithmic personalization have different horizons.

| Horizon                 | Major recommendations and register IDs                                                                                                                                 |
| ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| H1 — Current Rawan      | Existing questionnaire (C01), local creator layout/theme/typography/focus/accessibility and supported query views (C10), local owned-draft preview appearance (C11)    |
| H2 — Near future        | Dedicated reader/graphic behavior (N03/N20/N22), synchronized scoped preferences (N16), persisted saved views/arrangements (N17), reader state kept separate (N05/N06) |
| H3 — Long-term platform | Automatic personalization/adaptive layouts (L04/L11), team defaults (L09), advanced offline/cross-device delivery (L12); no speculative settings now                   |

Research date: 12 October 2026. This study proposes customization scopes, defaults and precedence. No settings, preference store, synchronization API, reader mode or configurable layout is implemented.

## Research basis

Nielsen Norman Group distinguishes user-controlled customization from system-controlled personalization. Rawan should begin with explicit, reversible choices rather than silently infer layout or reading needs from behavior. [Customization versus personalization](https://www.nngroup.com/articles/customization-personalization/).

VS Code documents user/workspace settings and explicit precedence. This supports distinguishing portable defaults from contextual overrides without requiring Rawan to copy a developer tool's many scopes. [Settings scopes](https://code.visualstudio.com/docs/configure/settings).

Readium's Kotlin 3.2 navigator guidance distinguishes defaults, publication-specific preferences, shared preferences and settings whose availability depends on the content/navigator. This is a useful reading-system precedent; it is not a decision to install that toolkit. [Navigator preferences](https://readium.org/kotlin-toolkit/3.2.0/guides/navigator/preferences/).

W3C documents honoring reduced-motion preferences through a CSS technique. Rawan should preserve system accessibility signals when resolving settings rather than override them through a synced theme. [Reduced motion](https://www.w3.org/WAI/WCAG22/Techniques/css/C39.html).

The scope assignments below are Rawan design recommendations, not tested settings or an established universal model.

## Scope has two dimensions

**Where a choice applies** is different from **who owns it and where it persists**. A global appearance setting can apply across Rawan while remaining private to one user. Global does not mean one database value applied to every account.

| Scope                            | Meaning                                                                                                                     |
| -------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| Product-wide personal preference | The user's default across applicable Rawan modes, such as system/light/dark appearance                                      |
| Per-user mode default            | Portable creator or reader preference, such as default reading font                                                         |
| Account + project/work override  | This user's explicit choice for one private project or readable work; not a shared property of the work                     |
| Per-device/browser override      | Environment-specific choice, such as panel geometry; identified by ordinary local state rather than hardware fingerprinting |
| Session                          | Temporary focus, fullscreen, zoom or open controls in the current task                                                      |
| Authored content/capability      | Actual publication structure, reading order, language and supported modes; not user customization                           |

Creator configurations usually belong to **account + private project**; reader overrides belong to **account + work**, with edition/release scoping only where a choice depends on specific content. The Work model itself does not exist today. A comic's page/panel zoom may be tied to the current release item and session, while the user's preferred fit mode can be portable.

## Creator customization

| Candidate                        | Recommended default persistence                   | Contextual/device/session behavior                                                           |
| -------------------------------- | ------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| Workspace arrangement            | Per-user creator default                          | Optional account+project override; device adapts geometry                                    |
| Visible/pinned modules           | Per-user creator default                          | Account+project selection; hiding preserves content, links and permissions                   |
| Sidebar organization             | Per-user creator default                          | Project override for relevant tools/order; compact drawer on phone                           |
| Editor font / size / line height | Per-user writing default                          | Optional per-project exception for script/content needs; no manuscript content mutation      |
| Editor width                     | Portable narrow/standard/wide intent              | Resolve width for device; explicit project exception only when useful                        |
| Creator theme                    | Inherit product-wide appearance                   | Optional creator-mode override; device choice may take precedence locally                    |
| Focus mode                       | Session by default                                | An explicit start-in-focus preference may be added later; never hide errors or exit controls |
| Panel sizes / dock positions     | Per-device/browser, optionally project-contextual | Do not synchronize raw pixels to all devices; validate available viewport                    |
| Saved views                      | Account+project                                   | Explicit filters/sort/grouping against supported APIs; device presentation separate          |

Saved view definitions and panel layout are different. A filter such as a plot-point status can be portable; a panel width cannot safely assume the same screen. An existing personal view should not become a shared project default without a future collaboration/access contract.

Presets change presentation, not work type or data. A switch from writing-focused to research-focused must not create sample factions, erase hidden tools or change ownership. Unsupported maps/comic editors/structured citations cannot become available through a preset.

## Reader customization

| Candidate                          | Recommended default persistence                            | Exceptions and constraints                                                                   |
| ---------------------------------- | ---------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| Reading font / size                | Per-user prose-reader default                              | Optional account+work or device override; require suitable script coverage                   |
| Line height / paragraph spacing    | Per-user prose-reader default                              | Per-work exception if explicitly chosen; preserve semantic paragraphs                        |
| Margins / content width            | Portable reader intent                                     | Device resolves actual width; per-device override useful on small/large screens              |
| Reader theme                       | Per-user reader override or inherited product theme        | Work/session exceptions only by explicit choice; can differ from Library chrome              |
| Brightness-oriented presentation   | Light/dark/warm/high-contrast options                      | Local/device context; web themes are not hardware screen-brightness control                  |
| Scroll / page behavior             | Per-user preference for supported content type             | Content may not support both; reflowable pagination is a future feature, not assumed present |
| Comic fit / page-spread preference | Per-user graphic-reader default                            | Work capability and current viewport determine usable presentation                           |
| Vertical / guided-panel behavior   | Preference only among modes actually supplied by a release | No automatic conversion, invented panel order or mirrored artwork                            |
| Fullscreen / open controls         | Session                                                    | Browser permission/support and an accessible exit; no forced cross-device fullscreen         |
| Current zoom/pan                   | Session, tied to current item if temporarily retained      | Reset sensibly on navigation; not a global font-size substitute                              |

Keep prose typography and graphic-reader presentation separate. Changing reading font cannot alter lettering baked into artwork; changing comic mode cannot change the work's authored direction or panel sequence. A reader can choose an available presentation, while page progression/language/reading order remain release data.

Changing typography/theme should preserve the current content anchor. Appearance is not progress: font preferences can span works, while bookmarks, progress and highlights need identity-scoped release locations. Resetting reading appearance must not clear annotations or history.

## Global choices and accessibility

| Candidate                                 | Proposed policy                                                                                                                                    |
| ----------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| System / light / dark appearance          | Per-user product-wide default with explicit mode/device overrides where needed; System follows the current device                                  |
| Accent preference                         | Optional bounded accessible choices; not arbitrary colors that defeat focus/status contrast or tint artwork                                        |
| Reduced motion                            | Honor the current system request; allow the user to request less motion additionally, never silently re-enable it through synchronized preferences |
| Contrast, text scaling, interaction needs | Respect browser/OS preferences; offer specific useful controls only when implemented and evaluated                                                 |
| Touch target/density adaptation           | Responsive rendering, not a forced disability category or a permanent device inference                                                             |

Do not infer or store a diagnosis/disability label from accessibility behavior. Browser zoom, forced-colors/high-contrast behavior and assistive navigation should continue to work regardless of stored settings. Applying an accent or theme must not weaken semantic error/focus/selection visibility.

One mode may retain an independent theme for comfort. For example, a user can choose dark application chrome and warm reader pages. That deliberate difference remains recognizable Rawan identity through controls and typography roles; it should not be treated as inconsistent branding.

## Precedence and effective settings

For ordinary presentation keys, a proposed resolution order from lower to higher priority is:

```text
Product default
→ user-wide default
→ user creator/reader mode default
→ explicit account + project/work override
→ explicit applicable device/context override
→ temporary session override
→ capability, viewport and accessibility constraints
```

Each key only participates in relevant scopes. Do not apply all scopes to every setting, create seven settings screens, or let a device override ambiguously replace both every-book and one-book choices. An override should declare its target context. Store explicit choices sparsely; absence means inheritance, not a copied default frozen forever.

Capability/viewport constraints govern **effective rendering**, not automatic rewriting of stored intent. A desktop dual-page preference may render one page on a narrow phone without replacing the user's desktop choice. A reduced-motion request suppresses optional motion even if a theme/preset asks for animation. User reading needs must not be blocked by authored styling when the supported content is reflowable.

Changing an inherited account theme should not overwrite an explicitly chosen warm reader theme. Reset a work override to inheritance, rather than set an arbitrary competing value. Controls should make important scope understandable—such as “Use for all books” versus “Only this work”—without exposing storage jargon.

Do not sync an unsupported publication mode as if it were active. Explain unavailable choices or omit inapplicable controls. Initial recommendations favor simple defaults, a small number of common adjustments and a clear reset before extensive per-work options.

## Persistence, privacy and synchronization

- Local UI preferences can be reversible client state. Synced per-user/project/work settings require a new validated identity-scoped backend contract; they are not implemented today.
- Device here means the current browser/app environment, not a required persistent hardware ID. Local storage may be cleared/unavailable; the default experience must still work.
- Separate anonymous/device choices from authenticated settings. On sign-in, any promotion to account defaults should be intentional rather than silently overwriting existing choices.
- Scope private local/server caches to the active account and context. On account switching, prevent one person's work overrides or saved views from leaking to another. Apply theme/font early to avoid flashes and layout jumps.
- Bound supported values, tool IDs, view filters and stored sizes; reject duplicate tool orders and unknown server fields. Version preference schemas and define defaults when features are removed or changed.
- Sync explicit keys with revision/conflict semantics when needed; do not use a large unvalidated settings object where changing a font overwrites another device's sidebar changes. Failed saves need a defined retry and visible scope/status when relevant.
- Presentation changes are not author permissions, release rights, AI-provider activation or reader entitlements. A hidden module remains owner-accessible; a selected comic mode cannot create a missing backend.
- Keep preference reset separate from deleting reader progress, private projects, saved content and annotations. Restoring defaults should preserve all of those records.

A useful first implementation can remain client-local where appropriate. Cross-device persistence should be added only for choices whose portability clearly benefits the user. Do not introduce arbitrary docking-layout persistence merely because the design system supports panels.

## Customization versus future personalization

Rawan should first provide useful defaults and explicit choices. Account experience can guide a landing destination, but should not permanently lock a user out of the other side of the product. Interests/goals are not consent for recommendation tracking or enough evidence to rearrange tool navigation automatically.

Future automatic suggestions, adaptive layouts and recommendation systems need separately scoped data, consent/privacy, explanations and opt-out behavior. If later introduced, they must preserve explicit user choices and keep tools discoverable. Predictable layout is especially important during writing and reading; avoid moving frequently used tools as an invisible algorithm learns.

## Current repository support and gaps

The backend's onboarding DTO persists experience, validated interests/goals and progress/legacy fields. It does not accept reading fonts, themes, layouts, panel widths, saved views or per-work overrides. Private Work identity now exists, but the schema still has no general preferences, reader settings or reading-state model.

The website already responds to reduced motion in several landing/login components and remembers the last sign-in provider locally. These are narrow existing behaviors, not a complete customization system. Root dark styling and the dashboard's light inline styling are not synchronized appearance settings. This study does not change either behavior.

Creator saved views must use actual sort/filter allowlists; the existing API does not support arbitrary client-defined fields or group queries. Reader/comic preferences only become meaningful once supported reader content and rendering exist. No speculative values are added to the current account DTO.

## Evolution and evaluation

1. Use shared semantic controls/themes and task-appropriate defaults; no customization wizard is required before creating or reading.
2. Add a few useful reversible client-local choices alongside real supported editors/readers.
3. Scope validated account defaults for valuable portable settings and explicit account+project/work overrides only when needed.
4. Add saved views, advanced arrangements and more granular device overrides based on actual usage and task research.
5. Research automatic personalization separately; avoid a preference system that quietly behaves like a recommender.

Evaluate a desktop-to-phone switch, large Arabic/English text, user-wide dark plus warm reader override, an unsupported comic mode, panel resizing after orientation, reduced motion with animated presets, offline/failed saves, conflicting device changes, anonymous-to-account transition and two accounts sharing a browser. Confirm that reset preserves content/state, effective overrides are understandable and good defaults require no configuration.

These are proposed acceptance scenarios. No new settings, preference endpoints, schemas, UI controls or synchronization behavior were implemented during this research.

## Repository and related references

- [Current preference DTO](../apps/api/src/users/onboarding.dto.ts) and [database schema](../packages/database/prisma/schema.prisma)
- [Account experience](account-experience.md) and [global styles](../apps/website/src/app/globals.css)
- [Creator workspace scopes](optional-worldbuilding-and-workspaces.md), [reader settings](reader-experience-research.md) and [comic behavior](comics-product-research.md)
- [Visual identity](visual-identity-across-modes.md) and [work-centered architecture](work-centered-product-architecture.md)
