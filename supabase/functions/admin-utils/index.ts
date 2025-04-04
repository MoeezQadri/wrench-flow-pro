
// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

// Create a Supabase client with the Admin key
const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

serve(async (req) => {
  // This is needed if you're planning to invoke your function from a browser.
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { action, params } = await req.json();
    
    // Validate input
    if (!action) {
      return new Response(
        JSON.stringify({ error: 'Missing action' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    switch (action) {
      case 'authenticate_superadmin': {
        if (!params || !params.username || !params.password) {
          return new Response(
            JSON.stringify({ error: 'Missing credentials' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
          );
        }

        console.log('Authenticating superadmin:', params.username);

        // Query the superadmins table for the provided credentials
        const { data: superadmin, error } = await supabaseAdmin
          .from('superadmins')
          .select('id, username, created_at')
          .eq('username', params.username)
          .eq('password_hash', params.password)
          .single();

        if (error || !superadmin) {
          console.error('Authentication error:', error || 'No matching superadmin found');
          return new Response(
            JSON.stringify({ 
              authenticated: false, 
              message: 'Invalid username or password' 
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // If credentials are valid, generate a token
        const token = crypto.randomUUID();
        
        // Update the last_login timestamp for the superadmin
        await supabaseAdmin
          .from('superadmins')
          .update({ last_login: new Date().toISOString() })
          .eq('id', superadmin.id);

        return new Response(
          JSON.stringify({
            authenticated: true,
            token,
            superadmin: {
              id: superadmin.id,
              username: superadmin.username
            }
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'verify_token': {
        // Get the authorization header
        const authHeader = req.headers.get('Authorization');
        
        if (!authHeader) {
          return new Response(
            JSON.stringify({ verified: false, message: 'No authorization header provided' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
          );
        }
        
        // Simple verification - in a production system you would validate against 
        // stored tokens or use JWT with proper verification
        return new Response(
          JSON.stringify({ verified: true }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      default:
        return new Response(
          JSON.stringify({ error: 'Invalid action' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        );
    }
  } catch (error) {
    console.error('Error processing request:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
