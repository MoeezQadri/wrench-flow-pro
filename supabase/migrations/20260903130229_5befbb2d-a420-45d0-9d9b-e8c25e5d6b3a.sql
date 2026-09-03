ALTER TABLE public.invoices
  DROP CONSTRAINT invoices_vehicle_id_fkey;

ALTER TABLE public.invoices
  ADD CONSTRAINT invoices_vehicle_id_fkey
  FOREIGN KEY (vehicle_id)
  REFERENCES public.vehicles(id)
  ON DELETE RESTRICT;