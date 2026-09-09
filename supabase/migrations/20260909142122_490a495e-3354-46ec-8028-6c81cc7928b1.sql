CREATE UNIQUE INDEX IF NOT EXISTS attendance_unique_day
  ON public.attendance (mechanic_id, date, record_type);