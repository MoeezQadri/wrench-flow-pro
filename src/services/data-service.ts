import { supabase } from '@/integrations/supabase/client';
import {
  Customer,
  DashboardMetrics,
  Expense,
  Invoice,
  Mechanic,
  Organization,
  Part,
  RolePermissionMap,
  Task,
  User,
  Vehicle,
  Vendor,
  Attendance
} from '@/types';

// Function to generate a unique ID
export const generateId = (prefix: string): string => {
  return `${prefix}-${Math.random().toString(36).substring(2, 15)}`;
};

// Function to get the current user from local storage
export const getCurrentUser = (): User => {
  try {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  } catch (error) {
    console.error('Error getting current user from local storage:', error);
    return null;
  }
};

// Function to check if a user has a specific permission
export const hasPermission = (
  user: User | null,
  resource: keyof RolePermissionMap,
  action: string
): boolean => {
  if (!user) {
    return false;
  }

  try {
    const permissions = localStorage.getItem('permissions');
    if (!permissions) {
      return false;
    }

    const rolePermissions: RolePermissionMap = JSON.parse(permissions);
    if (!rolePermissions) {
      return false;
    }

    if (typeof rolePermissions[resource] === 'boolean') {
      return rolePermissions[resource] as boolean;
    }

    if (
      typeof rolePermissions[resource] === 'object' &&
      rolePermissions[resource] !== null &&
      typeof (rolePermissions[resource] as any)[action] === 'boolean'
    ) {
      return (rolePermissions[resource] as any)[action] as boolean;
    }

    return false;
  } catch (error) {
    console.error('Error checking permission:', error);
    return false;
  }
};

// Function to get dashboard metrics
export const getDashboardMetrics = async (): Promise<DashboardMetrics> => {
  // Mock data for now
  return {
    totalRevenue: 50000,
    pendingInvoices: 10,
    activeJobs: 5,
    mechanicEfficiency: 85,
    completedJobs: 20,
    monthlyRevenue: [4000, 4700, 6000, 8000, 7000, 9000],
    monthlyExpenses: [2000, 2500, 3000, 4000, 3500, 4500],
    monthlyProfit: [2000, 2200, 3000, 4000, 3500, 4500],
    activeCustomers: 30,
    vehicleCount: 50,
    customerCount: 40,
    averageJobValue: 500,
    inventoryValue: 10000,
    pendingTasks: 8,
    activeVehicles: 12,
    lowStockItems: 5,
  };
};

// Function to get customers
export const getCustomers = async (): Promise<Customer[]> => {
  try {
    const { data: customers, error } = await supabase
      .from('customers')
      .select('*');

    if (error) {
      throw error;
    }

    return customers || [];
  } catch (error) {
    console.error('Error fetching customers:', error);
    throw error;
  }
};

