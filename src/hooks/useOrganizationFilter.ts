import { useAuthContext } from '@/context/AuthContext';
import { useMemo } from 'react';

export const useOrganizationFilter = () => {
  const { currentUser, organization } = useAuthContext();

  const organizationId = useMemo(() => {
    return currentUser?.organization_id || null;
  }, [currentUser?.organization_id]);

  const isOwner = useMemo(() => {
    return currentUser?.role === 'owner';
  }, [currentUser?.role]);

  const isSuperAdmin = useMemo(() => {
    return currentUser?.role === 'superuser' || currentUser?.role === 'superadmin';
  }, [currentUser?.role]);

  const canAccessAllOrganizations = useMemo(() => {
    return isSuperAdmin;
  }, [isSuperAdmin]);

  // Filter function for arrays of data that have organization_id
  const filterByOrganization = useMemo(() => {
    return <T extends { organization_id?: string | null }>(items: T[]): T[] => {
      if (canAccessAllOrganizations) {
        return items; // Super admins see all data
      }
      
      if (!organizationId) {
        return []; // Users without organization see nothing
      }
      
      return items.filter(item => item.organization_id === organizationId);
    };
  }, [organizationId, canAccessAllOrganizations]);

  // Get Supabase query filter for organization
  const getOrganizationQuery = useMemo(() => {
    return () => {
      if (canAccessAllOrganizations) {
        return null; // No filter for super admins
      }
      
      if (!organizationId) {
        return { organization_id: 'no-match' }; // Return impossible match
      }
      
      return { organization_id: organizationId };
    };
  }, [organizationId, canAccessAllOrganizations]);

  return {
    organizationId,
    organization,
    isOwner,
    isSuperAdmin,
    canAccessAllOrganizations,
    filterByOrganization,
    getOrganizationQuery,
  };
};