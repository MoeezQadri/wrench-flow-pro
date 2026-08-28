ALTER TABLE public.attendance
  ADD COLUMN IF NOT EXISTS record_type text NOT NULL DEFAULT 'attendance',
  ADD COLUMN IF NOT EXISTS leave_type text,
  ADD COLUMN IF NOT EXISTS leave_end_date date;

ALTER TABLE public.attendance ALTER COLUMN check_in DROP NOT NULL;

ALTER TABLE public.tasks
  ADD COLUMN IF NOT EXISTS billing_type text NOT NULL DEFAULT 'hourly';