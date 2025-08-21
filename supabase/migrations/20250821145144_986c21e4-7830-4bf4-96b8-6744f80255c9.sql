-- Ensure triggers exist to keep expenses and payables in sync
-- 1) Create trigger to automatically create a payable after inserting an expense (if not already paid)
DROP TRIGGER IF EXISTS create_payable_after_expense ON public.expenses;
CREATE TRIGGER create_payable_after_expense
AFTER INSERT ON public.expenses
FOR EACH ROW
EXECUTE FUNCTION public.handle_expense_payable();

-- 2) Create trigger to update payable when expense payment_status changes to 'paid'
DROP TRIGGER IF EXISTS update_payable_after_expense_payment ON public.expenses;
CREATE TRIGGER update_payable_after_expense_payment
AFTER UPDATE OF payment_status ON public.expenses
FOR EACH ROW
WHEN (OLD.payment_status IS DISTINCT FROM NEW.payment_status)
EXECUTE FUNCTION public.handle_expense_payment_update();

-- 3) Backfill: create payables for existing expenses that don't have one yet
INSERT INTO public.payables (
  expense_id,
  vendor_id,
  description,
  amount,
  status,
  organization_id,
  created_at,
  payment_date,
  paid_amount,
  payment_method
)
SELECT 
  e.id AS expense_id,
  e.vendor_id,
  COALESCE(e.description, 'Expense: ' || e.category) AS description,
  e.amount,
  CASE WHEN e.payment_status = 'paid' THEN 'paid' ELSE 'pending' END AS status,
  e.organization_id,
  NOW() AS created_at,
  CASE WHEN e.payment_status = 'paid' THEN COALESCE(e.updated_at, NOW()) ELSE NULL END AS payment_date,
  CASE WHEN e.payment_status = 'paid' THEN e.amount ELSE 0 END AS paid_amount,
  CASE WHEN e.payment_status = 'paid' THEN e.payment_method::text ELSE NULL END AS payment_method
FROM public.expenses e
LEFT JOIN public.payables p ON p.expense_id = e.id
WHERE p.id IS NULL;
