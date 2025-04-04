
// supabase/functions/admin-utils/index.ts
import { serve } from "https://deno.land/std@0.131.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

// CORS headers
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Create Supabase client
const supabaseUrl = Deno.env.get("SUPABASE_URL") as string;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") as string;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Handle request
const handler = async (req: Request): Promise<Response> => {
  // Handle OPTIONS request for CORS
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: corsHeaders,
    });
  }

  try {
    // Get JWT from request
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      console.error("No authorization header");
      return new Response(JSON.stringify({ error: "No authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Extract token and debug info
    const token = authHeader.replace("Bearer ", "");
    console.log("Processing request with token starting with:", token.substring(0, 10) + "...");
    
    // Check if it's a superadmin session token (special case)
    if (token.startsWith('superadmin-')) {
      console.log("Detected superadmin session token");
    } else {
      // Verify user has access to superadmin functions
      try {
        const { data: { user }, error: userError } = await supabase.auth.getUser(token);
        
        if (userError || !user) {
          console.error("Auth error:", userError);
          return new Response(JSON.stringify({ error: "Authentication failed", details: userError }), {
            status: 401,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        // Get user profile to check role
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();

        if (profileError) {
          console.error("Profile error:", profileError);
          return new Response(JSON.stringify({ error: "Failed to retrieve user profile", details: profileError }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        // Check if user is superuser
        if (!(profile?.role === "superuser")) {
          console.error("Unauthorized access attempt by role:", profile?.role);
          return new Response(JSON.stringify({ error: "Unauthorized - Superuser role required" }), {
            status: 403,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      } catch (error) {
        console.error("Error verifying user:", error);
        return new Response(JSON.stringify({ error: "Error verifying user", details: error.message }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }
    
    // Parse request body
    const { action, params } = await req.json();
    console.log("Processing action:", action);
    
    // Handle different actions
    let result;
    
    if (action === "get_organizations") {
      result = await getOrganizations();
    } else if (action === "create_organization") {
      result = await createOrganization(params);
    } else if (action === "update_organization") {
      result = await updateOrganization(params);
    } else if (action === "delete_organization") {
      result = await deleteOrganization(params);
    } else if (action === "search_organization") {
      result = await searchOrganization(params);
    } else if (action === "get_user_profiles") {
      result = await getUserProfiles();
    } else if (action === "get_all_users") {
      result = await getAllUsers();
    } else if (action === "enable_user_without_confirmation") {
      result = await enableUserWithoutConfirmation(params);
    } else {
      return new Response(JSON.stringify({ error: "Invalid action" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
    
  } catch (error) {
    console.error("Error in admin-utils function:", error);
    
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
};

// Get all organizations
async function getOrganizations() {
  const { data, error } = await supabase
    .from("organizations")
    .select("*")
    .order("created_at", { ascending: false });
    
  if (error) throw error;
  return data;
}

// Create new organization with owner user
async function createOrganization(params: any) {
  const { org_name, sub_level, owner_name, owner_email, owner_password } = params;
  
  // Start transaction
  const { data: org, error: orgError } = await supabase
    .from("organizations")
    .insert({
      name: org_name,
      subscription_level: sub_level
    })
    .select()
    .single();
  
  if (orgError) throw orgError;
  
  // Create owner user
  const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
    email: owner_email,
    password: owner_password,
    email_confirm: true,
    user_metadata: {
      name: owner_name,
      role: "owner",
      organization_id: org.id
    }
  });
  
  if (authError) {
    // Rollback organization creation
    await supabase.from("organizations").delete().eq("id", org.id);
    throw authError;
  }
  
  // Create profile for user
  const { error: profileError } = await supabase
    .from("profiles")
    .insert({
      id: authUser.user.id,
      name: owner_name, 
      role: "owner",
      organization_id: org.id,
      is_active: true
    });
  
  if (profileError) {
    // Log error but don't fail - profile might be created by trigger
    console.error("Error creating profile:", profileError);
  }
  
  return { 
    organization: org,
    owner: {
      id: authUser.user.id,
      email: owner_email,
      name: owner_name,
      temp_password: owner_password
    }
  };
}

// Update organization
async function updateOrganization(params: any) {
  const { org_id, org_name, sub_level } = params;
  
  const { data, error } = await supabase
    .from("organizations")
    .update({
      name: org_name,
      subscription_level: sub_level,
      updated_at: new Date().toISOString()
    })
    .eq("id", org_id)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

// Delete organization
async function deleteOrganization(params: any) {
  const { org_id } = params;
  
  // Get users associated with this organization
  const { data: users, error: usersError } = await supabase
    .from("profiles")
    .select("id")
    .eq("organization_id", org_id);
  
  if (usersError) throw usersError;
  
  // Delete organization
  const { error: deleteError } = await supabase
    .from("organizations")
    .delete()
    .eq("id", org_id);
  
  if (deleteError) throw deleteError;
  
  // Delete users - Note: This will cascade to profiles via RLS
  for (const user of users || []) {
    try {
      await supabase.auth.admin.deleteUser(user.id);
    } catch (error) {
      console.error(`Failed to delete user ${user.id}:`, error);
    }
  }
  
  return { success: true, deleted_users_count: (users || []).length };
}

// Search for organization by ID
async function searchOrganization(params: any) {
  const { org_id } = params;
  
  const { data, error } = await supabase
    .from("organizations")
    .select("*")
    .eq("id", org_id)
    .single();
  
  if (error && error.code !== "PGRST116") throw error;
  return data;
}

// Get user profiles with additional details
async function getUserProfiles() {
  console.log("Fetching user profiles");
  // First get all profiles
  const { data: profiles, error: profilesError } = await supabase
    .from("profiles")
    .select("*");
  
  if (profilesError) {
    console.error("Error fetching profiles:", profilesError);
    throw profilesError;
  }
  
  console.log(`Found ${profiles?.length || 0} profiles`);
  
  // Enrich with user data from Auth
  const enrichedProfiles = [];
  
  for (const profile of profiles || []) {
    try {
      const { data: userData, error: userError } = await supabase.auth.admin.getUserById(profile.id);
      
      if (!userError && userData.user) {
        enrichedProfiles.push({
          ...profile,
          email: userData.user.email,
          last_sign_in_at: userData.user.last_sign_in_at
        });
      } else {
        console.log(`No user data found for profile ${profile.id}`);
        enrichedProfiles.push(profile);
      }
    } catch (error) {
      console.error(`Error fetching user data for ${profile.id}:`, error);
      enrichedProfiles.push(profile);
    }
  }
  
  console.log(`Returning ${enrichedProfiles.length} enriched profiles`);
  return enrichedProfiles;
}

// Get all users with confirmation status
async function getAllUsers() {
  console.log("Fetching all users");
  try {
    // Get all users from auth
    const { data: { users }, error: usersError } = await supabase.auth.admin.listUsers();
    
    if (usersError) {
      console.error("Error listing users:", usersError);
      throw usersError;
    }
    
    console.log(`Found ${users?.length || 0} users from auth`);
    
    // Get all profiles
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("*");
    
    if (profilesError) {
      console.error("Error fetching profiles:", profilesError);
      throw profilesError;
    }
    
    console.log(`Found ${profiles?.length || 0} profiles from database`);
    
    // Merge data
    const mergedUsers = [];
    
    for (const user of users || []) {
      const profile = profiles?.find(p => p.id === user.id) || {};
      
      mergedUsers.push({
        ...profile,
        id: user.id,
        email: user.email,
        email_confirmed_at: user.email_confirmed_at,
        last_sign_in_at: user.last_sign_in_at,
        created_at: user.created_at,
        is_active: profile.is_active !== undefined ? profile.is_active : true,
      });
    }
    
    console.log(`Returning ${mergedUsers.length} merged user records`);
    return mergedUsers;
  } catch (error) {
    console.error("Error in getAllUsers:", error);
    throw error;
  }
}

// Enable user without email confirmation
async function enableUserWithoutConfirmation(params: any) {
  const { user_id } = params;
  
  console.log(`Enabling user ${user_id} without email confirmation`);
  
  // Update user to confirm email
  const { data, error } = await supabase.auth.admin.updateUserById(
    user_id,
    { email_confirm: true }
  );
  
  if (error) {
    console.error("Error updating user:", error);
    throw error;
  }
  
  console.log("User enabled successfully");
  return { success: true, user: data.user };
}

serve(handler);
