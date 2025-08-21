-- Create trigger function to automatically create payable when expense is created unpaid
CREATE OR REPLACE FUNCTION public.handle_expense_payable()
RETURNS TRIGGER AS $$
BEGIN
  -- Only create payable if payment_status is not 'paid'
  IF NEW.payment_status IS NULL OR NEW.payment_status != 'paid' THEN
    INSERT INTO public.payables (
      expense_id,
      vendor_id,
      description,
      amount,
      status,
      organization_id,
      created_at
    ) VALUES (
      NEW.id,
      NEW.vendor_id,
      COALESCE(NEW.description, 'Expense: ' || NEW.category),
      NEW.amount,
      'pending',
      NEW.organization_id,
      NOW()
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to run after expense insert
CREATE TRIGGER expense_create_payable_trigger
  AFTER INSERT ON public.expenses
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_expense_payable();

-- Create trigger function to update payable when expense payment status changes
CREATE OR REPLACE FUNCTION public.handle_expense_payment_update()
RETURNS TRIGGER AS $$
BEGIN
  -- If payment status changed to 'paid', mark payable as paid
  IF OLD.payment_status != 'paid' AND NEW.payment_status = 'paid' THEN
    UPDATE public.payables 
    SET 
      status = 'paid',
      paid_amount = NEW.amount,
      payment_date = NOW(),
      payment_method = NEW.payment_method::text
    WHERE expense_id = NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to run after expense update
CREATE TRIGGER expense_update_payable_trigger
  AFTER UPDATE ON public.expenses
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_expense_payment_update();