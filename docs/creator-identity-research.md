# Public creator identity research

Implementation update (12 October 2026): originally Horizon 2 backend scopes N01–N26 are now implemented in bounded form; see the [current backend guide](backend-horizon-2.md) and [validation ledger](backend-horizon-2-implementation.md). These backend capabilities are available to a future frontend. Horizon 3 remains deferred and no frontend changes accompany this implementation. The study below preserves its original research baseline; its old capability gaps/horizon labels must be read alongside the current register, not as current implementation status.

## Mandatory product horizons

The [feature register](product-horizons.md) supplies the required six-field analysis. Author's stored profile fields do not constitute a public creator system.

| Horizon                 | Major recommendations and register IDs                                                                                                                                                                             |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| H1 — Current Rawan      | Existing account/preference/Author ownership behavior (C01/C02); document its distinction without changing permissions                                                                                             |
| H2 — Near future        | Public identities/profiles/credits (N11), multiple personal pen names (N12), eligible works/featured collections/series/supplements (N01/N02/N13–N15)                                                              |
| H3 — Long-term platform | Teams/collective identity management, claims/transfers (L10), coauthor permission/revisions (L09), engagement/following (L03), commercial/legal verification requirements only in separately scoped commerce (L06) |

Research date: 12 October 2026. This document investigates creator identities in the reader ecosystem and their architectural implications. No public profile, pen-name model, schema migration or identity-management API is implemented.

## Research basis

KDP's official guidance distinguishes a public pen name from private account information, supports credited authors/contributors, and describes author pages separately from the publishing account. This is evidence for separating attribution and account administration, not a reason to import its payment, verification, limits or name-change rules into Rawan. [KDP authors and contributors](https://kdp.amazon.com/en_US/help/topic/G2BWJN2BY98T5PV2).

