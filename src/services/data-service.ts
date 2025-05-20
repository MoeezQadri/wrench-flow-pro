import { nanoid } from "nanoid";
import {
  fetchCustomers,
  fetchCustomerById,
  addCustomer as addCustomerToDb,
  fetchVehiclesByCustomerId,
  addVehicle as addVehicleToDb,
  fetchInvoices,
  fetchInvoiceById,
  fetchMechanics,
  fetchMechanicById,
  fetchExpenses,
  fetchParts,
  fetchTasks,
  fetchAttendance,
  recordAttendanceInDb
} from './supabase-service';

import { 
  Customer, 
  Vehicle, 
  Mechanic, 
  Invoice, 
  InvoiceItem, 
  Part, 
  Task, 
  User, 
  UserRole, 
  Expense, 
  Attendance, 
  Payment,
  DashboardMetrics,
  CustomerAnalytics,
  rolePermissions,
  PermissionValue,
  BasePermission,
  InvoiceStatus
} from '@/types';

// Mock data - will be used as fallback
export let customers: Customer[] = [
  {
    id: 'customer_1',
    name: 'John Doe',
    email: 'john@example.com',
    phone: '123-456-7890',
    address: '123 Main St',
    vehicles: [],
    totalVisits: 5,
    lifetimeValue: 1000,
    lastVisit: '2023-04-01'
  },
  {
    id: 'customer_2',
    name: 'Jane Smith',
    email: 'jane@example.com',
    phone: '987-654-3210',
    address: '456 Elm St',
    vehicles: [],
    totalVisits: 3,
    lifetimeValue: 500,
    lastVisit: '2023-04-02'
  }
];

export let vehicles: Vehicle[] = [
  {
    id: 'vehicle_1',
    customerId: 'customer_1',
    make: 'Toyota',
    model: 'Camry',
    year: '2020',
    licensePlate: 'ABC123',
    vin: '1HGBH41JXMN109186',
    color: 'Blue'
  },
  {
    id: 'vehicle_2',
    customerId: 'customer_2',
    make: 'Honda',
    model: 'Civic',
    year: '2019',
    licensePlate: 'XYZ789',
    vin: '2HGBH41JXMN109186',
    color: 'Red'
  }
];

// Initialize customer vehicles properly
customers.forEach(customer => {
  customer.vehicles = vehicles.filter(vehicle => vehicle.customerId === customer.id);
});

export let mechanics: Mechanic[] = [
  {
    id: 'mech_1',
    name: 'Mike Johnson',
    specialization: 'Engine Specialist',
    address: '789 Oak St',
    phone: '555-555-5555',
    idCardImage: 'path/to/image.jpg',
    employmentType: 'fulltime',
    isActive: true
  },
  {
    id: 'mech_2',
    name: 'Sara Connor',
    specialization: 'Transmission Specialist',
    address: '321 Pine St',
    phone: '444-444-4444',
    idCardImage: 'path/to/image.jpg',
    employmentType: 'contractor',
    isActive: true
  }
];

export interface Vendor {
  id: string;
  name: string;
  contactName: string;
  email: string;
  phone: string;
  address: string;
}

export let vendors: Vendor[] = [
  {
    id: 'vendor_1',
    name: 'Auto Parts Co.',
    contactName: 'Alice',
    email: 'alice@autoparts.com',
    phone: '111-222-3333',
    address: '123 Auto St'
  },
  {
    id: 'vendor_2',
    name: 'Tire Supplier Inc.',
    contactName: 'Bob',
    email: 'bob@tiresupplier.com',
    phone: '444-555-6666',
    address: '456 Tire Ave'
  }
];

export let parts: Part[] = [
  {
    id: 'part_1',
    name: 'Oil Filter',
    price: 10,
    quantity: 100,
    description: 'High quality oil filter',
    vendorId: 'vendor_1',
    vendorName: 'Auto Parts Co.',
    partNumber: 'OF123',
    reorderLevel: 20
  },
  {
    id: 'part_2',
    name: 'Brake Pads',
    price: 50,
    quantity: 50,
    description: 'Durable brake pads',
    vendorId: 'vendor_2',
    vendorName: 'Tire Supplier Inc.',
    partNumber: 'BP456',
    reorderLevel: 10
  }
];

