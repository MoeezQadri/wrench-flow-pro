UPDATE public.invoices
SET completed_at = CASE
  WHEN date < '2026-09-29 12:19:47+00' THEN COALESCE(date, created_at)
  ELSE COALESCE(updated_at, date, created_at)
END
WHERE status IN ('payment_pending','partial_payment','payment_completed')
  AND completed_at IS NULL;