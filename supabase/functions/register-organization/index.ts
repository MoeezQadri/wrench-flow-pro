import { serve } from 'https://deno.land/std@0.190.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
};

type Fail = {
  code:
    | 'validation_error'
    | 'email_exists'
    | 'email_pending_activation'
    | 'organization_exists'
    | 'signup_failed'
    | 'server_error';
  message: string;
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function fail(f: Fail, status = 400) {
  return json({ success: false, error: f.code, message: f.message }, status);
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  if (req.method !== 'POST') {
    return fail({ code: 'validation_error', message: 'Method not allowed' }, 405);
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

  const admin = createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  let createdOrgId: string | null = null;

  try {
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return fail({ code: 'validation_error', message: 'Invalid request body' });
    }

    const email = String(body.email ?? '').trim().toLowerCase();
    const password = String(body.password ?? '');
    const name = String(body.name ?? '').trim();
    const organizationName = String(body.organizationName ?? '').trim();
    const redirectTo =
      typeof body.redirectTo === 'string' && body.redirectTo.startsWith('http')
        ? body.redirectTo
        : undefined;

    // ---- 1. Validate input -------------------------------------------------
    if (!EMAIL_RE.test(email)) {
      return fail({
        code: 'validation_error',
        message: 'Please enter a valid email address.',
      });
    }
    if (password.length < 6) {
      return fail({
        code: 'validation_error',
        message: 'Password must be at least 6 characters long.',
      });
    }
    if (name.length < 1 || name.length > 120) {
      return fail({
        code: 'validation_error',
        message: 'Please enter your full name.',
      });
    }
    if (organizationName.length < 2 || organizationName.length > 120) {
      return fail({
        code: 'validation_error',
        message: 'Organization name must be between 2 and 120 characters.',
      });
    }

    // ---- 2. Email must not already have an account -------------------------
    const { data: existingList, error: listError } =
      await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
    if (listError) {
      console.error('listUsers failed:', listError.message);
      return fail(
        {
          code: 'server_error',
          message: 'Could not verify your email right now. Please try again.',
        },
        500
      );
    }
    const existingUser = existingList.users.find(
      (u) => (u.email ?? '').toLowerCase() === email
    );
    if (existingUser) {
      const { data: profile } = await admin
        .from('profiles')
        .select('is_active')
        .eq('id', existingUser.id)
        .maybeSingle();

      const isConfirmed = !!existingUser.email_confirmed_at;
      const isActive = profile?.is_active !== false;

      if (isConfirmed && isActive) {
        return fail({
          code: 'email_exists',
          message:
            'This email is already registered and cannot be used to register again. Please login or use "Forgot Password" if needed.',
        });
      }
      return fail({
        code: 'email_pending_activation',
        message:
          'This email is registered but not yet activated. Please check your inbox or use "Forgot Password" to complete activation.',
      });
    }

    // ---- 3. Organization name must be free (case/space insensitive) --------
    const { data: existingOrg, error: orgLookupError } = await admin
      .from('organizations')
      .select('id')
      .ilike('name', organizationName)
      .maybeSingle();
    if (orgLookupError) {
      console.error('organization lookup failed:', orgLookupError.message);
      return fail(
        {
          code: 'server_error',
          message:
            'Could not verify the organization name right now. Please try again.',
        },
        500
      );
    }
    if (existingOrg) {
      return fail({
        code: 'organization_exists',
        message:
          'This organization name is already taken. Please contact the organization administrator to request access, or choose a different organization name.',
      });
    }

    // ---- 4. Create the organization ---------------------------------------
    const { data: org, error: orgError } = await admin
      .from('organizations')
      .insert({
        name: organizationName,
        subscription_level: 'trial',
        subscription_status: 'active',
        country: 'United States',
        currency: 'USD',
      } as any)
      .select('id')
      .single();

    if (orgError || !org) {
      // Unique index collision => someone took the name in between.
      if (orgError?.code === '23505' || orgError?.code === '23514') {
        return fail({
          code: 'organization_exists',
          message:
            'This organization name is already taken. Please contact the organization administrator to request access, or choose a different organization name.',
        });
      }
      console.error('organization insert failed:', orgError?.message);
      return fail(
        {
          code: 'server_error',
          message:
            'There was an issue setting up your organization. Please try again.',
        },
        500
      );
    }
    createdOrgId = org.id as string;

    // ---- 5. Create the auth user (sends the confirmation email) -----------
    const publicClient = createClient(supabaseUrl, anonKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { data: signUpData, error: signUpError } =
      await publicClient.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectTo,
          data: {
            name,
            organization_id: createdOrgId,
            role: 'owner',
          },
        },
      });

    if (signUpError || !signUpData.user) {
      // Roll back the organization so the name stays free.
      await admin.from('organizations').delete().eq('id', createdOrgId);
      createdOrgId = null;

      const msg = signUpError?.message ?? 'Could not create your account.';
      console.error('signUp failed:', msg);

      if (/rate limit/i.test(msg)) {
        return fail(
          {
            code: 'signup_failed',
            message:
              'Too many signup attempts right now. Please wait a few minutes and try again.',
          },
          429
        );
      }
      if (/already registered|already been registered/i.test(msg)) {
        return fail({
          code: 'email_exists',
          message:
            'This email is already registered and cannot be used to register again. Please login or use "Forgot Password" if needed.',
        });
      }
      return fail(
        {
          code: 'signup_failed',
          message: `Could not create your account: ${msg}`,
        },
        400
      );
    }

    const userId = signUpData.user.id;

    // ---- 6. Guarantee the profile is linked to the organization -----------
    const { error: profileError } = await admin
      .from('profiles')
      .upsert(
        {
          id: userId,
          name,
          role: 'owner',
          organization_id: createdOrgId,
          is_active: true,
        } as any,
        { onConflict: 'id' }
      );

    if (profileError) {
      console.error('profile link failed:', profileError.message);
      // Undo everything so the user can retry cleanly.
      await admin.auth.admin.deleteUser(userId);
      await admin.from('organizations').delete().eq('id', createdOrgId);
      createdOrgId = null;
      return fail(
        {
          code: 'server_error',
          message:
            'There was an issue setting up your organization. Please try again.',
        },
        500
      );
    }

    return json({
      success: true,
      user: {
        id: userId,
        email,
        name,
        role: 'owner',
        organization_id: createdOrgId,
        created_at: signUpData.user.created_at,
        updated_at: signUpData.user.updated_at,
      },
      organization_id: createdOrgId,
      needs_email_confirmation: !signUpData.session,
    });
  } catch (err) {
    console.error('register-organization error:', err);
    if (createdOrgId) {
      await admin.from('organizations').delete().eq('id', createdOrgId);
    }
    return fail(
      {
        code: 'server_error',
        message: 'Registration failed. Please try again.',
      },
      500
    );
  }
});
