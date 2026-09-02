# Task price field: findings and fix

## What I found

- **Price is not strictly required.** In `src/components/task/TaskForm.tsx` the price field validates as "0 or greater" and defaults to `0`, so an internal task can be saved without typing anything. It looks required only because the label has no "optional" hint and the field is always visible.
- **Currency is hardcoded.** The label reads `Price ($)` / `Lumpsum Fee ($)` regardless of the organization's currency setting. The app already has `useOrganizationSettings()` with `currencySymbol` / `formatOrgCurrency`, used elsewhere, so this field is out of step.
- **Why price exists at all for internal tasks.** Task price is stored on every task and summed as "Total Task Value" in the Tasks report (`src/pages/reports/TasksReport.tsx`), so internal tasks carry an optional internal cost/value figure. It is not billed to a customer — only invoice tasks flow into invoice totals.

## Proposed changes

1. In `TaskForm.tsx`, replace the hardcoded `$` with the organization currency symbol from `useOrganizationSettings()`.
2. Label the field clearly by task type:
   - Invoice + hourly: `Price per Hour (<symbol>)`
   - Invoice + lumpsum: `Lumpsum Fee (<symbol>)`
   - Internal: `Internal Cost (<symbol>) — optional`, with a short helper line noting it is not billed to a customer and only feeds workshop reporting.
3. Keep price optional (empty treated as 0) so internal tasks can be saved without a value.

No database or business-logic changes; presentation and labelling only.
