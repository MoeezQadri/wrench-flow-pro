ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS completed_at timestamptz;

CREATE OR REPLACE FUNCTION public.set_invoice_completed_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.status IN ('completed','partial','paid') THEN
    IF NEW.completed_at IS NULL THEN
      NEW.completed_at := COALESCE(NEW.date, now());
      IF TG_OP = 'UPDATE' AND OLD.status NOT IN ('completed','partial','paid') THEN
        NEW.completed_at := now();
      END IF;
    END IF;
  ELSE
    NEW.completed_at := NULL;
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_invoice_completed_at ON public.invoices;
CREATE TRIGGER trg_invoice_completed_at BEFORE INSERT OR UPDATE ON public.invoices
FOR EACH ROW EXECUTE FUNCTION public.set_invoice_completed_at();

UPDATE public.invoices SET completed_at = COALESCE(date, created_at)
WHERE status IN ('completed','partial','paid') AND completed_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_invoices_org_completed_at ON public.invoices(organization_id, completed_at);