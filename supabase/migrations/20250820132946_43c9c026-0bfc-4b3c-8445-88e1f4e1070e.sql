-- Add invoice_id column to expenses table for linking expenses to specific invoices
ALTER TABLE public.expenses 
ADD COLUMN invoice_id UUID;

-- Add index for better performance when querying expenses by invoice
CREATE INDEX idx_expenses_invoice_id ON public.expenses(invoice_id);

-- Add comment for documentation
COMMENT ON COLUMN public.expenses.invoice_id IS 'Links expense to specific invoice when part/item purchased for that invoice';