# RAWAN — MASTER CODEX PROMPT
## Phase: Frontend Structure + First-Time User Onboarding

You are working inside the existing **Rawan** monorepo.

Your task is to inspect the current project, establish a clean and scalable frontend folder structure, and then implement a complete, production-quality first-time onboarding experience that appears after a user successfully signs in.

**Important: This phase is exclusively about application structure and onboarding. Do not create, redesign, or implement any author dashboard, reader dashboard, writing workspace, library, discovery page, or other product experience.**

Use the existing **Rawan Design Skill — Quiet Literary Studio** as the authoritative visual and UX direction.

Do not invent a new design language.

---

# PART 1 — Understand the existing repository

Before changing code:

1. Inspect the monorepo structure, workspace configuration, package dependencies, and frontend architecture.
2. Identify the current Next.js application and its App Router structure.
3. Inspect the authentication implementation, login callbacks, session handling, user model, API contracts, Prisma schema, and existing database migrations.
4. Check whether onboarding, profile, preferences, language settings, or age confirmation already exist.
5. Identify existing shared UI components, utilities, design tokens, validation libraries, API clients, and test infrastructure.
6. Read any relevant repository instructions, documentation, and existing design skills.
7. Identify any existing user role or authorization mechanisms. Do not confuse security roles with onboarding preferences.
8. Determine how existing users and newly registered users can be distinguished reliably.

Do not assume that a capability exists simply because it appears in the product vision.

Do not replace or break existing authentication.

Before implementation, write a concise architecture plan describing the current state, proposed changes, affected files, database implications, and verification strategy.

Then proceed with implementation unless a genuinely blocking architectural decision requires clarification.

---

# PART 2 — Establish a scalable frontend structure

Organize the application so that authentication, onboarding, shared components, and future product experiences are clearly separated.

Use the following as a conceptual target, adapting it to the existing architecture rather than copying it blindly:

```text
apps/app/
└── src/
    ├── app/
    │   ├── (public)/
    │   ├── (auth)/
    │   │   ├── login/
    │   │   └── register/
    │   ├── (onboarding)/
    │   │   └── onboarding/
    │   │       └── page.tsx
    │   ├── (studio)/
    │   │   └── ...
    │   └── (reader)/
    │       └── ...
    │
    ├── features/
    │   ├── auth/
    │   ├── onboarding/
    │   │   ├── components/
    │   │   ├── steps/
    │   │   ├── hooks/
    │   │   ├── schemas/
    │   │   ├── services/
    │   │   ├── types/
    │   │   └── constants/
    │   └── preferences/
    │
    ├── components/
    │   ├── ui/
    │   └── shared/
    │
    ├── lib/
    └── styles/
```

Rules:

- Adapt to the real repository, including its existing source-directory conventions.
- Do not create empty directories or placeholder pages just to match this example.
- Do not create future dashboards.
- Do not move working code unnecessarily.
- Keep route definitions thin and feature logic inside appropriate feature modules.
- Keep onboarding-specific components separate from generic shared UI.
- Use existing packages and conventions before adding dependencies.
- Preserve working imports, authentication routes, and public pages.
- Avoid circular dependencies and unnecessary abstractions.

The result should make it easy to add Author Studio and Reader Experience later, without implementing them now.

---

# PART 3 — Product and account architecture

Rawan is a literary platform for people who create and read books, stories, comics, and other written works.

A user has **one Rawan account**.

In the future, that account can access two distinct experiences:

**Author Studio**
- Writing and managing books
- Manuscripts and chapters
- Projects and creative organization
- Worldbuilding and research
- Future comic creation tools

**Reader Experience**
- Discovering books and comics
- Reading
- Personal library
- Bookmarks and collections
- Reading preferences

These experiences must remain separate at the UI and navigation level.

However, onboarding must **not permanently assign users to mutually exclusive Author or Reader account roles**.

Users may change their interests and preferred starting experience later.

Keep the following concepts distinct:

1. **Authentication:** Who is signed in?
2. **Authorization:** What actions is the account permitted to perform?
3. **Interests:** What does the person like creating or reading?
4. **Preferred starting experience:** Where should the application open by default?
5. **Onboarding state:** Has initial setup been completed?

Never use an onboarding answer as a security permission.

---

# PART 4 — First-time onboarding experience

Create a beautiful, focused, multi-step onboarding experience.

It must appear after successful authentication for users who have not completed or explicitly skipped eligible onboarding steps.

Use a calm, editorial, premium interface following the existing Rawan Design Skill.

Avoid generic SaaS styling, overly colorful cards, intrusive illustrations, excessive animation, or unnecessarily complex forms.

The experience should feel welcoming, personal, and effortless.

Use a step-based interface with:

