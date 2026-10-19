# Rawan — Quiet Literary Studio: proposed direction

19 October 2026. Research proposal using [23 references](rawan-reference-image-register.md). This is an addition to the existing [implemented design system](../README.md), not a replacement or authorization to change it.

## Identity and authority

Rawan centers on literary works, their private development and their approved reader experience. A project can support research or worldbuilding without producing a published book. Author and reader are experience preferences, not new authorization roles. Public reading must consume approved immutable releases, never private owner endpoints.

“Quiet Literary Studio” is the user's requested direction. No skill with that name is installed in the supplied skill catalog; no unavailable skill is claimed as an authority. Current fonts, tokens, brand assets and native controls are the implementation baseline. The user's supplied charcoal/gold palette is a provisional future direction. This research does not install skills, introduce dependencies or apply new CSS.

## Adopt, reinterpret, reject

| Reference principle                                   | Original Rawan adaptation                                                     | Boundary / trade-off                                                                              |
| ----------------------------------------------------- | ----------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| Compact chrome around a large work area (4/12/28)     | Short project header, collapsible contextual navigation, primary writing area | Author home still needs clear project discovery; do not make all entry points icon-only           |
| Literary document titles and quieter metadata (19/23) | Lora titles/prose and Inter controls using current self-hosted families       | Existing marketing and account font roles stay intact; no wholesale typography migration          |
| Floating dark document (13–19)                        | Opaque document page plus optional contextual side panel                      | Level 1 first; no desktop window manager required                                                 |
| Contextual settings (1)                               | Short anchored view controls with named scope and reset                       | Reader typography may sync through preferences; graph spacing does not gain storage automatically |
| Voluntary focused tutorials (13–18)                   | Restartable task guidance with explicit dismiss and accessible target         | Account setup remains separate; no closing summary after its final step                           |
| Spatial visualization (20/23–26)                      | Bounded project canvas/maps with list alternatives                            | Semantic colors belong to data, not all application controls                                      |
| Blurred environments (4/12/28)                        | Optional original static atmosphere behind selection/worldbuilding homes      | Solid focus surfaces for long writing, reading and research                                       |
| Help/feedback as part of the shell (2/3)              | Integrated original help content and support entry                            | Feedback submission requires an actual supported destination                                      |

Reject reference logos, artwork, named fictional examples as default product content, branded path terminology, proprietary icons, marketing copy and exact composition. Use existing Rawan mark and Tabler icons. Ordinary writing must never require a map, graph, faction or elaborate setup.

## Experience separation

**Author home:** a restrained productivity view of owned projects, clear creation and navigation. Prefer a real project list and contextual next actions over invented word streaks, task counts or recommendation cards. “Recent” or aggregate statistics require demonstrated query support before being promised.

**Project studio:** writing is the default useful path. Optional modules live beside it: research, notes, entities, plot, chronology, media and visual tools. Preserve the Project → Book → Chapter → Scene hierarchy and distinguish Work identity from private source organization. Do not rename every project a World or assume every Book is a public release.

**Reader home and library:** covers, titles, creator credits, saved status, collections and supported continuation. Readers do not receive an author dashboard or project rail. Discover uses eligible catalogue filters and editorial/shared collections where supported; no trending or personalized recommendation claims.

**Book reader:** quiet prose measure, adjustable text, optional contents and sparse contextual actions. No dotted background, ambient parallax, floating document desktop or creation toolbar. Comic reading uses approved graphic manifests and authored panels, not the prose page template. Reader annotations stay private.

The experiences share fonts, semantic controls, focus quality, surface families and brand mark. Their navigation, density and task hierarchy differ deliberately. Switching experience does not change account permissions or publish anything.

## Five color responsibilities

1. Brand identity: existing Rawan artwork and literary character; the proposed warm gold is an accent candidate, not a new logo palette decision.
2. Application surfaces: neutral near-black/charcoal candidates and the existing navy baseline; choose opaque surfaces for content.
3. Interaction semantics: focus, selection, errors and success use separate roles. A gold brand accent must not become the only focus or validation signal.
4. Visualization: categorical map/graph colors with text, icon and/or pattern redundancy. Blue region is not blue active navigation.
5. Atmosphere: context artwork contributes broad color outside the text surface and can be disabled independently of theme.

## Atmosphere policy

Allow original still artwork on project selection, optional creator introduction and worldbuilding/canvas surroundings. Default to a low-detail prepared image or gradient rather than nested backdrop blurs. Use one full-surface backdrop, a darkening layer and foreground opaque content. Reader/writer focus, settings and research documents use solid surfaces.

Decorations must not determine loading readiness. Render usable controls immediately over the fallback; failed artwork must not block a form. Respect reduced motion and plain-background preference. Avoid background downloads when focus mode has no need for them. Verify worst-case light artwork, browser zoom, narrow screens and visible focus rather than evaluating only a dark screenshot.

## Density and hierarchy

Use 14–16px UI text and larger adjustable literary text; allow metadata to be quieter without making it unreadable. A pane loses secondary chrome before losing readable content width. Place the primary action near its task, give empty states one next useful action, and make optional tool discovery secondary. Destructive controls remain deliberate and distinct from close/dismiss.

Do not transfer the reference's very wide paragraphs, dense marker collisions or tiny header utilities. Reference compactness comes from hierarchy; Rawan can keep that hierarchy with larger hit areas and clearer labels. Use subtle borders and surface changes before shadows; reserve modal dimming for actual blocking tasks or explicit tutorial mode.

## Decision conflicts and review gate

| Conflict                                                            | Resolution during research                                                 | Decision still needed before implementation                                          |
| ------------------------------------------------------------------- | -------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| Existing navy/white identity vs proposed charcoal/gold              | Preserve current tokens; define candidate studio semantic roles separately | Choose navy-first or neutral-first studio default and approve real contrast examples |
| Existing page-specific typography vs proposed serif literary system | Reuse existing Lora/Inter; no global font reassignment                     | Review a document and reader specimen before extending roles                         |
| Immersive account setup vs no extra section after finish            | Keep existing setup and direct workspace navigation                        | Optional future tour invitation belongs inside the destination, not between routes   |
| Reference multi-window composition vs empty Rawan shells            | Level 1 pages/context panels first                                         | Select the first useful split-view workflow before investing in Level 2              |
| Arbitrary facts/aliases vs typed entity schema                      | Show actual fields and explicit relationships                              | New schemas/inline mention format need product approval and relevant ADR             |
| Team demonstration vs private project ownership                     | Retain H3 classification                                                   | Collaboration requires a separate future proposal, not a UI badge                    |

Approval questions are consolidated in the [roadmap](rawan-design-implementation-roadmap.md). Pending choices do not prevent completing documentation. No application implementation is authorized by this study.
