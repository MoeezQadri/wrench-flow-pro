
-- Add new fields to invoice_items table for automatic assignment
ALTER TABLE public.invoice_items 
ADD COLUMN part_id UUID,
ADD COLUMN task_id UUID,
ADD COLUMN is_auto_added BOOLEAN DEFAULT FALSE;

-- Add foreign key constraints
ALTER TABLE public.invoice_items 
ADD CONSTRAINT fk_invoice_items_part_id 
FOREIGN KEY (part_id) REFERENCES public.parts(id) ON DELETE SET NULL;

ALTER TABLE public.invoice_items 
ADD CONSTRAINT fk_invoice_items_task_id 
FOREIGN KEY (task_id) REFERENCES public.tasks(id) ON DELETE SET NULL;

-- Add check constraint to ensure only one of part_id or task_id is set
ALTER TABLE public.invoice_items 
ADD CONSTRAINT chk_part_or_task_exclusive 
CHECK ((part_id IS NULL) OR (task_id IS NULL));