- Clear heading and short supporting description
- Progress indication
- Back and Continue controls
- Skip controls where appropriate
- Proper form validation
- Accessible keyboard interactions
- Responsive mobile and desktop layouts
- Persistent progress when practical
- Clear completion state

Recommended onboarding flow:

## Step 1 — Welcome and preferred name

Heading:
**Welcome to Rawan.**

Supporting text:
**A space for the stories you create and the worlds you explore.**

Question:
**What should we call you?**

Status: OPTIONAL

Input:
- Preferred display name
- Text field
- Sensible length limits
- Whitespace normalization
- Appropriate validation

If skipped:
- Preserve the existing account display name if available.
- Otherwise use a neutral fallback.
- Do not overwrite an existing name with an empty value.

Do not require a real legal name.

## Step 2 — Your purpose

Heading:
**What brings you to Rawan?**

Question:
**What would you like to do on Rawan?**

Status: REQUIRED for this onboarding flow

Options:
- **Create** — I want to write books, stories, comics, or other works.
- **Read** — I want to discover and enjoy books, comics, and stories.
- **Both** — I enjoy creating and reading.

Use elegant selectable options.

Allow exactly one answer.

Important:

This answer describes the user's interests, not a permanent account role.

Every account must remain capable of accessing both experiences when those experiences become available.

If the user selects Both, do not create a third combined dashboard.

## Step 3 — Your creative interests

Heading:
**What do you enjoy creating?**

Status: OPTIONAL

Show this step only when the user selects Create or Both.

Allow multiple selections.

Suggested categories:

- Novels
- Short stories
- Novellas
- Flash fiction
- Poetry
- Essays
- Articles
- Blogs
- Non-fiction books
- Memoirs
- Autobiographies
- Biographies
- Historical writing
- Educational writing
- Academic writing
- Research papers
- Technical writing
- Journalism
- Screenplays
- Film scripts
- Television scripts
- Stage plays
- Comics
- Graphic novels
- Manga
- Webtoons
- Children's books
- Young adult literature
- Interactive fiction
- Game narratives
- Worldbuilding and lore
- Journaling
- Other

Do not display all categories as one overwhelming wall of options.

Organize them into logical groups such as Fiction, Non-fiction, Visual Storytelling, Scripts, and Other.

Support searching or expanding categories if useful.

Allow selecting multiple interests.

Do not confuse writing formats with genres.

Do not imply every writing format already has a dedicated editor or backend workflow.

## Step 4 — Your reading interests

Heading:
**What do you love reading?**

Status: OPTIONAL

Show this step only when the user selects Read or Both.

Allow multiple selections.

Include broad formats:
- Novels
- Short stories
- Non-fiction
- Comics
- Graphic novels
- Manga
- Webtoons
- Poetry
- Essays
- Other

Then offer optional genre and topic interests, grouped logically.

Examples:

Fiction:
- Fantasy
- Science fiction
- Romance
- Mystery
- Thriller
- Horror
- Historical fiction
- Literary fiction
- Adventure
- Contemporary fiction
- Magical realism
- Dystopian fiction

Non-fiction:
- History
- Biography
- Memoir
- Philosophy
- Psychology
- Science
- Technology
- Business
- Personal development
- Politics
- Culture
- Education

Allow users to skip the entire step.

Avoid collecting more detail than the current application can meaningfully use.

## Step 5 — Language preference

Heading:
**Which language would you like to use?**

Status: OPTIONAL unless the current application genuinely requires explicit selection

Provide a language selector based on the languages actually supported by the product.

Consider languages such as:
- English
- Kurdish — Sorani
- Kurdish — Kurmanji
- Arabic

However:

**Do not claim a language is supported if its translations, fonts, layout behavior, and necessary RTL support are not implemented.**

If only English is currently available, use English as the default and do not present nonfunctional language options.

Prefer detecting the browser or account language and allowing the user to change it.

Separate interface language from future reading and writing language preferences.

Changing interface language must not silently change manuscript content or reading preferences.

## Step 6 — How did you hear about Rawan?

Heading:
**How did you discover Rawan?**

Status: OPTIONAL

Allow one answer.

Suggested options:
- Search engine
- Instagram
- TikTok
- YouTube
- X / Twitter
- Facebook
- Reddit
- Friend or family
- Writer or creator community
- Blog or article
- Online advertisement
- Other
- Prefer not to say

If Other is selected, optionally show a short text field.

Do not require users to identify an individual or provide personal contact information.

Keep this question short and unobtrusive.

## Step 7 — Age eligibility confirmation

Include the user's requested age confirmation, but implement it carefully.

Suggested label:

**I confirm that I am at least 18 years old.**

Use an explicit, unchecked checkbox.

Important requirements:

