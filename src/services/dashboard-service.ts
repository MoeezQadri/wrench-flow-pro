import { supabase } from "@/integrations/supabase/client";
import { isWithinInterval, parseISO, format, eachDayOfInterval } from "date-fns";
import { calculateInvoiceBreakdown } from "@/utils/invoice-calculations";
import { isNonBillable } from "@/utils/invoice-status";

export interface DashboardData {
  totalRevenue: number;
  revenueChange: number;
  totalInvoices: number;
  invoicesChange: number;
  activeTasks: number;
  tasksChange: number;
  newCustomers: number;
  customersChange: number;
  completedJobs: number;
  jobsChange: number;
  averageJobValue: number;
  jobValueChange: number;
}

export interface ChartData {
  date: string;
  revenue: number;
  expenses: number;
  invoices: number;
}

export async function fetchDashboardData(startDate: Date, endDate: Date): Promise<DashboardData> {
  try {
    const startIso = startDate.toISOString();
    const endIso = endDate.toISOString();

    // Calculate previous period dates (same duration before current period)
    const duration = endDate.getTime() - startDate.getTime();
    const previousEndDate = new Date(startDate.getTime());
    const previousStartDate = new Date(startDate.getTime() - duration);
    const previousStartIso = previousStartDate.toISOString();
    const previousEndIso = previousEndDate.toISOString();

    // Fetch current period data
    const { data: invoices, error: invoicesError } = await supabase
      .from('invoices')
      .select(`
        *,
        invoice_items(*),
        payments(*)
      `)
      .gte('date', startIso)
      .lte('date', endIso);

    if (invoicesError) throw invoicesError;

    const { data: tasks, error: tasksError } = await supabase
      .from('tasks')
      .select('*')
      .gte('created_at', startIso)
      .lte('created_at', endIso);

    if (tasksError) throw tasksError;

    const { data: customers, error: customersError } = await supabase
      .from('customers')
      .select('*')
      .gte('created_at', startIso)
      .lte('created_at', endIso);

    if (customersError) throw customersError;

    // Fetch previous period data for comparison
    const { data: previousInvoices } = await supabase
      .from('invoices')
      .select(`
        *,
        invoice_items(*),
        payments(*)
      `)
      .gte('date', previousStartIso)
      .lte('date', previousEndIso);

    const { data: previousTasks } = await supabase
      .from('tasks')
      .select('*')
      .gte('created_at', previousStartIso)
      .lte('created_at', previousEndIso);

    const { data: previousCustomers } = await supabase
      .from('customers')
      .select('*')
      .gte('created_at', previousStartIso)
      .lte('created_at', previousEndIso);

    // Calculate current period metrics
    const billableInvoices = invoices?.filter(invoice => !isNonBillable(invoice.status)) || [];
    const totalRevenue = billableInvoices.reduce((sum, invoice) => {
      const invoiceWithItems = {
        ...invoice,
        items: invoice.invoice_items,
        id: invoice.id || '',
        customer_id: invoice.customer_id || '',
        vehicle_id: invoice.vehicle_id || '',
        status: invoice.status as any
      } as any;
      const invoiceBreakdown = calculateInvoiceBreakdown(invoiceWithItems);
      return sum + invoiceBreakdown.total;
    }, 0) || 0;

    const totalInvoices = billableInvoices.length;
    const activeTasks = tasks?.filter(task => task.status === 'in-progress').length || 0;
    const newCustomers = customers?.length || 0;
    const completedJobs = tasks?.filter(task => task.status === 'completed').length || 0;
    const averageJobValue = totalInvoices > 0 ? totalRevenue / totalInvoices : 0;

    // Calculate previous period metrics
    const previousBillableInvoices = previousInvoices?.filter(invoice => !isNonBillable(invoice.status)) || [];
    const previousRevenue = previousBillableInvoices.reduce((sum, invoice) => {
      const invoiceWithItems = {
        ...invoice,
        items: invoice.invoice_items,
        id: invoice.id || '',
        customer_id: invoice.customer_id || '',
        vehicle_id: invoice.vehicle_id || '',
        status: invoice.status as any
      } as any;
      const invoiceBreakdown = calculateInvoiceBreakdown(invoiceWithItems);
      return sum + invoiceBreakdown.total;
    }, 0) || 0;

    const previousInvoicesCount = previousBillableInvoices.length;
    const previousActiveTasks = previousTasks?.filter(task => task.status === 'in-progress').length || 0;
    const previousNewCustomers = previousCustomers?.length || 0;
    const previousCompletedJobs = previousTasks?.filter(task => task.status === 'completed').length || 0;
    const previousAverageJobValue = previousInvoicesCount > 0 ? previousRevenue / previousInvoicesCount : 0;

    // Calculate percentage changes (handle division by zero and round to nearest integer)
    const calculateChange = (current: number, previous: number): number => {
      if (previous === 0) return current > 0 ? 100 : 0;
      const change = ((current - previous) / previous) * 100;
      return Math.round(change);
    };

    return {
      totalRevenue,
      revenueChange: calculateChange(totalRevenue, previousRevenue),
      totalInvoices,
      invoicesChange: calculateChange(totalInvoices, previousInvoicesCount),
      activeTasks,
      tasksChange: calculateChange(activeTasks, previousActiveTasks),
      newCustomers,
      customersChange: calculateChange(newCustomers, previousNewCustomers),
      completedJobs,
      jobsChange: calculateChange(completedJobs, previousCompletedJobs),
      averageJobValue,
      jobValueChange: calculateChange(averageJobValue, previousAverageJobValue)
    };
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    throw error;
  }
}

