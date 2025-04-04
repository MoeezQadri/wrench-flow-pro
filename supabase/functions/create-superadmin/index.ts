
// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from '../_shared/cors.ts';
import { getSupabaseAdmin } from '../_shared/auth.ts';
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  // Handle CORS for browser requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { email, password, username } = await req.json();
    
    // Validate inputs
    if (!email || !password || !username) {
      return new Response(
        JSON.stringify({ error: 'Email, password and username are required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }
    
    const supabaseAdmin = getSupabaseAdmin();
    
    // First check if a user with this email already exists
    const { data: existingUser, error: userCheckError } = await supabaseAdmin.auth.admin.listUsers({
      filter: {
        email: email
      }
    });
    
    if (userCheckError) {
      return new Response(
        JSON.stringify({ error: 'Failed to check existing users', details: userCheckError.message }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }
    
    if (existingUser.users.length > 0) {
      // A user with this email already exists
      // Check if they are already a superadmin
      const user = existingUser.users[0];
      if (user.user_metadata?.role === 'superuser' || user.user_metadata?.role === 'superadmin') {
        return new Response(
          JSON.stringify({ error: 'A superadmin with this email already exists' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 409 }
        );
      }
      
      // Promote the existing user to superadmin
      const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
        user.id,
        {
          email: email,
          password: password,
          user_metadata: {
            ...user.user_metadata,
            role: 'superuser',
            name: username
          },
          email_confirm: true
        }
      );
      
      if (updateError) {
        return new Response(
          JSON.stringify({ error: 'Failed to upgrade user to superadmin', details: updateError.message }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        );
      }
      
      // Update the profile if it exists
      await supabaseAdmin.from('profiles')
        .upsert({
          id: user.id,
          name: username,
          role: 'superuser',
          is_active: true
        });
        
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Existing user upgraded to superadmin',
          user: { id: user.id, email, username }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Create a new superadmin user
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true,
      user_metadata: {
        name: username,
        role: 'superuser'
      }
    });
    
    if (error) {
      return new Response(
        JSON.stringify({ error: 'Failed to create superadmin user', details: error.message }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }
    
    const userId = data.user.id;
    
    // Create profile record for the superadmin
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .insert({
        id: userId,
        name: username,
        role: 'superuser',
        is_active: true
      });
      
    if (profileError) {
      console.error('Error creating profile:', profileError);
      // Continue anyway as the auth user is created
    }
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Superadmin user created successfully',
        user: { id: userId, email, username } 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    console.error('Error in create-superadmin function:', err);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: err.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
