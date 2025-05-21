import { User, RolePermissionMap } from '@/types';
import { supabase } from '@/integrations/supabase/client';

// Function to fetch expenses
export const getExpenses = async () => {
  const { data, error } = await supabase
    .from('expenses')
    .select('*');

  if (error) {
    throw new Error(error.message);
  }

  return data;
};

// Function to fetch revenue data
export const getRevenueData = async () => {
  const { data, error } = await supabase
    .from('revenue')
    .select('*');

  if (error) {
    throw new Error(error.message);
  }

  return data;
};

// Function to calculate dashboard metrics
export const calculateDashboardMetrics = async (): Promise<DashboardMetrics> => {
  const { data, error } = await supabase
    .from('dashboard_metrics')
    .select('*')
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return {
    totalRevenue: data.total_revenue,
    pendingInvoices: data.pending_invoices,
    completedJobs: data.completed_jobs,
    activeJobs: data.active_jobs,
    mechanicEfficiency: data.mechanic_efficiency,
    monthlyRevenue: data.monthly_revenue,
    monthlyExpenses: data.monthly_expenses,
    monthlyProfit: data.monthly_profit,
    activeCustomers: data.active_customers,
    vehicleCount: data.vehicle_count,
    averageJobValue: data.average_job_value,
    inventoryValue: data.inventory_value,
    pendingTasks: data.pending_tasks,
    activeVehicles: data.active_vehicles,
    lowStockItems: data.low_stock_items,
  };
};

// Role permissions mapping
export const rolePermissions: Record<UserRole, RolePermissionMap> = {
  superuser: {
    dashboard: true,
    customers: { view: true, manage: true },
    invoices: { view: true, manage: true },
    mechanics: { view: true, manage: true },
    tasks: { view: true, manage: true },
    parts: { view: true, manage: true },
    finance: { view: true, manage: true },
    expenses: { view: true, manage: true },
    reports: { view: true, manage: true },
    attendance: { view: true, manage: true, approve: true },
    settings: { view: true, manage: true },
    organization: { view: true, manage: true },
    users: { view: true, manage: true },
    subscription: { view: true, manage: true },
    vehicles: { view: true, manage: true },
    roles: { view: true, manage: true }
  },
  owner: {
    dashboard: true,
    customers: { view: true, manage: true },
    invoices: { view: true, manage: true },
    mechanics: { view: true, manage: true },
    tasks: { view: true, manage: true },
    parts: { view: true, manage: true },
    finance: { view: true, manage: true },
    expenses: { view: true, manage: true },
    reports: { view: true, manage: true },
    attendance: { view: true, manage: true, approve: true },
    settings: { view: true, manage: true },
    organization: { view: true, manage: true },
    users: { view: true, manage: true },
    subscription: { view: true, manage: true },
    vehicles: { view: true, manage: true },
    roles: { view: true, manage: true }
  },
  manager: {
    dashboard: true,
    customers: { view: true, manage: true },
    invoices: { view: true, manage: true },
    mechanics: { view: true, manage: true },
    tasks: { view: true, manage: true },
    parts: { view: true, manage: true },
    finance: { view: true, manage: true },
    expenses: { view: true, manage: true },
    reports: { view: true, manage: true },
    attendance: { view: true, manage: true, approve: true },
    settings: { view: false, manage: false },
    organization: { view: true, manage: false },
    users: { view: true, manage: false },
    subscription: { view: true, manage: false },
    vehicles: { view: true, manage: true },
    roles: { view: true, manage: false }
  },
  foreman: {
    dashboard: true,
    customers: { view: true, manage: false },
    invoices: { view: true, manage: false },
    mechanics: { view: true, manage: false },
    tasks: { view: true, manage: true, assign: true, create: true, update: true },
    parts: { view: true, manage: false },
    finance: { view: false, manage: false },
    expenses: { view: false, manage: false },
    reports: { view: true, manage: false },
    attendance: { view: true, manage: true, approve: true, create: true, update: true },
    settings: { view: false, manage: false },
    organization: { view: false, manage: false },
    users: { view: false, manage: false },
    subscription: { view: false, manage: false },
    vehicles: { view: true, manage: false },
    roles: { view: false, manage: false }
  },
  mechanic: {
    dashboard: false,
    customers: { view: true, manage: false },
    invoices: { view: false, manage: false },
    mechanics: { view: false, manage: false },
    tasks: { view: true, manage: 'own' },
    parts: { view: true, manage: false },
    finance: { view: false, manage: false },
    expenses: { view: false, manage: false },
    reports: { view: 'own', manage: false },
    attendance: { view: 'own', manage: 'own', approve: false },
    settings: { view: false, manage: false },
    organization: { view: false, manage: false },
    users: { view: false, manage: false },
    subscription: { view: false, manage: false },
    vehicles: { view: true, manage: false },
    roles: { view: false, manage: false }
  }
};
