import { User, Customer, Vehicle, Invoice, Part, Mechanic, Vendor, Expense, Attendance, Task, CustomerAnalytics, DashboardMetrics, InvoiceItem, Payment, InvoiceStatus, UserRole } from "@/types";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { 
  syncInvoiceItemToPart, 
  syncInvoiceItemToTask, 
  createTaskFromInvoiceItem, 
  createPartFromInvoiceItem 
} from "./inventory-sync-service";

// Helper function to generate UUID
const generateUUID = () => crypto.randomUUID();

// Helper function to handle errors
const handleError = (error: any, action: string) => {
  console.error(`Error ${action}:`, error);
  toast.error(`Failed to ${action}`);
};

// Helper to map DB data to client model
const mapInvoiceFromDb = (invoice: any): Invoice => {
  const items = invoice.invoice_items?.map((item: any) => ({
    id: item.id,
    type: item.type as 'labor' | 'parts',
    description: item.description,
    quantity: item.quantity,
    price: item.price,
    part_id: item.part_id,
    task_id: item.task_id,
    is_auto_added: item.is_auto_added || false
  })) || [];
  
  const payments = invoice.payments?.map((payment: any) => ({
    id: payment.id,
    invoiceId: payment.invoice_id,
    amount: payment.amount,
    method: payment.method as 'cash' | 'card' | 'bank-transfer',
    date: payment.date,
    notes: payment.notes || ''
  })) || [];
  
  const vehicle = invoice.vehicles;
  
  return {
    id: invoice.id,
    customer_id: invoice.customer_id,
    vehicle_id: invoice.vehicle_id,
    date: invoice.date,
    status: invoice.status as InvoiceStatus,
    tax_rate: invoice.tax_rate,
    notes: invoice.notes || '',
    items,
    payments,
    vehicleInfo: {
      make: vehicle?.make || '',
      model: vehicle?.model || '',
      year: vehicle?.year || '',
      license_plate: vehicle?.license_plate || ''
    },
    created_at: invoice.created_at,
    discount_type: invoice.discount_type,
    discount_value: invoice.discount_value
  };
};

// Fetch customers
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

// Fetch customer by ID
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

