-- Enhance vendors table with additional fields for better financial tracking
ALTER TABLE public.vendors ADD COLUMN IF NOT EXISTS payment_terms INTEGER DEFAULT 30; -- Days for payment
ALTER TABLE public.vendors ADD COLUMN IF NOT EXISTS credit_limit NUMERIC DEFAULT 0;
ALTER TABLE public.vendors ADD COLUMN IF NOT EXISTS vendor_type TEXT DEFAULT 'supplier'; -- 'supplier', 'service_provider', 'contractor'
ALTER TABLE public.vendors ADD COLUMN IF NOT EXISTS tax_id TEXT;
ALTER TABLE public.vendors ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE public.vendors ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE public.vendors ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT now();

-- Create payables table to track what we owe to vendors
CREATE TABLE IF NOT EXISTS public.payables (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vendor_id UUID REFERENCES public.vendors(id) ON DELETE SET NULL,
    expense_id UUID REFERENCES public.expenses(id) ON DELETE CASCADE,
    reference_number TEXT, -- Invoice/bill number from vendor
    description TEXT NOT NULL,
    amount NUMERIC NOT NULL CHECK (amount > 0),
    due_date TIMESTAMP WITH TIME ZONE,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'overdue', 'paid', 'partially_paid', 'cancelled')),
    paid_amount NUMERIC DEFAULT 0 CHECK (paid_amount >= 0),
    payment_date TIMESTAMP WITH TIME ZONE,
    payment_method TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create receivables view based on existing invoices to track what customers owe us
CREATE OR REPLACE VIEW public.receivables AS
SELECT 
    i.id,
    i.customer_id,
    c.name as customer_name,
    c.email as customer_email,
    c.phone as customer_phone,
    i.date as invoice_date,
    i.due_date,
    -- Calculate invoice total (subtotal + tax - discount)
    CASE 
        WHEN ii_summary.subtotal IS NULL THEN 0
        ELSE ROUND(
            ii_summary.subtotal + 
            (ii_summary.subtotal * COALESCE(i.tax_rate, 0) / 100) - 
            CASE 
                WHEN i.discount_type = 'percentage' THEN ii_summary.subtotal * COALESCE(i.discount_value, 0) / 100
                WHEN i.discount_type = 'fixed' THEN COALESCE(i.discount_value, 0)
                ELSE 0
            END, 2)
    END as total_amount,
    -- Calculate paid amount
    COALESCE(p_summary.paid_amount, 0) as paid_amount,
    -- Calculate balance due
    CASE 
        WHEN ii_summary.subtotal IS NULL THEN 0
        ELSE ROUND(
            ii_summary.subtotal + 
            (ii_summary.subtotal * COALESCE(i.tax_rate, 0) / 100) - 
            CASE 
                WHEN i.discount_type = 'percentage' THEN ii_summary.subtotal * COALESCE(i.discount_value, 0) / 100
                WHEN i.discount_type = 'fixed' THEN COALESCE(i.discount_value, 0)
                ELSE 0
            END, 2) - COALESCE(p_summary.paid_amount, 0)
    END as balance_due,
    -- Calculate days overdue
    CASE 
        WHEN i.due_date IS NOT NULL AND i.due_date < CURRENT_DATE THEN 
            EXTRACT(DAY FROM (CURRENT_DATE - i.due_date::date))::INTEGER
        ELSE 0
    END as days_overdue,
    i.status,
    i.notes,
    i.created_at,
    i.updated_at
FROM public.invoices i
LEFT JOIN public.customers c ON i.customer_id = c.id
LEFT JOIN (
    SELECT 
        invoice_id, 
        ROUND(SUM(quantity * price), 2) as subtotal
    FROM public.invoice_items 
    GROUP BY invoice_id
) ii_summary ON i.id = ii_summary.invoice_id
LEFT JOIN (
    SELECT 
        invoice_id, 
        ROUND(SUM(amount), 2) as paid_amount
    FROM public.payments 
    GROUP BY invoice_id
) p_summary ON i.id = p_summary.invoice_id
WHERE i.status IN ('open', 'partial', 'overdue');

