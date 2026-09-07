import { serve } from 'https://deno.land/std@0.190.0/http/server.ts';
import Stripe from 'https://esm.sh/stripe@14.21.0';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';
import {
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
  console.log(`[UNSUSPEND-SUBSCRIPTION] ${step}${detailsStr}`);
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
    const body = await req.json().catch(() => ({}));
    const params = body?.params;
    if (!params?.org_id) {
      return json({ error: 'Valid parameters needed' }, 400);
    }

    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
    if (!stripeKey) throw new Error('STRIPE_SECRET_KEY is not set');

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error('No authorization header provided');
    const token = authHeader.replace('Bearer ', '');

    const { data: userData, error: userError } =
      await supabase.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user?.email) throw new Error('User not authenticated');
    logStep('User authenticated', { userId: user.id });

    const organizationId: string = params.org_id;
    const stripe = new Stripe(stripeKey, { apiVersion: '2023-10-16' });

    const emails: string[] = Array.isArray(params.user_emails)
      ? params.user_emails.filter((e: unknown) => typeof e === 'string' && e)
      : [];
    const discovery = await discoverLiveSubscription({
      stripe,
      supabase,
      organizationId,
      emails,
    });
    const subscription = discovery.subscription;

    let periodEnd: string | null = null;
    let resumed = false;
    let tier: string | null = null;

    let activeSubscription = subscription;
    if (subscription?.cancel_at_period_end) {
      activeSubscription = await stripe.subscriptions.update(subscription.id, {
        cancel_at_period_end: false,
      });
      logStep('Cancellation reverted', { source: discovery.source });
    }

    if (activeSubscription) {
      resumed = true;
      periodEnd = getPeriodEndIso(activeSubscription);
      tier = getPlanName(activeSubscription, params.sub_level || 'Basic');
    }

    const orgUpdate: Record<string, any> = {
      subscription_status: resumed ? 'active' : 'trial',
      subscription_level: resumed
        ? String(tier || params.sub_level || 'basic').toLowerCase()
        : 'trial',
      updated_at: new Date().toISOString(),
    };
    if (params.org_name) orgUpdate.name = params.org_name;
    if (periodEnd) orgUpdate.trial_ends_at = periodEnd;

    const { data: organization, error: orgError } = await supabase
      .from('organizations')
      .update(orgUpdate)
      .eq('id', organizationId)
      .select()
      .single();
    if (orgError) throw orgError;
    logStep('Organization updated', {
      status: organization?.subscription_status,
    });

    const subUpdate: Record<string, any> = {
      suspended: false,
      subscribed: resumed,
      subscription_end: periodEnd,
      updated_at: new Date().toISOString(),
    };
    if (activeSubscription) {
      subUpdate.stripe_subscription_id = activeSubscription.id;
      const customerId = getCustomerId(activeSubscription);
      if (customerId) subUpdate.stripe_customer_id = customerId;
    }
    if (tier) subUpdate.subscription_tier = tier;

    await supabase
      .from('subscribers')
      .update(subUpdate)
      .eq('organization_id', organizationId);

    if (Array.isArray(params.user_ids) && params.user_ids.length > 0) {
      await supabase
        .from('subscribers')
        .update(subUpdate)
        .in('user_id', params.user_ids);
    }

    return json({
      organization,
      resumed,
      subscription_end: periodEnd,
      message: resumed
        ? 'Subscription resumed and suspension lifted.'
        : 'Suspension lifted. No live subscription was found, so the organization is back on trial and must subscribe again.',
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    logStep('ERROR', { error: msg });
    return json({ error: msg }, 500);
  }
});
