
import { User, RolePermissionMap, Customer, Vehicle, Vendor, Part, Invoice, InvoiceItem, Payment, Mechanic, Task, Expense, AttendanceRecord } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { createUserFromSession } from '@/utils/auth-utils';
import { toast } from 'sonner';

// =====================
// User & Authentication
// =====================

// Get the current user from local storage
export const getCurrentUser = (): User => {
  const userStr = localStorage.getItem('garage_user');
  if (!userStr) {
    // Return a default user if none is found
    return {
      id: '',
      name: 'Guest User',
      email: '',
      role: 'owner'
    };
  }
  try {
    return JSON.parse(userStr);
  } catch (e) {
    console.error('Error parsing user from localStorage:', e);
    return {
      id: '',
      name: 'Guest User',
      email: '',
      role: 'owner'
    };
  }
};

// Check if a user has permission for a specific action
export const hasPermission = (user: User | null, resource: string, action: string): boolean => {
  if (!user) return false;
  
  const permissions = rolePermissions[user.role as keyof typeof rolePermissions];
  if (!permissions) return false;

  const resourcePermission = permissions[resource as keyof typeof permissions];
  if (!resourcePermission) return false;

  if (typeof resourcePermission === 'boolean') {
    return resourcePermission;
  } else if (typeof resourcePermission === 'object') {
    const actionPermission = resourcePermission[action as keyof typeof resourcePermission];
    return !!actionPermission;
  }

  return false;
};

// Generate a unique ID
export const generateId = (): string => {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
};

// =====================
// Customers
// =====================

// Get all customers from Supabase
export const getCustomers = async (): Promise<Customer[]> => {
  try {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .order('name');

    if (error) {
      throw error;
    }

    return data as Customer[];
  } catch (error) {
    console.error('Error fetching customers:', error);
    throw error;
  }
};

// Get a customer by ID
export const getCustomerById = async (id: string): Promise<Customer> => {
  try {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      throw error;
    }

    return data as Customer;
  } catch (error) {
    console.error(`Error fetching customer with id ${id}:`, error);
    throw error;
  }
};

// Add a new customer
export const addCustomer = async (customerData: Partial<Customer>): Promise<Customer> => {
  try {
    const { data, error } = await supabase
      .from('customers')
      .insert([customerData])
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data as Customer;
  } catch (error) {
    console.error('Error adding customer:', error);
    throw error;
  }
};

// Update an existing customer
export const updateCustomer = async (id: string, customerData: Partial<Customer>): Promise<Customer> => {
  try {
    const { data, error } = await supabase
      .from('customers')
      .update(customerData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data as Customer;
  } catch (error) {
    console.error(`Error updating customer with id ${id}:`, error);
    throw error;
  }
};

// Delete a customer
export const deleteCustomer = async (id: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('customers')
      .delete()
      .eq('id', id);

    if (error) {
      throw error;
    }
  } catch (error) {
    console.error(`Error deleting customer with id ${id}:`, error);
    throw error;
  }
};

// =====================
// Vehicles
// =====================

// Get all vehicles
export const getVehicles = async (): Promise<Vehicle[]> => {
  try {
    const { data, error } = await supabase
      .from('vehicles')
      .select('*');

    if (error) {
      throw error;
    }

    return data as Vehicle[];
  } catch (error) {
    console.error('Error fetching vehicles:', error);
    throw error;
  }
};

// Get vehicles by customer ID
export const getVehiclesByCustomerId = async (customerId: string): Promise<Vehicle[]> => {
  try {
    const { data, error } = await supabase
      .from('vehicles')
      .select('*')
      .eq('customer_id', customerId);

    if (error) {
      throw error;
    }

    return data.map(vehicle => ({
      ...vehicle,
      customerId: vehicle.customer_id,
      licensePlate: vehicle.license_plate
    })) as Vehicle[];
  } catch (error) {
    console.error(`Error fetching vehicles for customer ${customerId}:`, error);
    throw error;
  }
};

