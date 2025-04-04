
import { User, UserRole, RolePermissionMap as TypesRolePermissionMap, Expense, Vendor, Part, Mechanic, Task, Invoice, InvoiceItem, Customer, Vehicle, Attendance } from '@/types';
import * as supabaseService from './supabase-service';

// Ensure we're using the correct RolePermissionMap type
export type { TypesRolePermissionMap as RolePermissionMap };

// Storage for cached data from the database
export const mechanics: Mechanic[] = [];
export const tasks: Task[] = [];
export const invoices: Invoice[] = [];
export const customers: Customer[] = [];
export const parts: Part[] = [];
export const vendors: Vendor[] = [];
export const expenses: Expense[] = [];
export const attendance: Attendance[] = [];
export const users: User[] = [];
export const payments: any[] = [];

// Helper function to generate IDs
export const generateId = (prefix: string): string => {
  return `${prefix}-${Math.random().toString(36).substring(2, 10)}`;
};

// Data retrieval functions - now integrating with Supabase
export const getCustomers = async (): Promise<Customer[]> => {
  try {
    const fetchedCustomers = await supabaseService.fetchCustomers();
    // Update our cache
    customers.length = 0;
    customers.push(...fetchedCustomers);
    return fetchedCustomers;
  } catch (error) {
    console.error('Failed to fetch customers:', error);
    return customers; // Return cached data as fallback
  }
};

export const getCustomerById = async (id: string): Promise<Customer | undefined> => {
  try {
    const customer = await supabaseService.fetchCustomerById(id);
    return customer || undefined;
  } catch (error) {
    console.error(`Failed to fetch customer ${id}:`, error);
    return customers.find(customer => customer.id === id); // Fallback to cache
  }
};

export const getVehiclesByCustomerId = async (customerId: string): Promise<Vehicle[]> => {
  try {
    return await supabaseService.fetchVehiclesByCustomerId(customerId);
  } catch (error) {
    console.error(`Failed to fetch vehicles for customer ${customerId}:`, error);
    const customer = customers.find(c => c.id === customerId);
    return customer?.vehicles || [];
  }
};

export const getVehicleById = (vehicleId: string): Vehicle | undefined => {
  // Search through all customers for the vehicle
  for (const customer of customers) {
    if (customer.vehicles) {
      const vehicle = customer.vehicles.find(v => v.id === vehicleId);
      if (vehicle) return vehicle;
    }
  }
  return undefined;
};

export const getMechanicById = async (id: string): Promise<Mechanic | undefined> => {
  try {
    const mechanic = await supabaseService.fetchMechanicById(id);
    return mechanic || undefined;
  } catch (error) {
    console.error(`Failed to fetch mechanic ${id}:`, error);
    return mechanics.find(mechanic => mechanic.id === id); // Fallback to cache
  }
};

export const getVendorById = (id: string): Vendor | undefined => {
  return vendors.find(vendor => vendor.id === id);
};

export const getInvoiceById = async (id: string): Promise<Invoice | undefined> => {
  try {
    const invoice = await supabaseService.fetchInvoiceById(id);
    return invoice || undefined;
  } catch (error) {
    console.error(`Failed to fetch invoice ${id}:`, error);
    return invoices.find(invoice => invoice.id === id); // Fallback to cache
  }
};

// Data creation functions - now integrating with Supabase
export const addCustomer = async (customer: Omit<Customer, "id">): Promise<Customer> => {
  try {
    const newCustomer = await supabaseService.addCustomer(customer);
    customers.push(newCustomer); // Update cache
    return newCustomer;
  } catch (error) {
    console.error('Failed to add customer:', error);
    // Fallback to local creation for offline support
    const newCustomer: Customer = {
      id: generateId("customer"),
      ...customer,
      vehicles: [],
    };
    customers.push(newCustomer);
    return newCustomer;
  }
};

export const addVehicle = async (customerId: string, vehicle: Omit<Vehicle, "id" | "customerId">): Promise<Vehicle> => {
  try {
    const newVehicle = await supabaseService.addVehicle({
      customerId,
      ...vehicle
    });
    
    // Update local cache
    const customer = customers.find(c => c.id === customerId);
    if (customer) {
      if (!customer.vehicles) {
        customer.vehicles = [];
      }
      customer.vehicles.push(newVehicle);
    }
    
    return newVehicle;
  } catch (error) {
    console.error('Failed to add vehicle:', error);
    // Fallback to local creation
    const customer = customers.find(c => c.id === customerId);
    if (!customer) throw new Error("Customer not found");
    
    const newVehicle: Vehicle = {
      id: generateId("vehicle"),
      customerId,
      ...vehicle
    };
    
    if (!customer.vehicles) {
      customer.vehicles = [];
    }
    
    customer.vehicles.push(newVehicle);
    return newVehicle;
  }
};