1. First inspect whether Rawan is actually intended to be restricted to adults.
2. If the product policy genuinely requires users to be 18+, make the confirmation required before onboarding completion.
3. Do not precheck the checkbox.
4. Do not infer agreement from continuing to another step.
5. Do not claim that checking a box verifies someone's age.
6. If a user does not confirm eligibility, do not mark onboarding as complete or grant access to an age-restricted experience.
7. Show a clear, respectful explanation and a safe way to leave or return.
8. Record the confirmation timestamp and the applicable policy version if the product requires an auditable declaration.
9. Never ask for a government ID, birthdate, or other sensitive verification data without a separately approved requirement and appropriate handling.
10. Do not mix age eligibility with marketing consent, privacy policy acceptance, or terms acceptance.

If Rawan is not actually an adults-only platform, do not invent an 18+ restriction simply because a checkbox was proposed. Identify this as a product decision in the implementation plan and handle it explicitly.

Also review the existing registration and policy-acceptance flow to avoid redundant or contradictory consent collection.

## Step 8 — Choose where to begin

Heading:
**Where would you like to begin?**

Status: REQUIRED only when a user must select between available destinations

Options:

**Author Studio**
A space to create and organize your writing.

**Reader Experience**
A space to discover and enjoy books and stories.

Behavior:

- If the user selected Create, preselect Author Studio.
- If the user selected Read, preselect Reader Experience.
- If the user selected Both, allow them to choose their preferred starting experience.
- Explain that the preference can be changed later.
- Do not treat this selection as a permanent account role.

Important current-phase limitation:

**Do not create either destination page.**

Inspect which destination routes actually exist.

If the desired destination does not exist, use a safe, already-existing application route or a minimal onboarding completion state, without inventing a dashboard.

Do not redirect to nonexistent pages or create redirect loops.

Store the preferred starting experience for future use.

---

# PART 5 — Onboarding UX improvements

Although the requirements above describe eight logical sections, do not necessarily render eight separate screens.

Group related questions into approximately four or five visually manageable steps.

For example:

1. Welcome and preferred name
2. Purpose and interests
3. Language and discovery source
4. Eligibility confirmation
5. Preferred starting experience and completion

Adapt the flow dynamically:

- Create users see creative interests.
- Read users see reading interests.
- Both users see both sets.
- Optional questions can be skipped.
- Users can go backward without losing answers.
- Changing the purpose should not unexpectedly delete previously saved interests.
- Preserve progress on refresh when feasible.
- Avoid making the onboarding feel like a long registration survey.

Provide a concise privacy explanation where appropriate.

Avoid requesting notification permissions, microphone permissions, file access, or other unrelated permissions during onboarding.

---

# PART 6 — Backend and persistence

Implement onboarding persistence using the existing NestJS, Prisma, and authentication architecture.

Inspect the current schema before adding fields or models.

Prefer a dedicated onboarding/preferences structure when it improves separation of concerns, but avoid unnecessary schema complexity.

The conceptual data should cover:

```ts
type OnboardingState = {
  status:
    | "not_started"
    | "in_progress"
    | "completed";

  version: number;

  preferredName: string | null;

  purpose:
    | "create"
    | "read"
    | "both"
    | null;

  creativeInterests: string[];
  readingInterests: string[];

  preferredLanguage: string | null;

  discoverySource: string | null;
  discoverySourceOther: string | null;

  preferredStartingExperience:
    | "studio"
    | "reader"
    | null;

  ageEligibilityConfirmedAt: string | null;
  ageEligibilityPolicyVersion: string | null;

  completedAt: string | null;
};
```

This is a conceptual contract, not a mandatory Prisma schema.

Adjust it based on existing models, migrations, and conventions.

Requirements:

- Persist state on the server, not only in localStorage.
- Use authenticated user identity from the server session/token.
- Do not trust a user ID supplied by the browser.
- Validate all input server-side.
- Apply sensible field-length and enum restrictions.
- Support saving partial progress.
- Prevent accidental loss of existing preferences.
- Avoid writing duplicate records on repeated submissions.
- Ensure completion is idempotent.
- Never let a client arbitrarily set eligibility timestamps without server validation.
- Keep age confirmation separate from general onboarding preferences where appropriate.
- Do not store unnecessary personal information.
- Use migrations safely.
- Follow existing API conventions and OpenAPI documentation practices.
- Do not modify unrelated backend domains.

If the existing architecture already supports profile/preferences updates, extend it instead of duplicating functionality.

---

# PART 7 — First-time login routing

Implement correct routing behavior after authentication.

Expected behavior:

**New user**
1. Signs in or registers successfully.
2. Server determines onboarding has not been completed.
3. User is directed to onboarding.
4. User completes required steps.
5. Completion is persisted.
6. User is directed to a safe existing destination.

**Returning user**
1. Signs in successfully.
2. Existing completed onboarding state is recognized.
3. User does not see onboarding again.
4. Existing destination behavior is preserved unless explicitly changed.

