ALTER TABLE public.parts ADD COLUMN IF NOT EXISTS cost numeric NOT NULL DEFAULT 0;
ALTER TABLE public.invoice_items ADD COLUMN IF NOT EXISTS cost numeric NOT NULL DEFAULT 0;
UPDATE public.parts SET cost = price WHERE cost = 0;