export let tasks: Task[] = [
  {
    id: 'task_1',
    title: 'Oil Change',
    description: 'Change the oil and filter',
    mechanicId: 'mech_1',
    status: 'completed',
    hoursEstimated: 1,
    hoursSpent: 0.5,
    invoiceId: 'invoice_1',
    vehicleId: 'vehicle_1',
    location: 'workshop',
    price: 50,
    startTime: '2023-04-01T10:00:00Z',
    endTime: '2023-04-01T11:00:00Z',
    completedBy: 'user_1',
    completedAt: '2023-04-01T11:00:00Z'
  },
  {
    id: 'task_2',
    title: 'Brake Inspection',
    description: 'Inspect and replace brake pads',
    mechanicId: 'mech_2',
    status: 'in-progress',
    hoursEstimated: 2,
    hoursSpent: 1,
    invoiceId: 'invoice_2',
    vehicleId: 'vehicle_2',
    location: 'onsite',
    price: 100,
    startTime: '2023-04-02T09:00:00Z',
    endTime: '',
    completedBy: '',
    completedAt: ''
  }
];

export let invoices: Invoice[] = [
  {
    id: 'invoice_1',
    customerId: 'customer_1',
    vehicleId: 'vehicle_1',
    vehicleInfo: {
      make: 'Toyota',
      model: 'Camry',
      year: '2020',
      licensePlate: 'ABC123'
    },
    status: 'open',
    date: '2023-04-01',
    notes: 'First invoice',
    taxRate: 0.1,
    items: [],
    payments: []
  },
  {
    id: 'invoice_2',
    customerId: 'customer_2',
    vehicleId: 'vehicle_2',
    vehicleInfo: {
      make: 'Honda',
      model: 'Civic',
      year: '2019',
      licensePlate: 'XYZ789'
    },
    status: 'in-progress',
    date: '2023-04-02',
    notes: 'Second invoice',
    taxRate: 0.1,
    items: [],
    payments: []
  }
];

export let expenses: Expense[] = [
  {
    id: 'expense_1',
    date: '2023-04-01',
    category: 'Maintenance',
    amount: 200,
    description: 'Oil change and filter replacement',
    paymentMethod: 'card', // Updated from 'credit card' to match type
    paymentStatus: 'paid',
    vendorId: 'vendor_1',
    vendorName: 'Auto Parts Co.'
  },
  {
    id: 'expense_2',
    date: '2023-04-02',
    category: 'Parts',
    amount: 150,
    description: 'Brake pads purchase',
    paymentMethod: 'cash',
    paymentStatus: 'pending',
    vendorId: 'vendor_2',
    vendorName: 'Tire Supplier Inc.'
  }
];

export let attendanceRecords: Attendance[] = [
  {
    id: 'attendance_1',
    mechanicId: 'mech_1',
    date: '2023-04-01',
    checkIn: '09:00',
    checkOut: '17:00',
    status: 'approved',
    approvedBy: 'user_1',
    notes: 'Full day'
  },
  {
    id: 'attendance_2',
    mechanicId: 'mech_2',
    date: '2023-04-02',
    checkIn: '09:00',
    checkOut: '15:00',
    status: 'pending',
    approvedBy: '',
    notes: 'Half day'
  }
];

// Export payments data from invoices for use in reports
export let payments: Payment[] = invoices.flatMap(invoice => invoice.payments);

// Helper functions
export const generateId = (prefix: string): string => `${prefix}_${nanoid(8)}`;

// Current user simulation - in a real app, this would come from auth
let currentUser: User = {
  id: 'user_1',
  name: 'John Doe',
  email: 'john@example.com',
  role: 'manager' as UserRole,
  isActive: true,
  lastLogin: '2023-04-01'
};

export const getCurrentUser = (): User => {
  return currentUser;
};

export const setCurrentUser = (user: User): void => {
  currentUser = user;
};

// Permission check helper
export function hasPermission(
  user: User,
  resource: string,
  action: string
): boolean {
  const permissions = rolePermissions[user.role];
  if (!permissions) return false;
  const resourcePermissions = permissions[resource];
  if (!resourcePermissions) return false;
  return resourcePermissions[action] === true || resourcePermissions[action] === 'own';
}

// Export the role permissions for use in sidebar/components
export { rolePermissions };
export type { RolePermissionMap } from '@/types';

