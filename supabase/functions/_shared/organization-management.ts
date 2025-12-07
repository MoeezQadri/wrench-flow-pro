import { getSupabaseAdmin } from './auth.ts';
export async function deleteOrganization(orgId) {
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
      .update({
        is_active: false,
      })
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
export async function updateOrganization(params) {
  const supabaseAdmin = await getSupabaseAdmin();
  const updateData = {
    name: params.org_name,
    subscription_level: params.sub_level,
    updated_at: new Date().toISOString(),
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
export async function createOrganization(params) {
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
      subscription_status: 'active',
    })
    .select()
    .single();
  if (orgError) {
    console.error('Error creating organization:', orgError);
    throw orgError;
  }
  // Generate a random password
  const tempPassword = Array.from(crypto.getRandomValues(new Uint8Array(8)))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
  // Create a user for the owner
  const { data: userData, error: userError } =
    await supabaseAdmin.auth.admin.createUser({
      email: params.owner_email,
      password: tempPassword,
      email_confirm: true,
      user_metadata: {
        name: params.owner_name,
        organization_id: orgId,
        role: 'owner',
      },
    });
  if (userError) {
    // Delete the organization if user creation fails
    await supabaseAdmin.from('organizations').delete().eq('id', orgId);
    console.error('Error creating owner user:', userError);
    throw userError;
  }
  return {
    organization: orgData,
    owner: {
      email: params.owner_email,
      temp_password: tempPassword,
    },
  };
}
export async function searchOrganizationById(orgId) {
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
      return {
        organization: null,
        users: [],
      };
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
    return {
      organization,
      users: [],
    };
  }
  return {
    organization,
    users,
  };
}

export async function suspendSubscriber({
  user_ids,
  subscription_current_period_end,
}) {
  if (!user_ids?.length) return []; // No users to update

  const supabaseAdmin = await getSupabaseAdmin();

  const updateData: Record<string, any> = {
    suspended: true,
    updated_at: new Date().toISOString(),
  };

  if (subscription_current_period_end) {
    updateData.subscription_end = new Date(
      subscription_current_period_end
    ).toISOString();
  }

  const { data, error } = await supabaseAdmin
    .from('subscribers')
    .update(updateData)
    .in('user_id', user_ids)
    .select();

  if (error) {
    console.error('Error updating subscribers:', error);
    throw error;
  }
  console.log('Subscribers updated: \n', JSON.stringify(data));
  return data;
}

export async function getSubscriber(userId) {
  try {
    const supabaseAdmin = await getSupabaseAdmin();
    const { data, error } = await supabaseAdmin
      .from('subscribers')
      .select('*')
      .eq('user_id', userId)
      .single();
    return data;
  } catch (error) {
    console.error('Error fetching subscriber:', error);
    throw error;
  }
}
export async function getSubscribers(stripe_customer_ids: string[]) {
  try {
    console.log('[getSubscribers]: \n', stripe_customer_ids);
    const supabaseAdmin = await getSupabaseAdmin();
    const { data, error } = await supabaseAdmin
      .from('subscribers')
      .select('*')
      .in('stripe_customer_id', stripe_customer_ids);
    console.log('[getSubscribers] fetched: \n', JSON.stringify(data));

    return data;
  } catch (error) {
    console.error('Error fetching subscriber:', error);
    throw error;
  }
}