**User with incomplete onboarding**
1. Signs in.
2. Returns to onboarding.
3. Previous progress is restored where supported.

**Existing Rawan account**
- Must not lose access to existing projects or data.
- Must not be accidentally trapped in onboarding.
- Must have a documented migration/default behavior.
- Must not be assigned an irreversible role.

Additional requirements:

- Prevent authenticated onboarding redirect loops.
- Handle expired sessions.
- Handle failed profile/onboarding requests.
- Handle direct navigation to onboarding.
- Handle browser refresh and back navigation.
- Preserve safe return URLs when appropriate.
- Do not allow open redirects.
- Avoid redirecting users away from valid deep links unnecessarily.
- Distinguish authentication errors from onboarding validation errors.

Do not use frontend-only checks as a substitute for server-side enforcement of actual age eligibility or authorization requirements.

---

# PART 8 — Design and interaction requirements

Use the Rawan Design Skill.

The onboarding should be:

- Calm
- Literary
- Premium
- Minimal
- Original
- Comfortable
- Accessible
- Responsive

Prioritize:

- Beautiful typography
- Strong visual hierarchy
- Generous but controlled whitespace
- Subtle borders
- Restrained accent colors
- Elegant inputs
- Carefully designed selectable options
- Smooth, quiet transitions
- Clear validation and error messages

Avoid:

- Generic admin-dashboard layouts
- Excessive gradients
- Glassmorphism
- Neon effects
- Large decorative illustrations
- Overly playful animations
- Overwhelming selection grids
- Excessive card nesting

Implement:

- Keyboard-accessible controls
- Proper labels and descriptions
- Visible focus states
- Semantic form elements
- Screen-reader-friendly errors
- Reduced-motion support
- Mobile-friendly tap targets
- Responsive layouts
- RTL support for any RTL languages actually enabled

Do not use animations that interfere with form completion.

---

# PART 9 — Testing and quality assurance

Add tests appropriate to the repository's existing testing stack.

At minimum, cover:

### Onboarding logic
- New user enters onboarding.
- Returning completed user bypasses onboarding.
- Incomplete progress can be restored.
- Purpose selection is validated.
- Creative interests appear for Create and Both.
- Reading interests appear for Read and Both.
- Optional fields can be skipped.
- Changing purpose does not corrupt saved preferences.
- Preferred starting experience is saved correctly.

### Age eligibility
- Checkbox starts unchecked.
- If 18+ eligibility is required, completion fails without confirmation.
- Confirmation is recorded correctly.
- Users cannot forge server-owned confirmation timestamps.
- Repeated completion does not create duplicate confirmation records.

### Authentication and routing
- Unauthenticated users cannot submit onboarding.
- Existing sessions remain valid.
- No redirect loops.
- Safe behavior when destinations are not implemented.
- Existing users are not accidentally blocked.

### Data validation
- Invalid enums are rejected.
- Excessively long input is rejected.
- Unexpected fields cannot modify privileged account properties.
- Duplicate submissions are handled safely.

### UI
- Mobile responsiveness.
- Keyboard navigation.
- Back and Continue behavior.
- Loading and error states.
- Accessibility of checkboxes, selections, and form labels.

Run the relevant commands available in the repository, such as:

- Formatting
- Lint
- Type checking
- Unit tests
- Integration tests
- Production build

Report any failures honestly.

---

# PART 10 — Documentation and final deliverables

Create or update concise documentation describing:

1. Final folder organization.
2. Onboarding steps and conditional visibility.
3. Required versus optional fields.
4. Database schema changes.
5. API endpoints and request/response contracts.
6. Authentication and redirect behavior.
7. Existing-user migration strategy.
8. Age eligibility policy assumptions and limitations.
9. How preferences can be changed later.
10. How to preview and test onboarding locally.

At completion, provide:

- Summary of implemented changes
- Important files created or modified
- Database migration instructions, if needed
- Commands run and results
- Any outstanding product decisions
- Known limitations

---

# HARD CONSTRAINTS

Do not create an Author Dashboard.

Do not create a Reader Dashboard.

Do not create a combined dashboard.

Do not create a Writing Studio.

Do not create a reader library, discovery system, book reader, or publishing workflow.

Do not implement unrelated backend features.

Do not replace the authentication system.

Do not use onboarding interests as authorization roles.

Do not introduce a third "Both" experience.

Do not make optional answers mandatory.

Do not falsely claim age verification has occurred.

Do not introduce unsupported language choices.

Do not fabricate APIs or backend capabilities.

Do not overwrite unrelated work.

Do not stop at static UI mockups: implement the onboarding workflow, persistence, validation, and routing as far as the existing architecture safely supports.

**Final goal:** Rawan should have a clean frontend foundation and a complete, elegant, reliable first-time onboarding system. The two future product experiences should be architecturally anticipated but not implemented in this phase.