// Creating mock users list
export const users: User[] = [
  {
    id: 'user_1',
    name: 'John Doe',
    email: 'john@example.com',
    role: 'manager',
    isActive: true,
    lastLogin: '2023-04-01',
    organizationId: 'org_1'
  },
  {
    id: 'user_2',
    name: 'Jane Smith',
    email: 'jane@example.com',
    role: 'owner',
    isActive: true,
    lastLogin: '2023-04-02',
    organizationId: 'org_1'
  },
  {
    id: 'user_3',
    name: 'Bob Johnson',
    email: 'bob@example.com',
    role: 'mechanic',
    isActive: true,
    mechanicId: 'mech_1',
    lastLogin: '2023-04-03',
    organizationId: 'org_1'
  },
  {
    id: 'user_4',
    name: 'Alice Williams',
    email: 'alice@example.com',
    role: 'foreman',
    isActive: true,
    lastLogin: '2023-04-04',
    organizationId: 'org_1'
  }
];

// ======================
// Customer functions
// ======================
export const getCustomers = async (): Promise<Customer[]> => {
  try {
    const data = await fetchCustomers();
    return data;
  } catch (error) {
    console.error("Error fetching customers:", error);
    return customers; // Return mock data as fallback
  }
};

// Modified to not return a Promise for direct use in components
export const getCustomerById = (id: string): Customer | null => {
  const customer = customers.find(c => c.id === id);
  return customer || null;
};

// Keep the async version as a separate function
export const fetchCustomerByIdAsync = async (id: string): Promise<Customer | null> => {
  try {
    return await fetchCustomerById(id);
  } catch (error) {
    console.error("Error fetching customer by ID:", error);
    return getCustomerById(id); // Use mock data as fallback
  }
};

export const addCustomer = async (customerData: Omit<Customer, 'id' | 'vehicles' | 'totalVisits' | 'lifetimeValue' | 'lastVisit'>): Promise<Customer> => {
  try {
    return await addCustomerToDb(customerData);
  } catch (error) {
    console.error("Error adding customer:", error);
    const newCustomer: Customer = {
      id: generateId('customer'),
      ...customerData,
      vehicles: [],
      totalVisits: 0,
      lifetimeValue: 0,
      lastVisit: ''
    };
    customers.push(newCustomer);
    return newCustomer;
  }
};

// ======================
// Vehicle functions
// ======================
export const getVehiclesByCustomerId = (customerId: string): Vehicle[] => {
  return vehicles.filter(vehicle => vehicle.customerId === customerId);
};

export const fetchVehiclesByCustomerIdAsync = async (customerId: string): Promise<Vehicle[]> => {
  try {
    const data = await fetchVehiclesByCustomerId(customerId);
    
    // Ensure data is mapped to the correct Vehicle type
    return data.map(vehicle => ({
      id: vehicle.id,
      customerId: vehicle.customerId || vehicle.customer_id || customerId, // Handle both naming conventions
      make: vehicle.make,
      model: vehicle.model,
      year: vehicle.year,
      licensePlate: vehicle.licensePlate || vehicle.license_plate || '', // Handle both naming conventions
      vin: vehicle.vin,
      color: vehicle.color
    }));
  } catch (error) {
    console.error("Error fetching vehicles by customer ID:", error);
    return getVehiclesByCustomerId(customerId); // Use mock data as fallback
  }
};

export const getVehicleById = (id: string): Vehicle | null => {
  const vehicle = vehicles.find(v => v.id === id);
  return vehicle || null;
};

export const addVehicle = async (customerId: string, vehicleData: Omit<Vehicle, 'id' | 'customerId'>): Promise<Vehicle> => {
  try {
    return await addVehicleToDb({ ...vehicleData, customerId });
  } catch (error) {
    console.error("Error adding vehicle:", error);
    // Fallback to mock data
    const newVehicle: Vehicle = {
      id: generateId('vehicle'),
      customerId,
      ...vehicleData
    };
    vehicles.push(newVehicle);
    return newVehicle;
  }
};

// ======================
// Invoice functions
// ======================
export const getInvoices = async (): Promise<Invoice[]> => {
  try {
    const data = await fetchInvoices();
    
    // Ensure data is mapped to the correct Invoice type
    return data.map(invoice => ({
      id: invoice.id,
      customerId: invoice.customerId || invoice.customer_id,
      vehicleId: invoice.vehicleId || invoice.vehicle_id,
      vehicleInfo: {
        make: invoice.vehicleInfo?.make || '',
        model: invoice.vehicleInfo?.model || '',
        year: invoice.vehicleInfo?.year || '',
        licensePlate: invoice.vehicleInfo?.licensePlate || invoice.vehicleInfo?.license_plate || ''
      },
      status: invoice.status as InvoiceStatus,
      date: invoice.date,
      items: invoice.items || [],
      notes: invoice.notes || '',
      taxRate: invoice.taxRate || invoice.tax_rate,
      payments: invoice.payments || []
    }));
  } catch (error) {
    console.error("Error fetching invoices:", error);
    return invoices; // Return mock data as fallback
  }
};