// Add a new vehicle
export const addVehicle = async (customerId: string, vehicleData: Partial<Vehicle>): Promise<Vehicle> => {
  try {
    // Prepare the vehicle data for the database
    const dbVehicleData = {
      make: vehicleData.make,
      model: vehicleData.model,
      year: vehicleData.year,
      license_plate: vehicleData.licensePlate,
      vin: vehicleData.vin,
      color: vehicleData.color,
      customer_id: customerId
    };

    const { data, error } = await supabase
      .from('vehicles')
      .insert([dbVehicleData])
      .select()
      .single();

    if (error) {
      throw error;
    }

    // Convert the database response to our Vehicle type
    return {
      id: data.id,
      make: data.make,
      model: data.model,
      year: data.year,
      licensePlate: data.license_plate,
      vin: data.vin,
      color: data.color,
      customerId: data.customer_id,
      created_at: data.created_at,
      updated_at: data.updated_at
    };
  } catch (error) {
    console.error('Error adding vehicle:', error);
    throw error;
  }
};

// =====================
// Vendors
// =====================

// Mock vendors data for now, will be replaced with Supabase API calls
export const vendors: Vendor[] = [
  {
    id: '1',
    name: 'Parts Unlimited',
    contact_name: 'John Supplier',
    email: 'john@partsunlimited.com',
    phone: '555-1234',
    address: '123 Supplier St',
    category: 'Parts',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: '2',
    name: 'Auto Accessories',
    contact_name: 'Jane Vendor',
    email: 'jane@autoaccessories.com',
    phone: '555-5678',
    address: '456 Vendor Ave',
    category: 'Accessories',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

// Get a vendor by ID
export const getVendorById = async (id: string): Promise<Vendor | null> => {
  try {
    const { data, error } = await supabase
      .from('vendors')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw error;
    }

    return data as Vendor;
  } catch (error) {
    console.error(`Error fetching vendor with id ${id}:`, error);
    return null;
  }
};

// Add a new vendor
export const addVendor = async (vendorData: Omit<Vendor, 'id'>): Promise<Vendor> => {
  try {
    const { data, error } = await supabase
      .from('vendors')
      .insert([{
        name: vendorData.name,
        contact_name: vendorData.contact_name,
        email: vendorData.email,
        phone: vendorData.phone,
        address: vendorData.address,
        category: vendorData.category
      }])
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data as Vendor;
  } catch (error) {
    console.error('Error adding vendor:', error);
    throw error;
  }
};

// =====================
// Invoices
// =====================

// Get all invoices
export const getInvoices = async (): Promise<Invoice[]> => {
  try {
    const { data, error } = await supabase
      .from('invoices')
      .select(`
        *,
        customers:customer_id (name),
        vehicles:vehicle_id (make, model, license_plate)
      `);

    if (error) {
      throw error;
    }

    // Transform the response to match our Invoice type
    return data.map(invoice => ({
      id: invoice.id,
      customerId: invoice.customer_id,
      vehicleId: invoice.vehicle_id,
      date: invoice.date,
      due_date: invoice.due_date,
      status: invoice.status,
      tax_rate: invoice.tax_rate,
      notes: invoice.notes,
      created_at: invoice.created_at,
      updated_at: invoice.updated_at,
      customerInfo: {
        name: invoice.customers?.name || 'Unknown'
      },
      vehicleInfo: {
        make: invoice.vehicles?.make || 'Unknown',
        model: invoice.vehicles?.model || 'Unknown',
        licensePlate: invoice.vehicles?.license_plate || 'Unknown'
      }
    }));
  } catch (error) {
    console.error('Error fetching invoices:', error);
    throw error;
  }
};

// Get invoice by ID
export const getInvoiceById = async (id: string): Promise<Invoice | null> => {
  try {
    const { data, error } = await supabase
      .from('invoices')
      .select(`
        *,
        customers:customer_id (name),
        vehicles:vehicle_id (make, model, license_plate)
      `)
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw error;
    }

    // Get invoice items
    const { data: itemsData, error: itemsError } = await supabase
      .from('invoice_items')
      .select('*')
      .eq('invoice_id', id);

    if (itemsError) {
      throw itemsError;
    }

    // Get payments
    const { data: paymentsData, error: paymentsError } = await supabase
      .from('payments')
      .select('*')
      .eq('invoice_id', id);

    if (paymentsError) {
      throw paymentsError;
    }

    return {
      id: data.id,
      customerId: data.customer_id,
      vehicleId: data.vehicle_id,
      customer_id: data.customer_id,
      vehicle_id: data.vehicle_id,
      date: data.date,
      due_date: data.due_date,
      status: data.status,
      tax_rate: data.tax_rate,
      taxRate: data.tax_rate,
      notes: data.notes,
      created_at: data.created_at,
      updated_at: data.updated_at,
      items: itemsData as InvoiceItem[],
      payments: paymentsData as Payment[],
      customerInfo: {
        name: data.customers?.name || 'Unknown'
      },
      vehicleInfo: {
        make: data.vehicles?.make || 'Unknown',
        model: data.vehicles?.model || 'Unknown',
        licensePlate: data.vehicles?.license_plate || 'Unknown'
      }
    };
  } catch (error) {
    console.error(`Error fetching invoice with id ${id}:`, error);
    return null;
  }
};

