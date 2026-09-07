import { serve } from 'https://deno.land/std@0.190.0/http/server.ts';
import Stripe from 'https://esm.sh/stripe@14.21.0';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';
import {
  asString,
  discoverLiveSubscription,
  getCustomerId,
  getPeriodEndIso,
  getPlanName,
} from '../_shared/stripe-subscriptions.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CANCEL-OWN-SUBSCRIPTION] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    { auth: { persistSession: false } }
  );

  const json = (body: any, status = 200) =>
    new Response(JSON.stringify(body), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status,
    });

  try {
    let action: 'cancel' | 'resume' = 'cancel';
    const body = await req.json().catch(() => ({}));
    if (body?.action === 'resume') action = 'resume';

    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
    if (!stripeKey) throw new Error('STRIPE_SECRET_KEY is not set');

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error('No authorization header provided');
    const token = authHeader.replace('Bearer ', '');

    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user?.email) throw new Error('User not authenticated');
    logStep('User authenticated', { userId: user.id, action });

    const { data: profile } = await supabase
      .from('profiles')
      .select('organization_id, role')
      .eq('id', user.id)
      .single();

    const organizationId = asString(profile?.organization_id);
    const role = String(profile?.role || '').toLowerCase();
    if (!organizationId) return json({ error: 'No organization found' }, 400);
    if (!['owner', 'admin'].includes(role)) {
      return json(
        { error: 'Only organization owners and admins can change the plan' },
        403
      );
    }

    const { data: adminProfiles } = await supabase
      .from('profiles')
      .select('id')
      .eq('organization_id', organizationId)
      .in('role', ['owner', 'admin']);

    const adminIds: string[] = (adminProfiles || []).map((p: any) => p.id);
    if (!adminIds.includes(user.id)) adminIds.push(user.id);

    const emails: string[] = [];
    for (const id of adminIds) {
      const { data: u } = await supabase.auth.admin.getUserById(id);
      const email = u?.user?.email;
      if (email) emails.push(email);
    }
    logStep('Admin emails resolved', { count: emails.length });

    const stripe = new Stripe(stripeKey, { apiVersion: '2023-10-16' });
    const discovery = await discoverLiveSubscription({
      stripe,
      supabase,
      organizationId,
      emails,
    });
    const subscription = discovery.subscription;

    logStep('Stripe subscription discovery complete', {
      source: discovery.source,
      customersChecked: discovery.customerIds.length,
      found: !!subscription,
    });

    if (!subscription) {
      await supabase
        .from('organizations')
        .update({
          subscription_status: 'ended',
          updated_at: new Date().toISOString(),
        })
        .eq('id', organizationId);
      await supabase
        .from('subscribers')
        .update({
          subscribed: false,
          subscription_end: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('organization_id', organizationId);

      logStep('No live Stripe subscription found; stale local state ended');
      return json({
        changed: false,
        stale: true,
        message:
          'No live Stripe subscription was found for this organization. The local subscription status has been marked as ended.',
      });
    }

    const alreadyInRequestedState =
      action === 'cancel'
        ? subscription.cancel_at_period_end === true
        : subscription.cancel_at_period_end === false;

    const updatedSubscription = alreadyInRequestedState
      ? subscription
      : await stripe.subscriptions.update(subscription.id, {
          cancel_at_period_end: action === 'cancel',
          metadata: {
            ...(subscription.metadata || {}),
            organization_id: organizationId,
            cancellation_requested_by: user.id,
          },
          expand: ['items.data.price.product'],
        });

    const verified =
      action === 'cancel'
        ? updatedSubscription.cancel_at_period_end === true
        : updatedSubscription.cancel_at_period_end === false;

    if (!verified) {
      throw new Error('Stripe did not confirm the subscription change. Please try again.');
    }

    const periodEnd = getPeriodEndIso(updatedSubscription) || getPeriodEndIso(subscription);
    const customerId = getCustomerId(updatedSubscription) || getCustomerId(subscription);
    const tier = getPlanName(updatedSubscription, 'Basic');

    await supabase
      .from('organizations')
      .update({
        subscription_status: action === 'cancel' ? 'canceling' : 'active',
        subscription_level: tier.toLowerCase(),
        trial_ends_at: periodEnd,
        updated_at: new Date().toISOString(),
      })
      .eq('id', organizationId);

    const subscriberUpdate: Record<string, any> = {
      stripe_subscription_id: updatedSubscription.id,
      subscribed: true,
      subscription_tier: tier,
      subscription_end: periodEnd,
      suspended: false,
      updated_at: new Date().toISOString(),
    };
    if (customerId) subscriberUpdate.stripe_customer_id = customerId;

    await supabase
      .from('subscribers')
      .update(subscriberUpdate)
      .eq('organization_id', organizationId);

    if (discovery.subscriberRows.length === 0 && user.email) {
      await supabase.from('subscribers').upsert(
        {
          user_id: user.id,
          email: user.email,
          organization_id: organizationId,
          ...subscriberUpdate,
        },
        { onConflict: 'email' }
      );
    }

    logStep('Stripe subscription updated', {
      action,
      alreadyInRequestedState,
      hasPeriodEnd: !!periodEnd,
    });

    return json({
      changed: !alreadyInRequestedState,
      action,
      subscription_end: periodEnd,
      message:
        action === 'cancel'
          ? 'Your subscription will stop at the end of the period you have already paid for.'
          : 'Your subscription has been resumed and will renew as usual.',
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    logStep('ERROR', { error: msg });
    return json({ error: msg }, 500);
  }
});
