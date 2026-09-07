import { serve } from 'https://deno.land/std@0.190.0/http/server.ts';
import Stripe from 'https://esm.sh/stripe@14.21.0';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';
import {
  asString,
  getCustomerId,
  getPeriodEndIso,
  getPlanName,
  isLiveSubscription,
} from '../_shared/stripe-subscriptions.ts';

const stripeKey = Deno.env.get('STRIPE_SECRET_KEY') ?? '';
const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET') ?? '';
const stripe = new Stripe(stripeKey, { apiVersion: '2023-10-16' });

const db = () =>
  createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    { auth: { persistSession: false } }
  );

async function resolveOrganizationId(
  supabase: any,
  subscription: any,
  customerId: string | null
): Promise<string | null> {
  const metadataOrg = asString(subscription?.metadata?.organization_id);
  if (metadataOrg) return metadataOrg;

  const subscriptionId = asString(subscription?.id);
  if (subscriptionId) {
    const { data } = await supabase
      .from('subscribers')
      .select('organization_id')
      .eq('stripe_subscription_id', subscriptionId)
      .maybeSingle();
    if (data?.organization_id) return String(data.organization_id);
  }

  if (customerId) {
    const { data } = await supabase
      .from('subscribers')
      .select('organization_id')
      .eq('stripe_customer_id', customerId)
      .order('updated_at', { ascending: false })
      .limit(1);
    if (data?.[0]?.organization_id) return String(data[0].organization_id);
  }

  return null;
}

async function syncSubscriptionEvent(subscription: any) {
  const supabase = db();
  const subscriptionId = asString(subscription?.id);
  const customerId = getCustomerId(subscription);
  const organizationId = await resolveOrganizationId(
    supabase,
    subscription,
    customerId
  );

  if (!subscriptionId || !organizationId) {
    console.error('Could not resolve subscription event', {
      hasSubscriptionId: !!subscriptionId,
      hasCustomerId: !!customerId,
      hasOrganizationId: !!organizationId,
    });
    return;
  }

  const live = isLiveSubscription(subscription);
  const canceling = live && subscription.cancel_at_period_end === true;
  const { data: currentOrganization } = await supabase
    .from('organizations')
    .select('subscription_status')
    .eq('id', organizationId)
    .maybeSingle();
  const remainsSuspended =
    live && currentOrganization?.subscription_status === 'suspended';
  const status = live
    ? remainsSuspended
      ? 'suspended'
      : canceling
        ? 'canceling'
        : 'active'
    : 'ended';
  const periodEnd = getPeriodEndIso(subscription) || new Date().toISOString();
  const tier = getPlanName(subscription, 'Basic');

  await supabase
    .from('organizations')
    .update({
      subscription_status: status,
      subscription_level: tier.toLowerCase(),
      trial_ends_at: periodEnd,
      updated_at: new Date().toISOString(),
    })
    .eq('id', organizationId);

  const update: Record<string, any> = {
    stripe_subscription_id: subscriptionId,
    subscribed: live,
    subscription_tier: tier,
    subscription_end: periodEnd,
    suspended: remainsSuspended,
    updated_at: new Date().toISOString(),
  };
  if (customerId) update.stripe_customer_id = customerId;

  await supabase.from('subscribers').update(update).eq('organization_id', organizationId);

  console.log('Subscription event synchronized', {
    organizationId,
    status,
    live,
  });
}

serve(async (req) => {
  if (!stripeKey || !webhookSecret) {
    console.error('Stripe webhook secrets are missing');
    return new Response('Webhook not configured', { status: 500 });
  }

  let event: any;
  try {
    const signature = req.headers.get('stripe-signature');
    if (!signature) return new Response('Missing signature', { status: 400 });
    const body = await req.text();
    event = await stripe.webhooks.constructEventAsync(
      body,
      signature,
      webhookSecret
    );
  } catch (error) {
    console.error('Webhook signature failed', {
      message: error instanceof Error ? error.message : String(error),
    });
    return new Response('Invalid signature', { status: 400 });
  }

  try {
    if (
      event.type === 'customer.subscription.created' ||
      event.type === 'customer.subscription.updated' ||
      event.type === 'customer.subscription.deleted'
    ) {
      await syncSubscriptionEvent(event.data.object);
      return new Response('Success', { status: 200 });
    }

    if (event.type !== 'checkout.session.completed') {
      return new Response('Ignored', { status: 200 });
    }

    const session = event.data.object as any;
    const userId = asString(session?.metadata?.user_id) || asString(session?.client_reference_id);
    const userEmail = asString(session?.metadata?.user_email) || asString(session?.customer_details?.email);
    const sessionOrganizationId = asString(session?.metadata?.organization_id);
    const subscriptionId = asString(session?.subscription?.id) || asString(session?.subscription);
    const customerId = asString(session?.customer?.id) || asString(session?.customer);

    if (!userId || !subscriptionId) {
      console.error('Completed checkout missing required identity', {
        hasUserId: !!userId,
        hasSubscriptionId: !!subscriptionId,
      });
      return new Response('Missing checkout identity', { status: 400 });
    }

    const supabase = db();
    let organizationId = sessionOrganizationId;
    if (!organizationId) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', userId)
        .single();
      organizationId = asString(profile?.organization_id);
    }
    if (!organizationId) return new Response('No organization found', { status: 400 });

    const subscription = await stripe.subscriptions.retrieve(subscriptionId, {
      expand: ['items.data.price.product'],
    });
    if (!isLiveSubscription(subscription)) {
      console.error('Checkout subscription is not live', { status: subscription.status });
      return new Response('Subscription is not active', { status: 409 });
    }

    const tier = getPlanName(subscription, session?.metadata?.plan_name || 'Basic');
    const periodEnd = getPeriodEndIso(subscription);

    const { error: subscriberError } = await supabase.from('subscribers').upsert(
      {
        user_id: userId,
        email: userEmail || '',
        organization_id: organizationId,
        stripe_customer_id: customerId,
        stripe_subscription_id: subscriptionId,
        subscribed: true,
        subscription_tier: tier,
        subscription_end: periodEnd,
        suspended: false,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'email' }
    );
    if (subscriberError) throw subscriberError;

    await supabase
      .from('organizations')
      .update({
        subscription_status: subscription.cancel_at_period_end ? 'canceling' : 'active',
        subscription_level: tier.toLowerCase(),
        trial_ends_at: periodEnd,
        updated_at: new Date().toISOString(),
      })
      .eq('id', organizationId);

    const previousSubscriptionId = asString(session?.metadata?.previous_subscription_id);
    if (previousSubscriptionId && previousSubscriptionId !== subscriptionId) {
      try {
        await stripe.subscriptions.cancel(previousSubscriptionId);
      } catch (error) {
        console.error('Could not cancel replaced subscription', {
          message: error instanceof Error ? error.message : String(error),
        });
      }
    }

    console.log('Checkout subscription synchronized', {
      organizationId,
      tier,
      hasPeriodEnd: !!periodEnd,
    });
    return new Response('Success', { status: 200 });
  } catch (error) {
    console.error('Stripe webhook handler failed', {
      message: error instanceof Error ? error.message : String(error),
    });
    return new Response('Handler error', { status: 500 });
  }
});
