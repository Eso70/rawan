# ADR 0001: private work identity and manuscript sources

Date: 12 October 2026. Status: Accepted for the implemented private foundation only.

## Context

Rawan's product centers on literary works, but Project is a private development container and Book is an existing manuscript hierarchy. Neither should be renamed or automatically exposed as a public work. The backend update must preserve current manuscript APIs and make no frontend changes.

## Decision

Add a private Work owned directly by the authenticated User account. Its initial fields are only stable ID, title, optional description and timestamps. No public credits, form enum, edition, publication status or reader data is added.

Link owned Book manuscripts through explicit WorkSource associations. Each association names the existing project/book pair and a Work; the same pair cannot be linked twice to one Work. A Work can have no sources or multiple sources from projects owned by the same account. A manuscript can participate in multiple private Works; that association does not declare a series, anthology, published edition or reading order.

API queries and mutations validate the Work owner and manuscript project owner. ADMIN has no bypass. IDs from other accounts and incorrect project/book pairs return 404. Source linking uses a database transaction and a composite Book foreign key. No current endpoint transfers project or Work ownership; if ownership transfer is introduced later, its ADR must preserve the same-owner association invariant transactionally.

Work deletion removes only its association rows. Book or Project deletion removes matching source associations but preserves Work identity. Account deletion cascades private Works as part of the existing private-account lifecycle. WorkSource has no media ownership and triggers no file deletion. No source content is copied, automatically created, published or renamed.

Existing manuscripts are not automatically backfilled as Works. Creation/linking is intentional. Existing nested routes, Book/Chapter/Scene IDs and public response shapes remain unchanged.

## Alternatives

- Rename Project/Book: rejected because they have different meanings and existing dependent routes/links.
- Add only a title/type field to Project: rejected because one project may contain several manuscripts or only research.
- Enforce one Book per Work: deferred; there is no current reader representation requiring this cardinality, and explicit links preserve flexibility without changing prose storage.
- Implement publishing/readers simultaneously: deferred to a separately scoped release/access decision.

## Consequences and limits

The private identity is reusable for a later publication bridge, but is not a public catalogue record. Sources are unordered private references, not a publication manifest. API responses omit owner account metadata. Title changes preserve IDs.

Future release retention, public attribution, source ownership transfers, ordered content assembly and edition/library relationships require further ADR decisions. This ADR covers the bounded C13 foundation in the horizon register; it does not approve all of N01, N02 or any Horizon 3 feature.
