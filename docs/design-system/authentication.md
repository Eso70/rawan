# Authentication UI

Sources are under `apps/website/src/`. The thin `(auth)/login/page.tsx` route loads `features/auth/components/login-page.tsx`; its feature CSS is `login.module.css`. Login, registration and email verification are states of `/login`. There is no `/register` page or password-recovery UI/API; the leftover `.forgot` CSS is not a working recovery feature.

## Component hierarchy and layout

```text
LoginPage
├─ artwork: desktop LoginScene + palette copy feedback + attribution + year
└─ panel: BrandMark / motion content / utility footer
   ├─ LoginHeading (login/signup typing state)
   ├─ Google and Email provider Button choices
   ├─ EmailSignin (when email chosen)
   │  ├─ email TextInput / password TextInput / IconButton visibility toggle
   │  ├─ password assessment (signup only)
   │  ├─ submit Button and inline FieldError
   │  └─ verification state: code TextInput / submit / resend / Back
   └─ Help / Terms / Privacy / LoginLanguage
```

Desktop art occupies the background while the form panel begins at 55% page width. Form content is capped at 400px. The current design has no enclosing form card. Preserve its navy/purple/teal/warm background, 15px dots and grain overlay. Inter headings, Space Grotesk controls, translucent input borders and distinct 18.6px field/12px submit radii remain feature recipes expressed with shared tokens. See [typography](typography.md) and [tokens](tokens.md).

Below 768px, art, swatches, model credit and year hide; the form centers with 33.6px side gutters, reduced to 22px at 360px and below. Short screens scroll. The provided Dragonspire Library Monk GLB, materials and [attribution](../../apps/website/public/models/login/ATTRIBUTION.md) are retained. The Three.js scene is desktop-only and releases resources; palette buttons copy colors and show status, not change themes.

## Fields, validation and states

| State                      | Inputs and actual behavior                                                                                                                                                                                                                                                                                                                         |
| -------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Provider choice            | Google starts the existing correlated popup flow; Email opens the form. Pending Google disables providers and offers Cancel sign-in. Signup toggles heading/copy while retaining the same URL.                                                                                                                                                     |
| Email login                | Required email, max 254; required password, max 128, minimum 1 for existing accounts. Autocomplete is email/current-password. Password IconButton exposes a name, pressed state and controlled input. Submit uses Signing in… while busy.                                                                                                          |
| Email signup               | Same form with new-password autocomplete, minimum 15 and existing shared password assessment. Strength/error feedback is polite live content associated with the password input; backend remains authoritative. Submit shows Sending code… and does not create an account until verification.                                                      |
| Code verification          | Named required text input with numeric input mode, exactly eight digits, one-time-code autocomplete and max length eight. Entering eight digits attempts verification; the busy guard prevents a second concurrent request. Explicit submit remains available and shows Checking…. Resend has a countdown; Back remains disabled during a request. |
| Validation/network failure | Native form validity and shared password assessment run before appropriate requests. API/network messages remain in-place FieldError paragraphs with `role="alert"`; outer provider/copy notices use `role="status"`. Pending state disables relevant fields/actions.                                                                              |

`EmailSignin` owns credential/challenge/pending/countdown state and request sequencing. Its existing alive/busy guards and password-clearing behavior remain untouched. Shared controls do not validate credentials or hold session state. Labels remain associated even where visually hidden; do not replace inputs with contenteditable elements or hide focus rings.

`LoginLanguage` is a real details/summary disclosure with English only. Escape closes it and returns focus to summary; outside pointer interaction dismisses it. It does not set an untranslated language or enable RTL. Terms and Privacy link to real `/terms` and `/privacy` routes; Help uses the supplied shared Discord destination. No consent or age requirement was introduced here.

## Integration boundary

`useGooglePopup` retains provider verification, callback correlation, cancellation and timeout handling. `features/auth/server/*` remain server-only adapters behind the same `/auth/*` URLs. Email UI posts to `/auth/email`; cookie sessions and upstream credentials stay within the existing server boundary. UI preferences never grant access. Safe `returnTo` handling is shared with onboarding, and the existing `/workspace` entry determines whether setup is required.

See [auth feature ownership](../../apps/website/src/features/auth/README.md), [email configuration](../email-auth.md) and [onboarding workflow](../onboarding-guide.md) for canonical contracts/local setup. This documentation includes no credentials or secrets. Real external mail/provider behavior requires separate verification; local fake-mailbox tests do not certify external delivery.

## Safe changes

Reuse `components/ui/controls.ts` with the established feature classes and native attributes. Explicitly use `type="submit"` for form submission; shared Button defaults to `button`. Keep loading text specific to the action. Keep a real input label for every field and preserve autocomplete/inputMode/maxLength constraints. Change credential/security rules in their canonical shared/server owner, never in a generic visual component.
