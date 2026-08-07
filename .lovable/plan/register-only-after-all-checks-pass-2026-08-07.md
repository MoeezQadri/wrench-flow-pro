# Register only after all checks pass

Today registration happens in this order: the browser creates the auth account, and only afterwards does the app try to create the organization. If the organization name is taken (or anything else fails at that point), the account already exists — so the user "registered" but has no organization, and can't sign up again with that email.

The fix: move the whole registration into one server-side step that validates everything first, creates the organization, and only then creates the user. If any step fails, nothing is left behind.

## New flow

```text
Browser  ->  register-organization (edge function)
                1. validate input (name, org name, email, password)
                2. reject if email already has an account
                3. reject if organization name already exists (case/space insensitive)
                4. create the organization
                5. create the auth user + send confirmation email
                6. link profile to the organization as owner
                -> on any failure after step 4: undo (delete org / delete user)
Browser  <-  clear success or a specific error message
```

Net effect: a user can never exist without an organization, and a failed attempt leaves the email free to try again.

## What changes

1. **New edge function `register-organization`** — owns the ordering above, returns typed errors (`organization_exists`, `email_exists`, `email_pending_activation`, `validation_error`) plus a friendly message. Rolls back the organization if user creation fails, and deletes the user if profile linking fails.
2. **`src/context/AuthContext.tsx`** — `signUp` calls the new edge function instead of `supabase.auth.signUp` + `create_organization_and_assign_user`. Existing return shape (`{ data, error }`) is kept so callers don't change.
3. **`src/pages/auth/Register.tsx`** — drops the now-redundant `checkEmailExists` pre-check (the server is authoritative) and maps the typed error codes to the existing user-facing messages. Keeps the org helper text and inline error display.
4. **Signup trigger** — `handle_new_user_signup` currently drops every new user into a placeholder organization (`00000000-…-0001`). It gets updated to read `organization_id` / `role` from the signup metadata that the edge function passes, and to skip creating a placeholder assignment when metadata is absent, so no half-configured profile is created.
5. **Case-insensitive org uniqueness** — add a unique index on `lower(name)` for `organizations` so two orgs differing only in case can't slip past the existing exact-match index.
6. **Cleanup of existing damage** — a one-off data check to list accounts sitting in the placeholder organization so you can decide whether to delete them (I'll show the list before touching anything).

## Technical notes

- The edge function uses the service-role key (never exposed to the browser) and `auth.admin.createUser` with `email_confirm: false` plus `generateLink`/invite so the confirmation email still goes out through your SMTP.
- Input validated with Zod; passwords are never logged.
- `create_organization_and_assign_user` stays in place for backward compatibility but is no longer on the signup path.
- Duplicate detection uses an indexed lookup on `lower(name)` rather than paging through all auth users where possible; email lookup uses the admin API filtered by email.
- Invitation-based signup (`invite-user`, `SetupPassword`) is untouched — it already creates the profile with the right organization.