export const addVendor = (vendor: Omit<Vendor, "id">): Vendor => {
  const newVendor: Vendor = {
    id: generateId("vendor"),
    ...vendor
  };
  vendors.push(newVendor);
  return newVendor;
};

// Analytics functions
export const getCustomerAnalytics = async (customerId: string) => {
  // Get the latest invoices for the customer
  try {
    await getInvoices(); // Make sure we have latest data
    
    // All below calculations work on the cached data
    const customerInvoices = invoices.filter(inv => inv.customerId === customerId);
    const totalSpent = customerInvoices.reduce((total, inv) => 
      total + calculateInvoiceTotal(inv).total, 0);
    
    return {
      totalSpent,
      invoiceCount: customerInvoices.length,
      lastVisit: customerInvoices.length > 0 
        ? Math.max(...customerInvoices.map(inv => new Date(inv.date).getTime())).toString()
        : null,
      // Additional data for CustomerDetail page
      lifetimeValue: totalSpent,
      totalInvoices: customerInvoices.length,
      averageInvoiceValue: customerInvoices.length > 0 ? totalSpent / customerInvoices.length : 0,
      vehicles: await getVehiclesByCustomerId(customerId),
      invoiceHistory: customerInvoices
    };
  } catch (error) {
    console.error(`Failed to get customer analytics for ${customerId}:`, error);
    // Fallback to local data
    const customerInvoices = invoices.filter(inv => inv.customerId === customerId);
    const totalSpent = customerInvoices.reduce((total, inv) => 
      total + calculateInvoiceTotal(inv).total, 0);
    
    return {
      totalSpent,
      invoiceCount: customerInvoices.length,
      lastVisit: customerInvoices.length > 0 
        ? Math.max(...customerInvoices.map(inv => new Date(inv.date).getTime())).toString()
        : null,
      // Additional data for CustomerDetail page
      lifetimeValue: totalSpent,
      totalInvoices: customerInvoices.length,
      averageInvoiceValue: customerInvoices.length > 0 ? totalSpent / customerInvoices.length : 0,
      vehicles: customers.find(c => c.id === customerId)?.vehicles || [],
      invoiceHistory: customerInvoices
    };
  }
};

export const calculateInvoiceTotal = (invoice: Invoice) => {
  const subtotal = invoice.items.reduce((total, item) => {
    return total + (item.price * item.quantity);
  }, 0);
  
  // Calculate tax amount
  const taxAmount = subtotal * (invoice.taxRate / 100);
  
  // Calculate total
  const total = subtotal + taxAmount;
  
  return {
    subtotal,
    taxAmount,
    total
  };
};

// Helper function to fetch invoices
export const getInvoices = async (): Promise<Invoice[]> => {
  try {
    const fetchedInvoices = await supabaseService.fetchInvoices();
    // Update our cache
    invoices.length = 0;
    invoices.push(...fetchedInvoices);
    return fetchedInvoices;
  } catch (error) {
    console.error('Failed to fetch invoices:', error);
    return invoices; // Return cached data as fallback
  }
};

// Helper function to fetch expenses
export const getExpenses = async (): Promise<Expense[]> => {
  try {
    const fetchedExpenses = await supabaseService.fetchExpenses();
    // Update our cache
    expenses.length = 0;
    expenses.push(...fetchedExpenses);
    return fetchedExpenses;
  } catch (error) {
    console.error('Failed to fetch expenses:', error);
    return expenses; // Return cached data as fallback
  }
};

// Helper function to fetch parts
export const getParts = async (): Promise<Part[]> => {
  try {
    const fetchedParts = await supabaseService.fetchParts();
    // Update our cache
    parts.length = 0;
    parts.push(...fetchedParts);
    return fetchedParts;
  } catch (error) {
    console.error('Failed to fetch parts:', error);
    return parts; // Return cached data as fallback
  }
};

