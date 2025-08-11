# Signup and Organization Rule — Step-by-step Test Cases

- AUTH-SIGNUP-001 New organization creation (happy path)
  - Precondition: No organization named "Nova Motors" exists.
  - Steps:
    1. Go to /auth/register
    2. Enter Full Name: "Jane Doe"
    3. Organization Name: "Nova Motors"
    4. Email: jane.neworg@test.com
    5. Password: P@ssw0rd123, Confirm Password: P@ssw0rd123
    6. Click Register
  - Expected:
    - Redirect to dashboard
    - organizations has "Nova Motors" (trial, active)
    - profiles linked with role=admin
    - RPC returns { success: true, role: 'admin' }

- AUTH-SIGNUP-002 Existing organization error (exact match)
  - Precondition: Organization "Acme Inc" exists.
  - Steps:
    1. /auth/register
    2. Full Name: "John Smith"
    3. Organization Name: "Acme Inc"
    4. Email: john.acme@test.com
    5. Valid matching passwords
    6. Click Register
  - Expected:
    - Error: "Organization already exists. Please contact your administrator to be added to this organization."
    - No org/profile changes
    - RPC returns { success: false, error: 'organization_exists' }

- AUTH-SIGNUP-003 Existing organization error (case/whitespace)
  - Precondition: "Acme Inc" exists.
  - Steps: Use " acme inc  " → Register
  - Expected: Same error as 002; no DB changes

- AUTH-SIGNUP-004 Password mismatch
  - Steps: Enter mismatched passwords → Register
  - Expected: Inline error "Passwords do not match"; no auth/RPC calls

- AUTH-SIGNUP-005 Missing organization name
  - Steps: Leave Org Name empty → Register
  - Expected: Client validation blocks submit; no calls

- AUTH-SIGNUP-006 Email already in use
  - Pre: Email exists
  - Steps: Register with existing email
  - Expected: Supabase error surfaced; no org created

- AUTH-SIGNUP-007 Network/RPC failure handling
  - Steps: Simulate network error → Register with unique org
  - Expected: Friendly error; no partial org/profile; retry works

- AUTH-SIGNUP-008 Double-click submit protection
  - Steps: Rapid double-click Register
  - Expected: Single request; no duplicate orgs

- AUTH-SIGNUP-009 Helper text verification
  - Steps: Open /auth/register
  - Expected: Helper text present and correct

- AUTH-SIGNUP-010 Org name invalid characters/XSS
  - Steps: Org Name: "<script>alert(1)</script>" → Register
  - Expected: Rejected/sanitized; no script exec; no org

- AUTH-SIGNUP-011 Org name length limits
  - Steps: 256+ chars → Register
  - Expected: Validation error; no org created

- AUTH-SIGNUP-012 Email verification (if enabled)
  - Steps: Verify email after signup
  - Expected: Login permitted; org/role intact

- AUTH-SIGNUP-013 Accessibility
  - Steps: Keyboard navigation of form
  - Expected: Labels, focus, announcements correct

- AUTH-SIGNUP-014 Mobile responsiveness
  - Steps: 375x812 viewport
  - Expected: Layout intact; controls usable
