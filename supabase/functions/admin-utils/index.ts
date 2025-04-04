
// Use esm.sh URL instead of import from package name
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.23.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// New function to verify the superadmin token
async function verifyToken() {
  try {
    // If we reach this point, it means authorization was successful
    // The token passed the auth check in the request handler
    return {
      verified: true,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error in verifyToken:', error);
    throw error;
  }
}

async function checkEmailExists(client: any, { email }: any) {
  if (!email) {
    throw new Error('Email is required');
  }

  try {
    // Check if the email exists in auth.users
    const { data: users, error } = await client.auth.admin.listUsers({
      filter: { email },
    });

    if (error) {
      throw error;
    }

    // Find the user with the exact email (since filter might be case-insensitive)
    const user = users.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());

    if (!user) {
      return {
        exists: false,
        is_active: false,
      };
    }

    // Check if the user is active in profiles table
    const { data: profiles, error: profileError } = await client
      .from('profiles')
      .select('is_active')
      .eq('id', user.id)
      .single();

    if (profileError && profileError.code !== 'PGRST116') {
      console.warn(`Error checking profile for user ${user.id}:`, profileError);
    }

    return {
      exists: true,
      is_active: profiles?.is_active !== false, // Default to active if profile doesn't exist or is_active is null
      user_id: user.id,
    };
  } catch (error) {
    console.error('Error in checkEmailExists:', error);
    throw error;
  }
}

async function deleteOrganization(client: any, { org_id }: any) {
  if (!org_id) {
    throw new Error('Organization ID is required');
  }

  try {
    // Delete organization from the organizations table
    const { error: orgError } = await client.from('organizations').delete().eq('id', org_id);

    if (orgError) {
      throw orgError;
    }

    // Find all users in the organization
    const { data: users, error: usersError } = await client.from('profiles').select('id').eq('organization_id', org_id);

    if (usersError) {
      throw usersError;
    }

    // Delete each user from auth.users
    if (users && users.length > 0) {
      const userIds = users.map((user) => user.id);
      const { data, error: authError } = await client.auth.admin.deleteUsers(userIds);

      if (authError) {
        throw authError;
      }

      console.log(`Successfully deleted ${data?.length || 0} users from auth.users`);

      // Optionally, delete profiles from the profiles table
      const { error: profilesError } = await client.from('profiles').delete().in('id', userIds);

      if (profilesError) {
        throw profilesError;
      }

      console.log('Successfully deleted profiles from the profiles table');
    }

    return { success: true, message: `Organization ${org_id} and associated users deleted successfully.` };
  } catch (error) {
    console.error('Error in deleteOrganization:', error);
    throw error;
  }
}

async function createOrganization(client: any, params: any) {
  const { org_name, sub_level, owner_name, owner_email, owner_password } = params;

  if (!org_name || !sub_level || !owner_name || !owner_email || !owner_password) {
    throw new Error('Missing required parameters for creating organization.');
  }

  try {
    // Create a new user in auth.users
    const { data: authData, error: authError } = await client.auth.admin.createUser({
      email: owner_email,
      password: owner_password,
      user_metadata: {
        name: owner_name,
      },
    });

    if (authError) {
      throw authError;
    }

    const newUserId = authData.user?.id;

    if (!newUserId) {
      throw new Error('Failed to create user in auth.users');
    }

    // Create a new organization
    const { data: orgData, error: orgError } = await client
      .from('organizations')
      .insert([
        {
          name: org_name,
          subscription_level: sub_level,
        },
      ])
      .select();

    if (orgError) {
      // If organization creation fails, delete the user we just created
      await client.auth.admin.deleteUser(newUserId);
      throw orgError;
    }

    const newOrgId = orgData?.[0]?.id;

    if (!newOrgId) {
      // If organization creation fails, delete the user we just created
      await client.auth.admin.deleteUser(newUserId);
      throw new Error('Failed to create organization');
    }

    // Update the user's profile with the organization ID and role
    const { error: profileError } = await client
      .from('profiles')
      .update({
        organization_id: newOrgId,
        role: 'owner',
        is_active: true,
      })
      .eq('id', newUserId);

    if (profileError) {
      // If profile update fails, delete the user and organization we just created
      await client.auth.admin.deleteUser(newUserId);
      await client.from('organizations').delete().eq('id', newOrgId);
      throw profileError;
    }

    return {
      success: true,
      message: `Organization ${org_name} created successfully with owner ${owner_name}.`,
      org_id: newOrgId,
      user_id: newUserId,
    };
  } catch (error) {
    console.error('Error in createOrganization:', error);
    throw error;
  }
}

async function updateOrganization(client: any, params: any) {
  const { org_id, org_name, sub_level } = params;

  if (!org_id || !org_name || !sub_level) {
    throw new Error('Missing required parameters for updating organization.');
  }

  try {
    // Update the organization
    const { error: orgError } = await client
      .from('organizations')
      .update({
        name: org_name,
        subscription_level: sub_level,
      })
      .eq('id', org_id);

    if (orgError) {
      throw orgError;
    }

    return { success: true, message: `Organization ${org_name} updated successfully.` };
  } catch (error) {
    console.error('Error in updateOrganization:', error);
    throw error;
  }
}

async function getOrganizations(client: any) {
  try {
    // Fetch all organizations
    const { data, error } = await client.from('organizations').select('*');

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error in getOrganizations:', error);
    throw error;
  }
}

