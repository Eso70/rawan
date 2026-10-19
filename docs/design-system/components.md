# Component reference and ownership

All source paths below are relative to `apps/website/src/`. Reusable native behavior is local to this app in `components/ui/controls.ts`; there is no separate UI workspace package or preview framework. Existing CSS Modules remain the visual recipes and now consume shared tokens. The controls add no wrapper elements, so their existing selectors, spacing, labels and native interaction remain intact.

## Shared native controls

All native props use React `ComponentPropsWithRef`, including React 19 refs, event callbacks, className, data/ARIA attributes and native validation attributes. These components perform no fetching, business validation, authentication, routing or automatic focus changes.

| Export / type                    | Purpose and props                                                                                        | States, visuals and accessibility                                                                                                                                                                                                                                |
| -------------------------------- | -------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Button` / `ButtonProps`         | Native button props plus `loading?: boolean` and `loadingLabel?: ReactNode`; `type` defaults to `button` | Loading sets `disabled` and `aria-busy`; optional loadingLabel replaces children only while busy. Native disabled remains respected. Pass explicit submit type inside forms. No global variant/size enum is invented; callers retain their actual visual recipe. |
| `IconButton` / `IconButtonProps` | Button props excluding aria-label, plus required `label: string`                                         | Supplies an accessible name on the same button. Children normally contain a decorative icon. Existing password-toggle recipe owns its 40px geometry and states.                                                                                                  |
| `TextInput` / `TextInputProps`   | Native input props; type restricted to text/email/password/search/tel/url, default text                  | Real input/ref/autocomplete/required/minLength/maxLength/inputMode/disabled/ARIA state. Consumer provides label and matching error/help IDs. Used for login, code, setup name/note and library search.                                                           |
| `Checkbox` / `SelectionProps`    | Native input props with fixed checkbox type                                                              | Controlled checked/onChange or native defaultChecked; label and grouping stay with consumer. InterestPicker owns larger target styling and selected/focus states.                                                                                                |
| `Radio` / `SelectionProps`       | Native input props with fixed radio type                                                                 | Preserve common name/value and native arrow keys. Purpose/start choices remain controlled and feature-styled. Do not use these preferences as authorization.                                                                                                     |
| `Select` / `SelectProps`         | Native select props and option children                                                                  | Keeps browser keyboard behavior and real selected value. Onboarding class supplies dark Rawan field styling. No clickable-div replacement or invented option UI.                                                                                                 |
| `FieldError` / `FieldErrorProps` | Native paragraph props excluding role, with required `id`                                                | Always renders role=alert. Optional ref/tabIndex/className support existing focus/error recipes. The component does not create labels or focus itself. Consumer associates the error with the failing field.                                                     |

`Button`, `TextInput` and `FieldError` have multiple feature consumers. IconButton serves the existing password action; Radio/Select serve repeated setup fields; Checkbox serves many real grouped interest options. These are the implemented primitives, not a promise to fill every category in the original brief.

### Visual recipes and composition

`components/ui/form-input.module.css` remains the shared text-field foundation. `LanguageDropdown` in `components/ui/language-dropdown.tsx` owns the login and onboarding language disclosure, including its shared popup CSS, outside-pointer dismissal and Escape/selection focus recovery. Compact login uses EN; the onboarding field variant shows English in full and associates its question with the trigger. English is the only supported choice. The shared Button renders a non-submit option. No menu roles or new dependencies are introduced. The former custom-select CSS has been removed.

Onboarding Continue/Finish uses one feature-owned `OnboardingContinue` component and `features/onboarding/components/onboarding-action.module.css`, shared across all six question screens. It composes `components/ui/glass-button.module.css`, shared with Google/Email sign-in, with compact onboarding dimensions. Recovery/completion links compose the same action recipe.

| Recipe                          | Source module                                  | Existing variant/size behavior                                                                                               |
| ------------------------------- | ---------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| Onboarding action               | `features/onboarding/onboarding.module.css`    | Single glass Continue/Finish button, 104×36px desktop and ≥44px high on narrow/coarse pointers. Back/Skip removed.           |
| Onboarding fields/choices/chips | Same                                           | Shared login inputs/selects; 34px glass icon chips and larger Purpose cards, with native selection states and visible focus. |
| Auth provider/submit/back       | `features/auth/components/login.module.css`    | Transparent/translucent providers, distinct 36px submit recipe, text Back, action-specific pending copy                      |
| Auth fields/password toggle     | Same                                           | Existing translucent fields, 18.6px corners, 40px visibility action, invalid border/strength feedback                        |
| Library search/trigger/close    | `components/library/library-search.module.css` | Soft translucent dialog, compact trigger/Escape action, serif search text and one active result row                          |
| Marketing link actions          | Hero/nav/closing modules                       | Existing `<a href="/workspace">` CTAs and contextual geometry; remain links rather than Button pretending to navigate        |

There is deliberately no `asChild`, polymorphic `as`, universal form wrapper, global spacing prop system or automatic theme variant. Pass a class from an established recipe and appropriate native props. A new visual recipe needs an actual consumer and a design review; it must not silently overwrite all existing buttons.

```tsx
import { Button, TextInput, Select, IconButton, FieldError } from "../components/ui/controls";

