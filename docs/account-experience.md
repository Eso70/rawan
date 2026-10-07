# Author and reader experience

Google sign-in and sign-up redirect to `/workspace`. The server validates the session and reads authenticated account preferences. Accounts without an `experience` preference see `/onboarding`, a simple three-step optional questionnaire. This replaces the removed narrated sample-world tutorial.

- Author → `/workspace/author`.
- Reader → `/workspace/reader`.
- Both → Author by default, with a switch between writing and reading.
- Just exploring, or Skip without a role → Reader.

Each question is optional. Skip saves the current selections and finishes; Continue can advance without selecting anything. Interests support multiple selections. The final question asks authors/both about creating and readers/explorers about discovery. The defaults are exploring and an undecided goal. Save failures keep the questionnaire open with a retryable message. Existing accounts with legacy tutorial completion but no experience preference also receive the new questionnaire once. Returning users with a saved preference skip it. `/onboarding?edit=1` lets users change their choices.

The database stores experience, interests and goal on `UserOnboarding`, separate from existing authorization roles. The browser cannot set `User.role`, a user ID or administrator permissions through `/api/preferences`. The server uses an HTTP-only session, checks request origin, bounds body size and forwards only preference fields to the identity-scoped backend endpoint. Existing project ownership and backend permission checks remain in force. These are dashboard preferences, not a new security-role system.

Dashboard bodies remain blank for the user's future design. Their small header identifies the experience, offers preference changes and sign-out, and offers a reading/writing switch for Both. This change does not expose other authors' private books as reader content, create a public book catalogue or implement a manuscript editor. Those product features require separate work.

The additive `20261007020000_account_experience` migration preserves existing accounts and was applied locally. Other checkouts run `pnpm db:deploy` and `pnpm db:generate`. API validation tests reject administrator choices, malformed interests and unknown goals. Database smoke tests cover saved preferences, identity isolation and unchanged authorization roles; website tests cover dashboard selection. Build and lint validate both applications.