// =====================
// Mechanics
// =====================

// Get all mechanics
export const getMechanics = async (): Promise<Mechanic[]> => {
  try {
    const { data, error } = await supabase
      .from('mechanics')
      .select('*');

    if (error) {
      throw error;
    }

    // Transform to match our Mechanic type
    return data.map(mechanic => ({
      id: mechanic.id,
      name: mechanic.name,
      specialization: mechanic.specialization,
      phone: mechanic.phone,
      address: mechanic.address,
      isActive: mechanic.is_active,
      id_card_image: mechanic.id_card_image,
      employment_type: mechanic.employment_type,
      user_id: mechanic.user_id,
      created_at: mechanic.created_at,
      updated_at: mechanic.updated_at
    }));
  } catch (error) {
    console.error('Error fetching mechanics:', error);
    throw error;
  }
};

// =====================
// Role Permissions
// =====================

export const rolePermissions: Record<string, RolePermissionMap> = {
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
    tasks: { view: true, manage: { assign: true, create: true, update: true } },
    parts: { view: true, manage: false },
    finance: { view: false, manage: false },
    expenses: { view: false, manage: false },
    reports: { view: true, manage: false },
    attendance: { view: true, manage: { create: true, update: true, approve: true } },
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
    tasks: { view: true, manage: { update: 'own' } },
    parts: { view: true, manage: false },
    finance: { view: false, manage: false },
    expenses: { view: false, manage: false },
    reports: { view: { view: 'own' }, manage: false },
    attendance: { view: { view: 'own' }, manage: { update: 'own' }, approve: false },
    settings: { view: false, manage: false },
    organization: { view: false, manage: false },
    users: { view: false, manage: false },
    subscription: { view: false, manage: false },
    vehicles: { view: true, manage: false },
    roles: { view: false, manage: false }
  }
};

// =====================
// Finance & Expenses
// =====================

// Get expenses
export const getExpenses = async (): Promise<Expense[]> => {
  try {
    const { data, error } = await supabase
      .from('expenses')
      .select('*')
      .order('date', { ascending: false });

    if (error) {
      throw error;
    }

    return data as Expense[];
  } catch (error) {
    console.error('Error fetching expenses:', error);
    throw error;
  }
};

// Get revenue data
export const getRevenueData = async (): Promise<any[]> => {
  try {
    // Calculate revenue from payments
    const { data, error } = await supabase
      .rpc('get_monthly_revenue');

    if (error) {
      // Fallback if RPC doesn't exist yet
      console.error('Error fetching revenue data:', error);
      return generateMockRevenueData();
    }

    return data || [];
  } catch (error) {
    console.error('Error fetching revenue data:', error);
    return generateMockRevenueData();
  }
};

// Helper function to generate mock revenue data
function generateMockRevenueData() {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const currentMonth = new Date().getMonth();
  
  return months.map((month, index) => {
    // Generate some sensible data
    const base = 5000;
    const variation = 2000;
    const isCurrentMonth = index === currentMonth;
    const isPastMonth = index < currentMonth;
    
    const revenue = isPastMonth ? base + Math.random() * variation : (isCurrentMonth ? (base + Math.random() * variation) / 2 : 0);
    const expenses = isPastMonth ? (revenue * 0.6) + (Math.random() * 1000) : (isCurrentMonth ? (revenue * 0.6) : 0);
    
    return {
      month,
      revenue,
      expenses,
      profit: revenue - expenses
    };
  });
}

