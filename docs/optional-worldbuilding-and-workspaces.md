# Optional worldbuilding and configurable workspaces

Implementation update (12 October 2026): originally Horizon 2 backend scopes N01–N26 are now implemented in bounded form; see the [current backend guide](backend-horizon-2.md) and [validation ledger](backend-horizon-2-implementation.md). These backend capabilities are available to a future frontend. Horizon 3 remains deferred and no frontend changes accompany this implementation. The study below preserves its original research baseline; its old capability gaps/horizon labels must be read alongside the current register, not as current implementation status.

## Mandatory product horizons

The [feature register](product-horizons.md) supplies current support, backend gaps, frontend/data implications and ADR requirements. Visibility preferences never grant capabilities or change publication/access.

| Horizon                 | Major recommendations and register IDs                                                                                                                                |
| ----------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| H1 — Current Rawan      | Existing optional project tools (C02–C09), simple navigation/local pins/presets/reset/geometry (C10); no stored layout contract                                       |
| H2 — Near future        | Synced defaults/overrides and persisted views (N16/N17), structured research (N18), maps/layouts (N19), real comic organization (N21), selected released lore (N15)   |
| H3 — Long-term platform | Shared universes (L02), shared team layouts/collaboration (L09), adaptive/automatic complex arrangements (L11); broad work-centered identity (L01) guides naming only |

Research date: 12 October 2026. This document proposes progressive disclosure for creator workflows and separates interface preferences from backend capabilities. No workspace layout, preset, tool-toggle API or frontend redesign is implemented.

## Research basis