// Inside the feature's form; styles refers to that feature's token-based CSS Module.
<label htmlFor="pen-name">Preferred name</label>
<TextInput id="pen-name" className={styles.input} autoComplete="nickname"
  value={name} onChange={(event) => setName(event.target.value)}
  aria-invalid={Boolean(error)} aria-describedby={error ? "name-error" : undefined} />
{error && <FieldError id="name-error" className={styles.error}>{error}</FieldError>}
<Button type="submit" className={styles.primary} loading={pending} loadingLabel="Saving…">
  Save
</Button>

<label htmlFor="language">Interface language</label>
<Select id="language" className={styles.input} defaultValue="en">
  <option value="en">English</option>
</Select>
<IconButton label="Show password" className={styles.passwordToggle} aria-pressed={shown}>
  <EyeIcon aria-hidden="true" />
</IconButton>
```

Examples illustrate composition and require the consumer's real state/styles/icon imports; they do not establish a new save API or language list. Use a native anchor for navigation. Keep a visible label for essential inputs. Do not rely on placeholder text alone or on an unlabelled SVG for an action name.

## Existing shared composition components

| Component / location                                    | Props and defaults                               | Behavior and usage                                                                                                                                                                                 |
| ------------------------------------------------------- | ------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| BrandMark / `components/shared/brand-mark.tsx`          | `className?: string`, `priority?: boolean=false` | Supplied `/brand/logo.svg`, decorative empty alt, 28×28 intrinsic size. Pair with an accessible Rawan name/link; do not add duplicate spoken branding. Used across marketing/auth/setup.           |
| LandingScroll / `components/landing-scroll.tsx`         | `children: ReactNode`                            | Owns Lenis context, anchors, reduced-motion sync and cleanup for home/legal/library. Not for the onboarding form or future productive app surfaces by default.                                     |
| LandingNavigation / `components/landing-navigation.tsx` | `current?: "library"`                            | Shared header/nav with scroll visibility/inert state. Library current state supplies aria-current and SearchTrigger. No mobile menu, active page tabs or functioning pricing links are fabricated. |
| SiteFooter / `components/site-footer.tsx`               | `current?: "terms"                               | "privacy"`                                                                                                                                                                                         | Shared brand, Resources details/summary, legal links/copyright and supplied Discord destination. Current legal page uses aria-current.                                             |
| LegalPage / `components/legal/legal-page.tsx`           | `title: string`, `current: "terms"               | "privacy"`, `children: ReactNode`                                                                                                                                                                  | Shared header/main/named article/footer, draft-date display and responsive typography. See [legal pages](legal-pages.md); never rewrite policy children as part of a style change. |

```tsx
<LandingNavigation current="library" />
<LegalPage title="Privacy Policy" current="privacy">{approvedPolicySections}</LegalPage>
<SiteFooter current="privacy" />
```

Do not nest a second navigation/footer inside LegalPage; it already includes both. Keep marketing section layout classes local rather than introducing an unused Container/Stack/Grid abstraction.

## Feature inventory: existing, extracted and new

| Ownership                      | Components/patterns                                                                                       | Status and location                                                                                                                                            |
| ------------------------------ | --------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Shared native behavior         | Button, IconButton, TextInput, Checkbox, Radio, Select, FieldError                                        | New and consumed; `components/ui/controls.ts`; seven rendered-contract tests                                                                                   |
| Shared brand/navigation/layout | BrandMark, LandingScroll/useLandingScroll, LandingNavigation, SiteFooter, LegalPage                       | Existing, retained; tokens adopted in their styles                                                                                                             |
| Marketing hero/toolkit         | HomeHero, ToolkitSection, ConnectionsCanvas                                                               | Existing section owners; `components/*`; FeatureIcon and DemoVideo extracted into `components/toolkit/toolkit-media.tsx`                                       |
| Marketing community            | CommunitySection / Reel / genre and reel metadata                                                         | Reel extracted into `community/community-reel.tsx`; static metadata into `community/community-data.ts`; original module/style retained                         |
| Marketing narrative            | ManifestoSection with local RevealLine/Underline, CreatorsSection, WorldScene/sample data, ClosingSection | Existing cohesive interaction owners retained in their component files; no artificial generic scene abstraction                                                |
| Marketing hooks                | usePageVisible, useLandingNavigationVisibility                                                            | Existing reusable lifecycle/navigation helpers, retained                                                                                                       |
| Auth                           | LoginPage, EmailSignin, LoginHeading, LoginLanguage, LoginScene, GooglePopupComplete, useGooglePopup      | Existing feature owners; shared controls adopted where actually used; provider/security code unchanged                                                         |
| Onboarding                     | OnboardingPage, OnboardingFields, InterestQuestions, InterestPicker, SetupUnavailable, SetupError         | Fields extracted into `features/onboarding/components/onboarding-fields.tsx`; controller and established recovery components retained; shared controls adopted |
| Onboarding atmosphere          | OnboardingBackground, backgroundReducer                                                                   | Feature-owned decorative responsive image layers and readiness/failure state; no form, authentication or persistence policy                                    |
| Library                        | LibraryPage, BookCard, SearchTrigger, LibrarySearch, books                                                | Existing feature-local catalogue, card/search and empty state; shared text/action controls adopted; native modal remains local                                 |
| Application shells             | account/workspace/reader pages and application error boundary                                             | Existing guards/shells retained; no dashboard/product interface created                                                                                        |

### Dialog, disclosure and feedback examples

Use the existing `LibrarySearch` with `SearchTrigger` only inside the Library page/navigation composition. Its `dialog` handles native focus containment/top-layer semantics; its owner handles query, result navigation and cleanup. Do not mount it globally or create a second modal primitive from its feature-specific keyboard code.

Use native `<details><summary>Resources</summary>…</details>` for ordinary disclosure navigation, following SiteFooter/LoginLanguage. These are not ARIA application menus. Use `InterestPicker` for the actual grouped setup catalogue: props are `label: string`, `groups: InterestGroup[]`, `selected: string[]`, `onChange(values: string[]): void`; it owns native checkbox disclosures, not persistence.

Setup progress, privacy/help text, recovery screens, library empty result copy, auth notices/copy feedback and book cards are already implemented feature patterns. There is no shared toast service, Alert/Card/Badge toolkit, switch, textarea form, tabs, breadcrumb, combobox, skeleton or confirmation dialog. Create one only when a real feature needs it; document its keyboard/dismissal contract and test it then.

## Tests and maintenance

`test/ui-controls.test.mjs` renders native contracts with React DOM server using the existing Node test runner. It checks submit/disabled/loading behavior, accessible icon names, input validation attributes, native selection/options and error focus targets. Real browser QA covers focus, keyboard, dialog dismissal, feature styles and auth/setup interactions; server-rendered markup is not sufficient by itself. No new dependency was added.

Keep `controls.ts` free of feature imports and CSS selectors aimed at other pages. It uses React createElement for these thin native wrappers, so the existing Node type-stripping test runner can exercise them directly without adding a JSX test compiler. Larger feature views continue to use TSX. Preserve shared types in their existing package; do not put credentials or server APIs in a visual primitive.