// =====================
// Dashboard metrics
// =====================

// Calculate dashboard metrics
export const calculateDashboardMetrics = async () => {
  try {
    // In a real application, we'd have a proper SQL query or RPC function for this
    // For now, we'll make separate queries and combine the results
    
    // Get customer count
    const { count: customerCount, error: customerError } = await supabase
      .from('customers')
      .select('*', { count: 'exact', head: true });
    
    if (customerError) throw customerError;
    
    // Get active vehicle count
    const { count: vehicleCount, error: vehicleError } = await supabase
      .from('vehicles')
      .select('*', { count: 'exact', head: true });
    
    if (vehicleError) throw vehicleError;
    
    // Get pending tasks count
    const { count: pendingTasksCount, error: taskError } = await supabase
      .from('tasks')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending');
    
    if (taskError) throw taskError;
    
    // Get active jobs count
    const { count: activeJobsCount, error: activeJobsError } = await supabase
      .from('tasks')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'in-progress');
    
    if (activeJobsError) throw activeJobsError;
    
    // Get completed jobs count
    const { count: completedJobsCount, error: completedJobsError } = await supabase
      .from('tasks')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'completed');
    
    if (completedJobsError) throw completedJobsError;
    
    // Get pending invoices count
    const { count: pendingInvoicesCount, error: invoiceError } = await supabase
      .from('invoices')
      .select('*', { count: 'exact', head: true })
      .in('status', ['draft', 'pending']);
    
    if (invoiceError) throw invoiceError;
    
    // Get inventory value
    const { data: partsData, error: partsError } = await supabase
      .from('parts')
      .select('price, quantity');
    
    if (partsError) throw partsError;
    
    const inventoryValue = partsData.reduce((total, part) => total + (part.price * part.quantity), 0);
    
    // Get low stock items count
    const { count: lowStockCount, error: lowStockError } = await supabase
      .from('parts')
      .select('*', { count: 'exact', head: true })
      .lt('quantity', 10);
    
    if (lowStockError) throw lowStockError;
    
    // Get monthly data
    const revenueData = await getRevenueData();
    
    // Calculate mechanic efficiency (this is a simplified calculation)
    const mechanicEfficiency = 0.78; // 78% - in a real app, this would be calculated
    
    // Calculate average job value
    const { data: taskData, error: taskValueError } = await supabase
      .from('tasks')
      .select('price')
      .not('price', 'is', null);
    
    if (taskValueError) throw taskValueError;
    
    const totalTaskValue = taskData.reduce((sum, task) => sum + (task.price || 0), 0);
    const averageJobValue = taskData.length > 0 ? totalTaskValue / taskData.length : 0;
    
    return {
      customerCount: customerCount || 0,
      totalRevenue: revenueData.reduce((total, item) => total + item.revenue, 0),
      pendingInvoices: pendingInvoicesCount || 0,
      completedJobs: completedJobsCount || 0,
      activeJobs: activeJobsCount || 0,
      mechanicEfficiency,
      monthlyRevenue: revenueData.map(item => item.revenue),
      monthlyExpenses: revenueData.map(item => item.expenses),
      monthlyProfit: revenueData.map(item => item.profit),
      activeCustomers: customerCount || 0,
      vehicleCount: vehicleCount || 0,
      averageJobValue,
      inventoryValue,
      pendingTasks: pendingTasksCount || 0,
      activeVehicles: vehicleCount || 0,
      lowStockItems: lowStockCount || 0,
    };
  } catch (error) {
    console.error('Error calculating dashboard metrics:', error);
    // Return default values if there's an error
    return {
      totalRevenue: 0,
      pendingInvoices: 0,
      completedJobs: 0,
      activeJobs: 0,
      mechanicEfficiency: 0,
      monthlyRevenue: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      monthlyExpenses: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      monthlyProfit: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      activeCustomers: 0,
      vehicleCount: 0,
      customerCount: 0,
      averageJobValue: 0,
      inventoryValue: 0,
      pendingTasks: 0,
      activeVehicles: 0,
      lowStockItems: 0,
    };
  }
};