-- Create financial summary view
CREATE OR REPLACE VIEW public.financial_summary AS
WITH payables_summary AS (
    SELECT 
        COUNT(*) as total_payables,
        COALESCE(SUM(amount - paid_amount), 0) as total_payables_amount,
        COALESCE(SUM(CASE WHEN status = 'overdue' THEN amount - paid_amount ELSE 0 END), 0) as overdue_payables
    FROM public.payables 
    WHERE status IN ('pending', 'overdue', 'partially_paid')
),
receivables_summary AS (
    SELECT 
        COUNT(*) as total_receivables,
        COALESCE(SUM(balance_due), 0) as total_receivables_amount,
        COALESCE(SUM(CASE WHEN days_overdue > 0 THEN balance_due ELSE 0 END), 0) as overdue_receivables
    FROM public.receivables
)
SELECT 
    p.total_payables,
    p.total_payables_amount,
    p.overdue_payables,
    r.total_receivables,
    r.total_receivables_amount,
    r.overdue_receivables,
    (r.total_receivables_amount - p.total_payables_amount) as net_position
FROM payables_summary p
CROSS JOIN receivables_summary r;

-- Enable RLS on new payables table
ALTER TABLE public.payables ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for payables
CREATE POLICY "Allow authenticated users full access to payables"
ON public.payables
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_payables_vendor_id ON public.payables(vendor_id);
CREATE INDEX IF NOT EXISTS idx_payables_due_date ON public.payables(due_date);
CREATE INDEX IF NOT EXISTS idx_payables_status ON public.payables(status);
CREATE INDEX IF NOT EXISTS idx_vendors_vendor_type ON public.vendors(vendor_type);
CREATE INDEX IF NOT EXISTS idx_vendors_is_active ON public.vendors(is_active);

-- Create function to automatically update payables when expenses are created/updated
CREATE OR REPLACE FUNCTION public.sync_expense_to_payable()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    IF TG_OP = 'INSERT' AND NEW.vendor_id IS NOT NULL THEN
        -- Create corresponding payable record
        INSERT INTO public.payables (
            vendor_id,
            expense_id,
            description,
            amount,
            due_date,
            status,
            created_at,
            updated_at
        ) VALUES (
            NEW.vendor_id,
            NEW.id,
            COALESCE(NEW.description, 'Expense: ' || NEW.category),
            NEW.amount,
            NEW.date + INTERVAL '30 days', -- Default 30 days payment terms
            CASE 
                WHEN NEW.payment_status = 'paid' THEN 'paid'
                ELSE 'pending'
            END,
            NEW.created_at,
            NEW.updated_at
        );
        
    ELSIF TG_OP = 'UPDATE' AND NEW.vendor_id IS NOT NULL THEN
        -- Update corresponding payable record
        UPDATE public.payables 
        SET 
            amount = NEW.amount,
            status = CASE 
                WHEN NEW.payment_status = 'paid' THEN 'paid'
                ELSE 'pending'
            END,
            paid_amount = CASE 
                WHEN NEW.payment_status = 'paid' THEN NEW.amount
                ELSE 0
            END,
            payment_date = CASE 
                WHEN NEW.payment_status = 'paid' THEN NEW.updated_at
                ELSE NULL
            END,
            updated_at = NEW.updated_at
        WHERE expense_id = NEW.id;
        
    ELSIF TG_OP = 'DELETE' AND OLD.vendor_id IS NOT NULL THEN
        -- Delete corresponding payable record
        DELETE FROM public.payables WHERE expense_id = OLD.id;
        RETURN OLD;
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$;

-- Create trigger for expense-payable synchronization
DROP TRIGGER IF EXISTS sync_expense_to_payable_trigger ON public.expenses;
CREATE TRIGGER sync_expense_to_payable_trigger
    AFTER INSERT OR UPDATE OR DELETE ON public.expenses
    FOR EACH ROW
    EXECUTE FUNCTION public.sync_expense_to_payable();

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER 
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

-- Create triggers for updating timestamps
DROP TRIGGER IF EXISTS update_vendors_updated_at ON public.vendors;
CREATE TRIGGER update_vendors_updated_at
    BEFORE UPDATE ON public.vendors
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_payables_updated_at ON public.payables;
CREATE TRIGGER update_payables_updated_at
    BEFORE UPDATE ON public.payables
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();