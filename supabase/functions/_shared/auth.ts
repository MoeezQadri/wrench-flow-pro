
// JWT verification and token utilities

// Secret key for verifying JWT tokens - in production, use a proper secret
const JWT_SECRET = Deno.env.get('JWT_SECRET') || 'superadmin-jwt-secret-2024';

// Generate a secure random token
export function generateSecureToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

// Create a Supabase admin client function
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

export function getSupabaseAdmin() {
  return createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  );
}

// Improved JWT verification function using database function
export async function verifyJWT(token: string): Promise<boolean> {
  if (!token || token.length < 20) {
    console.log("Token missing or too short");
    return false;
  }
  
  try {
    const supabaseAdmin = getSupabaseAdmin();
    
    // Use the database function to verify the token
    const { data, error } = await supabaseAdmin.rpc(
      'verify_superadmin_token',
      { token: token }
    );
    
    if (error) {
      console.error("Error calling verify_superadmin_token:", error);
      return false;
    }
    
    return data === true;
  } catch (err) {
    console.error("Error verifying token:", err);
    return false;
  }
}
