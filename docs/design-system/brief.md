# RAWAN — DESIGN SYSTEM CONSOLIDATION & DOCUMENTATION

Before starting the Author Studio and Reader Experience, perform a complete frontend design-system audit, component refactoring, and documentation phase.

Your goal is to turn Rawan's existing frontend into a **clean, maintainable, reusable, fully documented design foundation** for all future pages.

This phase covers:

- Homepage / landing page
- Login and registration pages
- Onboarding pages
- Terms of Service page
- Privacy Policy page
- Shared layouts and navigation
- All existing UI components, styles, interactions, and design patterns

Use the existing Rawan Design Skill and current visual identity as the source of truth.

**Do not redesign the website. Preserve its existing appearance, behavior, content, and responsiveness unless a change is necessary to fix a confirmed issue.**

## Part 1 — Full frontend audit

Inspect the entire existing frontend and identify:

1. Every page, route, and layout.
2. Every reusable UI component.
3. Every component implemented directly inside large page files.
4. Repeated HTML, JSX, styling, and interaction patterns.
5. Existing typography, fonts, colors, spacing, borders, radii, shadows, icons, and animation styles.
6. All buttons, checkboxes, radio buttons, switches, dropdowns, selects, text inputs, textareas, dialogs, tooltips, popovers, menus, tabs, accordions, notifications, and form controls.
7. Header, footer, navigation, mobile menus, and responsive behavior.
8. Authentication and onboarding UI dependencies.
9. Accessibility, keyboard navigation, focus behavior, loading states, error states, and validation patterns.
10. Existing third-party UI dependencies and opportunities to consolidate components.

Document the findings before making significant changes.

Identify which components already exist, which should be extracted, which should be consolidated, and which genuinely need to be created.

Do not create components without an actual use case.

## Part 2 — Refactor into practical reusable components

If the homepage or other pages contain large monolithic components, split them into smaller, meaningful components.

For example, the homepage might be organized as:

```text
features/marketing/
├── components/
│   ├── HeroSection.tsx
│   ├── FeaturesSection.tsx
│   ├── ShowcaseSection.tsx
│   ├── CallToActionSection.tsx
│   └── ...
└── pages/
    └── HomePage.tsx
```

This is an example only. Inspect the real homepage and extract components based on what actually exists.

Follow these rules:

- Keep page files focused on composition.
- Separate shared components from page-specific components.
- Separate business logic from visual presentation where useful.
- Extract repeated functionality.
- Avoid excessive fragmentation into meaningless tiny files.
- Avoid premature abstraction.
- Preserve existing functionality and visual appearance.
- Use clear naming conventions and predictable imports.
- Do not move code merely for the sake of creating folders.

Use the existing monorepo and shared UI package architecture appropriately.

If the marketing website and application are separate Next.js apps, respect that separation and avoid unnecessary cross-app coupling.

## Part 3 — Build a native-feeling Rawan UI component system

Create or consolidate a library of **custom-designed Rawan components**.

By custom, I mean that components must visually and behaviorally belong to Rawan rather than looking like unmodified browser defaults or generic third-party UI kits.

Prefer semantic native HTML elements for basic controls, with custom Rawan styling and behavior.

For complex accessible interactions, reuse existing proven primitives where appropriate rather than rebuilding accessibility behavior from scratch.

Do not replace reliable accessible infrastructure simply to claim everything is custom.

### Component categories

**Actions**

- Button
- IconButton
- ButtonGroup
- LinkButton
- LoadingButton

**Form controls**

- TextInput
- Textarea
- Checkbox
- Radio
- RadioGroup
- Switch
- Select
- Combobox, only if needed
- SearchInput
- FormField
- FieldLabel
- FieldDescription
- FieldError

**Overlays and menus**

- Dialog / Modal
- DropdownMenu
- Popover
- Tooltip
- ConfirmationDialog

**Navigation**

- Header
- Footer
- NavigationMenu
- MobileNavigation
- Tabs
- Breadcrumbs, where needed

**Feedback**

- Alert
- Toast
- LoadingIndicator
- Skeleton
- EmptyState
- ErrorState
- ProgressIndicator

**Content and layout**

- Container
- Stack
- Grid
- Divider
- Card
- Badge
- SectionHeading

This is a component inventory, not an instruction to implement every component immediately.

Prioritize components already used by the homepage, authentication, onboarding, and legal pages.

Create additional primitives only when they are necessary for those pages or clearly remove existing duplication.

### Requirements for every shared component

- Fully typed TypeScript props
- Consistent naming and API design
- Accessible semantic structure
- Keyboard support
- Visible focus indicators
- Disabled, loading, error, and selected states where relevant
- Dark/light theme compatibility where supported
- Responsive behavior
- Design-token-based styling
- Minimal unnecessary dependencies
- Support for composition and customization
- Appropriate automated tests

Custom dropdowns, menus, and dialogs must handle focus, keyboard navigation, dismissal, and screen-reader semantics correctly.

Do not replace native select controls with inaccessible clickable divs.

## Part 4 — Consolidate design tokens

Audit and centralize the existing design language.

Document and standardize:

- Color palette
- Background and surface levels
- Typography families
- Font sizes and weights
- Line heights
- Letter spacing
- Spacing scale
- Border colors and widths
- Border radii
- Shadows
- Layout widths and breakpoints
- Icon sizing
- Animation durations and easing
- Focus indicators
- Z-index conventions
- Dark and light themes

