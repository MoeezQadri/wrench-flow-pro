
# Automation Setup Request (Professional & Enterprise)

Add a settings section where org admins/owners on Professional or Enterprise plans can request automation setup. Submissions are stored in the DB and emailed to `info@mygaragepro.co`.

## Email transport note

This project uses an external Supabase (not Lovable-managed Cloud), so the built-in Lovable Emails infrastructure is unavailable. To keep this "managed"-style, I'll wire the delivery through the **Resend** connector (verified sending domain on Resend, single API key). If you'd rather not use Resend, we can fall back to DB-only and you check requests in Settings.

## UX

New tab in Settings: **Automation Setup** — visible only when:
- `currentUser.role` is `owner` or `admin`, AND
- `organization.subscription_level` is `professional` or `enterprise`.

Otherwise hidden from the sidebar and route-guarded.

Form fields:
- Automations requested (checkboxes): time/mileage reminders, SMS delivery, email delivery, review requests (Google/Yelp), customer reactivation, lapsed-customer outreach, website booking form, custom branding.
- Preferred contact time (text) + phone number (validated).
- Notes (textarea, max 2000 chars).
- Auto-included from context (read-only display): org name, plan, requester name + email.

On submit:
1. Client validates with zod, calls edge function `request-automation-setup`.
2. Function verifies JWT, loads caller's profile + org, re-checks plan + role server-side.
3. Inserts row into `automation_requests`.
4. Sends email via Resend gateway to `info@mygaragepro.co` with request details and a reply-to of the requester.
5. Returns success; UI shows a confirmation card ("We'll be in touch within 1 business day") and lists the org's past requests with status (`new`, `in_progress`, `completed`).

## Data model

New table `public.automation_requests`:
- `id uuid pk`
- `organization_id text not null` (auto-set by `set_row_org_id()` trigger)
- `requested_by uuid not null` (auth user id)
- `requester_email text`, `requester_name text`
- `automations text[] not null`
- `preferred_contact_time text`
- `phone text`
- `notes text`
- `status text default 'new'` (`new` | `in_progress` | `completed`)
- `created_at`, `updated_at timestamptz`

Grants + RLS:
- `GRANT SELECT, INSERT ON public.automation_requests TO authenticated;`
- `GRANT ALL ... TO service_role;`
- Enable RLS.
- SELECT/INSERT policy: `organization_id = current_user_org_secure() AND is_organization_admin()`.
- UPDATE policy: superadmin only (support toggles status).
- Attach `set_row_org_id` BEFORE INSERT trigger.

## Edge function

`supabase/functions/request-automation-setup/index.ts`:
- CORS + JWT validation via `SUPABASE_JWKS`.
- Zod validation of body.
- Re-check role/plan server-side by fetching the caller's profile + organization with service-role client.
- Insert row; on success POST to `https://connector-gateway.lovable.dev/resend/emails` using `LOVABLE_API_KEY` + `RESEND_API_KEY`, from `automations@<verified-domain>`, to `info@mygaragepro.co`, reply-to requester email, HTML body listing all fields.
- Surface provider errors verbatim (log status + body) but still return success if the DB insert succeeded, so a Resend outage doesn't lose the request.

## Files

- Migration: create table, grants, RLS, trigger.
- `supabase/functions/request-automation-setup/index.ts` (new).
- `src/components/settings/AutomationSetupTab.tsx` (new) — form + past requests list.
- `src/pages/Settings.tsx` — add tab, gated by role + plan.
- `src/hooks/useAutomationRequests.ts` (new) — thin fetch/submit wrapper.

## Prereqs to confirm before I build

1. OK to add the **Resend connector** (I'll trigger the connect flow — you'll pick or create the connection and verify your sending domain in Resend)? If no, I'll switch to DB-only with an in-app "Requests" inbox visible to superadmins.
2. Sending domain to use on the `from:` address (e.g. `automations@mygaragepro.co`) — must be verified in Resend.
