
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
        // Delete users from auth (which will trigger delete from profiles due to cascade)
        for (const profile of profiles) {
          await supabase.auth.admin.deleteUser(profile.id);
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
      const { data: userData, error: userError } = await supabase.auth.admin.createUser({
        email: owner_email,
        password: owner_password,
        email_confirm: true,
        user_metadata: {
          name: owner_name,
          role: 'owner',
          organization_id: newOrg.id
        }
      });
      
      if (userError) throw userError;
      
      // 3. Update profile with organization
      await supabase
        .from('profiles')
        .update({ organization_id: newOrg.id })
        .eq('id', userData.user.id);
      
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
              password: owner_password
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
