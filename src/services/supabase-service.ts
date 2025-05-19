
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
  Task,
  TaskLocation,
  InvoiceItem,
  Payment
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
    return data.map((customer: any) => ({
      id: customer.id,
      name: customer.name,
      email: customer.email || '',
      phone: customer.phone || '',
      address: customer.address || '',
      totalVisits: customer.total_visits || 0,
      lifetimeValue: customer.lifetime_value || 0,
      lastVisit: customer.last_visit || null
    }));
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
    return {
      id: data.id,
      name: data.name,
      email: data.email || '',
      phone: data.phone || '',
      address: data.address || '',
      totalVisits: data.total_visits || 0,
      lifetimeValue: data.lifetime_value || 0,
      lastVisit: data.last_visit || null
    };
  } catch (error) {
    handleError(error, 'fetching customer by ID');
    return null;
  }
};

export const addCustomer = async (customerData: any): Promise<Customer> => {
  try {
    // Transform frontend model to database schema
    const dbCustomer = {
      name: customerData.name,
      email: customerData.email,
      phone: customerData.phone,
      address: customerData.address
    };
    
    const { data, error } = await supabase
      .from('customers')
      .insert([dbCustomer])
      .select()
      .single();
      
    if (error) throw error;
    
    return {
      id: data.id,
      name: data.name,
      email: data.email || '',
      phone: data.phone || '',
      address: data.address || '',
      totalVisits: data.total_visits || 0,
      lifetimeValue: data.lifetime_value || 0,
      lastVisit: data.last_visit || null
    };
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
    
    // Transform database schema to frontend model
    return data.map((vehicle: any) => ({
      id: vehicle.id,
      customerId: vehicle.customer_id,
      make: vehicle.make,
      model: vehicle.model,
      year: vehicle.year,
      licensePlate: vehicle.license_plate,
      vin: vehicle.vin || '',
      color: vehicle.color || ''
    }));
  } catch (error) {
    handleError(error, 'fetching vehicles by customer ID');
    return [];
  }
};

export const addVehicle = async (vehicleData: any): Promise<Vehicle> => {
  try {
    // Transform frontend model to database schema
    const dbVehicle = {
      customer_id: vehicleData.customerId, // Map to DB column name
      make: vehicleData.make,
      model: vehicleData.model,
      year: vehicleData.year,
      license_plate: vehicleData.licensePlate,
      vin: vehicleData.vin,
      color: vehicleData.color
    };
    
    const { data, error } = await supabase
      .from('vehicles')
      .insert([dbVehicle])
      .select()
      .single();
      
    if (error) throw error;
    
    return {
      id: data.id,
      customerId: data.customer_id,
      make: data.make,
      model: data.model,
      year: data.year,
      licensePlate: data.license_plate,
      vin: data.vin || '',
      color: data.color || ''
    };
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
        payments (*),
        vehicles:vehicle_id (make, model, year, license_plate)
      `)
      .order('created_at', { ascending: false });
      
    if (error) throw error;

    // Transform to the expected format
    return data.map((invoice: any) => ({
      id: invoice.id,
      customerId: invoice.customer_id,
      vehicleId: invoice.vehicle_id,
      vehicleInfo: {
        make: invoice.vehicles?.make || '',
        model: invoice.vehicles?.model || '',
        year: invoice.vehicles?.year || '',
        licensePlate: invoice.vehicles?.license_plate || ''
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
        payments (*),
        vehicles:vehicle_id (make, model, year, license_plate)
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
        make: data.vehicles?.make || '',
        model: data.vehicles?.model || '',
        year: data.vehicles?.year || '',
        licensePlate: data.vehicles?.license_plate || ''
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
    
    return data.map((mechanic: any) => ({
      id: mechanic.id,
      name: mechanic.name,
      specialization: mechanic.specialization || '',
      address: mechanic.address || '',
      phone: mechanic.phone || '',
      idCardImage: mechanic.id_card_image || '',
      employmentType: mechanic.employment_type || 'fulltime',
      isActive: mechanic.is_active
    }));
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
    
    return {
      id: data.id,
      name: data.name,
      specialization: data.specialization || '',
      address: data.address || '',
      phone: data.phone || '',
      idCardImage: data.id_card_image || '',
      employmentType: data.employment_type || 'fulltime',
      isActive: data.is_active
    };
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
    
    return data.map((expense: any) => ({
      id: expense.id,
      date: expense.date,
      category: expense.category,
      amount: expense.amount,
      description: expense.description || '',
      paymentMethod: expense.payment_method as 'cash' | 'card' | 'bank-transfer',
      paymentStatus: expense.payment_status,
      vendorId: expense.vendor_id || '',
      vendorName: expense.vendor_name || ''
    }));
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
    
    return data.map((part: any) => ({
      id: part.id,
      name: part.name,
      price: part.price,
      quantity: part.quantity,
      description: part.description || '',
      vendorId: part.vendor_id || '',
      vendorName: part.vendor_name || '',
      partNumber: part.part_number || '',
      reorderLevel: part.reorder_level || 5
    }));
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
      location: task.location || 'workshop' as TaskLocation,
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

// Add a task to an invoice
export const addTaskToInvoice = async (
  invoiceId: string, 
  task: Task, 
  hourlyRate: number = 85
): Promise<InvoiceItem> => {
  try {
    if (!task.hoursSpent) {
      throw new Error('Task has no hours spent recorded');
    }
    
    const taskPrice = task.price || (task.hoursSpent * hourlyRate);
    
    const newItem = {
      invoice_id: invoiceId,
      type: 'labor',
      description: `Labor: ${task.title}`,
      quantity: task.hoursSpent,
      price: task.price ? (taskPrice / task.hoursSpent) : hourlyRate
    };
    
    const { data, error } = await supabase
      .from('invoice_items')
      .insert([newItem])
      .select()
      .single();
    
    if (error) throw error;
    
    return {
      id: data.id,
      type: data.type,
      description: data.description,
      quantity: data.quantity,
      price: data.price
    };
    
  } catch (error) {
    handleError(error, 'adding task to invoice');
    throw error;
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
    
    return data.map((record: any) => ({
      id: record.id,
      mechanicId: record.mechanic_id,
      date: record.date,
      checkIn: record.check_in,
      checkOut: record.check_out,
      status: record.status,
      approvedBy: record.approved_by,
      notes: record.notes
    }));
  } catch (error) {
    handleError(error, 'fetching attendance records');
    return [];
  }
};

// Record new attendance
export const recordAttendanceInDb = async (attendanceData: Omit<Attendance, 'id'>): Promise<Attendance> => {
  try {
    const dbAttendance = {
      mechanic_id: attendanceData.mechanicId,
      date: attendanceData.date,
      check_in: attendanceData.checkIn,
      check_out: attendanceData.checkOut,
      status: attendanceData.status,
      approved_by: attendanceData.approvedBy,
      notes: attendanceData.notes
    };
    
    const { data, error } = await supabase
      .from('attendance')
      .insert([dbAttendance])
      .select()
      .single();
      
    if (error) throw error;
    
    return {
      id: data.id,
      mechanicId: data.mechanic_id,
      date: data.date,
      checkIn: data.check_in,
      checkOut: data.check_out,
      status: data.status,
      approvedBy: data.approved_by,
      notes: data.notes
    };
    
  } catch (error) {
    handleError(error, 'recording attendance');
    throw error;
  }
};

// Helper functions
export const getCustomers = async (): Promise<Customer[]> => {
  return await fetchCustomers();
};

