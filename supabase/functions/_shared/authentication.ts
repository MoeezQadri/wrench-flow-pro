
import { getSupabaseAdmin } from './auth.ts';
import { generateSecureToken } from './auth.ts';

export async function authenticateSuperadmin(username: string, password: string) {
  const supabaseAdmin = getSupabaseAdmin();
  
  console.log('Authenticating superadmin:', username);

  try {
    // Use the database function for authentication instead of direct query
    const { data, error } = await supabaseAdmin.rpc(
      'superadmin_login',
      {
        username: username,
        password_hash: password
      }
    );

    if (error || !data || data.authenticated === false) {
      console.error('Authentication error:', error || data.message || 'Login failed');
      return { 
        authenticated: false, 
        message: data?.message || 'Invalid username or password' 
      };
    }

    return data; // Return the data directly from the RPC function
  } catch (err) {
    console.error('Login function error:', err);
    return { 
      authenticated: false, 
      message: 'Error during authentication process' 
    };
  }
}
