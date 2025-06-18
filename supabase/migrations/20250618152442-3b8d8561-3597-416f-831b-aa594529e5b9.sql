
-- First, let's check what values are allowed for employment_type_enum
-- Looking at the error, we need to use the correct enum values

-- Insert test mechanics with correct employment_type values
INSERT INTO public.mechanics (id, name, specialization, phone, address, is_active, employment_type) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'John Smith', 'Engine Specialist', '+1-555-0101', '123 Main St, Anytown, USA', true, 'fulltime'),
('550e8400-e29b-41d4-a716-446655440002', 'Maria Garcia', 'Brake Systems', '+1-555-0102', '456 Oak Ave, Anytown, USA', true, 'fulltime'),
('550e8400-e29b-41d4-a716-446655440003', 'David Chen', 'Electrical Systems', '+1-555-0103', '789 Pine Rd, Anytown, USA', true, 'fulltime');

-- Insert test tasks (completed tasks that can be added to invoices)
INSERT INTO public.tasks (id, title, description, status, location, price, hours_estimated, hours_spent, mechanic_id, vehicle_id) VALUES
('660e8400-e29b-41d4-a716-446655440001', 'Oil Change Service', 'Complete oil and filter change with inspection', 'completed', 'workshop', 45.00, 0.5, 0.5, '550e8400-e29b-41d4-a716-446655440001', (SELECT id FROM vehicles LIMIT 1)),
('660e8400-e29b-41d4-a716-446655440002', 'Brake Pad Replacement', 'Replace front brake pads and resurface rotors', 'completed', 'workshop', 180.00, 2.0, 2.0, '550e8400-e29b-41d4-a716-446655440002', (SELECT id FROM vehicles LIMIT 1)),
('660e8400-e29b-41d4-a716-446655440003', 'Battery Test and Replace', 'Test battery condition and replace if needed', 'completed', 'workshop', 120.00, 1.0, 0.75, '550e8400-e29b-41d4-a716-446655440003', (SELECT id FROM vehicles LIMIT 1)),
('660e8400-e29b-41d4-a716-446655440004', 'Tire Rotation', 'Rotate all four tires and check pressure', 'completed', 'workshop', 35.00, 0.5, 0.5, '550e8400-e29b-41d4-a716-446655440001', (SELECT id FROM vehicles LIMIT 1));

-- Insert some test parts with inventory quantities > 0
INSERT INTO public.parts (id, name, description, price, quantity, part_number, category, manufacturer, location) VALUES
('770e8400-e29b-41d4-a716-446655440001', 'Engine Oil Filter', 'High-quality oil filter for most vehicles', 12.99, 25, 'OF-001', 'Filters', 'AutoParts Inc', 'Shelf A-1'),
('770e8400-e29b-41d4-a716-446655440002', 'Brake Pads - Front', 'Ceramic brake pads for front wheels', 45.99, 15, 'BP-F001', 'Brakes', 'BrakeMaster', 'Shelf B-2'),
('770e8400-e29b-41d4-a716-446655440003', 'Car Battery 12V', 'Standard 12V automotive battery', 89.99, 8, 'BAT-12V', 'Electrical', 'PowerCell', 'Floor Storage'),
('770e8400-e29b-41d4-a716-446655440004', 'Air Filter', 'Engine air filter replacement', 18.50, 20, 'AF-002', 'Filters', 'AutoParts Inc', 'Shelf A-2'),
('770e8400-e29b-41d4-a716-446655440005', 'Spark Plugs Set', 'Set of 4 spark plugs', 32.00, 12, 'SP-SET4', 'Engine', 'IgnitePro', 'Shelf C-1');