export const getInvoiceById = (id: string): Invoice | null => {
  const invoice = invoices.find(i => i.id === id);
  return invoice || null;
};

export const calculateInvoiceTotal = (invoice: Invoice): { 
  subtotal: number; 
  tax: number; 
  total: number; 
  paidAmount: number;
  balanceDue: number;
} => {
  const subtotal = invoice.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const tax = subtotal * invoice.taxRate;
  const total = subtotal + tax;
  const paidAmount = invoice.payments.reduce((sum, payment) => sum + payment.amount, 0);
  const balanceDue = total - paidAmount;
  return { subtotal, tax, total, paidAmount, balanceDue };
};

// ======================
// Mechanic functions 
// ======================
export const getMechanics = async (): Promise<Mechanic[]> => {
  try {
    const data = await fetchMechanics();
    
    // Ensure data is mapped to the correct Mechanic type
    return data.map(mechanic => ({
      id: mechanic.id,
      name: mechanic.name,
      specialization: mechanic.specialization || '',
      address: mechanic.address || '',
      phone: mechanic.phone || '',
      idCardImage: mechanic.idCardImage || mechanic.id_card_image || '',
      employmentType: (mechanic.employmentType || mechanic.employment_type || 'fulltime') as 'fulltime' | 'contractor',
      isActive: mechanic.isActive !== undefined ? mechanic.isActive : !!mechanic.is_active
    }));
  } catch (error) {
    console.error("Error fetching mechanics:", error);
    return mechanics; // Return mock data as fallback
  }
};

export const getMechanicById = (id: string): Mechanic | null => {
  const mechanic = mechanics.find(m => m.id === id);
  return mechanic || null;
};

// ======================
// Dashboard functions
// ======================
export const getDashboardMetrics = async (): Promise<DashboardMetrics> => {
  // Placeholder for actual metrics calculation
  return {
    totalRevenue: 10000,
    pendingInvoices: 5,
    completedJobs: 20,
    activeJobs: 10,
    mechanicEfficiency: 85
  };
};

// Add the missing calculateDashboardMetrics function
export const calculateDashboardMetrics = (): DashboardMetrics => {
  return {
    totalRevenue: 0,
    pendingInvoices: 0,
    completedJobs: 0,
    activeJobs: 0,
    mechanicEfficiency: 0
  };
};

// Add the missing getExpensesByDateRange function
export const getExpensesByDateRange = (startDate: string, endDate: string): Expense[] => {
  return expenses.filter(expense => {
    const expenseDate = new Date(expense.date);
    const start = new Date(startDate);
    const end = new Date(endDate);
    return expenseDate >= start && expenseDate <= end;
  });
};

// Async version
export const getExpensesByDateRangeAsync = async (startDate: string, endDate: string): Promise<Expense[]> => {
  return getExpensesByDateRange(startDate, endDate);
};

// ======================
// Customer analytics
// ======================
export const getCustomerAnalytics = (customerId: string): CustomerAnalytics => {
  // Placeholder for actual analytics calculation
  return {
    totalInvoices: 0,
    lifetimeValue: 0,
    averageInvoiceValue: 0,
    firstVisitDate: '',
    lastVisitDate: '',
    vehicles: [],
    invoiceHistory: []
  };
};

// ======================
// Expense functions
// ======================
export const getExpenses = (): Expense[] => {
  return expenses;
};

// Async version
export const getExpensesAsync = async (): Promise<Expense[]> => {
  try {
    const data = await fetchExpenses();
    
    // Ensure data is mapped to the correct Expense type
    return data.map(expense => ({
      id: expense.id,
      date: expense.date,
      category: expense.category,
      amount: expense.amount,
      description: expense.description || '',
      paymentMethod: (expense.paymentMethod || expense.payment_method) as 'cash' | 'card' | 'bank-transfer',
      paymentStatus: (expense.paymentStatus || expense.payment_status) as 'paid' | 'pending' | 'overdue',
      vendorId: expense.vendorId || expense.vendor_id,
      vendorName: expense.vendorName || expense.vendor_name
    }));
  } catch (error) {
    console.error("Error fetching expenses:", error);
    return expenses; // Return mock data as fallback
  }
};

