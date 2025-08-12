import React, { useEffect, useState } from 'react';
import { useOrganizationFilter } from '@/hooks/useOrganizationFilter';
import { useOrganizationAwareQuery } from '@/hooks/useOrganizationAwareQuery';
import { useAuthContext } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export const OrganizationDebug: React.FC = () => {
  const { currentUser, organization } = useAuthContext();
  const { organizationId, isSuperAdmin, canAccessAllOrganizations } = useOrganizationFilter();
  const { applyOrganizationFilter } = useOrganizationAwareQuery();
  const [partsCount, setPartsCount] = useState<{ total: number; filtered: number }>({ total: 0, filtered: 0 });

  useEffect(() => {
    const testOrganizationFiltering = async () => {
      try {
        // Test total parts count
        const { data: allParts, error: allError } = await supabase
          .from('parts')
          .select('*', { count: 'exact', head: true });

        // Test filtered parts count
        const filteredQuery = supabase.from('parts').select('*', { count: 'exact', head: true });
        const { data: filteredParts, error: filteredError, count: filteredCount } = await applyOrganizationFilter(filteredQuery);

        if (!allError && !filteredError) {
          setPartsCount({
            total: allParts?.length || 0,
            filtered: filteredCount || 0
          });
        }
      } catch (error) {
        console.error('Error testing organization filtering:', error);
      }
    };

    if (currentUser) {
      testOrganizationFiltering();
    }
  }, [currentUser, applyOrganizationFilter]);

  if (!currentUser) {
    return (
      <Card className="m-4">
        <CardHeader>
          <CardTitle>Organization Debug - Not Authenticated</CardTitle>
        </CardHeader>
        <CardContent>
          <p>User is not authenticated. Please log in to test organization filtering.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="m-4">
      <CardHeader>
        <CardTitle>Organization Context Debug</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h3 className="font-semibold">User Information:</h3>
          <p>ID: {currentUser.id}</p>
          <p>Name: {currentUser.name}</p>
          <p>Role: {currentUser.role}</p>
          <p>Organization ID: {currentUser.organization_id}</p>
        </div>

        <div>
          <h3 className="font-semibold">Organization Context:</h3>
          <p>Filter Organization ID: {organizationId || 'null'}</p>
          <p>Is Super Admin: {isSuperAdmin ? 'Yes' : 'No'}</p>
          <p>Can Access All Organizations: {canAccessAllOrganizations ? 'Yes' : 'No'}</p>
          <p>Organization Name: {organization?.name || 'Not loaded'}</p>
        </div>

        <div>
          <h3 className="font-semibold">Filtering Test Results:</h3>
          <p>Total Parts in Database: {partsCount.total}</p>
          <p>Filtered Parts for User: {partsCount.filtered}</p>
          <p>Filter Working: {partsCount.filtered > 0 && partsCount.filtered <= partsCount.total ? '✅ Yes' : '❌ No'}</p>
        </div>
      </CardContent>
    </Card>
  );
};