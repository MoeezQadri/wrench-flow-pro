ALTER TABLE public.expenses
  ADD COLUMN IF NOT EXISTS part_id uuid REFERENCES public.parts(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS quantity numeric,
  ADD COLUMN IF NOT EXISTS unit_cost numeric;

ALTER TABLE public.payables
  ADD COLUMN IF NOT EXISTS part_id uuid REFERENCES public.parts(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS quantity numeric,
  ADD COLUMN IF NOT EXISTS unit_cost numeric;

CREATE OR REPLACE FUNCTION public.handle_expense_payable()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  IF NEW.payment_status IS NULL OR NEW.payment_status != 'paid' THEN
    INSERT INTO public.payables (
      expense_id,
      vendor_id,
      description,
      amount,
      status,
      organization_id,
      part_id,
      quantity,
      unit_cost,
      created_at
    ) VALUES (
      NEW.id,
      NEW.vendor_id,
      COALESCE(NEW.description, 'Expense: ' || NEW.category),
      NEW.amount,
      'pending',
      NEW.organization_id,
      NEW.part_id,
      NEW.quantity,
      NEW.unit_cost,
      NOW()
    );
  END IF;

  RETURN NEW;
END;
$function$;