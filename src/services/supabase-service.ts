
// Supabase service for data fetching and manipulation
import { supabase } from '@/integrations/supabase/client';
import { 
  Customer, 
  Vehicle, 
  Mechanic, 
  Invoice, 
  InvoiceStatus, 
  Expense,
  Attendance,
  Part,
  Task
} from '@/types';

// General function to handle errors
const handleError = (error: any, operation: string) => {
  console.error(`Error ${operation}:`, error);
  throw new Error(`${operation} failed: ${error.message}`);
};

// Customer functions
export const fetchCustomers = async (): Promise<Customer[]> => {
  try {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .order('name');
      
    if (error) throw error;
    return data as Customer[];
  } catch (error) {
    handleError(error, 'fetching customers');
    return [];
  }
};

export const fetchCustomerById = async (id: string): Promise<Customer | null> => {
  try {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .eq('id', id)
      .single();
      
    if (error) throw error;
    return data as Customer;
  } catch (error) {
    handleError(error, 'fetching customer by ID');
    return null;
  }
};

export const addCustomer = async (customerData: any): Promise<Customer> => {
  try {
    const { data, error } = await supabase
      .from('customers')
      .insert([customerData])
      .select()
      .single();
      
    if (error) throw error;
    return data as Customer;
  } catch (error) {
    handleError(error, 'adding customer');
    throw error;
  }
};

// Vehicle functions
export const fetchVehiclesByCustomerId = async (customerId: string): Promise<Vehicle[]> => {
  try {
    const { data, error } = await supabase
      .from('vehicles')
      .select('*')
      .eq('customer_id', customerId);
      
    if (error) throw error;
    return data as Vehicle[];
  } catch (error) {
    handleError(error, 'fetching vehicles by customer ID');
    return [];
  }
};

export const addVehicle = async (vehicleData: any): Promise<Vehicle> => {
  try {
    const { data, error } = await supabase
      .from('vehicles')
      .insert([{
        ...vehicleData,
        customer_id: vehicleData.customerId // Map to DB column name
      }])
      .select()
      .single();
      
    if (error) throw error;
    return data as Vehicle;
  } catch (error) {
    handleError(error, 'adding vehicle');
    throw error;
  }
};

// Invoice functions
export const fetchInvoices = async (): Promise<Invoice[]> => {
  try {
    const { data, error } = await supabase
      .from('invoices')
      .select(`
        *,
        invoice_items (*),
        payments (*)
      `)
      .order('created_at', { ascending: false });
      
    if (error) throw error;

    // Transform to the expected format
    return data.map((invoice: any) => ({
      id: invoice.id,
      customerId: invoice.customer_id,
      vehicleId: invoice.vehicle_id,
      vehicleInfo: {
        make: invoice.vehicle_make || '',
        model: invoice.vehicle_model || '',
        year: invoice.vehicle_year || '',
        licensePlate: invoice.vehicle_license_plate || ''
      },
      status: invoice.status as InvoiceStatus,
      date: invoice.date,
      notes: invoice.notes || '',
      taxRate: invoice.tax_rate || 0,
      items: invoice.invoice_items.map((item: any) => ({
        id: item.id,
        type: item.type,
        description: item.description,
        quantity: item.quantity,
        price: item.price
      })),
      payments: invoice.payments.map((payment: any) => ({
        id: payment.id,
        invoiceId: payment.invoice_id,
        amount: payment.amount,
        method: payment.method,
        date: payment.date,
        notes: payment.notes || ''
      }))
    }));
  } catch (error) {
    handleError(error, 'fetching invoices');
    return [];
  }
};

export const fetchInvoiceById = async (id: string): Promise<Invoice | null> => {
  try {
    const { data, error } = await supabase
      .from('invoices')
      .select(`
        *,
        invoice_items (*),
        payments (*)
      `)
      .eq('id', id)
      .single();
      
    if (error) throw error;

    // Transform to the expected format
    return {
      id: data.id,
      customerId: data.customer_id,
      vehicleId: data.vehicle_id,
      vehicleInfo: {
        make: data.vehicle_make || '',
        model: data.vehicle_model || '',
        year: data.vehicle_year || '',
        licensePlate: data.vehicle_license_plate || ''
      },
      status: data.status as InvoiceStatus,
      date: data.date,
      notes: data.notes || '',
      taxRate: data.tax_rate || 0,
      items: data.invoice_items.map((item: any) => ({
        id: item.id,
        type: item.type,
        description: item.description,
        quantity: item.quantity,
        price: item.price
      })),
      payments: data.payments.map((payment: any) => ({
        id: payment.id,
        invoiceId: payment.invoice_id,
        amount: payment.amount,
        method: payment.method,
        date: payment.date,
        notes: payment.notes || ''
      }))
    } as Invoice;
  } catch (error) {
    handleError(error, 'fetching invoice by ID');
    return null;
  }
};

// Mechanic functions
export const fetchMechanics = async (): Promise<Mechanic[]> => {
  try {
    const { data, error } = await supabase
      .from('mechanics')
      .select('*')
      .order('name');
      
    if (error) throw error;
    return data as Mechanic[];
  } catch (error) {
    handleError(error, 'fetching mechanics');
    return [];
  }
};

export const fetchMechanicById = async (id: string): Promise<Mechanic | null> => {
  try {
    const { data, error } = await supabase
      .from('mechanics')
      .select('*')
      .eq('id', id)
      .single();
      
    if (error) throw error;
    return data as Mechanic;
  } catch (error) {
    handleError(error, 'fetching mechanic by ID');
    return null;
  }
};

// Expense functions
export const fetchExpenses = async (): Promise<Expense[]> => {
  try {
    const { data, error } = await supabase
      .from('expenses')
      .select('*')
      .order('date', { ascending: false });
      
    if (error) throw error;
    return data as Expense[];
  } catch (error) {
    handleError(error, 'fetching expenses');
    return [];
  }
};

// Parts functions
export const fetchParts = async (): Promise<Part[]> => {
  try {
    const { data, error } = await supabase
      .from('parts')
      .select('*')
      .order('name');
      
    if (error) throw error;
    return data as Part[];
  } catch (error) {
    handleError(error, 'fetching parts');
    return [];
  }
};

// Task functions
export const fetchTasks = async (): Promise<Task[]> => {
  try {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .order('created_at', { ascending: false });
      
    if (error) throw error;
    
    // Transform to the expected format
    return data.map((task: any) => ({
      id: task.id,
      title: task.title,
      description: task.description || '',
      mechanicId: task.mechanic_id,
      status: task.status,
      hoursEstimated: task.hours_estimated,
      hoursSpent: task.hours_spent,
      invoiceId: task.invoice_id,
      vehicleId: task.vehicle_id,
      location: task.location || 'workshop',
      price: task.price,
      startTime: task.start_time,
      endTime: task.end_time,
      completedBy: task.completed_by,
      completedAt: task.completed_at
    }));
  } catch (error) {
    handleError(error, 'fetching tasks');
    return [];
  }
};

// Attendance functions
export const fetchAttendance = async (): Promise<Attendance[]> => {
  try {
    const { data, error } = await supabase
      .from('attendance')
      .select('*')
      .order('date', { ascending: false });
      
    if (error) throw error;
    return data as Attendance[];
  } catch (error) {
    handleError(error, 'fetching attendance records');
    return [];
  }
};

// Helper functions
export const getCustomers = async (): Promise<Customer[]> => {
  return await fetchCustomers();
};

