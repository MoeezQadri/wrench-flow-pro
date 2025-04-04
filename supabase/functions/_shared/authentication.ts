
import { getSupabaseAdmin } from './auth.ts';

/**
 * Authenticates a superadmin user and returns a session token
 */
export async function authenticateSuperadmin(username: string, password: string) {
  const supabaseAdmin = getSupabaseAdmin();
  
  try {
    // Use the database function to authenticate the superadmin
    const { data, error } = await supabaseAdmin.rpc(
      'superadmin_login',
      { 
        username: username,
        password_hash: hashPassword(password)
      }
    );
    
    if (error) {
      console.error('Error authenticating superadmin:', error);
      return { 
        authenticated: false,
        message: error.message
      };
    }
    
    return data;
  } catch (error) {
    console.error('Failed to authenticate superadmin:', error);
    return {
      authenticated: false,
      message: 'Authentication failed'
    };
  }
}

/**
 * Simple hash function for password (in production use bcrypt or similar)
 * This is just a placeholder - in a real system you'd use a proper hashing library
 */
function hashPassword(password: string): string {
  // In production, use a proper password hashing library
  // This is just a simple MD5-like hash for demonstration
  let hash = 0;
  for (let i = 0; i < password.length; i++) {
    const char = password.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(16);
}
