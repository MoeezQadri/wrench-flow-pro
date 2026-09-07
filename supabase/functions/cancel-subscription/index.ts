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
  console.log(`[CANCEL-OWN-SUBSCRIPTION] ${step}${detailsStr}`);
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
    let action = 'cancel';
    try {
      const body = await req.json();
      if (body?.action === 'resume' || body?.action === 'cancel') {
        action = body.action;
      }
    } catch (_e) {
      // no body -> default to cancel
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
    logStep('User authenticated', { userId: user.id, action });

    // Caller must be owner/admin of the organization
    const { data: profile } = await supabase
      .from('profiles')
      .select('organization_id, role')
      .eq('id', user.id)
      .single();

    const organizationId = profile?.organization_id;
    const role = (profile?.role || '').toLowerCase();
    if (!organizationId) return json({ error: 'No organization found' }, 400);
    if (!['owner', 'admin'].includes(role)) {
      return json(
        { error: 'Only organization owners and admins can change the plan' },
        403
      );
    }

    // Emails of every owner/admin of the org (the possible Stripe customers)
    const { data: adminProfiles } = await supabase
      .from('profiles')
      .select('id')
      .eq('organization_id', organizationId)
      .in('role', ['owner', 'admin']);

    const adminIds: string[] = (adminProfiles || []).map((p: any) => p.id);
    if (!adminIds.includes(user.id)) adminIds.push(user.id);

    const emails: string[] = [];
    for (const id of adminIds) {
      const { data: u } = await supabase.auth.admin.getUserById(id);
      const email = u?.user?.email;
      if (email) emails.push(email);
    }
    logStep('Admin emails resolved', { count: emails.length });

    const stripe = new Stripe(stripeKey, { apiVersion: '2023-10-16' });

    const customers = (
      await Promise.all(
        emails.map((email) => stripe.customers.list({ email, limit: 100 }))
      )
    ).flatMap((res) => res.data);

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

    if (subscriptions.length === 0) {
      logStep('No active subscription found');
      return json({
        changed: false,
        message: 'No active subscription was found for this organization.',
      });
    }

    const targets =
      action === 'cancel'
        ? subscriptions.filter((s) => !s.cancel_at_period_end)
        : subscriptions.filter((s) => s.cancel_at_period_end);

    await Promise.all(
      targets.map((s) =>
        stripe.subscriptions.update(s.id, {
          cancel_at_period_end: action === 'cancel',
        })
      )
    );
    logStep('Stripe updated', { ids: targets.map((s) => s.id) });

    const latest = subscriptions.sort(
      (a, b) => b.current_period_end - a.current_period_end
    )[0];
    const periodEnd = new Date(latest.current_period_end * 1000).toISOString();

    await supabase
      .from('organizations')
      .update({
        subscription_status: action === 'cancel' ? 'canceling' : 'active',
        updated_at: new Date().toISOString(),
      })
      .eq('id', organizationId);

    await supabase
      .from('subscribers')
      .update({
        subscription_end: periodEnd,
        updated_at: new Date().toISOString(),
      })
      .eq('organization_id', organizationId);

    return json({
      changed: true,
      action,
      subscription_end: periodEnd,
      message:
        action === 'cancel'
          ? 'Your subscription will stop at the end of the period you have already paid for.'
          : 'Your subscription has been resumed and will renew as usual.',
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    logStep('ERROR', { error: msg });
    return json({ error: msg }, 500);
  }
});