// Function to add a new customer
export const addCustomer = async (customer: Omit<Customer, 'id'>): Promise<Customer> => {
  try {
    const { data: newCustomer, error } = await supabase
      .from('customers')
      .insert([
        {
          ...customer,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ])
      .select()
      .single();

    if (error) {
      throw error;
    }

    return newCustomer as Customer;
  } catch (error) {
    console.error('Error adding customer:', error);
    throw error;
  }
};

// Function to get vehicles
export const getVehicles = async (): Promise<Vehicle[]> => {
  try {
    const { data: vehicles, error } = await supabase
      .from('vehicles')
      .select('*');

    if (error) {
      throw error;
    }

    return vehicles || [];
  } catch (error) {
    console.error('Error fetching vehicles:', error);
    throw error;
  }
};

// Function to add a new vehicle
export const addVehicle = async (vehicle: Omit<Vehicle, 'id'>): Promise<Vehicle> => {
  try {
    const { data: newVehicle, error } = await supabase
      .from('vehicles')
      .insert([
        {
          ...vehicle,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ])
      .select()
      .single();

    if (error) {
      throw error;
    }

    return newVehicle as Vehicle;
  } catch (error) {
    console.error('Error adding vehicle:', error);
    throw error;
  }
};

// Function to get mechanics
export const getMechanics = async (): Promise<Mechanic[]> => {
  try {
    const { data: mechanics, error } = await supabase
      .from('mechanics')
      .select('*');

    if (error) {
      throw error;
    }

    return mechanics || [];
  } catch (error) {
    console.error('Error fetching mechanics:', error);
    throw error;
  }
};

// Function to add a new mechanic
export const addMechanic = async (mechanic: Omit<Mechanic, 'id'>): Promise<Mechanic> => {
  try {
    const { data: newMechanic, error } = await supabase
      .from('mechanics')
      .insert([
        {
          ...mechanic,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ])
      .select()
      .single();

    if (error) {
      throw error;
    }

    return newMechanic as Mechanic;
  } catch (error) {
    console.error('Error adding mechanic:', error);
    throw error;
  }
};

// Function to get tasks
export const getTasks = async (): Promise<Task[]> => {
  try {
    const { data: tasks, error } = await supabase
      .from('tasks')
      .select('*');

    if (error) {
      throw error;
    }

    return tasks || [];
  } catch (error) {
    console.error('Error fetching tasks:', error);
    throw error;
  }
};

// Function to add a new task
export const addTask = async (task: Omit<Task, 'id'>): Promise<Task> => {
  try {
    const { data: newTask, error } = await supabase
      .from('tasks')
      .insert([
        {
          ...task,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ])
      .select()
      .single();

    if (error) {
      throw error;
    }

    return newTask as Task;
  } catch (error) {
    console.error('Error adding task:', error);
    throw error;
  }
};

// Function to get invoices
export const getInvoices = async (): Promise<Invoice[]> => {
  try {
    const { data: invoices, error } = await supabase
      .from('invoices')
      .select('*');

    if (error) {
      throw error;
    }

    return invoices || [];
  } catch (error) {
    console.error('Error fetching invoices:', error);
    throw error;
  }
};

// Function to get invoice by ID
export const getInvoiceById = async (id: string): Promise<Invoice | null> => {
  try {
    const { data: invoice, error } = await supabase
      .from('invoices')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      throw error;
    }

    return invoice || null;
  } catch (error) {
    console.error('Error fetching invoice:', error);
    throw error;
  }
};

// Function to add a new invoice
export const addInvoice = async (invoice: Omit<Invoice, 'id'>): Promise<Invoice> => {
  try {
    const { data: newInvoice, error } = await supabase
      .from('invoices')
      .insert([
        {
          ...invoice,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ])
      .select()
      .single();

    if (error) {
      throw error;
    }

    return newInvoice as Invoice;
  } catch (error) {
    console.error('Error adding invoice:', error);
    throw error;
  }
};

// Function to get expenses
export const getExpenses = async (): Promise<Expense[]> => {
  try {
    const { data: expenses, error } = await supabase
      .from('expenses')
      .select('*');

    if (error) {
      throw error;
    }

    return expenses || [];
  } catch (error) {
    console.error('Error fetching expenses:', error);
    throw error;
  }
};

// Function to add a new expense
export const addExpense = async (expense: Omit<Expense, 'id'>): Promise<Expense> => {
  try {
    const { data: newExpense, error } = await supabase
      .from('expenses')
      .insert([
        {
          ...expense,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ])
      .select()
      .single();

    if (error) {
      throw error;
    }

    return newExpense as Expense;
  } catch (error) {
    console.error('Error adding expense:', error);
    throw error;
  }
};

// Function to get vendors
export const getVendors = async (): Promise<Vendor[]> => {
  try {
    const { data: vendors, error } = await supabase
      .from('vendors')
      .select('*');

    if (error) {
      throw error;
    }

    return vendors || [];
  } catch (error) {
    console.error('Error fetching vendors:', error);
    throw error;
  }
};

// Function to get vendor by ID
export const getVendorById = async (id: string): Promise<Vendor | null> => {
  try {
    const { data: vendor, error } = await supabase
      .from('vendors')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      throw error;
    }

    return vendor || null;
  } catch (error) {
    console.error('Error fetching vendor:', error);
    throw error;
  }
};

// Function to add a new vendor
export const addVendor = async (vendor: Omit<Vendor, 'id'>): Promise<Vendor> => {
  try {
    const { data: newVendor, error } = await supabase
      .from('vendors')
      .insert([
        {
          ...vendor,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ])
      .select()
      .single();

    if (error) {
      throw error;
    }

    return newVendor as Vendor;
  } catch (error) {
    console.error('Error adding vendor:', error);
    throw error;
  }
};

// Function to get parts
export const getParts = async (): Promise<Part[]> => {
  try {
    const { data: parts, error } = await supabase
      .from('parts')
      .select('*');

    if (error) {
      throw error;
    }

    return parts || [];
  } catch (error) {
    console.error('Error fetching parts:', error);
    throw error;
  }
};

// Function to add a new part
export const addPart = async (part: Omit<Part, 'id'>): Promise<Part> => {
  try {
    const { data: newPart, error } = await supabase
      .from('parts')
      .insert([
        {
          ...part,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ])
      .select()
      .single();

    if (error) {
      throw error;
    }

    return newPart as Part;
  } catch (error) {
    console.error('Error adding part:', error);
    throw error;
  }
};

// Mock vendors data
export const vendors = [
  { id: 'vendor-1', name: 'Auto Parts Supplier' },
  { id: 'vendor-2', name: 'Global Auto Distributors' },
  { id: 'vendor-3', name: 'Premier Parts Inc.' },
];

// Mock roles data
export const roles = [
  {
    name: 'Superuser',
    permissions: {
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
      roles: { view: true, manage: true },
    },
  },
  {
    name: 'Owner',
    permissions: {
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
      roles: { view: true, manage: true },
    },
  },
  {
    name: 'Manager',
    permissions: {
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
      roles: { view: true, manage: true },
    },
  },
  {
    name: 'Foreman',
    permissions: {
      dashboard: true,
      customers: { view: true, manage: false },
      invoices: { view: true, manage: false },
      mechanics: { view: true, manage: false },
      tasks: { view: true, manage: true },
      parts: { view: true, manage: false },
      finance: { view: true, manage: false },
      expenses: { view: true, manage: false },
      reports: { view: true, manage: false },
      attendance: { view: true, manage: false, approve: false },
      settings: { view: true, manage: false },
      organization: { view: true, manage: false },
      users: { view: true, manage: false },
      subscription: { view: true, manage: false },
      vehicles: { view: true, manage: false },
      roles: { view: true, manage: false },
    },
  },
  {
    name: 'Mechanic',
    permissions: {
      dashboard: false,
      customers: { view: true, manage: false },
      invoices: { view: true, manage: false },
      mechanics: { view: true, manage: false },
      tasks: { view: true, manage: false },
      parts: { view: true, manage: false },
      finance: { view: true, manage: false },
      expenses: { view: true, manage: false },
      reports: { view: true, manage: false },
      attendance: { view: true, manage: false, approve: false },
      settings: { view: true, manage: false },
      organization: { view: true, manage: false },
      users: { view: true, manage: false },
      subscription: { view: true, manage: false },
      vehicles: { view: true, manage: false },
      roles: { view: true, manage: false },
    },
  },
];

// Record attendance function
export const recordAttendance = async (attendanceData: Partial<Attendance>) => {
  try {
    const { data, error } = await supabase
      .from('attendance')
      .insert([attendanceData])
      .select()
      .single();
      
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error recording attendance:', error);
    throw error;
  }
};
