-- Create subscription plans table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.subscription_plans (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  name text NOT NULL,
  description text,
  price_monthly numeric NOT NULL DEFAULT 0,
  price_yearly numeric,
  included_seats integer NOT NULL DEFAULT 1,
  price_per_additional_seat numeric NOT NULL DEFAULT 0,
  features jsonb,
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer DEFAULT 0
);

-- Enable RLS on subscription plans
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;

-- Allow everyone to read subscription plans (they are public)
CREATE POLICY "Everyone can read subscription plans" 
ON public.subscription_plans 
FOR SELECT 
USING (is_active = true);

-- Only superadmins can manage subscription plans
CREATE POLICY "Superadmins can manage subscription plans" 
ON public.subscription_plans 
FOR ALL 
USING (user_is_superadmin()) 
WITH CHECK (user_is_superadmin());

-- Insert default subscription plans
INSERT INTO public.subscription_plans (
  name, 
  description, 
  price_monthly, 
  price_yearly, 
  included_seats, 
  price_per_additional_seat, 
  features, 
  sort_order
) VALUES 
(
  'Trial',
  'Free trial for new users to explore the platform',
  0,
  0,
  1,
  0,
  '["1 user included", "Basic reporting", "Standard support", "14-day trial period"]'::jsonb,
  1
),
(
  'Basic',
  'For small workshops or teams getting started',
  29,
  290,
  3,
  10,
  '["Up to 3 users included", "Basic reporting", "Standard support", "Essential workshop features", "Email support"]'::jsonb,
  2
),
(
  'Professional',
  'For growing businesses with more complex needs',
  79,
  790,
  10,
  8,
  '["Up to 10 users included", "Advanced reporting", "Priority support", "Complete feature set", "API access", "Unlimited customers", "Phone support"]'::jsonb,
  3
),
(
  'Enterprise',
  'For large organizations with custom requirements',
  199,
  1990,
  50,
  5,
  '["Up to 50 users included", "Custom reporting", "Dedicated support", "All features", "Priority API access", "Custom integrations", "Dedicated account manager", "SLA guarantee"]'::jsonb,
  4
);