
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { corsHeaders } from "../_shared/cors.ts"
import { authenticateSuperadmin } from "../_shared/authentication.ts"

interface VerifyTokenRequestBody {
  token: string
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { token } = await req.json() as VerifyTokenRequestBody

    if (!token) {
      return new Response(
        JSON.stringify({ 
          verified: false, 
          message: "Token is required" 
        }),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400 
        }
      )
    }

    // Verify the token using the database function
    const { data, error } = await fetch(
      `${Deno.env.get("SUPABASE_URL")}/rest/v1/rpc/verify_superadmin_token_new`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
          "apikey": `${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`
        },
        body: JSON.stringify({
          superadmin_token: token
        })
      }
    ).then(res => res.json())

    if (error) {
      console.error("Error verifying token:", error)
      return new Response(
        JSON.stringify({ verified: false, message: "Token verification failed" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    return new Response(
      JSON.stringify({ verified: data }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    )
  } catch (error) {
    console.error("Error:", error)
    
    return new Response(
      JSON.stringify({ verified: false, message: "Internal server error" }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500
      }
    )
  }
})
