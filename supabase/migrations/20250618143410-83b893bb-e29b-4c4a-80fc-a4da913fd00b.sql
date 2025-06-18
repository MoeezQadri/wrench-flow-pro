
-- Add part_number field to parts table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'parts' AND column_name = 'part_number'
    ) THEN
        ALTER TABLE parts ADD COLUMN part_number TEXT;
    END IF;
END $$;

-- Add category field to parts table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'parts' AND column_name = 'category'
    ) THEN
        ALTER TABLE parts ADD COLUMN category TEXT;
    END IF;
END $$;

-- Add manufacturer field to parts table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'parts' AND column_name = 'manufacturer'
    ) THEN
        ALTER TABLE parts ADD COLUMN manufacturer TEXT;
    END IF;
END $$;

-- Add location field to parts table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'parts' AND column_name = 'location'
    ) THEN
        ALTER TABLE parts ADD COLUMN location TEXT;
    END IF;
END $$;

-- Add unit field to parts table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'parts' AND column_name = 'unit'
    ) THEN
        ALTER TABLE parts ADD COLUMN unit TEXT DEFAULT 'piece';
    END IF;
END $$;

-- Add labor_rate field to tasks table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'tasks' AND column_name = 'labor_rate'
    ) THEN
        ALTER TABLE tasks ADD COLUMN labor_rate NUMERIC DEFAULT 50.00;
    END IF;
END $$;

-- Add skill_level field to tasks table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'tasks' AND column_name = 'skill_level'
    ) THEN
        ALTER TABLE tasks ADD COLUMN skill_level TEXT DEFAULT 'standard';
    END IF;
END $$;

-- Add custom_part_data JSONB field to invoice_items table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'invoice_items' AND column_name = 'custom_part_data'
    ) THEN
        ALTER TABLE invoice_items ADD COLUMN custom_part_data JSONB;
    END IF;
END $$;

-- Add custom_labor_data JSONB field to invoice_items table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'invoice_items' AND column_name = 'custom_labor_data'
    ) THEN
        ALTER TABLE invoice_items ADD COLUMN custom_labor_data JSONB;
    END IF;
END $$;

-- Add unit_of_measure field to invoice_items table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'invoice_items' AND column_name = 'unit_of_measure'
    ) THEN
        ALTER TABLE invoice_items ADD COLUMN unit_of_measure TEXT DEFAULT 'piece';
    END IF;
END $$;

-- Add creates_inventory_part boolean field to invoice_items table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'invoice_items' AND column_name = 'creates_inventory_part'
    ) THEN
        ALTER TABLE invoice_items ADD COLUMN creates_inventory_part BOOLEAN DEFAULT false;
    END IF;
END $$;

-- Add creates_task boolean field to invoice_items table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'invoice_items' AND column_name = 'creates_task'
    ) THEN
        ALTER TABLE invoice_items ADD COLUMN creates_task BOOLEAN DEFAULT false;
    END IF;
END $$;

-- Create index on custom_part_data for better performance
CREATE INDEX IF NOT EXISTS idx_invoice_items_custom_part_data 
ON invoice_items USING gin(custom_part_data);

-- Create index on custom_labor_data for better performance
CREATE INDEX IF NOT EXISTS idx_invoice_items_custom_labor_data 
ON invoice_items USING gin(custom_labor_data);

-- Update existing invoice_items to have proper unit_of_measure
UPDATE invoice_items 
SET unit_of_measure = 'piece' 
WHERE unit_of_measure IS NULL;

-- Update existing parts to have proper unit
UPDATE parts 
SET unit = 'piece' 
WHERE unit IS NULL;

-- Update existing tasks to have proper labor_rate and skill_level
UPDATE tasks 
SET labor_rate = 50.00 
WHERE labor_rate IS NULL;

UPDATE tasks 
SET skill_level = 'standard' 
WHERE skill_level IS NULL;
