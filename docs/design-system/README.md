# Rawan design system

An independent mock Author Studio now consumes the literary direction at `/studio`. See [implementation and backend boundaries](../author-studio-v1.md). The reference proposals below retain their research status; the mock prototype does not establish new backend capabilities.

## Proposed visual-reference research

The cumulative VVD reference study is documentation-only and separate from the implemented system below. It analyzes 23 supplied screenshots across two batches and proposes an original Quiet Literary Studio direction; it does not authorize frontend implementation or replace existing tokens.

- [Visual analysis](references/vvd-visual-reference-analysis.md) and [image register](references/rawan-reference-image-register.md)
- [Rawan direction](references/rawan-visual-direction.md) and [proposed tokens](references/rawan-design-tokens-proposal.md)
- [Component patterns](references/rawan-component-patterns.md) and [workspace layouts](references/rawan-workspace-layouts.md)
- [Onboarding and tours](references/rawan-onboarding-and-guided-tours.md) and [implementation roadmap / review decisions](references/rawan-design-implementation-roadmap.md)

Current implementation reference, consolidated 18 October 2026. This directory describes the frontend that exists and the reusable foundation for future Author Studio/Reader work. It does not introduce either product experience or a new visual design.

## Start here

| Reference                                       | Contents                                                                                               |
| ----------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| [Audit and plan](audit.md)                      | Findings recorded before significant changes, extraction decisions, dependencies and verification plan |
| [Design principles](design-principles.md)       | Identity, ownership, native semantics and abstraction rules                                            |
| [Tokens](tokens.md)                             | Complete consumed registry, palette/surfaces, geometry, typography, motion/layers and theme limits     |
| [Typography](typography.md)                     | Actual supplied font faces/weights, roles, sizes, leading and fallbacks                                |
| [Components](components.md)                     | Typed APIs, current recipes/states, examples, component inventory and ownership                        |
| [Accessibility](accessibility.md)               | Labels, errors, keyboard/focus, native dialogs/disclosures, reduced motion and testing limits          |
| [Responsive design](responsive-design.md)       | Existing content measures, breakpoints and mobile behavior                                             |
| [Homepage](homepage.md)                         | Actual section order/tree, content, assets, interactions and safe extension                            |
| [Authentication](authentication.md)             | Provider choice, email login/signup/code UI, states and integration boundary                           |
| [Onboarding](onboarding.md)                     | Controlled presentation, five-step flow, validation/recovery and shared controls                       |
| [Immersive onboarding](immersive-onboarding.md) | Latest presentation redesign plan, artwork and verification evidence                                   |
| [Legal pages](legal-pages.md)                   | Existing shared shell, exact-content preservation, typography and draft status                         |
| [Verification and handoff](verification.md)     | Per-part outcomes, commands, browser/visual evidence, limitations and next-phase guidance              |
| [Original brief](brief.md)                      | Supplied consolidation requirements                                                                    |

The named Quiet Literary Studio skill remains unavailable. Current source and these documents are the available visual authority; exact compliance with an absent skill is not claimed. The older [frontend design reference](../frontend-design-reference.md) retains historical context and links here as the current consolidation reference. Canonical onboarding/backend contracts remain in [the onboarding guide](../onboarding-guide.md), not duplicated into a design package.

## Current routes and layouts

One Next.js app, `apps/website`, owns all these routes. There is no second application or shared UI workspace package to couple here.

| URL                     | Source under `apps/website/src/app`       | Presentation/owner                                                  |
| ----------------------- | ----------------------------------------- | ------------------------------------------------------------------- |
| `/`                     | `page.tsx`                                | Composed six-section homepage and shared public navigation/footer   |
| `/login`                | `(auth)/login/page.tsx`                   | Login/signup/code states in `features/auth`                         |
| `/onboarding`           | `(onboarding)/onboarding/page.tsx`        | Authenticated new-account setup in `features/onboarding`            |
| `/library`              | `library/page.tsx`                        | Existing 12-cover sample catalogue; local search dialog             |
| `/terms`                | `terms/page.tsx`                          | Original draft text inside shared LegalPage                         |
| `/privacy`              | `privacy/page.tsx`                        | Original draft text inside shared LegalPage                         |
| `/account`              | `(application)/account/page.tsx`          | Existing session guard/redirect; no new account UI                  |
| `/workspace`            | `(application)/workspace/page.tsx`        | Existing guarded empty workspace shell                              |
| `/workspace/reader`     | `(application)/workspace/reader/page.tsx` | Existing minimal light shell/header; not a completed reader product |
| `/auth/google/complete` | `auth/google/complete/page.tsx`           | Correlated popup completion utility                                 |
| Framework 404           | Next default                              | No new custom error route                                           |

`layout.tsx` is the English root document, metadata/font/global-style owner. `(onboarding)/error.tsx` and `(application)/error.tsx` delegate recovery to the existing setup error component. The auth/onboarding/application groups preserve URLs; there are no additional nested visual layouts. `/auth/email`, `/auth/logout`, `/auth/google`, `/auth/google/callback`, `/auth/google/result` and `/api/setup` remain existing server handlers, not designed product pages.

## Final source organization

```text
apps/website/src/
  app/                          # public composition, route groups and existing handlers
  components/
    ui/controls.ts              # seven consumed native primitives, typed refs/props
    shared/                     # BrandMark and supplied link constants
    legal/                      # existing LegalPage and typography
    library/                    # existing sample cards/catalogue/search
    toolkit/toolkit-media.tsx   # extracted icon and video presentation
    community/                  # extracted reel and static genre/reel metadata
    *-section.tsx               # retained meaningful marketing section owners
    landing-* / site-footer    # shared public layout/navigation
  features/
    auth/                       # original provider/credential UI, hooks and server adapters
    onboarding/
      onboarding-page.tsx       # controller/composition and recovery
      components/               # extracted OnboardingFields, InterestPicker and recovery views
      hooks/ services/ server/  # existing persistence/routing boundaries
  styles/
    globals.css                 # font faces/reset/shared public surface/reduced motion
    tokens.css                  # 92 consumed existing-value tokens
```

No public asset, policy text, authentication system, database schema or API contract changed in this phase. No dependencies, dashboard routes, UI framework or documentation site were added. Shared controls preserve feature-specific class recipes rather than replacing the existing design with a uniform kit.

## Future development

Read the relevant page reference, reuse real shared components/tokens, and keep product state/security in its owning feature/server package. Add a primitive only when a real consumer needs it. Build future Studio and Reader navigation/layout deliberately instead of copying marketing scroll choreography. Preserve one account with separate preferences and authorization, safe routing and existing account compatibility. Review the known verification/release limits before treating this as a production-readiness certificate.
