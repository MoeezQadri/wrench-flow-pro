import { getSupabaseAdmin } from './auth.ts';

export async function getOrganizations() {
  const supabaseAdmin = await getSupabaseAdmin();
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
  
  try {
    // Try to use the user_profiles view first
    const { data: viewData, error: viewError } = await supabaseAdmin
      .from('user_profiles')
      .select('*');
      
    if (!viewError && viewData) {
      return viewData;
    }
    
    console.warn('Could not fetch from view, falling back to RPC:', viewError);
    
    // Fall back to the RPC function if the view doesn't work
    const { data: rpcData, error: rpcError } = await supabaseAdmin
      .rpc('get_all_users_with_profiles');
      
    if (rpcError) {
      console.error('Error fetching users with RPC:', rpcError);
      throw rpcError;
    }
    
    return rpcData;
  } catch (error) {
    console.error('Error in getUsers:', error);
    
    // Last resort fallback: get basic user data
    try {
      const { data: users, error: usersError } = await supabaseAdmin
        .from('auth.users')
        .select('id, email, created_at, last_sign_in_at, confirmed_at');
        
      if (usersError) {
        console.error('Error in fallback user fetch:', usersError);
        throw usersError;
      }
      
      const { data: profiles, error: profilesError } = await supabaseAdmin
        .from('profiles')
        .select('*');
        
      if (profilesError) {
        console.error('Error fetching profiles:', profilesError);
        // Return just users without profile data
        return users.map(user => ({
          id: user.id,
          email: user.email,
          created_at: user.created_at,
          last_sign_in_at: user.last_sign_in_at,
          email_confirmed_at: user.confirmed_at
        }));
      }
      
      // Join users and profiles
      return users.map(user => {
        const profile = profiles.find(p => p.id === user.id) || {};
        return {
          id: user.id,
          email: user.email,
          name: profile.name,
          role: profile.role,
          is_active: profile.is_active,
          organization_id: profile.organization_id,
          created_at: user.created_at,
          email_confirmed_at: user.confirmed_at
        };
      });
    } catch (fallbackError) {
      console.error('Fallback error:', fallbackError);
      throw error; // Throw the original error
    }
  }
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
  
  try {
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
  } catch (error) {
    console.error('Failed to enable user:', error);
    throw error;
  }
}

export async function checkEmailExists(email: string) {
  const supabaseAdmin = await getSupabaseAdmin();
  console.log({supabaseAdmin});
  // Check if user exists
  const { data: users, error } = await supabaseAdmin.auth.admin.listUsers({
    page: 1,
    perPage: 10,
    filter: {
      email: email
    }
  });
  console.log({users, error});
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
