
import { getSupabaseAdmin } from './auth.ts';
import { generateSecureToken } from './auth.ts';

export async function authenticateSuperadmin(username: string, password: string) {
  const supabaseAdmin = getSupabaseAdmin();
  
  console.log('Authenticating superadmin:', username);

  // Query the superadmins table for the provided credentials
  const { data: superadmin, error } = await supabaseAdmin
    .from('superadmins')
    .select('id, username, created_at')
    .eq('username', username)
    .eq('password_hash', password)
    .single();

  if (error || !superadmin) {
    console.error('Authentication error:', error || 'No matching superadmin found');
    return { 
      authenticated: false, 
      message: 'Invalid username or password' 
    };
  }

  // Generate a secure token
  const token = generateSecureToken();
  
  // Calculate expiration (24 hours from now)
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + 24);
  
  // Store the token in the superadmin_sessions table
  const { data: sessionData, error: sessionError } = await supabaseAdmin
    .from('superadmin_sessions')
    .insert({
      superadmin_id: superadmin.id,
      token,
      expires_at: expiresAt.toISOString()
    })
    .select('*');
    
  if (sessionError) {
    console.error('Error storing session:', sessionError);
    return { 
      authenticated: false, 
      message: 'Error creating session' 
    };
  }
  
  // Update the last_login timestamp for the superadmin
  await supabaseAdmin
    .from('superadmins')
    .update({ last_login: new Date().toISOString() })
    .eq('id', superadmin.id);

  return {
    authenticated: true,
    token,
    superadmin: {
      id: superadmin.id,
      username: superadmin.username
    }
  };
}
