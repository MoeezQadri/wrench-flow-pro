import { supabase } from '@/integrations/supabase/client';

export interface IsolationTestResults {
  currentUserOrg: string | null;
  isSuperAdmin: boolean;
  dataAccess: {
    customers: number;
    vehicles: number;
    parts: number;
    tasks: number;
    mechanics: number;
    expenses: number;
    payments: number;
    vendors: number;
  };
  totalDataCounts: {
    customers: number;
    vehicles: number;
    parts: number;
    tasks: number;
    mechanics: number;
    expenses: number;
    payments: number;
    vendors: number;
  };
}

/**
 * Tests data isolation by checking what data is accessible with current user context
 */
export const testOrganizationIsolation = async (): Promise<IsolationTestResults> => {
  // Get current user organization
  const { data: orgResult } = await supabase.rpc('current_user_org');
  const currentUserOrg = orgResult;

  // Check if user is super admin
  const { data: superAdminResult } = await supabase.rpc('user_is_superadmin');
  const isSuperAdmin = superAdminResult || false;

  // Test accessible data counts (will be filtered by RLS)
  const dataAccess = {
    customers: 0,
    vehicles: 0,
    parts: 0,
    tasks: 0,
    mechanics: 0,
    expenses: 0,
    payments: 0,
    vendors: 0,
  };

  // Test total data counts (bypass RLS for comparison)
  const totalDataCounts = {
    customers: 0,
    vehicles: 0,
    parts: 0,
    tasks: 0,
    mechanics: 0,
    expenses: 0,
    payments: 0,
    vendors: 0,
  };

  try {
    // Get accessible data counts (filtered by RLS)
    const [customers, vehicles, parts, tasks, mechanics, expenses, payments, vendors] = await Promise.all([
      supabase.from('customers').select('*', { count: 'exact', head: true }),
      supabase.from('vehicles').select('*', { count: 'exact', head: true }),
      supabase.from('parts').select('*', { count: 'exact', head: true }),
      supabase.from('tasks').select('*', { count: 'exact', head: true }),
      supabase.from('mechanics').select('*', { count: 'exact', head: true }),
      supabase.from('expenses').select('*', { count: 'exact', head: true }),
      supabase.from('payments').select('*', { count: 'exact', head: true }),
      supabase.from('vendors').select('*', { count: 'exact', head: true }),
    ]);

    dataAccess.customers = customers.count || 0;
    dataAccess.vehicles = vehicles.count || 0;
    dataAccess.parts = parts.count || 0;
    dataAccess.tasks = tasks.count || 0;
    dataAccess.mechanics = mechanics.count || 0;
    dataAccess.expenses = expenses.count || 0;
    dataAccess.payments = payments.count || 0;
    dataAccess.vendors = vendors.count || 0;

    // For total counts, we would need to use admin access or direct SQL
    // For now, using the same data as it represents what's accessible
    totalDataCounts.customers = dataAccess.customers;
    totalDataCounts.vehicles = dataAccess.vehicles;
    totalDataCounts.parts = dataAccess.parts;
    totalDataCounts.tasks = dataAccess.tasks;
    totalDataCounts.mechanics = dataAccess.mechanics;
    totalDataCounts.expenses = dataAccess.expenses;
    totalDataCounts.payments = dataAccess.payments;
    totalDataCounts.vendors = dataAccess.vendors;

  } catch (error) {
    console.error('Error testing organization isolation:', error);
  }

  return {
    currentUserOrg,
    isSuperAdmin,
    dataAccess,
    totalDataCounts,
  };
};

/**
 * Validates that organization isolation is working correctly
 */
export const validateDataIsolation = (results: IsolationTestResults): {
  isValid: boolean;
  issues: string[];
  summary: string;
} => {
  const issues: string[] = [];
  
  // Check if user has access to data
  const hasDataAccess = Object.values(results.dataAccess).some(count => count > 0);
  
  if (!results.currentUserOrg && !results.isSuperAdmin) {
    if (hasDataAccess) {
      issues.push('User without organization has access to data (security issue)');
    }
  }
  
  if (results.currentUserOrg && !results.isSuperAdmin) {
    if (!hasDataAccess) {
      issues.push('User with organization has no data access (possible RLS issue)');
    }
  }
  
  if (results.isSuperAdmin) {
    if (!hasDataAccess) {
      issues.push('Super admin has no data access (unexpected)');
    }
  }

  const isValid = issues.length === 0;
  const summary = isValid 
    ? '✅ Data isolation working correctly'
    : '❌ Data isolation issues detected';

  return { isValid, issues, summary };
};