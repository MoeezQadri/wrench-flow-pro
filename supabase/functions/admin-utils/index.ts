// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from '../_shared/cors.ts';

// Import authentication modules
import { verifyJWT, verifyUserJWT } from '../_shared/auth.ts';
import { authenticateSuperadmin } from '../_shared/authentication.ts';

// Import user management modules
import { 
  getOrganizations, 
  getUsers,
  getInactiveUsers,
  cleanUserData,
  enableUserWithoutConfirmation,
  checkEmailExists,
} from '../_shared/user-management.ts';

// Import organization management modules
import {
  deleteOrganization,
  updateOrganization,
  createOrganization,
  searchOrganizationById,
} from '../_shared/organization-management.ts';

serve(async (req) => {
  // This is needed if you're planning to invoke your function from a browser.
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { action, params } = await req.json();
    
    console.log(`--- admin-utils called action: ${action} ---`);
    console.log(`--- admin-utils called params: ${params.toString()} ---`);
    
    // Validate input
    if (!action) {
      return new Response(
        JSON.stringify({ error: 'Missing action' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Handle authentication separately
    if (action === 'authenticate_superadmin') {
      if (!params || !params.userid) {
        return new Response(
          JSON.stringify({ error: 'Missing credentials' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        );
      }

      try {
        const result = await authenticateSuperadmin(params.userid);
        return new Response(
          JSON.stringify(result),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

      } catch (error) {
        console.error('Authentication error:', error);
        return new Response(
          JSON.stringify({ authenticated: false, message: 'Authentication failed' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        );
      }
    }

    // For all other actions, verify authorization
    if (action !== 'authenticate_superadmin' && action !== 'check_email_exists') {
      // Get the authorization header
      const authHeader = req.headers.get('Authorization');
      console.log(`--- Auth header ${authHeader} ---`)
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return new Response(
          JSON.stringify({ 
            error: 'Authentication required', 
            details: 'Missing or invalid Bearer token'
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
        );
      }
      
      const token = authHeader.split(' ')[1];
      console.log(`--- token ${token} ---`)
      
      let isValid;
      // First try to verify as a superadmin token
      if (params.superadmin_token){
        
        isValid = await verifyJWT(params.superadmin_token);
      }
      
      console.log(`--- isValid:  ${isValid} ---`)
    
      // If not a valid superadmin token, check if it's a valid user token
      if (!isValid) {
        const userVerification = await verifyUserJWT(token);
        
        if (userVerification) {
          // For user tokens, we need to further check if they have the right permissions
          // depending on the action they're trying to perform
          isValid = true;
          
          // Here we would check the user's role for specific actions
          // For example, if they're trying to perform an admin action
          if (action.startsWith('admin_')) {
            const user = userVerification;
            // Check if the user has admin permissions
            // This would depend on your application's permission model
            isValid = false;
          }
        }
      }
      
      if (!isValid) {
        return new Response(
          JSON.stringify({ error: 'Invalid or expired token' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
        );
      }
    }

    // Handle different actions
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
        
        // Verify the token
        const isValid = await verifyJWT(token);
        return new Response(
          JSON.stringify({ verified: isValid }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'get_organizations': {
        try {
          const organizations = await getOrganizations();
          return new Response(
            JSON.stringify({ organizations }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        } catch (error) {
          return new Response(
            JSON.stringify({ error: error.message }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
          );
        }
      }
      
      case 'get_users': {
        try {
          const users = await getUsers();
          return new Response(
            JSON.stringify({ users }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        } catch (error) {
          return new Response(
            JSON.stringify({ error: error.message }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
          );
        }
      }

      case 'get_inactive_users': {
        const daysInactive = params?.days_inactive || 90;
        
        try {
          const users = await getInactiveUsers(daysInactive);
          return new Response(
            JSON.stringify({ users }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        } catch (error) {
          return new Response(
            JSON.stringify({ error: error.message }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
          );
        }
      }
      
      case 'clean_user_data': {
        if (!params?.user_id) {
          return new Response(
            JSON.stringify({ error: 'user_id parameter required' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
          );
        }
        
        try {
          await cleanUserData(params.user_id);
          return new Response(
            JSON.stringify({ success: true }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        } catch (error) {
          return new Response(
            JSON.stringify({ error: error.message }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
          );
        }
      }
      
      case 'delete_organization': {
        if (!params?.org_id) {
          return new Response(
            JSON.stringify({ error: 'org_id parameter required' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
          );
        }
        
        try {
          await deleteOrganization(params.org_id);
          return new Response(
            JSON.stringify({ success: true }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        } catch (error) {
          return new Response(
            JSON.stringify({ error: error.message }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
          );
        }
      }
      
      case 'update_organization': {
        if (!params?.org_id || !params?.org_name || !params?.sub_level) {
          return new Response(
            JSON.stringify({ error: 'Valid parameters needed' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
          );
        }
        
        try {
          const organization = await updateOrganization(params);
          return new Response(
            JSON.stringify({ organization }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        } catch (error) {
          return new Response(
            JSON.stringify({ error: error.message }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
          );
        }
      }
      
      case 'create_organization': {
        if (!params?.org_name || !params?.sub_level || !params?.owner_email || !params?.owner_name) {
          return new Response(
            JSON.stringify({ error: 'Valid parameters needed' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
          );
        }
        
        try {
          const result = await createOrganization(params);
          return new Response(
            JSON.stringify(result),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        } catch (error) {
          return new Response(
            JSON.stringify({ error: error.message }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
          );
        }
      }
      
      case 'search_organization_by_id': {
        if (!params?.org_id) {
          return new Response(
            JSON.stringify({ error: 'org_id parameter required' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
          );
        }
        
        try {
          const result = await searchOrganizationById(params.org_id);
          return new Response(
            JSON.stringify(result),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        } catch (error) {
          return new Response(
            JSON.stringify({ error: error.message }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
          );
        }
      }
      
      case 'enable_user_without_confirmation': {
        if (!params?.user_id) {
          return new Response(
            JSON.stringify({ error: 'user_id parameter required' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
          );
        }
        
        try {
          await enableUserWithoutConfirmation(params.user_id);
          return new Response(
            JSON.stringify({ success: true }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        } catch (error) {
          return new Response(
            JSON.stringify({ error: error.message }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
          );
        }
      }
      
      case 'check_email_exists': {
        if (!params?.email) {
          return new Response(
            JSON.stringify({ error: 'Email parameter is required' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
          );
        }
        
        try {
          const result = await checkEmailExists(params.email);
          return new Response(
            JSON.stringify(result),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        } catch (error) {
          return new Response(
            JSON.stringify({ error: error.message }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
          );
        }
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