export async function fetchChartData(startDate: Date, endDate: Date): Promise<ChartData[]> {
  try {
    const startIso = startDate.toISOString();
    const endIso = endDate.toISOString();

    // Fetch invoices with items
    const { data: invoices, error: invoicesError } = await supabase
      .from('invoices')
      .select(`
        date,
        status,
        tax_rate,
        discount_type,
        discount_value,
        invoice_items(quantity, price),
        payments(amount)
      `)
      .gte('date', startIso)
      .lte('date', endIso);

    if (invoicesError) throw invoicesError;

    // Fetch expenses
    const { data: expenses, error: expensesError } = await supabase
      .from('expenses')
      .select('date, amount')
      .gte('date', startIso)
      .lte('date', endIso);

    if (expensesError) throw expensesError;

    // Generate all days in the range
    const days = eachDayOfInterval({ start: startDate, end: endDate });
    
    // Aggregate data by day
    const chartData: ChartData[] = days.map(day => {
      const dayStr = format(day, 'yyyy-MM-dd');
      
      // Calculate revenue for this day
      const dayRevenue = invoices
        ?.filter(invoice => !isNonBillable(invoice.status) && format(new Date(invoice.date || ''), 'yyyy-MM-dd') === dayStr)
        .reduce((sum, invoice) => {
          const invoiceWithItems = {
            ...invoice,
            items: invoice.invoice_items,
            id: '',
            customer_id: '',
            vehicle_id: '',
            status: invoice.status as any
          } as any;
          const invoiceBreakdown = calculateInvoiceBreakdown(invoiceWithItems);
          return sum + invoiceBreakdown.total;
        }, 0) || 0;

      // Calculate expenses for this day
      const dayExpenses = expenses
        ?.filter(expense => format(new Date(expense.date || ''), 'yyyy-MM-dd') === dayStr)
        .reduce((sum, expense) => sum + Number(expense.amount), 0) || 0;

      // Count invoices for this day
      const dayInvoices = invoices
        ?.filter(invoice => !isNonBillable(invoice.status) && format(new Date(invoice.date || ''), 'yyyy-MM-dd') === dayStr)
        .length || 0;

      return {
        date: day.toISOString(),
        revenue: dayRevenue,
        expenses: dayExpenses,
        invoices: dayInvoices
      };
    });

    return chartData;
  } catch (error) {
    console.error('Error fetching chart data:', error);
    throw error;
  }
}