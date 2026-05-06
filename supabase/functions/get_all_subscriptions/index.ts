import { serve } from 'https://deno.land/std@0.190.0/http/server.ts';
import Stripe from 'https://esm.sh/stripe@14.21.0';
import { getSubscribers } from '../_shared/organization-management.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[GET-ALL-BILLING-DETAILS] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep('Function started');

    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
    if (!stripeKey) throw new Error('Missing STRIPE_SECRET_KEY in environment');

    const stripe = new Stripe(stripeKey, { apiVersion: '2023-10-16' });

    // Fetch active subscriptions
    logStep('Fetching active subscriptions');
    const subscriptions = await stripe.subscriptions.list({
      status: 'active',
      limit: 100,
    });
    logStep('Active subscriptions found', { count: subscriptions.data.length });
    logStep('All subscriptions fetched', {
      subs: JSON.stringify(subscriptions.data),
    });

    const userIds = subscriptions.data.map((sub) => sub.customer as string);
    const subscribers = await getSubscribers(userIds);
    const subscribersMap: Record<string, any> = {};
    subscribers?.forEach((sub) => {
      subscribersMap[sub.email] = sub;
    });

    // Process subscriptions in parallel
    const billingDetails = await Promise.all(
      subscriptions.data.map(async (sub) => {
        try {
          const customerId = sub.customer as string;

          // Fetch customer and invoices in parallel
          const [customer, invoices] = await Promise.all([
            stripe.customers.retrieve(customerId),
            stripe.invoices.list({ customer: customerId, limit: 100 }),
          ]);

          const email =
            typeof customer === 'object' && 'email' in customer
              ? (customer.email as string)
              : null;

          if (!email) {
            logStep('Skipping customer without email', { customerId });
            return null;
          }

          const totalBilled = invoices.data.reduce(
            (sum, inv) => sum + (inv.amount_paid ?? 0),
            0
          );

          const price = sub.items.data[0].price;

          return {
            email,
            total_billed: totalBilled / 100,
            next_billing_date: sub.current_period_end
              ? new Date(sub.current_period_end * 1000).toISOString()
              : null,
            plan_name: price.nickname,
            amount: price.unit_amount ? price.unit_amount / 100 : null,
            currency: price.currency,
            interval: price.recurring?.interval,
            interval_count: price.recurring?.interval_count,
            status: sub.status,
            trial_start: sub.trial_start
              ? new Date(sub.trial_start * 1000).toISOString()
              : null,
            trial_end: sub.trial_end
              ? new Date(sub.trial_end * 1000).toISOString()
              : null,
            canceled_at: sub.canceled_at
              ? new Date(sub.canceled_at * 1000).toISOString()
              : null,
            cancel_at_period_end: sub.cancel_at_period_end,
            current_period_start: sub.current_period_start
              ? new Date(sub.current_period_start * 1000).toISOString()
              : null,
            suspended: subscribersMap[email]?.suspended || false,
          };
        } catch (err) {
          console.error('Error processing subscription:', err);
          return null;
        }
      })
    );

    return new Response(JSON.stringify(billingDetails.filter(Boolean)), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logStep('ERROR', { message });
    return new Response(JSON.stringify({ error: message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
