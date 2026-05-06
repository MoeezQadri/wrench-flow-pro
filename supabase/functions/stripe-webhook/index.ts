// supabase/functions/stripe-webhook/index.ts

import { serve } from 'https://deno.land/std@0.180.0/http/server.ts';
import Stripe from 'https://esm.sh/stripe@12.0.0?target=deno';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
  apiVersion: '2024-06-20',
});

const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');

serve(async (req) => {
  let event;

  // Verify webhook signature
  try {
    const signature = req.headers.get('stripe-signature')!;
    const body = await req.text();
    event = await stripe.webhooks.constructEventAsync(
      body,
      signature,
      webhookSecret!
    );
  } catch (err) {
    console.error('Webhook signature failed', err);
    return new Response('Invalid signature', { status: 400 });
  }

  // Only handle checkout completed
  if (event.type !== 'checkout.session.completed') {
    return new Response('Ignored', { status: 200 });
  }

  const session = event.data.object as any;
  const userId = session?.metadata?.user_id;
  const userEmail = session?.metadata?.user_email;

  if (!userId) {
    console.error('Missing user_id in Stripe metadata');
    return new Response('Missing user_id metadata', { status: 400 });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  // 1. Get profile to find organization_id
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('organization_id')
    .eq('id', userId)
    .single();

  if (profileError || !profile) {
    console.error('Profile not found:', profileError);
    return new Response('Profile not found', { status: 500 });
  }

  const organizationId = profile.organization_id;

  if (!organizationId) {
    console.error('User does not have an organization_id');
    return new Response('No organization found for user', { status: 400 });
  }

  // 2. Get subscription plan name from the session
  const subscriptionId = session.subscription;

  let planName = null;

  if (subscriptionId) {
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    planName = subscription.items.data[0]?.price?.nickname || null;
  }

  // Fallback if no nickname
  if (!planName) {
    planName = session?.metadata?.plan_name ?? 'unknown';
  }

  // 3. Update organization fields
  const { error: updateError } = await supabase
    .from('organizations')
    .update({
      subscription_status: 'active',
      subscription_level: planName,
    })
    .eq('id', organizationId)
    .eq('profile_email', userEmail);
  if (updateError) {
    console.error('Error updating organization:', updateError);
    return new Response('Update failed', { status: 500 });
  }

  console.log(`Organization ${organizationId} updated → active / ${planName}`);

  return new Response('Success', { status: 200 });
});
