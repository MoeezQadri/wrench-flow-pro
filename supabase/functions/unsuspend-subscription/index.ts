import { serve } from 'https://deno.land/std@0.190.0/http/server.ts';
import Stripe from 'https://esm.sh/stripe@14.21.0';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

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

    const { data: subscriberRows } = await supabase
      .from('subscribers')
      .select('stripe_customer_id')
      .eq('organization_id', organizationId)
      .not('stripe_customer_id', 'is', null);

    const savedCustomerIds = (subscriberRows || [])
      .map((row: any) => row.stripe_customer_id)
      .filter(
        (id: unknown): id is string => typeof id === 'string' && id.length > 0
      );

    const emails: string[] = Array.isArray(params.user_emails)
      ? params.user_emails.filter((e: unknown) => typeof e === 'string' && e)
      : [];

    const customersByEmail = (
      await Promise.all(
        emails.map((email) => stripe.customers.list({ email, limit: 100 }))
      )
    ).flatMap((res) => res.data);

    const customerIds = Array.from(
      new Set([...savedCustomerIds, ...customersByEmail.map((c) => c.id)])
    );
    logStep('Stripe customers resolved', {
      saved: savedCustomerIds.length,
      total: customerIds.length,
    });

    const subscriptions = (
      await Promise.all(
        customerIds.map((customerId) =>
          stripe.subscriptions.list({
            customer: customerId,
            status: 'all',
            limit: 100,
          })
        )
      )
    )
      .flatMap((res) => res.data)
      .filter((s) => ['active', 'trialing', 'past_due'].includes(s.status));

    let periodEnd: string | null = null;
    let resumed = false;
    let tier: string | null = null;

    const scheduled = subscriptions.filter((s) => s.cancel_at_period_end);
    if (scheduled.length > 0) {
      await Promise.all(
        scheduled.map((s) =>
          stripe.subscriptions.update(s.id, { cancel_at_period_end: false })
        )
      );
      logStep('Cancellation reverted', { ids: scheduled.map((s) => s.id) });
    }

    if (subscriptions.length > 0) {
      resumed = true;
      const latest = subscriptions.sort(
        (a, b) => b.current_period_end - a.current_period_end
      )[0];
      periodEnd = new Date(latest.current_period_end * 1000).toISOString();
      const amount = latest.items.data[0]?.price?.unit_amount ?? 0;
      tier =
        amount >= 19900
          ? 'Enterprise'
          : amount >= 7900
            ? 'Professional'
            : amount > 0
              ? 'Basic'
              : null;
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
