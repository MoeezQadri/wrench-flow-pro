import { supabase } from "@/integrations/supabase/client";
import { isWithinInterval, parseISO, format, eachDayOfInterval } from "date-fns";
import { calculateInvoiceBreakdown } from "@/utils/invoice-calculations";

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

    // Fetch invoices for the period
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

    // Fetch tasks for the period
    const { data: tasks, error: tasksError } = await supabase
      .from('tasks')
      .select('*')
      .gte('created_at', startIso)
      .lte('created_at', endIso);

    if (tasksError) throw tasksError;

    // Fetch customers for the period
    const { data: customers, error: customersError } = await supabase
      .from('customers')
      .select('*')
      .gte('created_at', startIso)
      .lte('created_at', endIso);

    if (customersError) throw customersError;

    // Calculate metrics
    const totalRevenue = invoices?.reduce((sum, invoice) => {
      // Map invoice_items to items to match expected interface and add required fields
      const invoiceWithItems = { 
        ...invoice, 
        items: invoice.invoice_items,
        // Ensure all required Invoice fields are present
        id: invoice.id || '',
        customer_id: invoice.customer_id || '',
        vehicle_id: invoice.vehicle_id || '',
        status: invoice.status as any
      } as any;
      const invoiceBreakdown = calculateInvoiceBreakdown(invoiceWithItems);
      return sum + invoiceBreakdown.total;
    }, 0) || 0;

    const totalInvoices = invoices?.length || 0;
    const activeTasks = tasks?.filter(task => task.status === 'in-progress').length || 0;
    const newCustomers = customers?.length || 0;
    const completedJobs = tasks?.filter(task => task.status === 'completed').length || 0;
    const averageJobValue = totalInvoices > 0 ? totalRevenue / totalInvoices : 0;

    // For now, we'll use mock change percentages since we'd need previous period data
    // In a real implementation, you'd fetch data for the previous period and compare
    return {
      totalRevenue,
      revenueChange: 12.5,
      totalInvoices,
      invoicesChange: 8.3,
      activeTasks,
      tasksChange: -2.1,
      newCustomers,
      customersChange: 15.7,
      completedJobs,
      jobsChange: 5.2,
      averageJobValue,
      jobValueChange: 3.8
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
        ?.filter(invoice => format(new Date(invoice.date || ''), 'yyyy-MM-dd') === dayStr)
        .reduce((sum, invoice) => {
          // Map invoice_items to items to match expected interface and add required fields
          const invoiceWithItems = { 
            ...invoice, 
            items: invoice.invoice_items,
            // Add minimal required fields for calculation
            id: '',
            customer_id: '',
            vehicle_id: '',
            status: 'open' as any
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
        ?.filter(invoice => format(new Date(invoice.date || ''), 'yyyy-MM-dd') === dayStr)
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