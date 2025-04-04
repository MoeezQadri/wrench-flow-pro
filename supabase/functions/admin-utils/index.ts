
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { action, params } = await req.json();

    if (action === 'delete_organization') {
      const { org_id } = params;
      
      // Get profiles associated with this organization
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id')
        .eq('organization_id', org_id);
      
      if (profiles && profiles.length > 0) {
        // Update profiles to remove organization reference
        await supabase
          .from('profiles')
          .update({ 
            organization_id: null,
            updated_at: new Date().toISOString() 
          })
          .eq('organization_id', org_id);
          
        // Optionally delete users from auth (in a real app, might just deactivate)
        for (const profile of profiles) {
          // Here just updating profile status instead of deleting the auth user
          await supabase
            .from('profiles')
            .update({ 
              is_active: false,
              updated_at: new Date().toISOString() 
            })
            .eq('id', profile.id);
        }
      }
      
      // Delete the organization
      const { error } = await supabase
        .from('organizations')
        .delete()
        .eq('id', org_id);
      
      if (error) throw error;
      
      return new Response(
        JSON.stringify({ success: true, message: 'Organization deleted successfully' }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === 'create_organization') {
      const { org_name, sub_level, owner_name, owner_email, owner_password } = params;
      
      // 1. Create organization
      const { data: orgData, error: orgError } = await supabase
        .from('organizations')
        .insert({
          name: org_name,
          subscription_level: sub_level,
          subscription_status: 'active'
        })
        .select();
      
      if (orgError) throw orgError;
      
      if (!orgData || orgData.length === 0) {
        throw new Error('Failed to create organization');
      }
      
      const newOrg = orgData[0];
      
      // 2. Create owner user
      const password = owner_password || Math.random().toString(36).slice(2, 10); // Use provided or generate random password
      
      const { data: userData, error: userError } = await supabase.auth.admin.createUser({
        email: owner_email,
        password: password,
        email_confirm: true,
        user_metadata: {
          name: owner_name,
          role: 'owner'
        }
      });
      
      if (userError) throw userError;
      
      // 3. Create or update profile for the new user with organization
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: userData.user.id,
          name: owner_name,
          role: 'owner',
          organization_id: newOrg.id,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      
      if (profileError) throw profileError;
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Organization created successfully',
          data: {
            organization: newOrg,
            user: {
              id: userData.user.id,
              email: userData.user.email,
              name: owner_name,
              password: password
            }
          }
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === 'update_organization') {
      const { org_id, org_name, sub_level } = params;
      
      const { error } = await supabase
        .from('organizations')
        .update({
          name: org_name,
          subscription_level: sub_level,
          updated_at: new Date().toISOString()
        })
        .eq('id', org_id);
      
      if (error) throw error;
      
      return new Response(
        JSON.stringify({ success: true, message: 'Organization updated successfully' }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === 'get_organizations') {
      const { data, error } = await supabase
        .from('organizations')
        .select('*');
      
      if (error) throw error;
      
      return new Response(
        JSON.stringify(data),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // Add a new action to get user profiles
    if (action === 'get_user_profiles') {
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*');
        
      if (profilesError) throw profilesError;
      
      // Here you'd typically join with auth.users to get emails, but that requires special handling
      // For demonstration purposes, we'll return the profiles as-is
      
      return new Response(
        JSON.stringify(profiles),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // Add a new action to search for organization by ID
    if (action === 'search_organization') {
      const { org_id } = params;
      
      // Search for the organization
      const { data: orgData, error: orgError } = await supabase
        .from('organizations')
        .select('*')
        .eq('id', org_id)
        .single();
        
      if (orgError && orgError.code !== 'PGRST116') {
        throw orgError;
      }
      
      // If organization found, also get users associated with it
      if (orgData) {
        const { data: usersData, error: usersError } = await supabase
          .from('profiles')
          .select('*')
          .eq('organization_id', org_id);
          
        if (usersError) throw usersError;
        
        return new Response(
          JSON.stringify({ 
            organization: orgData,
            users: usersData || []
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      return new Response(
        JSON.stringify(null),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      { 
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );

  } catch (error) {
    console.error('Error in admin-utils function:', error);
    
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});
