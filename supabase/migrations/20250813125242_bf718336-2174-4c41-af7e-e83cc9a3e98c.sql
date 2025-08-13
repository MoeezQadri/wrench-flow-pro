-- Enable real-time for customers table
ALTER TABLE public.customers REPLICA IDENTITY FULL;

-- Add customers table to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.customers;