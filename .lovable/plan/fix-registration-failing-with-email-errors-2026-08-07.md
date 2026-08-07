# Fix registration failing with email errors

## What I verified

- Email confirmation is **required** on this project (`mailer_autoconfirm: false`), so every signup must send a confirmation email before the account can be used.
- **No email domain / sender is configured** for this project (email setup status: `not_started`). Auth emails therefore go out through the shared default Lovable/Supabase sender, which has a very low hourly cap — once it is hit, signup fails with an email error (typically "Error sending confirmation email" or a 429 rate-limit error) and **no user is created**.
- No new users have been created since 14 May 2026, and auth logs show no successful signup traffic — consistent with signups dying at the email step.
- The pre-signup email/organization check (`admin-utils`) is working correctly and returns `{exists: false, organization_exists: false}`, so it is not the cause.

Not yet confirmed: the exact error string users see. Step 1 below captures it so the fix is targeted rather than guessed.

## Plan

1. **Capture the exact failure** — run one real registration attempt against the app and record the precise GoTrue error code/message (rate limit vs. sender failure vs. redirect-URL rejection). This decides which of steps 2/3 is applied.

2. **Raise the auth email rate limit** — the hourly cap for auth emails is low by default. Increase it to a value matching real signup volume so bursts of registrations stop erroring.

3. **Set up a real sender domain (recommended, removes the root cause)** — configure the email domain for the project (e.g. `mygaragepro.co` or a subdomain like `mail.mygaragepro.co`), verify DNS, and let auth emails send from your own domain instead of the shared default sender. This lifts the shared-sender limits and improves deliverability. Requires you to add DNS records.

   Optional alternative if you don't want to wait for DNS: temporarily enable auto-confirm so signup completes without a confirmation email. This means new accounts are active immediately with unverified emails — I'll only do this if you ask for it.

4. **Harden the registration flow so failures are recoverable** — in `src/pages/auth/Register.tsx` and `src/context/AuthContext.tsx`:
   - Surface the real cause for email-send/rate-limit failures ("we couldn't send your confirmation email, please try again in a few minutes") instead of the current generic fallback.
   - Handle the case where `signUp` succeeds but the follow-up `create_organization_and_assign_user` call runs without a session, so a user is never left created-but-orphaned with no organization.

5. **Verify end to end** — attempt a fresh registration, confirm the user row is created, the confirmation email is queued/sent, and the confirm link lands on `/auth/confirm` with the intent params preserved.

## Technical notes

- Auth email cap is changed via the project's auth configuration (`rate_limit_email_sent`); raising it requires email sending to be active, which is why the domain step matters.
- The Register page's `getConfirmationRedirectUrl()` builds `/auth/confirm?next=...&tab=...&plan=...`; the app URL must be present in the allowed redirect URLs, which step 1 will also confirm.
- No database schema changes are needed.

## What I need from you

- Whether you own a domain to use as the email sender (e.g. `mygaragepro.co`), so I can start the domain setup in step 3.
