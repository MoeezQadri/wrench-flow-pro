
-- Update the tasks table to ensure mechanic assignment is properly supported
-- Add an index for better performance when querying by mechanic
CREATE INDEX IF NOT EXISTS idx_tasks_mechanic_id ON public.tasks(mechanic_id);

-- Add an index for better performance when querying by vehicle and status
CREATE INDEX IF NOT EXISTS idx_tasks_vehicle_status ON public.tasks(vehicle_id, status);

-- No need to update mechanic_id values since NULL is already the default for unassigned tasks
