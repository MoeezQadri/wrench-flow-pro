
import { supabase } from '@/integrations/supabase/client';
import type { 
  Customer, 
  Vehicle, 
  Mechanic,
  Invoice, 
  InvoiceItem, 
  Part, 
  Task, 
  Expense, 
  Attendance,
  Payment
} from '@/types';

// CUSTOMERS
export const fetchCustomers = async (): Promise<Customer[]> => {
  const { data, error } = await supabase
    .from('customers')
    .select(`
      *,
      vehicles:vehicles(*)
    `);

  if (error) {
    console.error('Error fetching customers:', error);
    throw error;
  }

  // Transform to match our types
  return data.map(customer => ({
    id: customer.id,
    name: customer.name,
    email: customer.email || '',
    phone: customer.phone || '',
    address: customer.address || '',
    vehicles: customer.vehicles || [],
    totalVisits: customer.total_visits || 0,
    lifetimeValue: customer.lifetime_value || 0,
    lastVisit: customer.last_visit || undefined
  }));
};

export const fetchCustomerById = async (id: string): Promise<Customer | null> => {
  const { data, error } = await supabase
    .from('customers')
    .select(`
      *,
      vehicles:vehicles(*)
    `)
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching customer:', error);
    if (error.code === 'PGRST116') {
      return null; // No data found
    }
    throw error;
  }

  return {
    id: data.id,
    name: data.name,
    email: data.email || '',
    phone: data.phone || '',
    address: data.address || '',
    vehicles: data.vehicles || [],
    totalVisits: data.total_visits || 0,
    lifetimeValue: data.lifetime_value || 0,
    lastVisit: data.last_visit || undefined
  };
};

export const addCustomer = async (customer: Omit<Customer, 'id' | 'vehicles' | 'totalVisits' | 'lifetimeValue' | 'lastVisit'>): Promise<Customer> => {
  const { data, error } = await supabase
    .from('customers')
    .insert({
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      address: customer.address
    })
    .select()
    .single();

  if (error) {
    console.error('Error adding customer:', error);
    throw error;
  }

  return {
    id: data.id,
    name: data.name,
    email: data.email || '',
    phone: data.phone || '',
    address: data.address || '',
    vehicles: [],
    totalVisits: 0,
    lifetimeValue: 0
  };
};

// VEHICLES
export const fetchVehiclesByCustomerId = async (customerId: string): Promise<Vehicle[]> => {
  const { data, error } = await supabase
    .from('vehicles')
    .select('*')
    .eq('customer_id', customerId);

  if (error) {
    console.error('Error fetching vehicles:', error);
    throw error;
  }

  return data.map(vehicle => ({
    id: vehicle.id,
    customerId: vehicle.customer_id,
    make: vehicle.make,
    model: vehicle.model,
    year: vehicle.year,
    licensePlate: vehicle.license_plate,
    vin: vehicle.vin || undefined,
    color: vehicle.color || undefined
  }));
};

export const addVehicle = async (vehicle: Omit<Vehicle, 'id'>): Promise<Vehicle> => {
  const { data, error } = await supabase
    .from('vehicles')
    .insert({
      customer_id: vehicle.customerId,
      make: vehicle.make,
      model: vehicle.model,
      year: vehicle.year,
      license_plate: vehicle.licensePlate,
      vin: vehicle.vin,
      color: vehicle.color
    })
    .select()
    .single();

  if (error) {
    console.error('Error adding vehicle:', error);
    throw error;
  }

  return {
    id: data.id,
    customerId: data.customer_id,
    make: data.make,
    model: data.model,
    year: data.year,
    licensePlate: data.license_plate,
    vin: data.vin || undefined,
    color: data.color || undefined
  };
};

// MECHANICS
export const fetchMechanics = async (): Promise<Mechanic[]> => {
  const { data, error } = await supabase
    .from('mechanics')
    .select('*');

  if (error) {
    console.error('Error fetching mechanics:', error);
    throw error;
  }

  return data.map(mechanic => ({
    id: mechanic.id,
    name: mechanic.name,
    specialization: mechanic.specialization || '',
    address: mechanic.address || '',
    phone: mechanic.phone || '',
    idCardImage: mechanic.id_card_image,
    employmentType: mechanic.employment_type as 'contractor' | 'fulltime',
    isActive: mechanic.is_active || true
  }));
};

export const fetchMechanicById = async (id: string): Promise<Mechanic | null> => {
  const { data, error } = await supabase
    .from('mechanics')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching mechanic:', error);
    if (error.code === 'PGRST116') {
      return null; // No data found
    }
    throw error;
  }

  return {
    id: data.id,
    name: data.name,
    specialization: data.specialization || '',
    address: data.address || '',
    phone: data.phone || '',
    idCardImage: data.id_card_image,
    employmentType: data.employment_type as 'contractor' | 'fulltime',
    isActive: data.is_active || true
  };
};

