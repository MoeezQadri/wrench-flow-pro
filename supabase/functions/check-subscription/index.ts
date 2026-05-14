import { serve } from 'https://deno.land/std@0.190.0/http/server.ts';
import Stripe from 'https://esm.sh/stripe@14.21.0';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';
import { getSubscriber } from '../_shared/organization-management.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
};

// Helper logging function for enhanced debugging
const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CHECK-SUBSCRIPTION] ${step}${detailsStr}`);
};

const TRIAL_DAYS = 14;

async function checkTrialStatus(supabaseClient: any, userId: string) {
  const { data: profile } = await supabaseClient
    .from('profiles')
    .select('organization_id')
    .eq('id', userId)
    .single();

  if (!profile?.organization_id) {
    return { subscribed: false };
  }

  const { data: org } = await supabaseClient
    .from('organizations')
    .select('created_at')
    .eq('id', profile.organization_id)
    .single();

  if (!org?.created_at) {
    return { subscribed: false };
  }

  const createdAt = new Date(org.created_at);
  const trialEnd = new Date(
    createdAt.getTime() + TRIAL_DAYS * 24 * 60 * 60 * 1000
  );
  const now = new Date();

  if (now <= trialEnd) {
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

  // Use the service role key to perform writes (upsert) in Supabase
  const supabaseClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    { auth: { persistSession: false } }
  );

  try {
    logStep('Function started');

    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
    if (!stripeKey) throw new Error('STRIPE_SECRET_KEY is not set');
    logStep('Stripe key verified');

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error('No authorization header provided');
    logStep('Authorization header found');

    const token = authHeader.replace('Bearer ', '');
    logStep('Authenticating user with token');

    const { data: userData, error: userError } =
      await supabaseClient.auth.getUser(token);
    if (userError)
      throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user?.email)
      throw new Error('User not authenticated or email not available');
    logStep('User authenticated', { userId: user.id, email: user.email });

    const OWNER_EMAILS = [
      'gearheadgarage.pk@gmail.com',
      'daniyal.reviewer@gmail.com',
    ];
    if (OWNER_EMAILS.includes(user.email)) {
      logStep('Owner account detected, granting Enterprise access');
      return new Response(
        JSON.stringify({
          subscribed: true,
          subscription_tier: 'Enterprise',
          subscription_end: null,
          suspended: false,
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    }

    const stripe = new Stripe(stripeKey, { apiVersion: '2023-10-16' });
    const customers = await stripe.customers.list({
      email: user.email,
      limit: 1,
    });

    if (customers.data.length === 0) {
      logStep('No Stripe customer found, checking trial eligibility');
      const trialResult = await checkTrialStatus(supabaseClient, user.id);
      logStep('Trial check result', trialResult);
      return new Response(JSON.stringify(trialResult), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    const customerId = customers.data[0].id;
    logStep('Found Stripe customer', { customerId });

    const subscriber = await getSubscriber(user.id);
    if (!subscriber) {
      logStep('No subscriber record found');
    }

    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: 'active',
      limit: 1,
    });
    const hasActiveSub =
      subscriptions.data.length > 0 &&
      subscriptions.data[0].status === 'active';
    let subscriptionTier = null;
    let subscriptionEnd = null;

    if (hasActiveSub) {
      const subscription = subscriptions.data[0];
      subscriptionEnd = new Date(
        subscription.current_period_end * 1000
      ).toISOString();
      logStep('Active subscription found', {
        subscriptionId: subscription.id,
        endDate: subscriptionEnd,
      });

      // Determine subscription tier from price
      const priceId = subscription.items.data[0].price.id;
      const price = await stripe.prices.retrieve(priceId);
      const amount = price.unit_amount || 0;
      if (amount === 0) {
        subscriptionTier = 'Trial';
      } else if (amount <= 2900) {
        // $29 and below
        subscriptionTier = 'Basic';
      } else if (amount <= 7900) {
        // $79 and below
        subscriptionTier = 'Professional';
      } else {
        subscriptionTier = 'Enterprise';
      }
      logStep('Determined subscription tier', {
        priceId,
        amount,
        subscriptionTier,
      });
    } else {
      logStep('No active subscription found, checking trial eligibility');
      const trialResult = await checkTrialStatus(supabaseClient, user.id);
      if (trialResult.subscribed) {
        logStep('User is within trial period', trialResult);
        return new Response(
          JSON.stringify({
            ...trialResult,
            suspended: subscriber?.suspended || false,
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
          }
        );
      }
    }

    // await supabaseClient.from("subscribers").upsert({
    //   email: user.email,
    //   user_id: user.id,
    //   stripe_customer_id: customerId,
    //   subscribed: hasActiveSub,
    //   subscription_tier: subscriptionTier,
    //   subscription_end: subscriptionEnd,
    //   updated_at: new Date().toISOString(),
    // }, { onConflict: 'email' });

    // logStep("Updated database with subscription info", { subscribed: hasActiveSub, subscriptionTier });
    return new Response(
      JSON.stringify({
        subscribed: hasActiveSub,
        subscription_tier: subscriptionTier,
        subscription_end: subscriptionEnd,
        suspended: subscriber?.suspended || false,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep('ERROR in check-subscription', { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
