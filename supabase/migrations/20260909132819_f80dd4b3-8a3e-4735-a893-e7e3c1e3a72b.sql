-- 1) Remove duplicate bill-creating triggers (each expense was creating two bills)
DROP TRIGGER IF EXISTS create_payable_after_expense ON public.expenses;
DROP TRIGGER IF EXISTS update_payable_after_expense_payment ON public.expenses;

-- 2) Delete duplicate bills, keeping the oldest row per expense
DELETE FROM public.payables p
USING public.payables q
WHERE p.expense_id IS NOT NULL
  AND p.expense_id = q.expense_id
  AND (
    q.created_at < p.created_at
    OR (q.created_at = p.created_at AND q.id < p.id)
  );

-- 3) Invoices marked paid without any recorded payment go back to open
UPDATE public.invoices i
SET status = 'open', updated_at = now()
WHERE i.status = 'paid'
  AND NOT EXISTS (SELECT 1 FROM public.payments p WHERE p.invoice_id = i.id);