// INVOICES
export const fetchInvoices = async (): Promise<Invoice[]> => {
  const { data, error } = await supabase
    .from('invoices')
    .select(`
      *,
      items:invoice_items(*),
      payments:payments(*),
      vehicle:vehicles!inner(*),
      customer:customers!inner(*)
    `);

  if (error) {
    console.error('Error fetching invoices:', error);
    throw error;
  }

  return data.map(invoice => ({
    id: invoice.id,
    customerId: invoice.customer_id,
    vehicleId: invoice.vehicle_id,
    vehicleInfo: {
      make: invoice.vehicle.make,
      model: invoice.vehicle.model,
      year: invoice.vehicle.year,
      licensePlate: invoice.vehicle.license_plate
    },
    status: invoice.status as any,
    date: new Date(invoice.date).toISOString().split('T')[0],
    items: invoice.items.map((item: any) => ({
      id: item.id,
      type: item.type,
      description: item.description,
      quantity: item.quantity,
      price: item.price
    })),
    notes: invoice.notes || '',
    taxRate: invoice.tax_rate || 0,
    payments: invoice.payments.map((payment: any) => ({
      id: payment.id,
      invoiceId: payment.invoice_id,
      amount: payment.amount,
      method: payment.method,
      date: new Date(payment.date).toISOString().split('T')[0],
      notes: payment.notes || ''
    }))
  }));
};

export const fetchInvoiceById = async (id: string): Promise<Invoice | null> => {
  const { data, error } = await supabase
    .from('invoices')
    .select(`
      *,
      items:invoice_items(*),
      payments:payments(*),
      vehicle:vehicles!inner(*),
      customer:customers!inner(*)
    `)
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching invoice:', error);
    if (error.code === 'PGRST116') {
      return null; // No data found
    }
    throw error;
  }

  return {
    id: data.id,
    customerId: data.customer_id,
    vehicleId: data.vehicle_id,
    vehicleInfo: {
      make: data.vehicle.make,
      model: data.vehicle.model,
      year: data.vehicle.year,
      licensePlate: data.vehicle.license_plate
    },
    status: data.status,
    date: new Date(data.date).toISOString().split('T')[0],
    items: data.items.map((item: any) => ({
      id: item.id,
      type: item.type,
      description: item.description,
      quantity: item.quantity,
      price: item.price
    })),
    notes: data.notes || '',
    taxRate: data.tax_rate || 0,
    payments: data.payments.map((payment: any) => ({
      id: payment.id,
      invoiceId: payment.invoice_id,
      amount: payment.amount,
      method: payment.method,
      date: new Date(payment.date).toISOString().split('T')[0],
      notes: payment.notes || ''
    }))
  };
};

// FINANCE & EXPENSES
export const fetchExpenses = async (): Promise<Expense[]> => {
  const { data, error } = await supabase
    .from('expenses')
    .select('*');

  if (error) {
    console.error('Error fetching expenses:', error);
    throw error;
  }

  return data.map(expense => ({
    id: expense.id,
    date: new Date(expense.date).toISOString().split('T')[0],
    category: expense.category,
    amount: expense.amount,
    description: expense.description || '',
    paymentMethod: expense.payment_method as 'cash' | 'card' | 'bank-transfer',
    paymentStatus: expense.payment_status as 'paid' | 'pending' | 'overdue',
    vendorId: expense.vendor_id,
    vendorName: expense.vendor_name
  }));
};

export const addExpense = async (expense: Omit<Expense, 'id'>): Promise<Expense> => {
  const { data, error } = await supabase
    .from('expenses')
    .insert({
      date: expense.date,
      category: expense.category,
      amount: expense.amount,
      description: expense.description,
      payment_method: expense.paymentMethod,
      payment_status: expense.paymentStatus,
      vendor_id: expense.vendorId,
      vendor_name: expense.vendorName
    })
    .select()
    .single();

  if (error) {
    console.error('Error adding expense:', error);
    throw error;
  }

  return {
    id: data.id,
    date: new Date(data.date).toISOString().split('T')[0],
    category: data.category,
    amount: data.amount,
    description: data.description || '',
    paymentMethod: data.payment_method as 'cash' | 'card' | 'bank-transfer',
    paymentStatus: data.payment_status as 'paid' | 'pending' | 'overdue',
    vendorId: data.vendor_id,
    vendorName: data.vendor_name
  };
};

// PARTS
export const fetchParts = async (): Promise<Part[]> => {
  const { data, error } = await supabase
    .from('parts')
    .select('*');

  if (error) {
    console.error('Error fetching parts:', error);
    throw error;
  }

  return data.map(part => ({
    id: part.id,
    name: part.name,
    price: part.price,
    quantity: part.quantity,
    description: part.description || '',
    vendorId: part.vendor_id,
    vendorName: part.vendor_name,
    partNumber: part.part_number,
    reorderLevel: part.reorder_level
  }));
};

// TASKS
export const fetchTasks = async (): Promise<Task[]> => {
  const { data, error } = await supabase
    .from('tasks')
    .select('*');

  if (error) {
    console.error('Error fetching tasks:', error);
    throw error;
  }

  return data.map(task => ({
    id: task.id,
    title: task.title,
    description: task.description || '',
    mechanicId: task.mechanic_id,
    status: task.status as 'pending' | 'in-progress' | 'completed',
    hoursEstimated: task.hours_estimated,
    hoursSpent: task.hours_spent,
    invoiceId: task.invoice_id
  }));
};

// ATTENDANCE
export const fetchAttendance = async (): Promise<Attendance[]> => {
  const { data, error } = await supabase
    .from('attendance')
    .select('*');

  if (error) {
    console.error('Error fetching attendance:', error);
    throw error;
  }

  return data.map(record => ({
    id: record.id,
    mechanicId: record.mechanic_id,
    date: record.date,
    checkIn: record.check_in,
    checkOut: record.check_out,
    status: record.status as 'pending' | 'approved' | 'rejected',
    approvedBy: record.approved_by,
    notes: record.notes
  }));
};
