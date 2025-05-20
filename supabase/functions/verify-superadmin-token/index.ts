
import { serve } from 'https://deno.land/std@0.180.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Define CORS headers for cross-origin requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders, status: 204 });
  }

  try {
    // Only allow POST requests
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse the request body
    const { token } = await req.json();

    // Validate required fields
    if (!token) {
      return new Response(
        JSON.stringify({ error: 'Token is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Verifying superadmin token');

    // Create a Supabase client with the service role key
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
          detectSessionInUrl: false,
        },
      }
    );

    // Call the RPC function to verify the token
    const { data, error } = await supabaseAdmin.rpc(
      'verify_superadmin_token_new',
      { superadmin_token: token }
    );

    if (error) {
      console.error('Token verification error:', error);
      return new Response(
        JSON.stringify({ isValid: false, error: error.message }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get user details if the token is valid
    let userId = null;
    let username = null;

    if (data === true) {
      // Query the superadmin_sessions table to get the superadmin_id
      const { data: sessionData, error: sessionError } = await supabaseAdmin
        .from('superadmin_sessions')
        .select('superadmin_id')
        .eq('token', token)
        .single();

      if (!sessionError && sessionData) {
        // Query the superadmins table to get the username
        const { data: adminData, error: adminError } = await supabaseAdmin
          .from('superadmins')
          .select('id, username')
          .eq('id', sessionData.superadmin_id)
          .single();

        if (!adminError && adminData) {
          userId = adminData.id;
          username = adminData.username;
        }
      }
    }

    // Return the token verification result
    return new Response(
      JSON.stringify({
        isValid: data === true,
        userId,
        username
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    console.error('Error in verify-superadmin-token function:', err);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: err.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
