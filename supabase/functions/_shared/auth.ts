
// JWT verification and token utilities

// Secret key for verifying JWT tokens - in production, use a proper secret
const JWT_SECRET = Deno.env.get('JWT_SECRET') || 'superadmin-jwt-secret-2024';
const USER_JWT_SECRET = Deno.env.get('USER_JWT_SECRET') || 'user-jwt-secret-secure-2024';

// Generate a secure random token
export function generateSecureToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

// Create a Supabase admin client function
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

export async function getSupabaseAdmin() {
  return createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false
      }
    }
  );
}

// Improved verification function that handles both JWT and session token formats
export async function verifyJWT(superadmin_token: string): Promise<boolean> {
  console.log(`--- verifying jwt: ${superadmin_token} ---`);
  if (!superadmin_token || superadmin_token.length < 20) {
    console.log("Token missing or too short");
    return false;
  }
  
  try {
    const supabaseAdmin = await getSupabaseAdmin();
    
    // Use the database function to verify the superadmin_token
    const { data, error } = await supabaseAdmin.rpc(
      'verify_superadmin_token_new',
      { superadmin_token }
    );
    console.log(`--- jwt verification response: ${data} ---`);
    console.log(`--- jwt verification error: ${error} ---`);
    
    if (error) {
      console.error("Error calling verify_superadmin_token:", error);
      return false;
    }
    
    return data === true;
  } catch (err) {
    console.error("Error verifying superadmin token:", err);
    return false;
  }
}

// Verify user access tokens
export async function verifyUserJWT(token: string): Promise<boolean | object> {
  if (!token || token.length < 20) {
    console.log("User token missing or too short");
    return false;
  }
  
  try {
    // For regular users, we verify the token using the Supabase client
    const supabaseAdmin = await getSupabaseAdmin();
    
    // Perform JWT verification here for user tokens
    // This would check the signature using USER_JWT_SECRET
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
    
    if (error) {
      console.error("Error verifying user token:", error);
      return false;
    }
    
    if (user) {
      // Return the user object for further checks if needed
      return user;
    }
    
    return false;
  } catch (err) {
    console.error("Error verifying user token:", err);
    return false;
  }
}
