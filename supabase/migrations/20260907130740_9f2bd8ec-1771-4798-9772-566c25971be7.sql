ALTER TABLE public.subscribers
ADD COLUMN IF NOT EXISTS stripe_subscription_id text;

CREATE INDEX IF NOT EXISTS subscribers_stripe_subscription_id_idx
ON public.subscribers (stripe_subscription_id)
WHERE stripe_subscription_id IS NOT NULL;