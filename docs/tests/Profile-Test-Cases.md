# Profile — Step-by-step Test Cases

- PROF-001 View own profile
  - Steps: Auth user → /profile
  - Expected: Own data only

- PROF-002 Update profile fields
  - Steps: Change name → Save
  - Expected: Persisted; toast; DB updated

- PROF-003 RLS: forbid updating others
  - Steps: Attempt to update another user
  - Expected: Blocked by RLS; error surfaced

- PROF-004 Optional fields
  - Steps: Update avatar/bio/etc. (if present)
  - Expected: Validated and stored

- PROF-005 Accessibility
  - Steps: Keyboard and SR labels
  - Expected: Proper labels and focus
