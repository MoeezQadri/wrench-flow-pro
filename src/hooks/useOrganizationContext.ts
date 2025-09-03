import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/context/AuthContext';

export const useOrganizationContext = () => {
  const { currentUser } = useAuthContext();
  const [selectedOrganizationId, setSelectedOrganizationId] = useState<string>('');
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const isSuperAdmin = currentUser?.role === 'superuser' || currentUser?.role === 'superadmin';

  useEffect(() => {
    if (isSuperAdmin) {
      loadOrganizations();
    } else {
      // For regular users, set their own organization
      setSelectedOrganizationId(currentUser?.organization_id || '');
    }
  }, [currentUser, isSuperAdmin]);

  const loadOrganizations = async () => {
    if (!isSuperAdmin) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('organizations')
        .select('id, name, subscription_level, subscription_status')
        .order('name');

      if (!error) {
        setOrganizations(data || []);
      }
    } catch (error) {
      console.error('Error loading organizations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOrganizationChange = (orgId: string) => {
    setSelectedOrganizationId(orgId);
  };

  return {
    selectedOrganizationId,
    organizations,
    loading,
    isSuperAdmin,
    handleOrganizationChange,
  };
};