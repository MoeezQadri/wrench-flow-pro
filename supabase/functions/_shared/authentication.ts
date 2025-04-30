import { getSupabaseAdmin } from './auth.ts';

export async function authenticateSuperadmin(userid: string) {
  const supabaseAdmin = await getSupabaseAdmin();

  console.log('Authenticating superadmin with id:', id);

  try {
    const { data, error } = await supabaseAdmin.rpc(
      'superadmin_login_new',
      { userid }
    );

    if (error) {
      console.error('Authentication error:', error);
      return {
        authenticated: false,
        message: error.message || 'Invalid superadmin ID',
      };
    }

    if (!data || data.authenticated === false) {
      console.error('Login failed:', data?.message || 'Unknown error');
      return {
        authenticated: false,
        message: data?.message || 'Invalid superadmin ID',
      };
    }

    return data;
  } catch (err) {
    console.error('Login function error:', err);
    return {
      authenticated: false,
      message: 'Error during authentication process',
    };
  }
}
