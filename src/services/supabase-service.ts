import { supabase } from "@/integrations/supabase/client";
import { User } from '@/types';
import { Mechanic, Task, InvoiceItem, Attendance } from '@/types';

// Helper function to handle errors
const handleError = (error: any, action: string) => {
  console.error(`Error ${action}:`, error);
};

// Only updating the specific parts with type errors
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
      employmentType: (data.employment_type || 'fulltime') as 'fulltime' | 'contractor',
      isActive: !!data.is_active
    };
  } catch (error) {
    handleError(error, 'fetching mechanic by ID');
    return null;
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
      type: data.type as 'labor' | 'part',
      description: data.description,
      quantity: data.quantity,
      price: data.price
    };
    
  } catch (error) {
    handleError(error, 'adding task to invoice');
    throw error;
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
      status: data.status as 'pending' | 'approved' | 'rejected',
      approvedBy: data.approved_by,
      notes: data.notes
    };
    
  } catch (error) {
    handleError(error, 'recording attendance');
    throw error;
  }
};

// Add the missing functions needed by data-service.ts
export const fetchCustomers = async () => {
  try {
    const { data, error } = await supabase
      .from('customers')
      .select('*');
      
    if (error) throw error;
    return data;
  } catch (error) {
    handleError(error, 'fetching customers');
    return [];
  }
};

export const fetchCustomerById = async (id: string) => {
  try {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .eq('id', id)
      .single();
      
    if (error) throw error;
    return data;
  } catch (error) {
    handleError(error, 'fetching customer by ID');
    return null;
  }
};

export const addCustomer = async (customerData: any) => {
  try {
    const { data, error } = await supabase
      .from('customers')
      .insert([customerData])
      .select()
      .single();
      
    if (error) throw error;
    return data;
  } catch (error) {
    handleError(error, 'adding customer');
    return null;
  }
};

export const fetchVehiclesByCustomerId = async (customerId: string) => {
  try {
    const { data, error } = await supabase
      .from('vehicles')
      .select('*')
      .eq('customer_id', customerId);
      
    if (error) throw error;
    
    // Map DB fields to client model field names
    return data.map(v => ({
      id: v.id,
      customerId: v.customer_id,
      make: v.make,
      model: v.model,
      year: v.year,
      licensePlate: v.license_plate,
      vin: v.vin,
      color: v.color
    }));
  } catch (error) {
    handleError(error, 'fetching vehicles by customer ID');
    return [];
  }
};

