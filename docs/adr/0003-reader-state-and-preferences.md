# ADR 0003: account-private reader state and scoped preferences

Date: 12 October 2026. Status: Accepted and implemented. Covers A03/A06 and originally H2 N03–N07/N14/N16/N17.

Reader state belongs to User, independently of Author, Project, public personas or onboarding experience. Product mode is a preference, not an authorization role. Saving a work never grants access: published-release eligibility is checked separately on content, search, assets and shared collection reads.

Library entries retain approved title/byline metadata when a Work disappears, with nullable references and unavailable state. Collections are private unless explicitly made public. Public members contain current eligible work/release/title/order only, never personal status, favorites, entry IDs or user IDs. Editorial collection creation/update additionally requires the current ADMIN role. Bookmarks/highlights/annotations are private reader records, distinct from project Notes. Deleting releases removes their bookmarks/annotations; withdrawing them prevents reads while retaining owner-controlled state. History means the last explicitly saved position per work, not a behavioral event log.

Prose locators use release/section/block IDs and UTF-16 offsets, matching JavaScript string indexing. Graphic locators use release/page IDs, authored panel position and within-page/panel progress. Progress is checked against actual release content; invalid references/ranges fail. Optimistic revisions reject stale writes with 409. Furthest progress is tracked separately from current position and resets for a new release. Resume maps server-private stable logical keys to a newer eligible release; removed or incompatible content deliberately falls back to the approved start. Mapping never reveals source identifiers or automatically rewrites saved state.

Portable preferences are allowlisted values with revisions and null-to-inherit reset. GLOBAL → CREATOR → PROJECT and GLOBAL → READER → WORK precedence is explicit. Device geometry, session overrides, fullscreen, keyboard/touch behavior and OS motion preference resolution remain client-local. Preferences cannot change permissions or manuscript text. Saved views store only supported resource queries and validated owned parent/tag IDs, plus optional visible-module arrangements. Deleted contexts become unavailable rather than granting access through stale preferences.

No offline access, personalized recommendations, social annotations or shared collaborative editing is introduced.
