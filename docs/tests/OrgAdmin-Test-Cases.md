# Organization Admin (Invites/Users) — Step-by-step Test Cases

- ORG-ADM-001 Admin adds user
  - Steps: Add user via admin UI
  - Expected: Invite/pending user appears; status correct

- ORG-ADM-002 Member cannot add user
  - Steps: Member opens user management
  - Expected: Access denied/hidden

- ORG-ADM-003 Resend invite
  - Steps: Resend pending invite
  - Expected: Success; timestamp updated

- ORG-ADM-004 Deactivate/Activate user
  - Steps: Toggle active
  - Expected: Login/visibility affected

- ORG-ADM-005 Role change
  - Steps: Change role
  - Expected: Permissions reflect immediately

- ORG-ADM-006 Search/filter users
  - Steps: Search list
  - Expected: Accurate filtering

- ORG-ADM-007 Tenant isolation
  - Steps: Try adding to another org
  - Expected: Blocked by server/RLS