// Helper function to fetch mechanics
export const getMechanics = async (): Promise<Mechanic[]> => {
  try {
    const fetchedMechanics = await supabaseService.fetchMechanics();
    // Update our cache
    mechanics.length = 0;
    mechanics.push(...fetchedMechanics);
    return fetchedMechanics;
  } catch (error) {
    console.error('Failed to fetch mechanics:', error);
    return mechanics; // Return cached data as fallback
  }
};

// Helper function to fetch tasks
export const getTasks = async (): Promise<Task[]> => {
  try {
    const fetchedTasks = await supabaseService.fetchTasks();
    // Update our cache
    tasks.length = 0;
    tasks.push(...fetchedTasks);
    return fetchedTasks;
  } catch (error) {
    console.error('Failed to fetch tasks:', error);
    return tasks; // Return cached data as fallback
  }
};

// Helper function to fetch attendance
export const getAttendance = async (): Promise<Attendance[]> => {
  try {
    const fetchedAttendance = await supabaseService.fetchAttendance();
    // Update our cache
    attendance.length = 0;
    attendance.push(...fetchedAttendance);
    return fetchedAttendance;
  } catch (error) {
    console.error('Failed to fetch attendance:', error);
    return attendance; // Return cached data as fallback
  }
};

export const calculateDashboardMetrics = async () => {
  try {
    await getInvoices(); // Make sure we have latest data
    
    const completedInvoices = invoices.filter(inv => inv.status === 'completed' || inv.status === 'paid');
    const pendingInvoices = invoices.filter(inv => inv.status === 'open' || inv.status === 'in-progress');
    
    return {
      totalRevenue: completedInvoices.reduce((total, inv) => total + calculateInvoiceTotal(inv).total, 0),
      pendingInvoices: pendingInvoices.length,
      activeCustomers: customers.length,
      completedTasks: tasks.filter(task => task.status === 'completed').length,
      activeJobs: pendingInvoices.length,
      mechanicEfficiency: 85 // Mock value, in a real app would be calculated
    };
  } catch (error) {
    console.error('Failed to calculate dashboard metrics:', error);
    // Fallback to local data
    const completedInvoices = invoices.filter(inv => inv.status === 'completed' || inv.status === 'paid');
    const pendingInvoices = invoices.filter(inv => inv.status === 'open' || inv.status === 'in-progress');
    
    return {
      totalRevenue: completedInvoices.reduce((total, inv) => total + calculateInvoiceTotal(inv).total, 0),
      pendingInvoices: pendingInvoices.length,
      activeCustomers: customers.length,
      completedTasks: tasks.filter(task => task.status === 'completed').length,
      activeJobs: pendingInvoices.length,
      mechanicEfficiency: 85 // Mock value, in a real app would be calculated
    };
  }
};

export const getExpensesByDateRange = async (startDate: string, endDate: string): Promise<Expense[]> => {
  try {
    await getExpenses(); // Make sure we have latest data
    
    // Filter expenses by date range using the cached data
    return expenses.filter(expense => {
      const expenseDate = new Date(expense.date);
      return expenseDate >= new Date(startDate) && expenseDate <= new Date(endDate);
    });
  } catch (error) {
    console.error(`Failed to get expenses from ${startDate} to ${endDate}:`, error);
    // Fallback to local data
    return expenses.filter(expense => {
      const expenseDate = new Date(expense.date);
      return expenseDate >= new Date(startDate) && expenseDate <= new Date(endDate);
    });
  }
};

export const getPaymentsByDateRange = (startDate: string, endDate: string): any[] => {
  // Filter payments by date range in a real implementation
  return payments.filter(payment => {
    const paymentDate = new Date(payment.date);
    return paymentDate >= new Date(startDate) && paymentDate <= new Date(endDate);
  });
};

export const getPayables = async (): Promise<Expense[]> => {
  try {
    await getExpenses(); // Make sure we have latest data
    
    // Return actual payables based on expenses that aren't paid
    return expenses.filter(e => e.paymentStatus !== 'paid');
  } catch (error) {
    console.error('Failed to get payables:', error);
    // Fallback to local data
    return expenses.filter(e => e.paymentStatus !== 'paid');
  }
};

export const getReceivables = async (): Promise<Invoice[]> => {
  try {
    await getInvoices(); // Make sure we have latest data
    
    // Return actual receivables based on unpaid invoices
    return invoices.filter(inv => inv.status !== 'paid');
  } catch (error) {
    console.error('Failed to get receivables:', error);
    // Fallback to local data
    return invoices.filter(inv => inv.status !== 'paid');
  }
};

