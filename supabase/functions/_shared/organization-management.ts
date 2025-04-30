
import { getSupabaseAdmin } from './auth.ts';

export async function deleteOrganization(orgId: string) {
  const supabaseAdmin = await getSupabaseAdmin();
  
  // First delete all users associated with the organization
  const { data: profilesData, error: profilesError } = await supabaseAdmin
    .from('profiles')
    .select('id')
    .eq('organization_id', orgId);
    
  if (profilesError) {
    console.error('Error fetching profiles:', profilesError);
    throw profilesError;
  }
  
  // Mark all profiles as inactive
  if (profilesData && profilesData.length > 0) {
    const { error: updateError } = await supabaseAdmin
      .from('profiles')
      .update({ is_active: false })
      .eq('organization_id', orgId);
      
    if (updateError) {
      console.error('Error deactivating profiles:', updateError);
      throw updateError;
    }
  }
  
  // Then delete the organization
  const { error: deleteError } = await supabaseAdmin
    .from('organizations')
    .delete()
    .eq('id', orgId);
    
  if (deleteError) {
    console.error('Error deleting organization:', deleteError);
    throw deleteError;
  }
  
  return true;
}

export async function updateOrganization(params: {
  org_id: string;
  org_name: string;
  sub_level: string;
  sub_status?: string;
}) {
  const supabaseAdmin = await getSupabaseAdmin();
  
  const updateData: any = {
    name: params.org_name,
    subscription_level: params.sub_level,
    updated_at: new Date().toISOString()
  };
  
  if (params.sub_status) {
    updateData.subscription_status = params.sub_status;
  }
  
  const { data, error } = await supabaseAdmin
    .from('organizations')
    .update(updateData)
    .eq('id', params.org_id)
    .select()
    .single();
    
  if (error) {
    console.error('Error updating organization:', error);
    throw error;
  }
  
  return data;
}

export async function createOrganization(params: {
  org_name: string;
  sub_level: string;
  owner_email: string;
  owner_name: string;
}) {
  const supabaseAdmin = await getSupabaseAdmin();
  
  // Generate organization ID
  const orgId = crypto.randomUUID();
  
  // Create the organization
  const { data: orgData, error: orgError } = await supabaseAdmin
    .from('organizations')
    .insert({
      id: orgId,
      name: params.org_name,
      subscription_level: params.sub_level,
      subscription_status: 'active'
    })
    .select()
    .single();
    
  if (orgError) {
    console.error('Error creating organization:', orgError);
    throw orgError;
  }
  
  // Generate a random password
  const tempPassword = Array.from(crypto.getRandomValues(new Uint8Array(8)))
    .map(b => b.toString(16).padStart(2, '0')).join('');
  
  // Create a user for the owner
  const { data: userData, error: userError } = await supabaseAdmin.auth.admin.createUser({
    email: params.owner_email,
    password: tempPassword,
    email_confirm: true,
    user_metadata: {
      name: params.owner_name,
      organization_id: orgId,
      role: 'owner'
    }
  });
    
  if (userError) {
    // Delete the organization if user creation fails
    await supabaseAdmin
      .from('organizations')
      .delete()
      .eq('id', orgId);
      
    console.error('Error creating owner user:', userError);
    throw userError;
  }
  
  return {
    organization: orgData,
    owner: {
      email: params.owner_email,
      temp_password: tempPassword 
    }
  };
}

export async function searchOrganizationById(orgId: string) {
  const supabaseAdmin = await getSupabaseAdmin();
  
  // Find the organization
  const { data: organization, error: orgError } = await supabaseAdmin
    .from('organizations')
    .select('*')
    .eq('id', orgId)
    .single();
    
  if (orgError) {
    if (orgError.code === 'PGRST116') {
      // Organization not found
      return { organization: null, users: [] };
    }
    
    console.error('Error searching for organization:', orgError);
    throw orgError;
  }
  
  // Find users associated with this organization
  const { data: users, error: usersError } = await supabaseAdmin
    .from('profiles')
    .select('*')
    .eq('organization_id', orgId);
    
  if (usersError) {
    console.error('Error fetching users for organization:', usersError);
    return { organization, users: [] };
  }
  
  return { organization, users };
}
