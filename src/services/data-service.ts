import { supabase } from '@/integrations/supabase/client';
import { Attendance, Customer, DashboardMetrics, Expense, Invoice, Mechanic, Task, Vehicle } from '@/types';

// Generate unique IDs
export const generateId = (prefix: string = 'id'): string => {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

// Legacy invoice calculation function - kept for backward compatibility
// Note: This function is simplified to avoid circular dependencies with utils/invoice-calculations.ts
export const calculateInvoiceTotal = (invoice: Invoice): { subtotal: number; tax: number; total: number; paidAmount: number; balanceDue: number } => {
  if (!invoice.items || invoice.items.length === 0) {
    return { subtotal: 0, tax: 0, total: 0, paidAmount: 0, balanceDue: 0 };
  }

  // Calculate subtotal
  const subtotal = invoice.items.reduce((sum, item) => sum + (item.quantity * item.price), 0);
  
  // Apply discounts
  let discountAmount = 0;
  if (invoice.discount_type === 'percentage' && invoice.discount_value) {
    discountAmount = subtotal * (invoice.discount_value / 100);
  } else if (invoice.discount_type === 'fixed' && invoice.discount_value) {
    discountAmount = invoice.discount_value;
  }
  
  const afterDiscount = subtotal - discountAmount;
  
  // Calculate tax
  const tax = afterDiscount * ((invoice.tax_rate || 0) / 100);
  const total = afterDiscount + tax;
  
  // Calculate paid amount
  const paidAmount = invoice.payments?.reduce((sum, payment) => sum + payment.amount, 0) || 0;
  const balanceDue = total - paidAmount;

  return { subtotal, tax, total, paidAmount, balanceDue };
};

// Mock function to simulate fetching dashboard metrics
export const calculateDashboardMetrics = async (): Promise<DashboardMetrics> => {
  // Replace this with actual data fetching logic from your database
  const totalRevenue = 150000;
  const pendingInvoices = 25;
  const activeJobs = 12;
  const mechanicEfficiency = 85;
  const completedJobs = 200;
  const monthlyRevenue = 12000;
  const monthlyExpenses = 5000;
  const monthlyProfit = monthlyRevenue - monthlyExpenses;
  const activeCustomers = 50;
  const averageJobValue = 500;
  const inventoryValue = 25000;
  const pendingTasks = 8;
  const activeVehicles = 60;
  const lowStockItems = 15;

  return {
    totalRevenue,
    totalInvoices: 100,
    completedTasks: completedJobs,
    activeCustomers,
    pendingInvoices,
    activeJobs,
    mechanicEfficiency,
    completedJobs,
    monthlyRevenue,
    monthlyExpenses,
    monthlyProfit,
    averageJobValue,
    inventoryValue,
    pendingTasks,
    activeVehicles,
    lowStockItems
  };
};

// Mock function to simulate checking permissions
export const hasPermission = (user: any, resource: string, permission: string): boolean => {
  // Replace this with actual permission checking logic
  if (user?.role === 'owner') return true; // Owner has all permissions

  // Example: Only managers can manage tasks
  if (resource === 'tasks' && permission === 'manage' && user?.role === 'manager') {
    return true;
  }

  return false;
};

// Export all the missing functions that are being imported
export const fetchAttendance = async (): Promise<Attendance[]> => {
  const { data, error } = await supabase
    .from('attendance')
    .select('*');
  
  if (error) throw error;
  return data || [];
};
