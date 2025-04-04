
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getSupabaseAdmin } from "../_shared/auth.ts";

// CORS headers for browser requests
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  
  try {
    // Only allow POST requests
    if (req.method !== "POST") {
      return new Response(
        JSON.stringify({ error: "Method not allowed" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 405 }
      );
    }
    
    // Parse the request body
    const { email, password, username } = await req.json();
    
    if (!email || !password) {
      return new Response(
        JSON.stringify({ error: "Email and password are required" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }
    
    // Get the Supabase admin client
    const supabaseAdmin = getSupabaseAdmin();
    
    // Create the user with the superadmin role in user_metadata
    const { data: userData, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        name: username || "Super Admin",
        role: "superuser"
      }
    });
    
    if (createError) {
      console.error("Error creating superadmin user:", createError);
      return new Response(
        JSON.stringify({ error: createError.message }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }
    
    return new Response(
      JSON.stringify({ 
        message: "Superadmin user created successfully",
        user: {
          id: userData.user.id,
          email: userData.user.email,
          role: "superuser"
        }
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 201 }
    );
  } catch (error) {
    console.error("Server error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
