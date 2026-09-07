import { serve } from 'https://deno.land/std@0.190.0/http/server.ts';
import Stripe from 'https://esm.sh/stripe@14.21.0';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';
import {
  discoverLiveSubscription,
  getCustomerId,
  getPeriodEndIso,
} from '../_shared/stripe-subscriptions.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[SUSPEND-SUBSCRIPTION] ${step}${detailsStr}`);
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

    const { data: superadmin, error: superadminError } = await supabase
      .from('superadmins')
      .select('id')
      .eq('_id', user.id)
      .maybeSingle();
    if (superadminError) throw superadminError;
    if (!superadmin) {
      return json({ error: 'Super admin access required' }, 403);
    }

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
    let billingChanged = false;

    if (!subscription) {
      logStep('No live subscription found');
      const endedAt = new Date().toISOString();
      const { data: organization, error: orgError } = await supabase
        .from('organizations')
        .update({
          subscription_status: 'ended',
          trial_ends_at: endedAt,
          updated_at: endedAt,
        })
        .eq('id', organizationId)
        .select()
        .single();
      if (orgError) throw orgError;

      await supabase
        .from('subscribers')
        .update({
          subscribed: false,
          suspended: false,
          subscription_end: endedAt,
          updated_at: endedAt,
        })
        .eq('organization_id', organizationId);

      return json({
        suspended: false,
        stale: true,
        billing_changed: false,
        period_end: endedAt,
        organization,
        message:
          'No live Stripe subscription was found. The organization was moved to ended subscriptions.',
      });
    } else {
      const updated = subscription.cancel_at_period_end
        ? subscription
        : await stripe.subscriptions.update(subscription.id, {
            cancel_at_period_end: true,
          });
      billingChanged = updated.cancel_at_period_end === true;
      periodEnd = getPeriodEndIso(updated) || getPeriodEndIso(subscription);
      logStep('Stripe set to cancel at period end', {
        source: discovery.source,
        periodEnd,
      });
    }

    const orgUpdate: Record<string, any> = {
      subscription_status: 'suspended',
      updated_at: new Date().toISOString(),
    };
    if (params.org_name) orgUpdate.name = params.org_name;
    if (params.sub_level) orgUpdate.subscription_level = params.sub_level;
    if (periodEnd) orgUpdate.trial_ends_at = periodEnd;

    const { data: organization, error: orgError } = await supabase
      .from('organizations')
      .update(orgUpdate)
      .eq('id', organizationId)
      .select()
      .single();
    if (orgError) throw orgError;
    logStep('Organization suspended', { organizationId, periodEnd });

    const subUpdate: Record<string, any> = {
      suspended: true,
      updated_at: new Date().toISOString(),
    };
    if (subscription) {
      subUpdate.stripe_subscription_id = subscription.id;
      const customerId = getCustomerId(subscription);
      if (customerId) subUpdate.stripe_customer_id = customerId;
    }
    if (periodEnd) subUpdate.subscription_end = periodEnd;

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
      suspended: true,
      billing_changed: billingChanged,
      period_end: periodEnd,
      organization,
      message: 'Billing stopped. Access ends at the end of the paid period.',
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    logStep('ERROR', { error: msg });
    return json({ error: msg }, 500);
  }
});
