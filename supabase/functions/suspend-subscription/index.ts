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

    const organizationId: string = params.org_id;
    const stripe = new Stripe(stripeKey, { apiVersion: '2023-10-16' });

    // Prefer the Stripe customers already saved for this organization; email
    // lookup stays as a fallback for older subscriber rows.
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
    let billingChanged = false;

    if (subscriptions.length === 0) {
      logStep('No live subscription found');
    } else {
      const targets = subscriptions.filter((s) => !s.cancel_at_period_end);
      await Promise.all(
        targets.map((s) =>
          stripe.subscriptions.update(s.id, { cancel_at_period_end: true })
        )
      );
      billingChanged = true;
      const latest = subscriptions.sort(
        (a, b) => b.current_period_end - a.current_period_end
      )[0];
      periodEnd = new Date(latest.current_period_end * 1000).toISOString();
      logStep('Stripe set to cancel at period end', {
        ids: targets.map((s) => s.id),
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
      message: billingChanged
        ? 'Billing stopped. Access ends at the end of the paid period.'
        : 'Organization suspended, but no live subscription was found in Stripe.',
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    logStep('ERROR', { error: msg });
    return json({ error: msg }, 500);
  }
});