Nielsen Norman Group describes progressive disclosure as exposing important options first and making specialized options clearly available on request. It distinguishes this from a compulsory sequence of wizard steps and stresses the importance of discoverability. Rawan should not make worldbuilding setup a mandatory stage before writing. [Progressive disclosure](https://www.nngroup.com/articles/progressive-disclosure/).

Notion documents property visibility within views. This is a useful example of changing presentation without implying that hidden information is deleted. It is not evidence that hiding UI enforces privacy. [Notion properties](https://www.notion.com/help/database-properties).

VS Code documents profiles associated with workspaces and separates user settings from workspace settings. These illustrate explicit customization scopes; Rawan should borrow the principle without copying a developer tool's complex settings system. [Profiles](https://code.visualstudio.com/docs/configure/profiles), [Settings scopes](https://code.visualstudio.com/docs/configure/settings).

The recommendations below are Rawan-specific design inferences, not findings from interviews or tests with Rawan creators. Default tool placement needs future task observation and usability evaluation.

## Worldbuilding's product role

Worldbuilding is a powerful optional layer, not the identity or required skeleton of every Rawan work. Projects remain private creative containers that can hold manuscripts, research and supporting organization. An author need not create a World, choose a fantasy template or enter fictional entities before writing.

Some tools commonly grouped under worldbuilding are also broadly useful: people, places, relationships, dates and references can support romance, history, biography, nonfiction or comics. Present their purpose in plain terms without describing every real-world research record as fictional lore.

Avoid collapsing Writing, Research, Planning and Story/World Organization into a compulsory World screen. Keep the work in focus and let supporting material appear when useful. A creator may move between these tools during one session; do not force a linear lifecycle wizard.

## Existing backend: optional tools, no configurable layout

CreateProject currently requires a title and accepts an optional description. It does not require a work type, book, character, faction, timeline or plot. The schema's related collections can be empty. Worldbuilding resources are project-owned and created through their own endpoints.

There is no independent World model, map model, general lore type, canvas-layout model or workspace-preference persistence. `UserOnboarding` stores account experience/interests/goals and legacy progress; these validated fields are not a generic tool-layout object or per-project configuration. Author/reader/both/explore preferences do not determine worldbuilding permissions.

The existing author dashboard body is empty by design. This research does not populate it. It describes a future client of the current API and identifies additions requiring separate backend scope.

## Progressive disclosure proposal

| Disclosure level  | Proposed contents                                                        | Behavior                                                                          |
| ----------------- | ------------------------------------------------------------------------ | --------------------------------------------------------------------------------- |
| Primary workspace | Current manuscript or selected task, project context, a few pinned tools | Start productive work without an inventory of every capability                    |
| More tools        | A labeled, searchable list of supported tools with concise purposes      | Available through a consistent visible action; allow pin/open without extra setup |
| Tool detail       | Advanced fields, filters, links or associations relevant to that tool    | Keep frequently used actions visible; defer rarely used detail within context     |

Do not hide essential save/error states, navigation or relationships needed to understand the open resource. Prefer a shallow two-level tool discovery pattern over nested menus and terminology-heavy configuration.

Suggested task groups are **Writing**, **Notes & References**, **Planning**, and **People & Places / Story Organization**. A grouping can contain several capabilities without implying a new backend resource. When useful, **Worldbuilding** can be a named group for creators who seek it, rather than the mandatory top-level destination.

The primary writing path should remain simple: select a project and manuscript, navigate chapters/scenes, write. Supporting tools can open in a side panel or separate view, according to available space. Reordering or hiding them should not disrupt that path.

## Example configurations, not fixed genre rules

| Creator need                | Useful initially visible tools                                                               | Current capability limits                                                                                |
| --------------------------- | -------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| Romance                     | Writing, characters, relationships, places, notes                                            | No specialized romance workflow is implemented                                                           |
| Historical fiction          | Writing, notes/references, timelines, places, characters                                     | Private files/notes exist; structured citations, historical calendars and source bibliography do not     |
| Fantasy series              | Writing, characters, places, factions, artifacts, relationships, timelines/eras, notes/media | Series, maps, explicit lore types and public worlds require future backend work                          |
| Nonfiction                  | Writing, notes/references and private search                                                 | Character-like records need honest schema mapping; there is no general research-person or citation model |
| Comic planning              | Notes/scripts as text, characters, places, relationships, plot/timeline, media references    | Comic page/panel/script structure and artwork publishing do not exist                                    |
| Research/world-only project | Notes, private media, relevant entities/timelines                                            | No manuscript is required; dedicated cross-project universe/research models remain future scope          |

These examples are optional starting arrangements. A romance writer may need factions; a nonfiction researcher may need complex timelines. Do not restrict available capabilities or silently choose a preset from genre, interests or account role.

Initially prefer descriptive arrangements such as **Writing focused**, **Research focused** and **Story organization** over unsupported persisted project types. Presets would change visible/pinned tools, not create sample entities or convert content. A comic-planning arrangement must not imply a comic editor, and a fantasy arrangement must not advertise a working map tool.

## Configurable workspace behavior

Start with a small amount of customization: pin/unpin supported tools, adjust their order and restore defaults. Reopening the last task can be useful, but should not interrupt a creator who deliberately chooses a different destination. Arbitrary docking, saved multi-panel canvases and complex theme/layout profiles should follow real demand.

| Choice                       | Proposed meaning                                                                 |
| ---------------------------- | -------------------------------------------------------------------------------- |
| Pin                          | Keep a tool in primary navigation                                                |
| Unpin / hide from navigation | Remove navigation prominence while preserving all content and direct access      |
| Open                         | Navigate to a supported tool; no domain records created merely by opening it     |
| Reset arrangement            | Restore visibility/order defaults; no data deletion                              |
| Apply preset                 | Preview/apply presentation changes; preserve content and explicit user overrides |

Avoid calling these actions Enable/Disable if they only change navigation. Actual feature availability, permissions, backend configuration and UI visibility are different dimensions. A hidden timeline remains available to an authorized link or search; an unsupported map capability remains unavailable regardless of a pin preference.

When a resource links to an unpinned tool, open the target in context rather than requiring the user to enable it first. Keep a clear way to pin the tool afterward. Existing content can show a restrained count/indicator when supported, but do not fetch every collection to invent counts. Never automatically delete, orphan or hide cross-links when switching arrangements.

Avoid surprise adaptive navigation that moves tools as usage changes. Suggestions such as “Pin Timeline?” may be useful later, but explicit customization should take precedence. Do not expose a complex configuration form before the creator can begin work.

## Scope and persistence implications

| Scope                               | Suitable preference                                           | Implementation boundary                                                    |
| ----------------------------------- | ------------------------------------------------------------- | -------------------------------------------------------------------------- |
| Account default                     | Preferred tool arrangement for new projects                   | Future account preference contract if synchronized; not an onboarding goal |
| Account + project override          | This creator's pinned tools/order for this project            | Future owner-scoped preference representation with versioning/validation   |
| Device/session                      | Open panel, split width, compact layout, temporary focus mode | Can be local UI state; do not copy desktop geometry into a phone view      |
| Project domain data                 | Manuscripts, characters, timelines and links                  | Existing APIs; independent of preference visibility                        |
| Future shared project configuration | Team defaults if collaboration is later supported             | New permission/override semantics; there are no shared memberships now     |

Define precedence simply: explicit per-project choices can override account defaults, while responsive layout chooses suitable geometry. A default arrangement update should not overwrite personal overrides or change existing project content.

A future synchronized preference DTO needs bounded allowed tool identifiers/order, duplicate rejection, a settings version and identity/project checks. Removed or newly added capabilities require safe defaults. Do not store unvalidated arbitrary layout JSON on Project or repurpose `UserOnboarding` fields. No new tool-list field is needed merely to demonstrate local reversible UI customization.

Project-level preference changes should not grant access to resources, enable AI providers or publish world content. Today's AI is disabled by default with only a development/test simulator; it should not appear as guaranteed available help because a workspace arrangement includes it.

## Responsive and accessible behavior

Desktop/laptop can accommodate a bounded tool rail and optional supporting panel without turning the manuscript into a narrow strip. Tablet/phone should open one primary task at a time with an accessible tool drawer and a reliable return path. Responsive collapse is not a permanent change to a creator's pinned tools.

Pinning, ordering and reset need keyboard/touch controls; dragging cannot be the only method. Tool labels and purpose descriptions should remain understandable without icons, hover or onboarding. Maintain focus through rearrangement, and keep search and More tools reachable even in focus mode.

Progressive disclosure should reduce unrelated decisions, not hide the information needed to understand the current task. Empty-state prompts should offer useful next actions without a checklist demanding every entity kind. A project with no factions/maps is complete for its purpose if the creator does not need them.

## Creator organization versus reader exposure

A configurable creator workspace has no effect on what a reader can see. Pinning Worldbuilding does not make entities public; hiding Notes does not protect them through authorization. Publication must explicitly select reader-safe content through the future [work/release bridge](create-and-experience-bridge.md).

World/universe relationships may eventually span works, but current entities belong to one project. Displaying a World navigation group does not create cross-project ownership or shared lore. Keep these product-language and domain-model distinctions explicit.

## Evolution and evaluation

1. Build the straightforward manuscript/notes client of existing APIs with a small stable primary navigation and a clearly labeled supported-tool list.
2. Add reversible local pins/order/reset only when useful; preserve the default for creators who never customize.
3. Add synchronized account/project arrangement preferences only with a separately scoped validated backend contract.
4. Add specialist tools such as maps, structured sources or comics through actual domain work, independent of workspace presets.
5. Consider advanced layouts and collaboration defaults after task research demonstrates the need.

Evaluate the user-provided romance, historical, fantasy, nonfiction and comic-planning scenarios. Include starting without configuration, finding an unpinned tool, following a link into hidden navigation, switching presets with existing data, restoring defaults, keyboard/touch reordering and moving between phone and desktop. Verify that writing remains simple, task completion does not require irrelevant tools, and no data or permissions change on hide/reset.

These are future acceptance scenarios. No usability tests, presets, capability toggles, UI changes or backend migrations were performed during this investigation.

## Repository evidence and related research

- [Project/manuscript DTOs](../apps/api/src/manuscript/manuscript.dto.ts) and [database schema](../packages/database/prisma/schema.prisma)
- [Account preference DTO](../apps/api/src/users/onboarding.dto.ts) and [account experience](account-experience.md)
- [Current capabilities](product-scope-and-backend-capabilities.md), [work terminology](works-projects-and-content-types.md) and [comic planning limits](comics-backend-implications.md)
