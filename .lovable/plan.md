# Fix: registration shows "check your internet connection" when the real error is different

## What's actually happening

Your internet is fine. Two things stack up:

1. The `register-organization` backend is rejecting the signup with a real, specific reason. The most recent function logs show repeated `signUp failed: email rate limit exceeded` — Supabase's confirmation-email sending limit has been hit (many registration attempts in a short window), so it returns HTTP 429.
2. The frontend hides that reason. `supabase.functions.invoke` treats any non-2xx response (400 validation, 400 email/org exists, 429 rate limit, 500) as an invocation error and returns no body. `AuthContext.signUp` then assumes the function was unreachable and returns "We could not reach the registration service. Please check your connection and try again.", which `Register.tsx` further maps to the generic network message.

So every backend rejection currently looks like a network outage to the user.

## Fix

### 1. Read the real error body (src/context/AuthContext.tsx)
In `signUp`, when `invokeError` is present, read the response JSON out of the `FunctionsHttpError` (`await invokeError.context.json()`) and use its `error` code and `message`. Only fall back to the connection message when there is genuinely no response (real network failure / CORS / timeout). Return the server's message so downstream mapping can use it.

### 2. Map the codes to clear messages (src/pages/auth/Register.tsx)
Add explicit handling ahead of the generic network branch for the codes the function already returns: `validation_error`, `email_exists`, `email_pending_activation`, `organization_exists`, `signup_failed`, `server_error`. Specifically:
- rate limit → "Too many signup attempts right now. Please wait a few minutes and try again." (already worded that way by the function; just stop swallowing it)
- Tighten the network branch so it no longer matches on the loose `fetch`/`connection` substrings that were catching these server messages.

### 3. Make the rate-limit case unambiguous
Surface the wait-and-retry message with a longer toast duration and no "check your connection" wording, so it's obvious the issue is temporary and on the mail-sending side, not the user's network.

## Notes / follow-up outside the code
The rate limit is a Supabase Auth setting (emails per hour). If registrations are being blocked in normal use, that hourly cap should be raised in Auth → Rate Limits, or custom SMTP throughput checked. The code change above will make that condition visible instead of masking it, so we can confirm it from the message the user sees.

## Files touched
- `src/context/AuthContext.tsx` — extract and propagate the edge function's error body
- `src/pages/auth/Register.tsx` — precise error-code mapping, narrower network fallback