Use CSS variables and the existing styling architecture.

Replace duplicated hardcoded values where appropriate.

Do not change established colors, typography, or spacing simply to introduce a new token system.

Ensure marketing pages, authentication, onboarding, and legal pages remain visually consistent while allowing different layouts.

## Part 5 — Homepage documentation

Create detailed documentation of the **actual implemented homepage design**.

Include:

1. Page purpose and content hierarchy.
2. Full section order.
3. Component tree.
4. Component responsibilities.
5. Source file locations.
6. Layout structure and responsive behavior.
7. Typography and font usage.
8. Color and spacing tokens.
9. Buttons, links, and navigation behavior.
10. Hover, focus, loading, and animation behavior.
11. Images, illustrations, icons, and other assets.
12. Accessibility considerations.
13. Mobile-specific behavior.
14. Dependencies on shared components.
15. Guidance for safely extending or modifying the homepage later.

Document what exists in the code. Do not invent design details or features.

## Part 6 — Authentication and onboarding documentation

Document the complete UI architecture of:

- Login
- Registration
- Password recovery, if implemented
- Onboarding

For each page, document:

- Component hierarchy
- Layout and styling
- Form fields and validation
- Interaction states
- Error handling
- Loading behavior
- Accessibility
- Responsive behavior
- Authentication/API integration boundaries
- Reused shared components

Do not expose secrets or sensitive implementation details in documentation.

Preserve the existing authentication and onboarding workflows.

## Part 7 — Terms and Privacy pages

Audit the existing Terms of Service and Privacy Policy pages.

If they already exist:

- Refactor repeated layout and typography into reusable legal-page components.
- Preserve the current legal text exactly unless explicitly authorized to change it.
- Improve semantic structure, accessibility, responsive readability, and navigation where necessary.

If they do not exist:

- Create reusable legal-page layouts and clearly identified placeholder states only if appropriate.
- Do not invent legally binding Terms of Service or Privacy Policy content.
- Report missing legal content as a blocker requiring approved text.

Document:

- Legal-page structure
- Shared typography
- Heading hierarchy
- Content width
- Table of contents, if present
- Link styling
- Mobile behavior
- Accessibility
- Policy version and effective-date display, if available

Ensure that authentication and onboarding links to Terms and Privacy point to real, appropriate routes.

Do not change user consent requirements or legal policy behavior without approval.

## Part 8 — Component documentation and examples

Create a practical design-system reference for future development.

Document each implemented shared component with:

- Component name
- Purpose
- Source file
- Props and types
- Variants and sizes
- Default behavior
- Interactive states
- Accessibility requirements
- Usage examples
- Do's and don'ts

Include guidance on when to use a shared component versus creating a feature-specific component.

Provide examples for forms, buttons, dropdowns, dialogs, navigation, and common layouts where implemented.

If the project already uses Storybook or an equivalent component-preview system, reuse it.

Do not add a large documentation framework unless it provides clear value and fits the current architecture.

## Part 9 — Quality assurance

After every major part:

1. Review the changes against the requirements.
2. Run relevant lint, type checks, tests, and builds.
3. Fix errors before proceeding.
4. Verify that existing behavior is preserved.
5. Report the completed work and actual verification results.

Specifically test:

- Homepage appearance and functionality
- Desktop and mobile layouts
- Login and registration flows
- Onboarding navigation and form controls
- Terms and Privacy links
- Keyboard accessibility
- Form validation
- Dropdowns, dialogs, and focus management
- Dark/light theme behavior where supported
- Shared component consistency
- No broken imports or routes

Use visual regression comparisons if the existing test infrastructure supports them.

Do not claim pixel-perfect preservation without evidence.

## Part 10 — Final documentation and handoff

Create a clear documentation structure, adapted to the repository:

```text
docs/design-system/
├── README.md
├── design-principles.md
├── tokens.md
├── typography.md
├── components.md
├── accessibility.md
├── responsive-design.md
├── homepage.md
├── authentication.md
├── onboarding.md
└── legal-pages.md
```

Avoid duplicate documents if equivalent documentation already exists.

Include a component inventory showing:

- Existing components
- Refactored components
- Newly created components
- Shared versus feature-specific components
- Component ownership and locations

Also provide:

- Final folder structure
- Summary of refactoring
- Documentation index
- Tests and build results
- Known issues
- Missing legal or design requirements
- Recommendations for the future Author Studio and Reader Experience

## Important constraints

- Preserve the current Rawan visual identity.
- Use the existing Rawan Design Skill.
- Do not redesign the homepage.
- Do not rewrite approved legal text.
- Do not break authentication or onboarding.
- Do not introduce unnecessary dependencies.
- Do not build an entirely new UI framework.
- Do not overengineer simple native controls.
- Do not create unused components.
- Do not create author or reader dashboards.
- Do not implement unrelated backend functionality.
- Do not deploy the application.

**Work incrementally. After each part, verify the changes, fix issues, and report results before moving forward.**

If a significant design or architecture decision is unclear, document the options and ask before making a potentially disruptive change.

### Final objective

Create a **fully documented, maintainable Rawan frontend design foundation** where the homepage, authentication, onboarding, and legal pages use consistent, custom-styled, accessible, reusable components.

The result should make future Author Studio and Reader Experience development faster, safer, and visually consistent without requiring repeated design decisions.
