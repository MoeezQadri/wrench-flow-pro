# Core Modules — Step-by-step Test Cases

Invoices
- INV-001 Create invoice → totals/status correct
- INV-002 Edit invoice → totals recalc; updated_at set
- INV-003 Add payment → balance/status updated
- INV-004 Filter/search by status/date/customer → correct results
- INV-005 Delete (if allowed) → removed per rules
- INV-006 Export/print (if present) → accurate content

Tasks
- TASK-001 Create task → defaults
- TASK-002 Check-in/out → times set; durations visible
- TASK-003 Complete task → status/fields set
- TASK-004 Assign to invoice → line item present
- TASK-005 Filters → correct subsets

Parts
- PART-001 Add part → validations; defaults
- PART-002 Adjust stock → updated_at; low-stock badge
- PART-003 Assign to invoice → line added
- PART-004 Search by name/number/category → accurate

Customers
- CUST-001 Create customer → saved
- CUST-002 Edit customer → persisted
- CUST-003 View details → related data visible

Vehicles
- VEH-001 Add vehicle → linked to customer
- VEH-002 VIN/plate uniqueness (if enforced) → duplicate prevented/warned

Expenses/Payables
- EXP-001 Add expense → saved
- EXP-002 Link to payables → records updated
- EXP-003 Filters → accurate results

Payments/Finance
- PAY-001 Record payment → status/balance
- PAY-002 Overpayment guard → prevented/credited

Reports/Analytics
- REP-001 Invoicing report by date → totals correct
- REP-002 Tasks/Attendance reports → aggregates correct; export works

Navigation/Roles
- NAV-001 Private route guard → redirect unauth
- NAV-002 Role-gated pages → denied for insufficient role

Security/RLS Regression
- SEC-001 Profiles self-only access
- SEC-002 Public tables limited to intended ops
- SEC-003 Multi-tenant isolation across modules

Performance/A11Y/UX
- PERF-001 Dashboard cold load baseline
- A11Y-001 Forms labeled; keyboard; contrast
- UX-001 Toasts/errors/loading states present
