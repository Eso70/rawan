# ADR 0002: released work and public identity boundary

Date: 12 October 2026. Status: Accepted for the authorized Horizon 2 backend scope; implementation tracked separately.

## Decision

Preserve User→Author→Project ownership and the private Work/source identity. Add public CreatorIdentity personas privately managed by an account, explicit Work credits and approved metadata. Name-only contributor credits do not confer login/edit rights. Multiple pen names have separate public profiles; their common manager is never serialized publicly.

Add optional edition metadata and typed external identifiers. ISBN syntax/checksum validation does not verify assignment. An edition is not a routine draft revision. Series/anthology relationships are explicit work memberships with intentional ordering and labels.

A WorkRelease is an immutable selected-content/metadata snapshot, initially DRAFT. It becomes publicly readable only through an explicit publish action after validation; WITHDRAWN releases cannot be republished. Creating another snapshot is how a source update becomes a new release. No private source endpoint becomes anonymous. Initial reader access is public/free only; commerce and restricted entitlements are deferred.

Public discovery, search and asset delivery check eligible PUBLISHED release state at read time. Creator/source account IDs, private notes, raw storage keys and automatically linked other pen names are excluded. Selected public supplements must omit references to unselected private entities.

Delete/withdraw semantics are explicit. Source manuscript/project deletion preserves release snapshots. Work/account deletion removes its releases and access; personal saved entries can retain approved title/credit metadata with unavailable state through nullable references. Progress/annotations remain private and have defined unavailable/version behavior. No publicly readable orphaned release survives creator account deletion.

## Alternatives and consequences

Directly exposing Book/Project was rejected because it leaks drafts and mixes update/access lifecycles. Reusing Author as a public persona was rejected because it owns projects and is unique per account. Mutable release content was rejected because it invalidates reader anchors and editorial expectations.

Snapshot storage costs more than source references, so content/assets and release counts must be bounded. Graphic asset retention/delivery and reader locators receive separate decisions. No Horizon 3 system is authorized by this ADR.
