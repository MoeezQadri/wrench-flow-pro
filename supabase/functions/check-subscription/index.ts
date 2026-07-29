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
  console.log(`[CHECK-SUBSCRIPTION] ${step}${detailsStr}`);
};

const TRIAL_DAYS = 14;

function tierFromAmount(amount: number): string {
  if (amount === 0) return 'Trial';
  if (amount <= 2900) return 'Basic';
  if (amount <= 7900) return 'Professional';
  return 'Enterprise';
}

async function checkTrialStatus(supabaseClient: any, organizationId: string) {
  const { data: org } = await supabaseClient
    .from('organizations')
    .select('created_at')
    .eq('id', organizationId)
    .single();

  if (!org?.created_at) return { subscribed: false };

  const trialEnd = new Date(
    new Date(org.created_at).getTime() + TRIAL_DAYS * 24 * 60 * 60 * 1000
  );
  if (new Date() <= trialEnd) {
    return {
      subscribed: true,
      subscription_tier: 'Trial',
      subscription_end: trialEnd.toISOString(),
      suspended: false,
    };
  }
  return { subscribed: false };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
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
    logStep('Function started');

    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
    if (!stripeKey) throw new Error('STRIPE_SECRET_KEY is not set');

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error('No authorization header provided');
    const token = authHeader.replace('Bearer ', '');

    const { data: userData, error: userError } =
      await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user?.email) throw new Error('User not authenticated');
    logStep('User authenticated', { userId: user.id, email: user.email });

    // Preserve hardcoded owner bypass
    const OWNER_EMAILS = [
      'gearheadgarage.pk@gmail.com',
      'daniyal.reviewer@gmail.com',
    ];
    if (OWNER_EMAILS.includes(user.email)) {
      logStep('Owner account detected, granting Enterprise access');
      return json({
        subscribed: true,
        subscription_tier: 'Enterprise',
        subscription_end: null,
        suspended: false,
      });
    }

    // Resolve caller's organization
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('organization_id')
      .eq('id', user.id)
      .single();

    const organizationId = profile?.organization_id;
    if (!organizationId) {
      logStep('No organization for user');
      return json({ subscribed: false });
    }
    logStep('Resolved organization', { organizationId });

    // Fast path: existing active subscriber row for this org
    const { data: orgSubscribers } = await supabaseClient
      .from('subscribers')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('subscribed', true)
      .order('updated_at', { ascending: false })
      .limit(1);

    const orgSub = orgSubscribers?.[0];
    const nowMs = Date.now();
    const cachedEndMs = orgSub?.subscription_end ? new Date(orgSub.subscription_end).getTime() : null;
    const cachedActive = orgSub && (cachedEndMs === null || cachedEndMs > nowMs);
    if (orgSub && cachedActive) {
      logStep('Fast path: org subscriber found', {
        tier: orgSub.subscription_tier,
      });
      return json({
        subscribed: true,
        subscription_tier: orgSub.subscription_tier,
        subscription_end: orgSub.subscription_end,
        suspended: orgSub.suspended || false,
      });
    }
    if (orgSub && !cachedActive) {
      logStep('Cached subscriber expired, falling through to Stripe', {
        subscription_end: orgSub.subscription_end,
      });
    }

    // Stripe path: check owner/admin emails in this org
    const stripe = new Stripe(stripeKey, { apiVersion: '2023-10-16' });

    const { data: adminProfiles } = await supabaseClient
      .from('profiles')
      .select('id, role')
      .eq('organization_id', organizationId)
      .in('role', ['owner', 'admin']);

    const adminIds: string[] = (adminProfiles || []).map((p: any) => p.id);
    // Always include the caller as a fallback candidate (covers legacy owner records)
    if (!adminIds.includes(user.id)) adminIds.push(user.id);

    const candidates: { userId: string; email: string }[] = [];
    for (const id of adminIds) {
      const { data: u } = await supabaseClient.auth.admin.getUserById(id);
      const email = u?.user?.email;
      if (email) candidates.push({ userId: id, email });
    }
    logStep('Admin candidates', { count: candidates.length });

    for (const cand of candidates) {
      const customers = await stripe.customers.list({
        email: cand.email,
        limit: 1,
      });
      if (customers.data.length === 0) continue;
      const customerId = customers.data[0].id;

      const subs = await stripe.subscriptions.list({
        customer: customerId,
        status: 'active',
        limit: 1,
      });
      if (subs.data.length === 0) continue;

      const subscription = subs.data[0];
      const subscriptionEnd = new Date(
        subscription.current_period_end * 1000
      ).toISOString();
      const priceId = subscription.items.data[0].price.id;
      const price = await stripe.prices.retrieve(priceId);
      const tier = tierFromAmount(price.unit_amount || 0);
      logStep('Active org subscription via admin', {
        email: cand.email,
        tier,
      });

      // Cache into subscribers table for future fast-path lookups
      try {
        await supabaseClient.from('subscribers').upsert(
          {
            user_id: cand.userId,
            email: cand.email,
            stripe_customer_id: customerId,
            organization_id: organizationId,
            subscribed: true,
            subscription_tier: tier,
            subscription_end: subscriptionEnd,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'email' }
        );
      } catch (e) {
        logStep('Failed to upsert subscriber cache', { error: String(e) });
      }

      return json({
        subscribed: true,
        subscription_tier: tier,
        subscription_end: subscriptionEnd,
        suspended: false,
      });
    }

    // Fall back to trial based on org creation date
    logStep('No active subscription found for org, checking trial');
    const trialResult = await checkTrialStatus(supabaseClient, organizationId);
    return json(trialResult);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep('ERROR', { message: errorMessage });
    return json({ error: errorMessage }, 500);
  }
});
