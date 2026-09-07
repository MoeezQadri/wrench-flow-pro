import { serve } from 'https://deno.land/std@0.190.0/http/server.ts';
import Stripe from 'https://esm.sh/stripe@14.21.0';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';
import {
  updateOrganization,
  unsuspendSubscriber,
} from '../_shared/organization-management.ts';

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

  const { params } = await req.json();
  if (
    !params?.org_id ||
    !params?.org_name ||
    !params?.sub_level ||
    !params?.user_ids ||
    !params?.user_emails
  ) {
    return new Response(
      JSON.stringify({ error: 'Valid parameters needed' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    { auth: { persistSession: false } }
  );

  try {
    logStep('Function started');

    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
    if (!stripeKey) throw new Error('STRIPE_SECRET_KEY is not set');

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error('Missing Authorization header');

    const token = authHeader.replace('Bearer ', '');
    const { data: userData, error: userError } =
      await supabase.auth.getUser(token);
    if (userError)
      throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user?.email) throw new Error('Missing user email');
    logStep('User authenticated', { userId: user.id });

    const stripe = new Stripe(stripeKey, { apiVersion: '2023-10-16' });

    // Find Stripe customers for every user of this organization
    const customers = (
      await Promise.all(
        params.user_emails
          .filter((email: string) => !!email)
          .map((email: string) => stripe.customers.list({ email, limit: 100 }))
      )
    ).flatMap((res) => res.data);

    let periodEnd: string | null = null;
    let resumed = false;
    let tier: string | null = null;

    if (customers.length === 0) {
      logStep('No Stripe customer found');
    } else {
      const subscriptions = (
        await Promise.all(
          customers.map((c) =>
            stripe.subscriptions.list({
              customer: c.id,
              status: 'active',
              limit: 100,
            })
          )
        )
      ).flatMap((res) => res.data);

      logStep('Active subscriptions found', { count: subscriptions.length });

      // Undo "cancel at period end" so billing simply continues
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
        const price = latest.items.data[0]?.price;
        const amount = price?.unit_amount ?? 0;
        tier =
          amount >= 19900
            ? 'Enterprise'
            : amount >= 7900
              ? 'Professional'
              : amount > 0
                ? 'Basic'
                : null;
      }
    }

    // Restore the organization state
    const organization = await updateOrganization({
      org_id: params.org_id,
      org_name: params.org_name,
      sub_level: resumed ? params.sub_level : 'trial',
      sub_status: resumed ? 'active' : 'trial',
    });
    logStep('Organization updated', { status: organization?.subscription_status });

    const subscribers = await unsuspendSubscriber({
      user_ids: params.user_ids,
      subscribed: resumed,
      subscription_tier: tier,
      subscription_current_period_end: periodEnd,
    });
    logStep('Subscribers updated', { count: subscribers?.length ?? 0 });

    return new Response(
      JSON.stringify({
        organization,
        resumed,
        subscription_end: periodEnd,
        message: resumed
          ? 'Subscription resumed and suspension lifted.'
          : 'Suspension lifted. No live subscription was found, so the organization is back on trial and must subscribe again.',
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    logStep('ERROR', { error: msg });
    return new Response(JSON.stringify({ error: msg }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
