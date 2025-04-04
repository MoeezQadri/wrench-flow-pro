
import { getSupabaseAdmin } from './auth.ts';

export async function getOrganizations() {
  const supabaseAdmin = getSupabaseAdmin();
  
  // Fetch organizations from the database
  const { data: organizations, error } = await supabaseAdmin
    .from('organizations')
    .select('*')
    .order('created_at', { ascending: false });
    
  if (error) {
    console.error('Error fetching organizations:', error);
    throw error;
  }
  
  return organizations;
}

export async function getUsers() {
  const supabaseAdmin = getSupabaseAdmin();
  
  // Get users from both auth.users and profiles
  const { data: users, error } = await supabaseAdmin
    .rpc('get_all_users_with_profiles');
    
  if (error) {
    console.error('Error fetching users:', error);
    throw error;
  }
  
  return users;
}

export async function getInactiveUsers(daysInactive: number = 90) {
  const supabaseAdmin = getSupabaseAdmin();
  
  // Get inactive users using the RPC function
  const { data: users, error } = await supabaseAdmin
    .rpc('get_inactive_users', { days_inactive: daysInactive });
    
  if (error) {
    console.error('Error fetching inactive users:', error);
    throw error;
  }
  
  return users;
}

export async function cleanUserData(userId: string) {
  const supabaseAdmin = getSupabaseAdmin();
  
  // Clean user data using the RPC function
  const { data, error } = await supabaseAdmin
    .rpc('clean_user_data', { user_id: userId });
    
  if (error) {
    console.error('Error cleaning user data:', error);
    throw error;
  }
  
  return true;
}

export async function enableUserWithoutConfirmation(userId: string) {
  const supabaseAdmin = getSupabaseAdmin();
  
  // Update the user's email_confirmation_token to null and set the email_confirmed_at to now
  const { data, error } = await supabaseAdmin.auth.admin.updateUserById(
    userId,
    { email_confirm: true }
  );
    
  if (error) {
    console.error('Error enabling user:', error);
    throw error;
  }
  
  // Also make sure the user is active in the profiles table
  await supabaseAdmin
    .from('profiles')
    .update({ is_active: true })
    .eq('id', userId);
  
  return true;
}

export async function checkEmailExists(email: string) {
  const supabaseAdmin = getSupabaseAdmin();
  
  // Check if user exists
  const { data: users, error } = await supabaseAdmin.auth.admin.listUsers({
    filter: {
      email: email
    }
  });
  
  if (error) {
    console.error('Error checking email exists:', error);
    throw error;
  }
  
  if (users.users.length === 0) {
    return { exists: false };
  }
  
  // User exists, check if they're active
  const user = users.users[0];
  const { data: profile, error: profileError } = await supabaseAdmin
    .from('profiles')
    .select('is_active')
    .eq('id', user.id)
    .single();
    
  if (profileError) {
    console.error('Error fetching profile:', profileError);
    return { 
      exists: true,
      is_active: true // Assume active if we can't determine
    };
  }
  
  return { 
    exists: true,
    is_active: profile.is_active
  };
}
