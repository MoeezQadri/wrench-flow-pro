import { serve } from 'https://deno.land/std@0.190.0/http/server.ts';
import Stripe from 'https://esm.sh/stripe@14.21.0';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';
import { asString, discoverLiveSubscription } from '../_shared/stripe-subscriptions.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CREATE-CHECKOUT] ${step}${detailsStr}`);
};

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
    if (!user?.email) {
      throw new Error('User not authenticated or email not available');
    }
    logStep('User authenticated', { userId: user.id });

    const { planId, billingFrequency = 'monthly' } = await req.json();
    if (!planId) throw new Error('Plan ID is required');

    const { data: plan, error: planError } = await supabaseClient
      .from('subscription_plans')
      .select('*')
      .eq('id', planId)
      .eq('is_active', true)
      .single();
    if (planError || !plan) throw new Error('Invalid subscription plan');

    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('organization_id')
      .eq('id', user.id)
      .single();

    const organizationId = asString(profile?.organization_id);
    if (!organizationId) throw new Error('No organization found for user');

    const isYearly = billingFrequency === 'yearly';
    const price = isYearly ? plan.price_yearly : plan.price_monthly;
    const interval = isYearly ? 'year' : 'month';
    if (!price || price <= 0) {
      throw new Error(`${billingFrequency} pricing not available for this plan`);
    }

    const stripe = new Stripe(stripeKey, { apiVersion: '2023-10-16' });

    const { data: savedRows } = await supabaseClient
      .from('subscribers')
      .select('stripe_customer_id')
      .eq('organization_id', organizationId)
      .not('stripe_customer_id', 'is', null)
      .limit(1);

    let customerId = asString(savedRows?.[0]?.stripe_customer_id);

    if (!customerId) {
      const customers = await stripe.customers.list({ email: user.email, limit: 100 });
      const orgCustomer = customers.data.find(
        (customer: any) => customer?.metadata?.organization_id === organizationId
      );
      customerId = orgCustomer?.id || customers.data[0]?.id || null;
    }

    if (customerId) {
      await stripe.customers.update(customerId, {
        email: user.email,
        metadata: {
          organization_id: organizationId,
          user_id: user.id,
        },
      });
      logStep('Using Stripe customer', { hasSavedCustomer: !!savedRows?.[0]?.stripe_customer_id });
    } else {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: {
          organization_id: organizationId,
          user_id: user.id,
        },
      });
      customerId = customer.id;
      logStep('Created Stripe customer');
    }

    const currentSubscription = await discoverLiveSubscription({
      stripe,
      supabase: supabaseClient,
      organizationId,
      emails: [user.email],
    });
    const existingSubscriptionId = asString(currentSubscription.subscription?.id);

    const metadata = {
      plan_id: String(planId),
      plan_name: String(plan.name),
      billing_frequency: String(billingFrequency),
      user_id: user.id,
      user_email: user.email,
      organization_id: organizationId,
      previous_subscription_id: existingSubscriptionId || '',
    };

    const origin = req.headers.get('origin') || 'http://localhost:3000';
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      client_reference_id: user.id,
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `${plan.name} - ${isYearly ? 'Yearly' : 'Monthly'}`,
              description: plan.description || undefined,
              metadata: {
                plan_id: String(planId),
                organization_id: organizationId,
              },
            },
            unit_amount: Math.round(price * 100),
            recurring: { interval },
          },
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${origin}/payment/success?session_id={CHECKOUT_SESSION_ID}&plan=${encodeURIComponent(plan.name)}&value=${encodeURIComponent(String(price))}&freq=${encodeURIComponent(String(billingFrequency))}`,
      cancel_url: `${origin}/payment/canceled?plan=${encodeURIComponent(plan.name)}`,
      metadata,
      subscription_data: {
        metadata,
      },
    });

    logStep('Checkout session created', {
      hasPreviousSubscription: !!existingSubscriptionId,
    });

    return json({ url: session.url });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep('ERROR in create-checkout', { message: errorMessage });
    return json({ error: errorMessage }, 500);
  }
});
