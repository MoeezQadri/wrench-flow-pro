# Login — Step-by-step Test Cases

- AUTH-LOGIN-001 Valid credentials
  - Steps: /auth/login → enter valid email/password → Login
  - Expected: Redirect to dashboard; session set

- AUTH-LOGIN-002 Invalid credentials
  - Steps: Wrong password
  - Expected: Supabase error shown; stays on login

- AUTH-LOGIN-003 Unverified email (if enabled)
  - Steps: Attempt login before verify
  - Expected: Clear message to verify email

- AUTH-LOGIN-004 Rate limiting/lockout (manual)
  - Steps: 5 rapid failures
  - Expected: User-friendly errors; no info leakage

- AUTH-LOGIN-005 Remembered route
  - Steps: Visit private route unauth → login
  - Expected: Redirects back to originally requested path
