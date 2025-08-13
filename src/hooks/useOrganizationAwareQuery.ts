import { useOrganizationFilter } from '@/hooks/useOrganizationFilter';
import { supabase } from '@/integrations/supabase/client';

export const useOrganizationAwareQuery = () => {
  const { getOrganizationQuery } = useOrganizationFilter();

  const applyOrganizationFilter = (query: any) => {
    const orgFilter = getOrganizationQuery();
    
    console.log("Applying organization filter:", orgFilter);
    
    if (orgFilter) {
      return query.eq('organization_id', orgFilter.organization_id);
    }
    
    // No filter for super admins viewing all organizations
    return query;
  };

  return { applyOrganizationFilter };
};