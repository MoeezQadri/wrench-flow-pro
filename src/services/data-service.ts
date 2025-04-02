import { User, UserRole, RolePermissionMap as TypesRolePermissionMap, Expense, Vendor, Part, Mechanic, Task, Invoice, InvoiceItem, Customer, Vehicle, Attendance } from '@/types';

// Ensure we're using the correct RolePermissionMap type
export type { TypesRolePermissionMap as RolePermissionMap };

// Mock data arrays that need to be exported
export const mechanics: Mechanic[] = [];
export const tasks: Task[] = [];
export const invoices: Invoice[] = [];
export const customers: Customer[] = [];
export const parts: Part[] = [];
export const vendors: Vendor[] = [];
export const expenses: Expense[] = [];
export const attendance: Attendance[] = [];
export const users: User[] = [];
export const payments: any[] = []; // Using any until we have a proper Payment type

// Helper function to generate IDs
export const generateId = (prefix: string): string => {
  return `${prefix}-${Math.random().toString(36).substring(2, 10)}`;
};

// Data retrieval functions
export const getCustomers = (): Customer[] => {
  return customers;
};

export const getCustomerById = (id: string): Customer | undefined => {
  return customers.find(customer => customer.id === id);
};

export const getVehiclesByCustomerId = (customerId: string): Vehicle[] => {
  const customer = getCustomerById(customerId);
  return customer?.vehicles || [];
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

export const getMechanicById = (id: string): Mechanic | undefined => {
  return mechanics.find(mechanic => mechanic.id === id);
};

export const getVendorById = (id: string): Vendor | undefined => {
  return vendors.find(vendor => vendor.id === id);
};

export const getInvoiceById = (id: string): Invoice | undefined => {
  return invoices.find(invoice => invoice.id === id);
};

// Data creation functions
export const addCustomer = (customer: Omit<Customer, "id">): Customer => {
  const newCustomer: Customer = {
    id: generateId("customer"),
    ...customer,
    vehicles: [], // Initialize with empty array to avoid type errors
  };
  customers.push(newCustomer);
  return newCustomer;
};

export const addVehicle = (customerId: string, vehicle: Omit<Vehicle, "id" | "customerId">): Vehicle => {
  const customer = getCustomerById(customerId);
  if (!customer) throw new Error("Customer not found");
  
  const newVehicle: Vehicle = {
    id: generateId("vehicle"),
    customerId, // Set from parameter
    ...vehicle
  };
  
  if (!customer.vehicles) {
    customer.vehicles = [];
  }
  
  customer.vehicles.push(newVehicle);
  return newVehicle;
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
export const getCustomerAnalytics = (customerId: string) => {
  // Implement real analytics in a real app
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
    vehicles: getVehiclesByCustomerId(customerId),
    invoiceHistory: customerInvoices
  };
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

export const calculateDashboardMetrics = () => {
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
};

export const getExpensesByDateRange = (startDate: string, endDate: string): Expense[] => {
  // Filter expenses by date range in a real implementation
  return expenses.filter(expense => {
    const expenseDate = new Date(expense.date);
    return expenseDate >= new Date(startDate) && expenseDate <= new Date(endDate);
  });
};

export const getPaymentsByDateRange = (startDate: string, endDate: string): any[] => {
  // Filter payments by date range in a real implementation
  return payments.filter(payment => {
    const paymentDate = new Date(payment.date);
    return paymentDate >= new Date(startDate) && paymentDate <= new Date(endDate);
  });
};

export const getPayables = (): Expense[] => {
  // Return actual payables based on expenses that aren't paid
  return expenses.filter(e => e.paymentStatus !== 'paid');
};

export const getReceivables = (): Invoice[] => {
  // Return actual receivables based on unpaid invoices
  return invoices.filter(inv => inv.status !== 'paid');
};

export const getPartExpenses = () => {
  // Calculate expenses related to parts
  const partItems = expenses.filter(e => e.category === 'parts');
  const total = partItems.reduce((sum, item) => sum + item.amount, 0);
  
  return {
    total,
    items: partItems
  };
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
