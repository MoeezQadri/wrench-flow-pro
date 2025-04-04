
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

// Improved JWT verification function
export async function verifyJWT(token: string): Promise<boolean> {
  if (!token || token.length < 20) {
    console.log("Token missing or too short");
    return false;
  }
  
  try {
    const supabaseAdmin = getSupabaseAdmin();
    // Check if the token exists in our storage
    const { data, error } = await supabaseAdmin
      .from('superadmin_sessions')
      .select('*')
      .eq('token', token)
      .single();
      
    if (error || !data) {
      console.log("Token not found in database or error:", error);
      return false;
    }
    
    // Check if token is expired
    if (data.expires_at && new Date(data.expires_at) < new Date()) {
      console.log("Token expired");
      // Clean up expired token
      await supabaseAdmin
        .from('superadmin_sessions')
        .delete()
        .eq('token', token);
      return false;
    }
    
    return true;
  } catch (err) {
    console.error("Error verifying token:", err);
    return false;
  }
}