export const getPartExpenses = async (): Promise<Expense[]> => {
  try {
    await getExpenses(); // Make sure we have latest data
    
    // Return expenses related to parts
    return expenses.filter(e => e.category === 'parts');
  } catch (error) {
    console.error('Failed to get part expenses:', error);
    // Fallback to local data
    return expenses.filter(e => e.category === 'parts');
  }
};

// Attendance functions
export const recordAttendance = (attendanceData: {
  mechanicId: string;
  date: string;
  checkIn: string;
  status?: 'pending' | 'approved' | 'rejected';
}): Attendance => {
  const newAttendance: Attendance = {
    id: generateId("attendance"),
    mechanicId: attendanceData.mechanicId,
    date: attendanceData.date,
    checkIn: attendanceData.checkIn,
    status: attendanceData.status || 'pending',
  };
  
  // Push the new attendance record to the array
  attendance.push(newAttendance);
  return newAttendance;
};

export const approveAttendance = (
  attendanceId: string
): boolean => {
  const record = attendance.find(a => a.id === attendanceId);
  if (record) {
    record.status = 'approved';
    return true;
  }
  return false;
};

// User functions
export const getCurrentUser = (): User => {
  const userString = localStorage.getItem('currentUser');
  if (userString) {
    try {
      return JSON.parse(userString);
    } catch (error) {
      console.error("Error parsing currentUser from localStorage:", error);
      return {
        id: 'guest',
        name: 'Guest User',
        email: 'guest@example.com',
        role: 'mechanic', // Default role
        isActive: false,
      };
    }
  }

  return {
    id: 'guest',
    name: 'Guest User',
    email: 'guest@example.com',
    role: 'mechanic', // Default role
    isActive: false,
  };
};

export const hasPermission = (
  user: User | null,
  resource: keyof TypesRolePermissionMap,
  action: string
): boolean => {
  if (!user) {
    return false;
  }

  const role = user.role;
  const rolePermissions = getRolePermissions(role);

  if (!rolePermissions || !rolePermissions[resource]) {
    return false;
  }

  const permission = rolePermissions[resource];

  if (typeof permission === 'boolean') {
    return permission;
  }

  if (typeof permission === 'object' && permission !== null && action in permission) {
    const actionPermission = (permission as any)[action];

    if (typeof actionPermission === 'boolean') {
      return actionPermission;
    }

    if (actionPermission === 'own') {
      // Example: Check if the user owns the resource
      // This will depend on your data structure and how you determine ownership
      // For example, if tasks have a mechanicId, you can check if user.mechanicId === task.mechanicId
      return true; // Replace with your ownership check logic
    }
  }

  return false;
};

type PermissionValue = boolean | 'own' | Record<string, boolean | 'own'>;

export const getRolePermissions = (role: UserRole): TypesRolePermissionMap | undefined => {
  const rolePermissions: Record<UserRole, TypesRolePermissionMap> = {
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
      tasks: { view: true, manage: true, assign: true, create: true, update: true },
      parts: { view: true, manage: false },
      finance: { view: false, manage: false },
      expenses: { view: false, manage: false },
      reports: { view: true, manage: false },
      attendance: { view: true, manage: true, approve: true, create: true, update: true },
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
      tasks: { view: true, manage: 'own' as any }, // Using 'as any' to fix the type error temporarily
      parts: { view: true, manage: false },
      finance: { view: false, manage: false },
      expenses: { view: false, manage: false },
      reports: { view: 'own' as any, manage: false }, // Using 'as any' to fix the type error temporarily
      attendance: { view: 'own' as any, manage: 'own' as any, approve: false }, // Using 'as any' to fix the type error temporarily
      settings: { view: false, manage: false },
      organization: { view: false, manage: false },
      users: { view: false, manage: false },
      subscription: { view: false, manage: false },
      vehicles: { view: true, manage: false },
      roles: { view: false, manage: false }
    }
  };

  return rolePermissions[role];
};

// Function to add expense that uses Supabase
export const addExpense = async (expense: Omit<Expense, 'id'>): Promise<Expense> => {
  try {
    const newExpense = await supabaseService.addExpense(expense);
    // Update local cache
    expenses.push(newExpense);
    return newExpense;
  } catch (error) {
    console.error('Failed to add expense:', error);
    // Fallback to local creation
    const newExpense: Expense = {
      id: generateId("expense"),
      ...expense
    };
    expenses.push(newExpense);
    return newExpense;
  }
};
