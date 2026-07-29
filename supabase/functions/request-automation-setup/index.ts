import { serve } from 'https://deno.land/std@0.190.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
};

const RECIPIENT = 'info@mygaragepro.co';
const ALLOWED_PLANS = new Set(['professional', 'enterprise']);
const ALLOWED_ROLES = new Set(['owner', 'admin']);
const ALLOWED_AUTOMATIONS = new Set([
  'time_mileage_reminders',
  'sms_delivery',
  'email_delivery',
  'review_requests',
  'reactivation_campaigns',
  'lapsed_outreach',
  'booking_form',
  'custom_branding',
]);

const AUTOMATION_LABELS: Record<string, string> = {
  time_mileage_reminders: 'Time/Mileage-based reminders',
  sms_delivery: 'Automated SMS delivery',
  email_delivery: 'Automated email delivery',
  review_requests: 'Review requests (Google/Yelp)',
  reactivation_campaigns: 'Customer reactivation campaigns',
  lapsed_outreach: 'Lapsed-customer outreach',
  booking_form: 'Website booking form',
  custom_branding: 'Custom branding',
};

function esc(s: string): string {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsError } =
      await userClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const userId = claimsData.claims.sub as string;
    const userEmail = (claimsData.claims.email as string) || '';

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return new Response(JSON.stringify({ error: 'Invalid body' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const automations = Array.isArray(body.automations)
      ? (body.automations as unknown[])
          .filter((a): a is string => typeof a === 'string')
          .filter((a) => ALLOWED_AUTOMATIONS.has(a))
      : [];
    const phone = typeof body.phone === 'string' ? body.phone.trim().slice(0, 40) : '';
    const preferredContactTime =
      typeof body.preferred_contact_time === 'string'
        ? body.preferred_contact_time.trim().slice(0, 200)
        : '';
    const notes =
      typeof body.notes === 'string' ? body.notes.trim().slice(0, 2000) : '';

    if (automations.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Select at least one automation' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const adminClient = createClient(supabaseUrl, serviceKey);

    const { data: profile, error: profileError } = await adminClient
      .from('profiles')
      .select('id, name, organization_id, role, is_active')
      .eq('id', userId)
      .maybeSingle();

    if (profileError || !profile) {
      return new Response(JSON.stringify({ error: 'Profile not found' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    if (
      !profile.is_active ||
      !ALLOWED_ROLES.has(String(profile.role || '').toLowerCase())
    ) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: org, error: orgError } = await adminClient
      .from('organizations')
      .select('id, name, subscription_level, subscription_status')
      .eq('id', profile.organization_id)
      .maybeSingle();

    if (orgError || !org) {
      return new Response(JSON.stringify({ error: 'Organization not found' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const plan = String(org.subscription_level || '').toLowerCase();
    if (!ALLOWED_PLANS.has(plan)) {
      return new Response(
        JSON.stringify({
          error: 'Automation setup is available on Professional and Enterprise plans.',
        }),
        {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Insert request
    const { data: inserted, error: insertError } = await adminClient
      .from('automation_requests')
      .insert({
        organization_id: profile.organization_id,
        requested_by: userId,
        requester_name: profile.name || '',
        requester_email: userEmail,
        phone,
        preferred_contact_time: preferredContactTime,
        automations,
        notes,
        status: 'new',
      } as any)
      .select('id, created_at')
      .single();

    if (insertError || !inserted) {
      console.error('[automation-request] insert failed', insertError);
      return new Response(
        JSON.stringify({ error: 'Failed to save request' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Attempt email via Resend gateway (best-effort)
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
    const resendKey = Deno.env.get('RESEND_API_KEY');
    let emailSent = false;
    let emailError: string | null = null;

    if (lovableApiKey && resendKey) {
      const fromAddress =
        Deno.env.get('AUTOMATION_FROM_EMAIL') ||
        'MyGaragePro <onboarding@resend.dev>';
      const rows = automations
        .map((a) => `<li>${esc(AUTOMATION_LABELS[a] || a)}</li>`)
        .join('');
      const html = `
        <h2>New Automation Setup Request</h2>
        <p><strong>Organization:</strong> ${esc(org.name)} (${esc(plan)})</p>
        <p><strong>Requester:</strong> ${esc(profile.name || '')} &lt;${esc(userEmail)}&gt;</p>
        <p><strong>Phone:</strong> ${esc(phone) || '—'}</p>
        <p><strong>Preferred contact time:</strong> ${esc(preferredContactTime) || '—'}</p>
        <p><strong>Automations requested:</strong></p>
        <ul>${rows}</ul>
        <p><strong>Notes:</strong></p>
        <p>${esc(notes).replace(/\n/g, '<br/>') || '—'}</p>
        <hr/>
        <p style="color:#666;font-size:12px">Request ID: ${inserted.id}</p>
      `;

      try {
        const res = await fetch(
          'https://connector-gateway.lovable.dev/resend/emails',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${lovableApiKey}`,
              'X-Connection-Api-Key': resendKey,
            },
            body: JSON.stringify({
              from: fromAddress,
              to: [RECIPIENT],
              reply_to: userEmail || undefined,
              subject: `Automation request from ${org.name}`,
              html,
            }),
          }
        );
        if (!res.ok) {
          emailError = `${res.status} ${await res.text()}`;
          console.error('[automation-request] resend failed', emailError);
        } else {
          emailSent = true;
        }
      } catch (e) {
        emailError = String(e);
        console.error('[automation-request] resend threw', e);
      }
    } else {
      emailError = 'email_provider_not_configured';
    }

    return new Response(
      JSON.stringify({
        success: true,
        id: inserted.id,
        email_sent: emailSent,
        email_error: emailError,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (err) {
    console.error('[automation-request] unexpected', err);
    return new Response(JSON.stringify({ error: 'Internal error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