// ======================
// Part functions
// ======================
export const getParts = async (): Promise<Part[]> => {
  try {
    return await fetchParts();
  } catch (error) {
    console.error("Error fetching parts:", error);
    return parts; // Return mock data as fallback
  }
};

// ======================
// Task functions
// ======================
export const getTasks = async (): Promise<Task[]> => {
  try {
    const data = await fetchTasks();
    
    // Ensure data is mapped to the correct Task type
    return data.map(task => ({
      id: task.id,
      title: task.title,
      description: task.description || '',
      mechanicId: task.mechanicId || task.mechanic_id,
      status: task.status as 'pending' | 'in-progress' | 'completed',
      hoursEstimated: task.hoursEstimated || task.hours_estimated,
      hoursSpent: task.hoursSpent || task.hours_spent,
      invoiceId: task.invoiceId || task.invoice_id,
      vehicleId: task.vehicleId || task.vehicle_id,
      location: task.location || 'workshop',
      price: task.price || 0,
      startTime: task.startTime || task.start_time || '',
      endTime: task.endTime || task.end_time || '',
      completedBy: task.completedBy || task.completed_by || '',
      completedAt: task.completedAt || task.completed_at || ''
    }));
  } catch (error) {
    console.error("Error fetching tasks:", error);
    return tasks; // Return mock data as fallback
  }
};

// ======================
// Attendance functions
// ======================
export const getAttendance = async (): Promise<Attendance[]> => {
  try {
    const data = await fetchAttendance();
    
    // Ensure data is mapped to the correct Attendance type
    return data.map(attendance => ({
      id: attendance.id,
      mechanicId: attendance.mechanicId || attendance.mechanic_id,
      date: attendance.date,
      checkIn: attendance.checkIn || attendance.check_in,
      checkOut: attendance.checkOut || attendance.check_out,
      status: attendance.status as 'pending' | 'approved' | 'rejected',
      approvedBy: attendance.approvedBy || attendance.approved_by,
      notes: attendance.notes || ''
    }));
  } catch (error) {
    console.error("Error fetching attendance:", error);
    return attendanceRecords; // Return mock data as fallback
  }
};

// Export for direct use in components
export const attendance = attendanceRecords;

// Missing function implementations
export const addVendor = (vendorData: Omit<Vendor, 'id'>): Vendor => {
  const newVendor: Vendor = {
    id: generateId('vendor'),
    ...vendorData
  };
  vendors.push(newVendor);
  return newVendor;
};

export const recordAttendance = (attendanceData: Omit<Attendance, 'id'>, userId?: string): Attendance => {
  try {
    // Try to use the Supabase function if available
    return recordAttendanceInDb(attendanceData) as any;
  } catch (error) {
    console.error("Error recording attendance in database:", error);
    
    // Fall back to mock data
    const newAttendance: Attendance = {
      id: generateId('attendance'),
      ...attendanceData,
      mechanicId: userId || attendanceData.mechanicId
    };
    attendanceRecords.push(newAttendance);
    return newAttendance;
  }
};

export const approveAttendance = (attendanceId: string, approverId: string): Attendance | null => {
  const attendance = attendanceRecords.find(a => a.id === attendanceId);
  if (attendance) {
    attendance.status = 'approved';
    attendance.approvedBy = approverId;
    return attendance;
  }
  return null;
};

// Missing Finance-related functions
export const getPartExpenses = async (): Promise<any[]> => {
  return [];
};

export const getPayables = async (): Promise<any[]> => {
  return [];
};

export const getReceivables = async (): Promise<any[]> => {
  return [];
};

export const getPaymentsByDateRange = (startDate: string, endDate: string): Payment[] => {
  return payments.filter(payment => {
    const paymentDate = new Date(payment.date);
    const start = new Date(startDate);
    const end = new Date(endDate);
    return paymentDate >= start && paymentDate <= end;
  });
};

export const addExpense = async (expenseData: Omit<Expense, 'id'>): Promise<Expense> => {
  const newExpense: Expense = {
    id: generateId('exp'),
    ...expenseData
  };
  expenses.push(newExpense);
  return newExpense;
};

export const getVendorById = (id: string): Vendor | null => {
  return vendors.find(vendor => vendor.id === id) || null;
};
