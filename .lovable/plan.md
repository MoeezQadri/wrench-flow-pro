# Make the app faster without changing anything you see

## What I measured

Your data is small — the biggest table has 195 rows, most have well under 100. Nothing should ever take half a second. So the slowness is not the amount of data; it's how often the app asks and how much work each request makes the database repeat.

The three real causes, measured on your live database:

**1. Every request re-checks who you are, once per row.**
A permission check runs "which shop does this user belong to?" against the user table for every single row of every result. That one lookup has run 26,968 times, burning about 7 minutes of database time in total, and it averages 16ms per call. It's the single most expensive thing in the database.

**2. The customer list asks about each customer separately.**
Each customer card fetches that customer's cars on its own — and twice over, because the summary figures fetch them again. Worse, the shared data layer hands the cards a brand-new copy of those functions on every screen update, so the cards refetch over and over. Result: 21,676 car lookups totalling more than 10 minutes of database time, for a table with 51 rows.

**3. A few lookups have no index.**
Cars are looked up by customer, invoice lines and payments by invoice, but there is no index on those columns, so the database scans the whole table each time. Some unfiltered car and invoice reads average 340-560ms each.

Two smaller things: the invoice list pulls every invoice with all its lines, payments and vehicle details in one unbounded request and then filters in the browser; and the invoice detail page reloads that entire set when it only needs one invoice.

## What I'll change

### Database (no visible change, big speed win)

- Make the permission helper functions run once per request instead of once per row, and let them read the user record directly instead of going back through permission checks. Same rules, same access — just evaluated once.
- Add the missing indexes: cars by customer, invoice lines by invoice, payments by invoice, invoices by customer, vehicle and date, expenses/bills by part.

### Customer list

- Load all cars and all invoice figures for the visible customers in one request instead of one request per card, and drop the duplicate car fetch inside the summary figures.
- Stop the shared data layer from handing out new function copies on every update, so screens stop refetching for no reason. This also removes repeated reloads on several other screens.

### Invoices

- The invoice detail page will fetch just the one invoice it's showing instead of reloading every invoice with all its lines and payments.
- Keep the invoice list's data exactly as it is today (all statuses, all filters, all totals work off the same numbers) — only the wasted repeat loads go away.

### Cleanup

- Remove the unused data-loading helpers that nothing calls, and the leftover reference to a data library that was never wired in. This is dead code only; nothing that runs today is touched.

## What will not change

This is a speed-only change. The absolute requirement is that everything works exactly as it does today — nothing changes, nothing fails, nothing breaks.

- No feature, page, figure, filter or permission changes.
- No loading spinners, skeletons or page-transition styles change.
- No pagination or "load more" is introduced — every screen still shows everything it shows today.
- No change to invoice, tax, discount, profit, payable or report maths.
- Same access rules for every role, including super admin — the permission changes only affect how often the rules are evaluated, never who passes them.
- If any single step can't be made faster without risking behaviour, that step is dropped rather than shipped.

## Technical detail

- Rewrite policy predicates to wrap helper calls in a scalar subselect — `(select public.current_user_org())` and `(select public.user_is_superadmin())` — so Postgres evaluates them once per statement as an InitPlan instead of per row. Applies to policies on `invoices`, `invoice_items`, `payments`, `parts`, `tasks`, `vehicles`, `customers`, `organizations`, `expenses`, `payables`, `vendors`, `attendance`, `mechanics`.
- Mark `current_user_org()` and `user_is_superadmin()` as `SECURITY DEFINER STABLE` with a pinned `search_path` (matching the existing `current_user_org_secure()`), so their reads of `public.profiles` don't re-enter `profiles` RLS.
- New indexes: `vehicles(customer_id)`, `invoice_items(invoice_id)`, `payments(invoice_id)`, `payments(payable_id)`, `invoices(customer_id)`, `invoices(vehicle_id)`, `invoices(date)`, `expenses(part_id)`, `payables(expense_id)` — created only where the column exists and no equivalent index is present.
- `src/context/data/DataContext.tsx`: wrap every exposed function in `useCallback` (or take them from already-stable hook references) and wrap the provider `value` in `useMemo`, so consumer effects keyed on those functions stop re-firing.
- `src/pages/Customers.tsx`: hoist the per-card fetch into the page — one `vehicles` query with `.in('customer_id', ids)` plus the already-loaded invoices — and pass results down as props. `getCustomerAnalytics` in `DataContext.tsx` stops issuing its own vehicle query.
- `src/pages/InvoiceDetails.tsx`: replace the `loadInvoices()` fallback with a single-invoice fetch by id (same nested select shape, `.eq('id', id).maybeSingle()`).
- Delete `src/hooks/useAsyncData.ts` (no importers) and the dead `window.reactQueryClient` branch in `src/utils/global-refresh.ts`. Leave `useSmartDataLoading`, `useDataCache`, `useEnhancedDataLoading` and `useIncrementalDataLoading` in place — they are all in use and changing them risks behaviour.

## How I'll verify

- Re-run the database's slow-query report before and after, and confirm the permission lookup's call count and total time collapse.
- `EXPLAIN` the car-by-customer and invoice-lines-by-invoice reads to confirm the new indexes are used.
- Load the customer list in a browser with the network log captured and confirm one cars request instead of one per card, and no repeat storms on re-render.
- Walk invoices (list, detail, create, edit, estimate), customers, parts, vendors, finance, tasks, attendance and reports to confirm identical data and identical loading behaviour.
- Type check and build.
