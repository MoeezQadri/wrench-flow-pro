
-- Add discount columns to the invoices table
ALTER TABLE public.invoices 
ADD COLUMN discount_type text CHECK (discount_type IN ('none', 'percentage', 'fixed')),
ADD COLUMN discount_value numeric DEFAULT 0;

-- Set default values for existing records
UPDATE public.invoices 
SET discount_type = 'none', discount_value = 0 
WHERE discount_type IS NULL;

-- Make discount_type NOT NULL after setting defaults
ALTER TABLE public.invoices 
ALTER COLUMN discount_type SET NOT NULL,
ALTER COLUMN discount_type SET DEFAULT 'none';