ORCID distinguishes a credited published name from other names, and permits visibility settings on names and biographical information. It provides useful examples of controlled disclosure, but an openly linked scholarly alias list is not equivalent to several intentionally unlinked pen-name personas. [ORCID names](https://support.orcid.org/hc/en-us/articles/360006973853-Add-and-edit-your-name-on-your-ORCID-record), [Visibility preferences](https://support.orcid.org/hc/en-us/articles/360006894494-Visibility-preferences).

The recommendations below are Rawan design inferences from primary documentation and the repository. They do not establish a legal-name requirement, verified identity policy, anonymity guarantee or implemented contributor system.

## Three different concepts

| Concept                   | Responsibility                                                            | Visibility and permissions                                                  |
| ------------------------- | ------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| User account              | Authentication, account recovery, preferences and private resource access | Account data and authentication identifiers are not public creator metadata |
| Creator / author identity | Stable attributed persona, potentially a pen name                         | Can be credited on works; managing it requires private authority            |
| Creator profile           | Reader-facing presentation of an identity                                 | Name, avatar, bio and eligible works deliberately exposed to readers        |

A pen name is more than an alternate spelling when it has its own biography, presentation and attributed catalogue. A spelling variant or transliteration can be an alias of the same identity; a deliberately separate writing persona may need a separate identity. Do not automatically merge the two cases.

These are separate responsibilities, not a requirement to create three new tables now. A minimal first public identity and its profile data may live together behind a distinct contract. The important boundary is that public attribution and profile presentation do not become the account or project-authorization record.

One account can eventually manage several public identities. One credited collaborator may have no Rawan account. A shared pseudonym or team identity may eventually have multiple managers, but this is a later collaboration decision rather than a prerequisite for personal pen names.

## Current repository model

`User` contains email, account name, password/Google subject, security role and timestamps. It has an optional Author relation. `Author.userId` is unique, so there can be at most one Author per User. Author stores displayName, bio and avatarUrl and owns Projects through `Project.authorId`.

Password registration and Google account creation both provision an Author whose displayName starts from the account name. Google creation can use the provider's supplied name or an email-derived fallback. This is initialization for the current private workflow, not explicit permission to publish that name as a public byline.

Project services use the current unique author lookup and owner queries such as `project.author.userId`. The current Author is therefore part of access control, not merely a cosmetic profile. Removing its unique constraint would affect service assumptions and ownership semantics; it is not a complete multi-pen-name implementation.

There is no public Author profile CRUD/read API, profile slug, profile-publication state, identity management grant or work-credit relationship. The existing current-user/admin user response includes account email and role. “Public user response” means a safe client-facing account DTO, not an anonymous creator-directory record; it must not be reused for public profiles.

## Candidate profile content and gaps

| Potential content      | Existing foundation                                      | Future responsibility                                                                                |
| ---------------------- | -------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| Name / pen name        | Author.displayName, initially account-derived            | Deliberately chosen attributed identity and approved profile display name                            |
| Avatar                 | Author.avatarUrl in persistence; private Media elsewhere | Validated profile asset, suitable delivery and lifecycle; not automatic account-avatar exposure      |
| Biography              | Author.bio in persistence                                | Public profile editing, validation, publication and safe rendering                                   |
| Works                  | Owned project manuscript containers                      | Explicit credits plus eligible released works; private drafts excluded                               |
| Series                 | No series contract                                       | Public series associated with credited works/identities                                              |
| Genres                 | No public genre model                                    | Supported public classifications; distinguish declared specialties from derived catalogue categories |
| Links                  | No profile link structure                                | Validated, intentionally published links with supported schemes and understandable labels            |
| Featured works         | No public work/curation model                            | Ordered selection of eligible credited works; no bypass of release visibility                        |
| Worlds / universes     | Private project entities and timelines                   | Selected reader-safe universe associations, not a list of private projects                           |
| Supplementary material | Private notes/media/entities                             | Explicitly released supplementary projections and assets                                             |

Stored displayName/bio/avatarUrl fields are only a persistence foundation. Their presence does not supply public search, author-page management or privacy controls. Series, work identity, publication and reader-safe lore must first gain their own contracts.

## Public profile experience

A profile should introduce a creator and offer clear entry points into their released works. Start with a name, optional image, concise biography and eligible catalogue. Featured works, series and supplementary exploration can follow only when supported. Avoid pretending every writer has a public universe, every illustrator is an author, or every user wants a creator page.

Use Creator as the broad product term and role-specific credit labels on works: Author, Illustrator, Translator and other agreed roles. A profile should show only that identity's works and presentation, not all content managed by the private account.

Management can eventually offer a private identity selector separate from the Create/Experience switch. The same account's reading library/preferences remain its own; choosing a pen name must not accidentally create a new reading account or change project permission. Publishing should require a clear credit selection and preview so a creator does not release under the wrong persona.

Do not auto-publish a creator profile on Google login. A reader can remain a reader, and an author can draft privately before selecting any public identity. Initial attribution can be a supported name-only credit if a public page is outside the first publishing milestone; a clickable profile requires an actual profile contract.

## Proposed architectural relationships

```text
Private account ── manages ──> Creator identity A ── presents ──> Public profile A
                └─ manages ──> Creator identity B ── presents ──> Public profile B

Private account / existing Author ── owns ──> Creative project and source manuscript
Future Work / Release ── has explicit credit ──> Selected creator identity + role
```

All identity/profile/work-credit relationships above are prospective. Existing private Author ownership stays intact until a deliberate migration is agreed.

The easiest evolutionary boundary is to leave current Author as the private project owner and later introduce public attribution identities managed by the account. This avoids repurposing an ownership key into a byline. A longer-term unified creator/profile model is possible only with explicit ownership migration and compatibility handling; it is not necessary merely to show a public name.

Work credits should distinguish an identity ID, role and display order. Decide how a released byline is recorded relative to mutable profile names: a release may preserve the name as credited while linking to the current profile. Renaming a persona should not silently rewrite historical credit or invalidate annotations/book links.

Crediting someone does not grant access to their account or to the source project. Managing an identity does not automatically confer edit rights over every work attributed to it. Invitation, claiming an external credit, editorial access and transfer of management are separate authorized operations if later supported.

## Privacy, identity integrity and lifecycle

- **No automatic persona linkage:** readers must not receive account IDs/email, shared manager IDs, other pen names or private reading activity through profile DTOs, search, related profiles, cache keys or public URLs. Authenticated management endpoints can expose only the account's authorized identities.
- **Optional disclosure:** “Also writes as” or links between personas require an explicit publication choice. Shared external links, biographies or avatars can still reveal a connection; separation of records is not a guarantee of anonymity.
- **Stable identity:** profile/identity IDs should survive display-name changes. Display names need not be unique; URL handles can have a separate uniqueness and rename/redirect policy. Do not merge creators only because their names match.
- **International names:** permit appropriate scripts, pen names, mononyms and presentation order. Do not force a Western first-name/last-name split or infer legal identity from a display name.
- **Authorization:** derive manager authority from the authenticated account, not a browser-supplied account/owner ID. Creation, editing, credit selection and future transfers require scoped validation.
- **Public data boundary:** expose explicit profile DTOs containing only approved fields. Avoid returning account email or authentication details by serializing a joined User/Author object.
- **Assets and links:** public avatar delivery is a deliberate media policy. External URLs need scheme/format validation and safe presentation; fetching remote images/links would need a separate bounded backend design.
- **Verification and abuse:** handles, impersonation reports, disputes and moderation need defined rules before public launch. A verification badge must describe what was actually verified, not imply literary quality or unverified legal ownership.
- **Deletion and suspension:** deleting a persona/profile must not cascade-delete its private projects or another contributor's works. Account deletion, profile withdrawal and credited-work retention need an explicit policy; today's User→Author→Project cascades cannot be copied blindly.
- **History and permissions:** retain appropriate private audit evidence for management changes without publishing links between personas. Credit corrections and profile merges require reviewed behavior, not silent reassignment.
- **Caching and discovery:** eligibility/withdrawal changes must update profile works, featured selections and search indexes. Personalized creator-management data and public profiles have different cache scopes.

## Evolutionary sequence

1. Keep today's account/authentication, Author ownership and manuscript API unchanged. Document the meaning of Author as currently implemented.
2. When the first publication contract is agreed, define public attribution separately from private ownership. Choose whether name-only external credits and a single initial profile suffice while allowing later multiple identities.
3. Add explicit profile creation/edit/publication/read DTOs and released-work credit links, with clear identity visibility. Require approved public names rather than copying account/provider names automatically.
4. Introduce multiple identities per account through an additive management model, with publishing preview, identity isolation and stable IDs. Do not expose their common account relationship publicly.
5. Add team management, contributor claiming, profile linking/merging and transfers only when concrete requirements and permissions are designed.

Potential future validation should cover two pen names under one account, unrelated creators with the same display name, an external collaborator without a login, a profile rename after release, withdrawn featured works, account/profile deletion, and cross-account edit attempts. Public searches and attribution must not reveal private persona links. These are future acceptance scenarios, not tests run during this investigation.

## Decisions needed before implementation

Agree on whether identities are initially personal only, whether a credited collaborator needs a profile/account, which public name corrections affect prior releases, who can claim/manage external credits, and how deleting an account affects released attribution. Do not add organization/team models, legal-name collection or verification solely because they are imaginable future needs.

The recommendation is **one private account, potentially several explicitly managed public identities, each with its own presentation and work credits**. Account permissions remain separate from the name readers see. This can evolve without dismantling the existing private author workflow.

## Repository evidence and related research

- [Database schema](../packages/database/prisma/schema.prisma)
- [Registration](../apps/api/src/auth/auth.service.ts), [Google account creation](../apps/api/src/auth/google-auth.service.ts) and [project ownership](../apps/api/src/manuscript/manuscript.service.ts)
- [Current user routes](../apps/api/src/users/users.controller.ts) and [response DTOs](../apps/api/src/contracts/response.dto.ts)
- [Work identity gap analysis](book-and-work-identity-gap-analysis.md), [discovery research](discovery-experience-research.md) and [publication bridge](create-and-experience-bridge.md)
