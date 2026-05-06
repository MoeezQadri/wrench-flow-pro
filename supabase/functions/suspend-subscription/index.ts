import { serve } from 'https://deno.land/std@0.190.0/http/server.ts';
import Stripe from 'https://esm.sh/stripe@14.21.0';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';
import {
  updateOrganization,
  suspendSubscriber,
} from '../_shared/organization-management.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CANCEL-SUBSCRIPTION] ${step}${detailsStr}`);
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
      JSON.stringify({
        error: 'Valid parameters needed',
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
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
    logStep('Authenticating user');

    const { data: userData, error: userError } =
      await supabase.auth.getUser(token);
    if (userError)
      throw new Error(`Authentication error: ${userError.message}`);

    const user = userData.user;
    if (!user?.email) throw new Error('Missing user email');
    logStep('User authenticated', { userId: user.id, email: user.email });

    const stripe = new Stripe(stripeKey, { apiVersion: '2023-10-16' });

    // Get Stripe customer
    const customers = (
      await Promise.all(
        params.user_emails.map((email) =>
          stripe.customers.list({
            email,
            limit: 100,
          })
        )
      )
    ).flatMap((res) => res.data);

    let periodEnd: string | null = null;

    if (customers.length === 0) {
      logStep('No Stripe customer found');
    } else {
      const customerIds = customers.map((c) => c.id);
      logStep('Stripe customer found', { customerIds });

      // Get active subscription
      const subscriptions = (
        await Promise.all(
          customerIds.map((id) =>
            stripe.subscriptions.list({
              customer: id,
              status: 'active',
              limit: 100,
            })
          )
        )
      ).flatMap((res) => res.data);

      if (subscriptions.length === 0) {
        logStep('No active subscription found');
        return new Response(
          JSON.stringify({
            canceled: false,
            message: 'No active subscription',
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
          }
        );
      }

      const subscriptionIds = subscriptions.map((sub) => sub.id);
      logStep('Active subscriptions found', { subscriptionIds });

      // Cancel at period end (continue until end of billing cycle)
      const updatedSubscriptions = await Promise.all(
        subscriptionIds.map((id) =>
          stripe.subscriptions.update(id, {
            cancel_at_period_end: true,
          })
        )
      );

      periodEnd = new Date(
        subscriptions[0].current_period_end * 1000
      ).toISOString();

      logStep('Subscription set to cancel at period end', {
        subscriptionId: subscriptions[0].id,
        periodEnd,
      });
    }

    // Updating in database
    const organization = await updateOrganization(params);
    logStep('Organization updated', {
      organization: JSON.stringify(organization),
    });

    const subscribers = await suspendSubscriber({
      user_ids: params.user_ids,
      subscription_current_period_end: periodEnd,
    });

    logStep('Subscribers updated', {
      subscribers: JSON.stringify(subscribers),
    });

    return new Response(
      JSON.stringify({
        organization,
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
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
