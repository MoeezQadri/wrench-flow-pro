import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface InviteRequest {
  email: string;
  role: string;
  organizationId: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Create Supabase client with service role key for admin operations
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Verify the request is from an authenticated user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    // Create regular client to verify the requesting user
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      throw new Error("Invalid authentication token");
    }

    // Get the requesting user's profile to verify permissions
    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("role, organization_id")
      .eq("id", user.id)
      .single();

    if (profileError || !profile) {
      throw new Error("User profile not found");
    }

    // Check if user has permission to invite (owner or admin)
    if (!["owner", "admin"].includes(profile.role)) {
      throw new Error("Insufficient permissions to invite users");
    }

    const { email, role, organizationId }: InviteRequest = await req.json();

    // Validate input
    if (!email || !role || !organizationId) {
      throw new Error("Email, role, and organization ID are required");
    }

    // Verify the organization matches the user's organization
    if (profile.organization_id !== organizationId) {
      throw new Error("Cannot invite users to a different organization");
    }

    // Check if user already exists
    const { data: existingUser } = await supabaseAdmin.auth.admin.getUserByEmail(email);
    
    if (existingUser.user) {
      throw new Error("User with this email already exists");
    }

    // Create invitation using Supabase's built-in invitation system
    const redirectTo = `${req.headers.get("origin") || "http://localhost:3000"}/auth/callback`;
    
    const { data: inviteData, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
      redirectTo,
      data: {
        role: role,
        organization_id: organizationId,
        invited_by: user.id,
        name: "" // User will set this during signup
      }
    });

    if (inviteError) {
      console.error("Invitation error:", inviteError);
      throw new Error(`Failed to send invitation: ${inviteError.message}`);
    }

    // Log the invitation for audit purposes
    console.log(`User ${user.email} invited ${email} with role ${role} to organization ${organizationId}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Invitation sent to ${email}`,
        invitedUserId: inviteData.user?.id
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );

  } catch (error) {
    console.error("Error in invite-user function:", error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "Failed to send invitation"
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});