import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CREATE-CHECKOUT] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");
    logStep("Stripe key verified");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");
    logStep("Authorization header found");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    logStep("User authenticated", { userId: user.id, email: user.email });

    // Get request body
    const { planId, billingFrequency = 'monthly' } = await req.json();
    if (!planId) throw new Error("Plan ID is required");
    logStep("Plan ID and billing frequency received", { planId, billingFrequency });

    // Fetch the subscription plan from database
    const { data: plan, error: planError } = await supabaseClient
      .from("subscription_plans")
      .select("*")
      .eq("id", planId)
      .eq("is_active", true)
      .single();

    if (planError || !plan) {
      throw new Error("Invalid subscription plan");
    }
    
    // Determine price based on billing frequency
    const isYearly = billingFrequency === 'yearly';
    const price = isYearly ? plan.price_yearly : plan.price_monthly;
    const interval = isYearly ? 'year' : 'month';
    
    if (!price || price <= 0) {
      throw new Error(`${billingFrequency} pricing not available for this plan`);
    }
    
    logStep("Plan found", { 
      planName: plan.name, 
      billingFrequency, 
      price, 
      interval 
    });

    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
      logStep("Existing customer found", { customerId });
    } else {
      logStep("No existing customer found, will create new customer");
    }

    // Calculate any discount for yearly billing
    const discount = isYearly && plan.price_monthly ? 
      Math.round(((plan.price_monthly * 12 - plan.price_yearly) / (plan.price_monthly * 12)) * 100) : 0;

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : user.email,
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: { 
              name: `${plan.name} - ${isYearly ? 'Yearly' : 'Monthly'}`,
              description: plan.description + (discount > 0 ? ` (Save ${discount}% with yearly billing)` : '')
            },
            unit_amount: Math.round(price * 100), // Convert to cents
            recurring: { interval },
          },
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: `${req.headers.get("origin")}/settings?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.get("origin")}/settings?canceled=true`,
      metadata: {
        plan_id: planId,
        billing_frequency: billingFrequency,
        user_id: user.id
      }
    });

    logStep("Checkout session created", { sessionId: session.id, url: session.url });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in create-checkout", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});