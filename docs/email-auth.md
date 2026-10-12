# Email sign-up and sign-in

The login page now offers Google popup authentication and email/password authentication. Email sign-up stays on the same page: email/password → code → empty authenticated `/workspace`. The layout follows the supplied references, with a password visibility control, numeric one-time-code field, automatic verification after eight digits, an explicit Verify button, resend countdown and Back controls. Only requested providers are shown. Sign-in sessions use the existing HttpOnly cookie; no JWT is exposed to client JavaScript or local storage.

## Account and API policy

- `POST /api/v1/auth/email/signup`: `{email,password,name?}` → 202 `{verificationId,expiresIn,resendAfter}`. Passwords are 15–128 characters. A display name defaults to the email's local part when omitted. No User/profile/session is created at this stage.
- `POST /api/v1/auth/email/resend`: `{verificationId}` → 202. Resends replace the code after a 30-second cooldown.
- `POST /api/v1/auth/email/verify`: `{verificationId,code}` → 200 existing AuthResponse. Verification atomically consumes the delivered code, creates User/Author with the server-assigned AUTHOR role, records email verification and clears the pending password/code hashes.
- `POST /api/v1/auth/login`: existing email/password login. Pre-existing password accounts remain usable, including older passwords and addresses outside the new signup list.
- `POST /api/v1/auth/register`: retired/deprecated; valid legacy requests return 410 `GONE`. It cannot bypass email verification. This is an intentional security-related contract change; callers must migrate to the new signup/verify flow.

Sign-up accepts these **nine exact domains only**: gmail.com, googlemail.com, yahoo.com, ymail.com, rocketmail.com, outlook.com, hotmail.com, live.com, msn.com. Regional Yahoo and custom/business domains are excluded by the requested policy. Domain membership is enforced by the API, not merely by frontend validation. This is a provider allowlist, not proof that an account is long-lived.

Existing-address signup requests have the same public challenge shape, but do not send mail or create/link accounts. Verification of an unknown, consumed, expired or incorrect challenge produces a generic error. There is no automatic password attachment to Google-only accounts; those accounts continue using Google. Password reset/account linking are separate future features.

## Gmail setup

The ignored `apps/api/.env.local` keeps email settings together in the **Email verification (Gmail)** section. The safe template uses these defaults:

```dotenv
EMAIL_SIGNUP_ENABLED=false
EMAIL_FROM=rawanproject3@gmail.com
GMAIL_APP_PASSWORD=
EMAIL_CODE_SECRET=<random local secret already generated>
EMAIL_APP_ORIGIN=http://localhost:3000
```

The local sending account, app password and random verification secret are configured. Gmail SMTP authentication was verified successfully on 2026-10-12 without sending a message, and `EMAIL_SIGNUP_ENABLED=true` is now set locally. Restart the API to load that change. Actual inbox delivery has not been tested. An unconfigured signup request returns safe 503 and creates no pending account. Keep the app password only in the ignored local file. Website Google credentials are independent; email sessions work without Google client credentials. Templates contain no app password or real verification secret. Production uses process configuration, a fresh random code secret and an HTTPS application origin. All local and example environment files are organized into named sections; existing values were preserved.

The transport uses fixed Gmail SMTP, port 465/TLS, bounded connection/socket waits and no debug logging or external attachment fetching. The email includes the local Rawan logo inline, an eight-digit code, ten-minute expiry and Help/Terms/Privacy links. HTML has a dark, dotted background with a solid fallback and table layout; email clients may simplify its decorative styles. Gmail app passwords require two-step verification on the sending account. [Google app-password guidance](https://support.google.com/accounts/answer/185833), [Nodemailer Gmail guidance](https://nodemailer.com/guides/using-gmail).

## Protection and storage

Codes use cryptographic randomness, preserve leading zeros, expire after ten minutes and allow five wrong attempts. A new resend code cannot equal the previous one. Code digests are HMAC-SHA256 bound to challenge ID and email with a separate random server secret; pending passwords are Argon2id hashes. Plaintext codes/passwords never enter the database, API responses or logs. Code plaintext exists only transiently for delivery through the mail transport.

Signup uses the shared `@rawan/types/password` policy on the form and API. It rejects email/username matches (including case and predictable numeric suffixes), common password variants, and estimated strength below 3/4 using local zxcvbn-ts dictionaries. No password is sent to a third-party checker; this is not a live breach lookup. Checks run before hashing, database access or mail delivery. Long passphrases and Unicode are supported without mandatory character mixtures or changing the submitted password. Existing account login validation remains unchanged. The browser loads dictionaries only for signup, shows compact strength feedback, and preserves password-manager autocomplete and paste. Extra Google popup instructions and last-method/helper paragraphs have been removed; actionable errors remain. The visibility toggle has a centered 40px target and keyboard focus styling. The policy follows [NIST password guidance](https://pages.nist.gov/800-63-4/sp800-63b.html) and uses the [zxcvbn-ts estimator](https://zxcvbn-ts.github.io/zxcvbn/guide/getting-started/).

PostgreSQL advisory locks serialize email attempts across API instances. Verification and nested account/profile creation are atomic; failed attempts commit their counter, profile failure rolls back consumption, and competing valid verifications produce one account/session. Pending delivery has a token fence; only a successful accepted SMTP send enables verification. Delivery failures clear pending secret hashes. SMTP acceptance does not guarantee inbox arrival.

There are five sending attempts per email/hour, a thirty-second cooldown, narrow per-process HTTP request budgets and a durable global budget of 200 sending attempts per UTC day. Failed delivery attempts count toward budgets. Provider sending limits may still apply. Worker maintenance removes challenge rows inactive for over 24 hours and delivery-budget rows older than three days, checking hourly; this cleanup requires the worker to run. Consumed challenge rows retain only minimal metadata/counters until cleanup. Existing account data is not reset or backfilled as verified.

The schema change is additive migration `20261012070000_email_signup_verification`, applied locally; all 21 migrations are current. The reviewed contract has 268 operations. Other existing operations are unchanged; only unverified direct registration was intentionally retired, with an additive `GONE` error category.

## Validation

API unit/HTTP tests, backend/frontend builds, type checks and lint pass. The full database regression includes the isolated email signup suite with a recording mailer. It covers domain/subdomain rejection, no account before verification, hashing, cooldown, resend invalidation, committed failed attempts, expiry, five-attempt exhaustion, concurrent verification, replay, duplicate-address handling, SMTP failure, profile rollback and daily/per-address limits. All messages remain in test memory; **no real email was sent**. Domain suites create trusted isolated account fixtures instead of relying on the retired signup bypass.

Use `pnpm --filter @rawan/api test:email:database` with explicit loopback `TEST_DATABASE_URL`, or the full database regression. Gmail SMTP authentication is verified; a real inbox delivery test remains outstanding. The supplied screenshot was used as a UI/email layout reference; its code and third-party brand are not reused.