export const addVehicle = async (vehicleData: any) => {
  try {
    // Convert client model field names to DB field names
    const dbVehicle = {
      customer_id: vehicleData.customerId,
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
    
    // Convert back to client model
    return {
      id: data.id,
      customerId: data.customer_id,
      make: data.make,
      model: data.model,
      year: data.year,
      licensePlate: data.license_plate,
      vin: data.vin,
      color: data.color
    };
  } catch (error) {
    handleError(error, 'adding vehicle');
    return null;
  }
};

export const fetchInvoices = async () => {
  try {
    const { data, error } = await supabase
      .from('invoices')
      .select(`
        *,
        invoice_items(*),
        payments(*),
        vehicles(make, model, year, license_plate)
      `);
      
    if (error) throw error;
    
    // Transform to client model
    return data.map(invoice => {
      const items = invoice.invoice_items.map((item: any) => ({
        id: item.id,
        type: item.type as 'labor' | 'part',
        description: item.description,
        quantity: item.quantity,
        price: item.price
      }));
      
      const payments = invoice.payments.map((payment: any) => ({
        id: payment.id,
        invoiceId: payment.invoice_id,
        amount: payment.amount,
        method: payment.method as 'cash' | 'card' | 'bank-transfer',
        date: payment.date,
        notes: payment.notes || ''
      }));
      
      const vehicle = invoice.vehicles;
      
      return {
        id: invoice.id,
        customerId: invoice.customer_id,
        vehicleId: invoice.vehicle_id,
        vehicleInfo: {
          make: vehicle?.make || '',
          model: vehicle?.model || '',
          year: vehicle?.year || '',
          licensePlate: vehicle?.license_plate || ''
        },
        status: invoice.status as 'open' | 'in-progress' | 'completed' | 'paid' | 'partial',
        date: invoice.date,
        items,
        notes: invoice.notes || '',
        taxRate: invoice.tax_rate,
        payments
      };
    });
  } catch (error) {
    handleError(error, 'fetching invoices');
    return [];
  }
};

export const fetchInvoiceById = async (id: string) => {
  try {
    const { data, error } = await supabase
      .from('invoices')
      .select('*')
      .eq('id', id)
      .single();
      
    if (error) throw error;
    return data;
  } catch (error) {
    handleError(error, 'fetching invoice by ID');
    return null;
  }
};

export const fetchMechanics = async () => {
  try {
    const { data, error } = await supabase
      .from('mechanics')
      .select('*');
      
    if (error) throw error;
    
    // Map DB fields to client model field names
    return data.map(m => ({
      id: m.id,
      name: m.name,
      specialization: m.specialization || '',
      address: m.address || '',
      phone: m.phone || '',
      idCardImage: m.id_card_image || '',
      employmentType: (m.employment_type || 'fulltime') as 'fulltime' | 'contractor',
      isActive: !!m.is_active
    }));
  } catch (error) {
    handleError(error, 'fetching mechanics');
    return [];
  }
};

export const fetchExpenses = async () => {
  try {
    const { data, error } = await supabase
      .from('expenses')
      .select('*');
      
    if (error) throw error;
    
    // Map DB fields to client model field names
    return data.map(e => ({
      id: e.id,
      date: e.date,
      category: e.category,
      amount: e.amount,
      description: e.description || '',
      paymentMethod: e.payment_method as 'cash' | 'card' | 'bank-transfer',
      paymentStatus: e.payment_status as 'paid' | 'pending' | 'overdue',
      vendorId: e.vendor_id,
      vendorName: e.vendor_name
    }));
  } catch (error) {
    handleError(error, 'fetching expenses');
    return [];
  }
};

export const fetchParts = async () => {
  try {
    const { data, error } = await supabase
      .from('parts')
      .select('*');
      
    if (error) throw error;
    return data;
  } catch (error) {
    handleError(error, 'fetching parts');
    return [];
  }
};

export const fetchTasks = async () => {
  try {
    const { data, error } = await supabase
      .from('tasks')
      .select('*');
      
    if (error) throw error;
    
    // Map DB fields to client model field names
    return data.map(t => ({
      id: t.id,
      title: t.title,
      description: t.description || '',
      mechanicId: t.mechanic_id,
      status: t.status as 'pending' | 'in-progress' | 'completed',
      hoursEstimated: t.hours_estimated,
      hoursSpent: t.hours_spent,
      invoiceId: t.invoice_id,
      location: 'workshop' as 'workshop' | 'onsite' | 'remote', // Default value for compatibility
      price: 0,
      startTime: '',
      endTime: '',
      completedBy: '',
      completedAt: ''
    }));
  } catch (error) {
    handleError(error, 'fetching tasks');
    return [];
  }
};

export const fetchAttendance = async () => {
  try {
    const { data, error } = await supabase
      .from('attendance')
      .select('*');
      
    if (error) throw error;
    
    // Map DB fields to client model field names
    return data.map(a => ({
      id: a.id,
      mechanicId: a.mechanic_id,
      date: a.date,
      checkIn: a.check_in,
      checkOut: a.check_out,
      status: a.status as 'pending' | 'approved' | 'rejected',
      approvedBy: a.approved_by,
      notes: a.notes || ''
    }));
  } catch (error) {
    handleError(error, 'fetching attendance');
    return [];
  }
};
