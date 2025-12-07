import { serve } from 'https://deno.land/std@0.190.0/http/server.ts';
import Stripe from 'https://esm.sh/stripe@14.21.0';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
};

// Helper for logging steps
const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CREATE-CHECKOUT] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Initialize Supabase client
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

    // Authenticate user via Supabase token
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error('No authorization header provided');
    const token = authHeader.replace('Bearer ', '');
    const { data: userData, error: userError } =
      await supabaseClient.auth.getUser(token);
    if (userError)
      throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user?.email)
      throw new Error('User not authenticated or email not available');
    logStep('User authenticated', { userId: user.id, email: user.email });

    // Extract planId and billingFrequency from request
    const { planId, billingFrequency = 'monthly' } = await req.json();
    if (!planId) throw new Error('Plan ID is required');
    logStep('Plan ID and billing frequency received', {
      planId,
      billingFrequency,
    });

    // Fetch subscription plan details from Supabase
    const { data: plan, error: planError } = await supabaseClient
      .from('subscription_plans')
      .select('*')
      .eq('id', planId)
      .eq('is_active', true)
      .single();
    if (planError || !plan) throw new Error('Invalid subscription plan');

    // Determine price and billing interval
    const isYearly = billingFrequency === 'yearly';
    const price = isYearly ? plan.price_yearly : plan.price_monthly;
    const interval = isYearly ? 'year' : 'month';
    if (!price || price <= 0)
      throw new Error(
        `${billingFrequency} pricing not available for this plan`
      );
    logStep('Plan found', {
      planName: plan.name,
      billingFrequency,
      price,
      interval,
    });

    const stripe = new Stripe(stripeKey, { apiVersion: '2023-10-16' });

    // Get or create Stripe customer
    const customers = await stripe.customers.list({
      email: user.email,
      limit: 1,
    });
    let customerId;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
      logStep('Existing customer found', { customerId });
    } else {
      const customer = await stripe.customers.create({ email: user.email });
      customerId = customer.id;
      logStep('Created new customer', { customerId });
    }

    // Check for existing active subscription
    const activeSubs = await stripe.subscriptions.list({
      customer: customerId,
      status: 'active',
      limit: 1,
    });
    let existingSubscriptionId: string | null = null;
    if (activeSubs.data.length > 0) {
      existingSubscriptionId = activeSubs.data[0].id;
      logStep('Existing active subscription found', {
        subscriptionId: existingSubscriptionId,
      });
    }

    // Create new subscription via Stripe Checkout
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `${plan.name} - ${isYearly ? 'Yearly' : 'Monthly'}`,
              description: plan.description,
            },
            unit_amount: Math.round(price * 100),
            recurring: { interval },
          },
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${req.headers.get('origin')}/settings?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.get('origin')}/settings?canceled=true`,
      metadata: {
        plan_id: planId,
        plan_name: plan.name,
        billing_frequency: billingFrequency,
        user_id: user.id,
        user_email: user.email,
        previous_subscription_id: existingSubscriptionId,
      },
    });
    logStep('New checkout session created', {
      sessionId: session.id,
      url: session.url,
    });

    // If there was an existing subscription, mark it inactive immediately
    if (existingSubscriptionId) {
      await stripe.subscriptions.cancel(existingSubscriptionId, {
        at_period_end: false,
      });
      logStep('Previous subscription marked inactive', {
        subscriptionId: existingSubscriptionId,
      });
    }

    // Return Checkout URL to client
    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep('ERROR in create-checkout', { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