// Add a customer with UUID generation
export const addCustomer = async (customerData: any) => {
  try {
    const customerWithId = {
      id: generateUUID(),
      ...customerData,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('customers')
      .insert([customerWithId])
      .select()
      .single();
      
    if (error) throw error;
    return data;
  } catch (error) {
    handleError(error, 'adding customer');
    return null;
  }
};

// Add a mechanic with proper UUID generation
export const addMechanic = async (mechanicData: any) => {
  try {
    const mechanicWithId = {
      id: generateUUID(),
      ...mechanicData,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('mechanics')
      .insert([mechanicWithId])
      .select()
      .single();
      
    if (error) throw error;
    return data;
  } catch (error) {
    handleError(error, 'adding mechanic');
    return null;
  }
};

// Update mechanic with proper error handling
export const updateMechanic = async (id: string, updates: any) => {
  try {
    const updatedData = {
      ...updates,
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('mechanics')
      .update(updatedData)
      .eq('id', id)
      .select()
      .single();
      
    if (error) throw error;
    return data;
  } catch (error) {
    handleError(error, 'updating mechanic');
    return null;
  }
};

// Get assigned parts for a specific vehicle or customer
export const getAssignedPartsForInvoice = async (vehicleId: string, customerId: string) => {
  try {
    const { data, error } = await supabase
      .from('parts')
      .select('*')
      .or(`invoice_ids.cs.{${vehicleId}},invoice_ids.cs.{${customerId}}`);
      
    if (error) throw error;
    
    return data.map(p => ({
      id: p.id,
      name: p.name,
      description: p.description,
      part_number: p.part_number,
      price: p.price,
      quantity: p.quantity,
      vendor_id: p.vendor_id,
      vendor_name: p.vendor_name,
      invoice_ids: p.invoice_ids || []
    }));
  } catch (error) {
    handleError(error, 'fetching assigned parts for invoice');
    return [];
  }
};

// Get assigned tasks for a specific vehicle - only completed tasks
export const getAssignedTasksForInvoice = async (vehicleId: string) => {
  try {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('vehicle_id', vehicleId)
      .eq('status', 'completed'); // Only get completed tasks
      
    if (error) throw error;
    
    return data.map(t => ({
      id: t.id,
      title: t.title,
      description: t.description || '',
      mechanic_id: t.mechanic_id,
      status: t.status as 'pending' | 'in-progress' | 'completed',
      hours_estimated: t.hours_estimated,
      hours_spent: t.hours_spent,
      invoice_id: t.invoice_id,
      location: t.location || 'workshop',
      price: t.price || 0
    }));
  } catch (error) {
    handleError(error, 'fetching assigned tasks for invoice');
    return [];
  }
};

// Create invoice with automatic assignment and bidirectional sync
export const createInvoiceWithAutoAssignment = async (invoiceData: any) => {
  try {
    // Create the invoice first with UUID
    const invoiceWithId = {
      id: generateUUID(),
      customer_id: invoiceData.customerId,
      vehicle_id: invoiceData.vehicleId,
      date: invoiceData.date,
      tax_rate: invoiceData.taxRate,
      discount_type: invoiceData.discountType,
      discount_value: invoiceData.discountValue,
      notes: invoiceData.notes,
      status: 'open'
    };

    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .insert([invoiceWithId])
      .select()
      .single();
      
    if (invoiceError) throw invoiceError;
    
    // Get assigned parts and tasks
    const [assignedParts, assignedTasks] = await Promise.all([
      getAssignedPartsForInvoice(invoiceData.vehicleId, invoiceData.customerId),
      getAssignedTasksForInvoice(invoiceData.vehicleId)
    ]);
    
    // Prepare auto-added items
    const autoItems = [];
    
    // Add parts as auto-added items
    assignedParts.forEach(part => {
      autoItems.push({
        id: generateUUID(),
        invoice_id: invoice.id,
        description: part.name,
        type: 'parts',
        quantity: 1,
        price: part.price,
        part_id: part.id,
        is_auto_added: true
      });
    });
    
    // Add tasks as auto-added labor items
    assignedTasks.forEach(task => {
      autoItems.push({
        id: generateUUID(),
        invoice_id: invoice.id,
        description: task.title,
        type: 'labor',
        quantity: task.hours_estimated || 1,
        price: task.price || 0,
        task_id: task.id,
        is_auto_added: true
      });
    });
    
    // Process manually specified items and create missing parts/tasks
    if (invoiceData.items && invoiceData.items.length > 0) {
      for (const item of invoiceData.items) {
        let processedItem = { 
          ...item, 
          id: generateUUID(),
          invoice_id: invoice.id, 
          is_auto_added: false 
        };
        
        // Create missing parts or tasks for manual items
        if (item.type === 'parts' && !item.part_id) {
          const newPartId = await createPartFromInvoiceItem(item, invoice.id);
          if (newPartId) {
            processedItem.part_id = newPartId;
          }
        } else if (item.type === 'labor' && !item.task_id) {
          const newTaskId = await createTaskFromInvoiceItem(
            item, 
            invoice.id, 
            invoiceData.vehicleId, 
            invoiceData.customerId
          );
          if (newTaskId) {
            processedItem.task_id = newTaskId;
          }
        }
        
        autoItems.push(processedItem);
      }
    }
    
    // Insert all items
    if (autoItems.length > 0) {
      const { data: insertedItems, error: itemsError } = await supabase
        .from('invoice_items')
        .insert(autoItems)
        .select();
        
      if (itemsError) throw itemsError;
      
      // Sync each item back to inventory/tasks
      for (const item of insertedItems || []) {
        // Type cast the item to ensure proper typing
        const typedItem: InvoiceItem = {
          id: item.id,
          invoice_id: item.invoice_id,
          description: item.description,
          type: item.type as 'labor' | 'parts',
          quantity: item.quantity,
          price: item.price,
          part_id: item.part_id,
          task_id: item.task_id,
          is_auto_added: item.is_auto_added || false
        };
        
        if (typedItem.type === 'parts' && typedItem.part_id) {
          await syncInvoiceItemToPart(typedItem, invoice.id);
        } else if (typedItem.type === 'labor' && typedItem.task_id) {
          await syncInvoiceItemToTask(typedItem, invoice.id, invoiceData.vehicleId);
        }
      }
    }
    
    // Update task assignments for assigned tasks
    if (assignedTasks.length > 0) {
      const taskIds = assignedTasks.map(task => task.id);
      const { error: taskUpdateError } = await supabase
        .from('tasks')
        .update({ invoice_id: invoice.id })
        .in('id', taskIds);
        
      if (taskUpdateError) throw taskUpdateError;
    }
    
    return invoice;
  } catch (error) {
    handleError(error, 'creating invoice with auto assignment');
    throw error;
  }
};

// Fetch vehicles by customer ID
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
      customer_id: v.customer_id,
      make: v.make,
      model: v.model,
      year: v.year,
      license_plate: v.license_plate,
      vin: v.vin,
      color: v.color
    }));
  } catch (error) {
    handleError(error, 'fetching vehicles by customer ID');
    return [];
  }
};