async function getUserProfiles(client: any) {
  try {
    // Fetch all user profiles
    const { data, error } = await client.from('profiles').select('*');

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error in getUserProfiles:', error);
    throw error;
  }
}

async function searchOrganization(client: any, { org_id }: any) {
  if (!org_id) {
    throw new Error('Organization ID is required');
  }

  try {
    // Search for the organization
    const { data, error } = await client.from('organizations').select('*').eq('id', org_id).single();

    if (error) {
      // If no record is found, the error code is usually 'PGRST116'
      if (error.code === 'PGRST116') {
        return null; // Return null to indicate no organization found
      }
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error in searchOrganization:', error);
    throw error;
  }
}

async function getAllUsers(client: any) {
  try {
    // Fetch all users from auth.users
    const { data: authUsers, error: authError } = await client.auth.admin.listUsers();

    if (authError) {
      throw authError;
    }

    // Extract user IDs from auth.users
    const userIds = authUsers.users.map((user) => user.id);

    // Fetch corresponding profiles from the profiles table
    const { data: profiles, error: profilesError } = await client.from('profiles').select('*').in('id', userIds);

    if (profilesError) {
      throw profilesError;
    }

    // Combine auth users with their profile data
    const usersWithConfirmation = authUsers.users.map((user) => {
      const profile = profiles?.find((p) => p.id === user.id);
      return {
        ...user,
        is_active: profile?.is_active ?? false, // Use profile data if available
        organization_id: profile?.organization_id ?? null,
        role: profile?.role ?? 'no-role',
      };
    });

    return usersWithConfirmation;
  } catch (error) {
    console.error('Error in getAllUsers:', error);
    throw error;
  }
}

async function enableUserWithoutConfirmation(client: any, { user_id }: any) {
  if (!user_id) {
    throw new Error('User ID is required');
  }

  try {
    // Update the user's profile to set is_active to true
    const { error: profileError } = await client.from('profiles').update({ is_active: true }).eq('id', user_id);

    if (profileError) {
      throw profileError;
    }

    return { success: true, message: `User ${user_id} enabled successfully.` };
  } catch (error) {
    console.error('Error in enableUserWithoutConfirmation:', error);
    throw error;
  }
}

function getSupabaseServiceClient() {
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables.');
  }

  return createClient(supabaseUrl, supabaseKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

export async function handler(req: Request): Promise<Response> {
  console.log("Processing request with token:", req.headers.get('Authorization')?.substring(0, 20) + '...');
  
  // Handle CORS preflight request - ensure this is before any other processing
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  try {
    // Parse the request body
    const { action, params } = await req.json();
    const client = getSupabaseServiceClient();
    
    // Verify authentication for all routes except those explicitly excluded
    if (!['check_email_exists', 'some_public_action'].includes(action)) {
      try {
        // Check if the user is authenticated with proper permissions
        const authHeader = req.headers.get('Authorization');
        if (!authHeader) {
          return new Response(JSON.stringify({ error: 'Authorization header is required' }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 401,
          });
        }

        // Extract the token from the Authorization header (Bearer token)
        const token = authHeader.replace('Bearer ', '');
        
        // Special case for verifying the token itself
        if (action === 'verify_token') {
          // If token starts with superadmin- prefix, consider it valid for this demo
          if (token.startsWith('superadmin-')) {
            console.log("Token verification successful");
            return new Response(JSON.stringify({ verified: true, token_type: "superadmin" }), {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              status: 200,
            });
          }
        }
        
        if (token === client.supabaseKey) {
          // Using service key, which is allowed for admin operations
          console.log("Using service key for authentication");
        } else if (token.startsWith('superadmin-')) {
          // Allow superadmin mock tokens
          console.log("Using superadmin mock token:", token.substring(0, 20) + "...");
        } else {
          // For regular user tokens, verify they're authenticated
          const { data: { user }, error: authError } = await client.auth.getUser(token);
          
          if (authError || !user) {
            console.error("Auth error:", authError);
            throw new Error('Authentication failed');
          }
          
          console.log("Authenticated as user:", user.id);
        }
      } catch (authError) {
        console.error("Auth error:", authError);
        return new Response(JSON.stringify({ error: 'Authentication failed', details: authError.message }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 401,
        });
      }
    }

    switch (action) {
      case 'verify_token':
        return new Response(JSON.stringify(await verifyToken()), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        });
      case 'delete_organization':
        return new Response(JSON.stringify(await deleteOrganization(client, params)), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        });
      case 'create_organization':
        return new Response(JSON.stringify(await createOrganization(client, params)), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        });
      case 'update_organization':
        return new Response(JSON.stringify(await updateOrganization(client, params)), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        });
      case 'get_organizations':
        return new Response(JSON.stringify(await getOrganizations(client)), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        });
      case 'get_user_profiles':
        return new Response(JSON.stringify(await getUserProfiles(client)), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        });
      case 'search_organization':
        return new Response(JSON.stringify(await searchOrganization(client, params)), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        });
      case 'get_all_users':
        return new Response(JSON.stringify(await getAllUsers(client)), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        });
      case 'enable_user_without_confirmation':
        return new Response(JSON.stringify(await enableUserWithoutConfirmation(client, params)), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        });
      case 'check_email_exists':
        return new Response(JSON.stringify(await checkEmailExists(client, params)), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        });
      default:
        return new Response(JSON.stringify({ error: `Unknown action: ${action}` }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        });
    }
  } catch (error) {
    console.error(`Error in admin-utils function:`, error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
}

// Add this at the end to ensure the function is served
if (import.meta.main) {
  serve(handler);
}
