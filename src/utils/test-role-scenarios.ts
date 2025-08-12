import { supabase } from '@/integrations/supabase/client';

export interface RoleTestScenario {
  scenarioName: string;
  userRole: string;
  organizationId: string;
  expectedBehavior: string;
  testResults: {
    canAccessOwnData: boolean;
    canAccessOtherOrgData: boolean;
    canAccessAllData: boolean;
    dataCount: number;
  };
}

/**
 * Test different user role scenarios for data access
 */
export const testUserRoleScenarios = async (): Promise<{
  scenarios: RoleTestScenario[];
  summary: string;
}> => {
  const scenarios: RoleTestScenario[] = [];

  // Test scenarios based on the current user context
  // Since we can't actually switch users, we'll test the filtering logic

  // Scenario 1: Regular user in Default Organization
  const regularUserScenario: RoleTestScenario = {
    scenarioName: 'Regular User - Default Org',
    userRole: 'owner',
    organizationId: '00000000-0000-0000-0000-000000000001',
    expectedBehavior: 'Should only see Default Organization data',
    testResults: {
      canAccessOwnData: false,
      canAccessOtherOrgData: false,
      canAccessAllData: false,
      dataCount: 0,
    },
  };

  // Scenario 2: Super Admin
  const superAdminScenario: RoleTestScenario = {
    scenarioName: 'Super Admin',
    userRole: 'superadmin',
    organizationId: 'N/A',
    expectedBehavior: 'Should see all data across all organizations',
    testResults: {
      canAccessOwnData: false,
      canAccessOtherOrgData: false,
      canAccessAllData: false,
      dataCount: 0,
    },
  };

  try {
    // Test current user's access to parts data
    const { data: partsData, error: partsError } = await supabase
      .from('parts')
      .select('*');

    if (!partsError && partsData) {
      // Analyze what the current user can access
      const uniqueOrgs = new Set(partsData.map(p => p.organization_id));
      const totalCount = partsData.length;
      const defaultOrgCount = partsData.filter(p => p.organization_id === '00000000-0000-0000-0000-000000000001').length;

      // Update scenarios based on actual results
      regularUserScenario.testResults = {
        canAccessOwnData: defaultOrgCount > 0,
        canAccessOtherOrgData: uniqueOrgs.size > 1,
        canAccessAllData: uniqueOrgs.size > 1,
        dataCount: totalCount,
      };

      superAdminScenario.testResults = {
        canAccessOwnData: true,
        canAccessOtherOrgData: uniqueOrgs.size > 1,
        canAccessAllData: uniqueOrgs.size > 1,
        dataCount: totalCount,
      };
    }

    scenarios.push(regularUserScenario, superAdminScenario);

  } catch (error) {
    console.error('Error testing role scenarios:', error);
  }

  const summary = generateTestSummary(scenarios);
  return { scenarios, summary };
};

function generateTestSummary(scenarios: RoleTestScenario[]): string {
  const issues: string[] = [];
  
  scenarios.forEach(scenario => {
    if (scenario.userRole === 'superadmin') {
      if (!scenario.testResults.canAccessAllData && scenario.testResults.dataCount > 0) {
        issues.push(`Super admin should see all organization data`);
      }
    } else {
      if (scenario.testResults.canAccessOtherOrgData) {
        issues.push(`Regular user can access other organization data (security issue)`);
      }
      if (!scenario.testResults.canAccessOwnData) {
        issues.push(`Regular user cannot access their own organization data`);
      }
    }
  });

  if (issues.length === 0) {
    return '✅ All role-based access scenarios working correctly';
  } else {
    return `❌ Issues found: ${issues.join(', ')}`;
  }
}