// Add a vehicle with UUID generation
export const addVehicle = async (vehicleData: any) => {
  try {
    const vehicleWithId = {
      id: generateUUID(),
      ...vehicleData,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('vehicles')
      .insert([vehicleWithId])
      .select()
      .single();
      
    if (error) throw error;
    
    return {
      id: data.id,
      customer_id: data.customer_id,
      make: data.make,
      model: data.model,
      year: data.year,
      license_plate: data.license_plate,
      vin: data.vin,
      color: data.color
    };
  } catch (error) {
    handleError(error, 'adding vehicle');
    return null;
  }
};

// Fetch invoices
export const fetchInvoices = async (): Promise<Invoice[]> => {
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
    
    // Transform to client model using our helper
    return data.map(mapInvoiceFromDb);
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
        invoice_items(*),
        payments(*),
        vehicles(make, model, year, license_plate)
      `)
      .eq('id', id)
      .single();
      
    if (error) throw error;
    
    return mapInvoiceFromDb(data);
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
      id_card_image: m.id_card_image || '',
      employment_type: (m.employment_type || 'fulltime') as 'fulltime' | 'contractor',
      is_active: !!m.is_active,
      created_at: m.created_at,
      updated_at: m.updated_at
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
      payment_method: e.payment_method as 'cash' | 'card' | 'bank-transfer',
      vendor_id: e.vendor_id,
      vendor_name: e.vendor_name
    }));
  } catch (error) {
    handleError(error, 'fetching expenses');
    return [];
  }
};

export const addExpense = async (expenseData: any) => {
  try {
    const expenseWithId = {
      id: generateUUID(),
      ...expenseData,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('expenses')
      .insert([expenseWithId])
      .select()
      .single();
      
    if (error) throw error;
    
    return {
      id: data.id,
      date: data.date,
      category: data.category,
      amount: data.amount,
      description: data.description || '',
      payment_method: data.payment_method,
      vendor_id: data.vendor_id,
      vendor_name: data.vendor_name
    };
  } catch (error) {
    handleError(error, 'adding expense');
    return null;
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
      mechanic_id: t.mechanic_id,
      status: t.status as 'pending' | 'in-progress' | 'completed',
      hours_estimated: t.hours_estimated,
      hours_spent: t.hours_spent,
      invoice_id: t.invoice_id,
      location: t.location || 'workshop',
      price: t.price || 0,
      created_at: t.created_at,
      updated_at: t.updated_at
    }));
  } catch (error) {
    handleError(error, 'fetching tasks');
    return [];
  }
};

export const recordAttendanceInDb = async (attendanceData: Omit<Attendance, 'id'>): Promise<Attendance> => {
  try {
    const dbAttendance = {
      id: generateUUID(),
      mechanic_id: attendanceData.mechanic_id,
      date: attendanceData.date,
      check_in: attendanceData.check_in,
      check_out: attendanceData.check_out,
      status: attendanceData.status,
      approved_by: attendanceData.approved_by,
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
      mechanic_id: data.mechanic_id,
      date: data.date,
      check_in: data.check_in,
      check_out: data.check_out,
      status: data.status as 'pending' | 'approved' | 'rejected',
      approved_by: data.approved_by,
      notes: data.notes
    };
    
  } catch (error) {
    handleError(error, 'recording attendance');
    throw error;
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
      mechanic_id: a.mechanic_id,
      date: a.date,
      check_in: a.check_in,
      check_out: a.check_out,
      status: a.status as 'pending' | 'approved' | 'rejected',
      approved_by: a.approved_by,
      notes: a.notes || ''
    }));
  } catch (error) {
    handleError(error, 'fetching attendance');
    return [];
  }
};

export const fetchDashboardMetrics = async (): Promise<DashboardMetrics> => {
  try {
    // Fetch metrics from Supabase or calculate them
    // For now, return mock data
    return {
      totalRevenue: 24500,
      pendingInvoices: 7,
      completedJobs: 34,
      activeJobs: 12,
      mechanicEfficiency: 84,
      monthlyRevenue: 7800,
      monthlyExpenses: 3200,
      monthlyProfit: 4600,
      pendingTasks: 9,
      activeCustomers: 28,
      activeVehicles: 42,
      inventoryValue: 15600,
      lowStockItems: 3,
      averageJobValue: 0
    };
  } catch (error) {
    handleError(error, 'fetching dashboard metrics');
    // Return empty metrics on error
    return {
      totalRevenue: 0,
      pendingInvoices: 0,
      completedJobs: 0,
      activeJobs: 0,
      mechanicEfficiency: 0,
      monthlyRevenue: 0,
      monthlyExpenses: 0,
      monthlyProfit: 0,
      pendingTasks: 0,
      activeCustomers: 0,
      activeVehicles: 0,
      inventoryValue: 0,
      lowStockItems: 0,
      averageJobValue: 0
    };
  }
};

export const fetchCustomerAnalytics = async (customerId: string): Promise<CustomerAnalytics> => {
  try {
    // Perform database operations to calculate analytics
    // For now, return mock data
    return {
      totalInvoices: 5,
      lifetimeValue: 1250,
      averageInvoiceValue: 250,
      vehicles: [],
      invoiceHistory: [],
      customerId: "1"
    };
  } catch (error) {
    handleError(error, 'fetching customer analytics');
    return {
      totalInvoices: 0,
      lifetimeValue: 0,
      averageInvoiceValue: 0,
      vehicles: [],
      invoiceHistory: [],
      customerId: "0"
    };
  }
};

// Update invoice with proper error handling
export const updateInvoice = async (invoiceData: any) => {
  try {
    const { id, items, payments, ...invoiceFields } = invoiceData;
    
    // Update the main invoice record
    const { data: updatedInvoice, error: invoiceError } = await supabase
      .from('invoices')
      .update({
        ...invoiceFields,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();
      
    if (invoiceError) throw invoiceError;
    
    // Delete existing invoice items
    const { error: deleteItemsError } = await supabase
      .from('invoice_items')
      .delete()
      .eq('invoice_id', id);
      
    if (deleteItemsError) throw deleteItemsError;
    
    // Insert updated invoice items
    if (items && items.length > 0) {
      const itemsToInsert = items.map((item: any) => ({
        id: generateUUID(),
        invoice_id: id,
        description: item.description,
        type: item.type,
        quantity: item.quantity,
        price: item.price,
        part_id: item.part_id,
        task_id: item.task_id,
        is_auto_added: item.is_auto_added || false
      }));
      
      const { error: itemsError } = await supabase
        .from('invoice_items')
        .insert(itemsToInsert);
        
      if (itemsError) throw itemsError;
    }
    
    return updatedInvoice;
  } catch (error) {
    handleError(error, 'updating invoice');
    throw error;
  }
};
