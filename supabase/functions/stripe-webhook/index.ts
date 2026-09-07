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

  const admin = () =>
    createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

  // --- Subscription ended (cancellation period reached, or payment failure) ---
  const endsAccess =
    event.type === 'customer.subscription.deleted' ||
    (event.type === 'customer.subscription.updated' &&
      ['canceled', 'unpaid', 'incomplete_expired'].includes(
        (event.data.object as any)?.status
      ));

  if (endsAccess) {
    const sub = event.data.object as any;
    const db = admin();

    try {
      const customerId =
        typeof sub.customer === 'string' ? sub.customer : sub.customer?.id;
      const customer: any = customerId
        ? await stripe.customers.retrieve(customerId)
        : null;
      const email = customer?.email ?? null;

      const periodEnd = sub.current_period_end
        ? new Date(sub.current_period_end * 1000).toISOString()
        : new Date().toISOString();

      // Resolve the organization from the subscribers cache, else from profiles
      let organizationId: string | null = null;

      if (email) {
        const { data: subscriberRow } = await db
          .from('subscribers')
          .select('user_id, organization_id')
          .eq('email', email)
          .maybeSingle();

        if (subscriberRow?.user_id) {
          const { data: prof } = await db
            .from('profiles')
            .select('organization_id')
            .eq('id', subscriberRow.user_id)
            .maybeSingle();
          organizationId = prof?.organization_id ?? null;
        }

        await db
          .from('subscribers')
          .update({
            subscribed: false,
            subscription_end: periodEnd,
            updated_at: new Date().toISOString(),
          })
          .eq('email', email);
      }

      if (organizationId) {
        await db
          .from('organizations')
          .update({
            subscription_status: 'ended',
            updated_at: new Date().toISOString(),
          })
          .eq('id', organizationId);

        await db
          .from('subscribers')
          .update({
            subscribed: false,
            subscription_end: periodEnd,
            updated_at: new Date().toISOString(),
          })
          .eq('organization_id', organizationId);

        console.log(`Organization ${organizationId} → subscription ended`);
      } else {
        console.error('Could not resolve organization for ended subscription', {
          email,
        });
      }
    } catch (err) {
      console.error('Error handling ended subscription', err);
      return new Response('Handler error', { status: 500 });
    }

    return new Response('Success', { status: 200 });
  }

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

  // 2. Resolve plan name (prefer Stripe subscription nickname/product, fallback to metadata)
  const subscriptionId = session.subscription;
  let planName: string | null = null;
  let subscriptionEnd: string | null = null;

  if (subscriptionId) {
    const subscription = await stripe.subscriptions.retrieve(subscriptionId, {
      expand: ['items.data.price.product'],
    });
    const priceItem = subscription.items.data[0];
    planName =
      priceItem?.price?.nickname ||
      (priceItem?.price?.product as any)?.name ||
      null;
    if (subscription.current_period_end) {
      subscriptionEnd = new Date(subscription.current_period_end * 1000).toISOString();
    }
  }

  if (!planName) {
    planName = session?.metadata?.plan_name ?? 'unknown';
  }

  const normalizedPlan = String(planName).toLowerCase();

  // 3. Update organization by id (previous code filtered on a non-existent column)
  const { error: updateError, data: updatedOrg } = await supabase
    .from('organizations')
    .update({
      subscription_status: 'active',
      subscription_level: normalizedPlan,
      updated_at: new Date().toISOString(),
    })
    .eq('id', organizationId)
    .select('id')
    .maybeSingle();

  if (updateError) {
    console.error('Error updating organization:', updateError);
    return new Response('Update failed', { status: 500 });
  }

  if (!updatedOrg) {
    console.error(`No organization row matched id=${organizationId}`);
    return new Response('Organization not found', { status: 404 });
  }

  // 4. Upsert subscribers cache so check-subscription fast path is correct
  const stripeCustomerId =
    typeof session.customer === 'string' ? session.customer : session.customer?.id ?? null;

  const { error: subError } = await supabase
    .from('subscribers')
    .upsert(
      {
        user_id: userId,
        email: userEmail ?? session.customer_details?.email ?? '',
        stripe_customer_id: stripeCustomerId,
        subscribed: true,
        subscription_tier: normalizedPlan,
        subscription_end: subscriptionEnd,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'email' }
    );

  if (subError) {
    console.error('Error upserting subscriber:', subError);
  }

  console.log(
    `Organization ${organizationId} updated → active / ${normalizedPlan} (user=${userId})`
  );

  return new Response('Success', { status: 200 });
});
