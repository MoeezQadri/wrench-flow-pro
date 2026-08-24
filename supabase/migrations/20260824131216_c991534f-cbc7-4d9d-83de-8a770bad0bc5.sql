ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS default_tax_rate numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS timezone text;