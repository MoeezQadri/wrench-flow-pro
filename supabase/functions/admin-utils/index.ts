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

// Simple JWT verification function
function verifyJWT(token: string): boolean {
  // In a real implementation, you would verify the token signature
  // This is a simple placeholder verification
  return !!token && token.length > 20;
}

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

    // Handle authentication separately
    if (action === 'authenticate_superadmin') {
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

      // If credentials are valid, generate a JWT token
      // In a real implementation, you would use a proper JWT library
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

    // For all other actions, verify authorization
    if (action !== 'authenticate_superadmin') {
      // Get the authorization header
      const authHeader = req.headers.get('Authorization');
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return new Response(
          JSON.stringify({ error: 'Authentication required', details: 'Missing or invalid Bearer token' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
        );
      }
      
      const token = authHeader.split(' ')[1];
      
      // In a production system, verify the JWT token
      if (!verifyJWT(token)) {
        return new Response(
          JSON.stringify({ error: 'Invalid token' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
        );
      }
    }

    switch (action) {
      case 'verify_token': {
        // Get the authorization header
        const authHeader = req.headers.get('Authorization');
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
          return new Response(
            JSON.stringify({ verified: false, message: 'No or invalid authorization header provided' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
          );
        }
        
        const token = authHeader.split(' ')[1];
        
        // Simple verification - in a production system you would validate against 
        // stored tokens or use JWT with proper verification
        return new Response(
          JSON.stringify({ verified: true }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'get_organizations': {
        console.log('Fetching organizations for superadmin');
        
        // Fetch organizations from the database
        const { data: organizations, error } = await supabaseAdmin
          .from('organizations')
          .select('*')
          .order('created_at', { ascending: false });
          
        if (error) {
          console.error('Error fetching organizations:', error);
          return new Response(
            JSON.stringify({ error: error.message }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
          );
        }
        
        return new Response(
          JSON.stringify({ organizations }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      case 'get_users': {
        console.log('Fetching users for superadmin');
        
        // Get users from both auth.users and profiles
        const { data: users, error } = await supabaseAdmin
          .rpc('get_all_users_with_profiles');
          
        if (error) {
          console.error('Error fetching users:', error);
          return new Response(
            JSON.stringify({ error: error.message }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
          );
        }
        
        return new Response(
          JSON.stringify({ users }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'get_inactive_users': {
        // Verify auth token before proceeding
        const authHeader = req.headers.get('Authorization');
        if (!authHeader) {
          return new Response(
            JSON.stringify({ error: 'Authentication required' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
          );
        }
        
        const daysInactive = params?.days_inactive || 90;
        console.log(`Fetching inactive users for ${daysInactive} days`);
        
        // Get inactive users using the RPC function
        const { data: users, error } = await supabaseAdmin
          .rpc('get_inactive_users', { days_inactive: daysInactive });
          
        if (error) {
          console.error('Error fetching inactive users:', error);
          return new Response(
            JSON.stringify({ error: error.message }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
          );
        }
        
        return new Response(
          JSON.stringify({ users }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      case 'clean_user_data': {
        // Verify auth token before proceeding
        const authHeader = req.headers.get('Authorization');
        if (!authHeader || !params?.user_id) {
          return new Response(
            JSON.stringify({ error: 'Authentication required and user_id parameter' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
          );
        }
        
        console.log(`Cleaning user data for user ${params.user_id}`);
        
        // Clean user data using the RPC function
        const { data, error } = await supabaseAdmin
          .rpc('clean_user_data', { user_id: params.user_id });
          
        if (error) {
          console.error('Error cleaning user data:', error);
          return new Response(
            JSON.stringify({ error: error.message }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
          );
        }
        
        return new Response(
          JSON.stringify({ success: true }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      case 'delete_organization': {
        // Verify auth token before proceeding
        const authHeader = req.headers.get('Authorization');
        if (!authHeader || !params?.org_id) {
          return new Response(
            JSON.stringify({ error: 'Authentication required and org_id parameter' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
          );
        }
        
        console.log(`Deleting organization ${params.org_id}`);
        
        // First delete all users associated with the organization
        const { data: profilesData, error: profilesError } = await supabaseAdmin
          .from('profiles')
          .select('id')
          .eq('organization_id', params.org_id);
          
        if (profilesError) {
          console.error('Error fetching profiles:', profilesError);
          return new Response(
            JSON.stringify({ error: profilesError.message }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
          );
        }
        
        // Mark all profiles as inactive
        if (profilesData && profilesData.length > 0) {
          const { error: updateError } = await supabaseAdmin
            .from('profiles')
            .update({ is_active: false })
            .eq('organization_id', params.org_id);
            
          if (updateError) {
            console.error('Error deactivating profiles:', updateError);
            return new Response(
              JSON.stringify({ error: updateError.message }),
              { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
            );
          }
        }
        
        // Then delete the organization
        const { error: deleteError } = await supabaseAdmin
          .from('organizations')
          .delete()
          .eq('id', params.org_id);
          
        if (deleteError) {
          console.error('Error deleting organization:', deleteError);
          return new Response(
            JSON.stringify({ error: deleteError.message }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
          );
        }
        
        return new Response(
          JSON.stringify({ success: true }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      case 'update_organization': {
        // Verify auth token before proceeding
        const authHeader = req.headers.get('Authorization');
        if (!authHeader || !params?.org_id || !params?.org_name || !params?.sub_level) {
          return new Response(
            JSON.stringify({ error: 'Authentication required and valid parameters needed' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
          );
        }
        
        console.log(`Updating organization ${params.org_id}`);
        
        const updateData: any = {
          name: params.org_name,
          subscription_level: params.sub_level,
          updated_at: new Date().toISOString()
        };
        
        if (params.sub_status) {
          updateData.subscription_status = params.sub_status;
        }
        
        const { data, error } = await supabaseAdmin
          .from('organizations')
          .update(updateData)
          .eq('id', params.org_id)
          .select()
          .single();
          
        if (error) {
          console.error('Error updating organization:', error);
          return new Response(
            JSON.stringify({ error: error.message }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
          );
        }
        
        return new Response(
          JSON.stringify({ organization: data }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      case 'create_organization': {
        // Verify auth token before proceeding
        const authHeader = req.headers.get('Authorization');
        if (!authHeader || !params?.org_name || !params?.sub_level || !params?.owner_email || !params?.owner_name) {
          return new Response(
            JSON.stringify({ error: 'Authentication required and valid parameters needed' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
          );
        }
        
        console.log(`Creating organization ${params.org_name}`);
        
        // Generate organization ID
        const orgId = crypto.randomUUID();
        
        // Create the organization
        const { data: orgData, error: orgError } = await supabaseAdmin
          .from('organizations')
          .insert({
            id: orgId,
            name: params.org_name,
            subscription_level: params.sub_level,
            subscription_status: 'active'
          })
          .select()
          .single();
          
        if (orgError) {
          console.error('Error creating organization:', orgError);
          return new Response(
            JSON.stringify({ error: orgError.message }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
          );
        }
        
        // Generate a random password
        const tempPassword = Array.from(crypto.getRandomValues(new Uint8Array(8)))
          .map(b => b.toString(16).padStart(2, '0')).join('');
        
        // Create a user for the owner
        const { data: userData, error: userError } = await supabaseAdmin.auth.admin.createUser({
          email: params.owner_email,
          password: tempPassword,
          email_confirm: true,
          user_metadata: {
            name: params.owner_name,
            organization_id: orgId,
            role: 'owner'
          }
        });
          
        if (userError) {
          // Delete the organization if user creation fails
          await supabaseAdmin
            .from('organizations')
            .delete()
            .eq('id', orgId);
            
          console.error('Error creating owner user:', userError);
          return new Response(
            JSON.stringify({ error: userError.message }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
          );
        }
        
        return new Response(
          JSON.stringify({ 
            organization: orgData,
            owner: {
              email: params.owner_email,
              temp_password: tempPassword 
            }
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      case 'search_organization_by_id': {
        // Verify auth token before proceeding
        const authHeader = req.headers.get('Authorization');
        if (!authHeader || !params?.org_id) {
          return new Response(
            JSON.stringify({ error: 'Authentication required and org_id parameter' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
          );
        }
        
        console.log(`Searching for organization ${params.org_id}`);
        
        // Find the organization
        const { data: organization, error: orgError } = await supabaseAdmin
          .from('organizations')
          .select('*')
          .eq('id', params.org_id)
          .single();
          
        if (orgError) {
          if (orgError.code === 'PGRST116') {
            // Organization not found
            return new Response(
              JSON.stringify({ organization: null, users: [] }),
              { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }
          
          console.error('Error searching for organization:', orgError);
          return new Response(
            JSON.stringify({ error: orgError.message }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
          );
        }
        
        // Find users associated with this organization
        const { data: users, error: usersError } = await supabaseAdmin
          .from('profiles')
          .select('*')
          .eq('organization_id', params.org_id);
          
        if (usersError) {
          console.error('Error fetching users for organization:', usersError);
          return new Response(
            JSON.stringify({ organization, users: [] }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        
        return new Response(
          JSON.stringify({ organization, users }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      case 'enable_user_without_confirmation': {
        // Verify auth token before proceeding
        const authHeader = req.headers.get('Authorization');
        if (!authHeader || !params?.user_id) {
          return new Response(
            JSON.stringify({ error: 'Authentication required and user_id parameter' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
          );
        }
        
        console.log(`Enabling user ${params.user_id} without email confirmation`);
        
        // Update the user's email_confirmation_token to null and set the email_confirmed_at to now
        const { data, error } = await supabaseAdmin.auth.admin.updateUserById(
          params.user_id,
          { email_confirm: true }
        );
          
        if (error) {
          console.error('Error enabling user:', error);
          return new Response(
            JSON.stringify({ error: error.message }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
          );
        }
        
        // Also make sure the user is active in the profiles table
        await supabaseAdmin
          .from('profiles')
          .update({ is_active: true })
          .eq('id', params.user_id);
        
        return new Response(
          JSON.stringify({ success: true }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      case 'check_email_exists': {
        if (!params?.email) {
          return new Response(
            JSON.stringify({ error: 'Email parameter is required' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
          );
        }
        
        console.log(`Checking if email exists: ${params.email}`);
        
        // Check if user exists
        const { data: users, error } = await supabaseAdmin.auth.admin.listUsers({
          filter: {
            email: params.email
          }
        });
        
        if (error) {
          console.error('Error checking email exists:', error);
          return new Response(
            JSON.stringify({ error: error.message }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
          );
        }
        
        if (users.users.length === 0) {
          return new Response(
            JSON.stringify({ exists: false }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        
        // User exists, check if they're active
        const user = users.users[0];
        const { data: profile, error: profileError } = await supabaseAdmin
          .from('profiles')
          .select('is_active')
          .eq('id', user.id)
          .single();
          
        if (profileError) {
          console.error('Error fetching profile:', profileError);
          return new Response(
            JSON.stringify({ 
              exists: true,
              is_active: true // Assume active if we can't determine
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        
        return new Response(
          JSON.stringify({ 
            exists: true,
            is_active: profile.is_active
          }),
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
