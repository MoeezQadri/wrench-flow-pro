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
  BasePermission
} from '@/types';

// Mock data - will be used as fallback
let customers: Customer[] = [
  {
    id: 'cust_1',
    name: 'John Doe',
    email: 'john.doe@example.com',
    phone: '555-1234',
    address: '123 Main St',
    vehicles: [], // Updated to be Vehicle[] instead of string[]
    totalVisits: 3,
    lifetimeValue: 350.00,
    lastVisit: '2023-04-01'
  },
  {
    id: 'cust_2',
    name: 'Jane Smith',
    email: 'jane.smith@example.com',
    phone: '555-5678',
    address: '456 Elm St',
    vehicles: [], // Updated to be Vehicle[] instead of string[]
    totalVisits: 1,
    lifetimeValue: 120.50,
    lastVisit: '2023-04-15'
  },
  {
    id: 'cust_3',
    name: 'Robert Johnson',
    email: 'robert.johnson@example.com',
    phone: '555-9012',
    address: '789 Oak St',
    vehicles: [],
    totalVisits: 5,
    lifetimeValue: 675.25,
    lastVisit: '2023-03-20'
  },
  {
    id: 'cust_4',
    name: 'Emily Brown',
    email: 'emily.brown@example.com',
    phone: '555-3456',
    address: '321 Pine St',
    vehicles: [], // Updated to be Vehicle[] instead of string[]
    totalVisits: 2,
    lifetimeValue: 240.75,
    lastVisit: '2023-04-10'
  },
  {
    id: 'cust_5',
    name: 'Michael Wilson',
    email: 'michael.wilson@example.com',
    phone: '555-7890',
    address: '654 Maple St',
    vehicles: [],
    totalVisits: 4,
    lifetimeValue: 450.00,
    lastVisit: '2023-03-28'
  }
];

let vehicles: Vehicle[] = [
  {
    id: 'veh_1',
    customerId: 'cust_1',
    make: 'Toyota',
    model: 'Camry',
    year: '2018',
    licensePlate: 'ABC-123'
  },
  {
    id: 'veh_2',
    customerId: 'cust_1',
    make: 'Honda',
    model: 'Civic',
    year: '2020',
    licensePlate: 'DEF-456'
  },
  {
    id: 'veh_3',
    customerId: 'cust_2',
    make: 'Ford',
    model: 'F-150',
    year: '2019',
    licensePlate: 'GHI-789'
  },
  {
    id: 'veh_4',
    customerId: 'cust_4',
    make: 'Chevrolet',
    model: 'Malibu',
    year: '2021',
    licensePlate: 'JKL-012'
  },
  {
    id: 'veh_5',
    customerId: 'cust_4',
    make: 'Nissan',
    model: 'Altima',
    year: '2022',
    licensePlate: 'MNO-345'
  }
];

// Initialize customer vehicles properly
customers.forEach(customer => {
  customer.vehicles = vehicles.filter(vehicle => vehicle.customerId === customer.id);
});

let mechanics: Mechanic[] = [
  {
    id: 'mech_1',
    name: 'Alice Johnson',
    specialization: 'Engine Repair',
    address: '789 Pine St',
    phone: '555-4321',
    employmentType: 'fulltime',
    isActive: true
  },
  {
    id: 'mech_2',
    name: 'Bob Smith',
    specialization: 'Brakes & Suspension',
    address: '321 Oak St',
    phone: '555-8765',
    employmentType: 'contractor',
    isActive: true
  },
  {
    id: 'mech_3',
    name: 'Charlie Brown',
    specialization: 'Electrical Systems',
    address: '987 Maple St',
    phone: '555-2109',
    employmentType: 'fulltime',
    isActive: false
  },
  {
    id: 'mech_4',
    name: 'Diana Miller',
    specialization: 'Transmission',
    address: '654 Elm St',
    phone: '555-6543',
    employmentType: 'contractor',
    isActive: true
  },
  {
    id: 'mech_5',
    name: 'Ethan Davis',
    specialization: 'General Maintenance',
    address: '321 Cherry St',
    phone: '555-0987',
    employmentType: 'fulltime',
    isActive: true
  }
];

interface Vendor {
  id: string;
  name: string;
  contactName: string;
  email: string;
  phone: string;
  address: string;
}

let vendors: Vendor[] = [
  {
    id: 'ven_1',
    name: 'Auto Parts Supplier',
    contactName: 'Tom Williams',
    email: 'tom.williams@autoparts.com',
    phone: '555-1122',
    address: '111 Commerce St'
  },
  {
    id: 'ven_2',
    name: 'Tire Wholesalers Inc.',
    contactName: 'Sarah Lee',
    email: 'sarah.lee@tirewholesalers.com',
    phone: '555-3344',
    address: '222 Industrial Ave'
  },
  {
    id: 'ven_3',
    name: 'Oils & Lubes Co.',
    contactName: 'Mike Brown',
    email: 'mike.brown@oilsandlubes.com',
    phone: '555-5566',
    address: '333 Distribution Rd'
  },
  {
    id: 'ven_4',
    name: 'Battery Solutions Ltd.',
    contactName: 'Lisa Green',
    email: 'lisa.green@batterysolutions.com',
    phone: '555-7788',
    address: '444 Energy Ln'
  },
  {
    id: 'ven_5',
    name: 'Brakes & More Corp.',
    contactName: 'Kevin White',
    email: 'kevin.white@brakesandmore.com',
    phone: '555-9900',
    address: '555 Safety Blvd'
  }
];

let parts: Part[] = [
  {
    id: 'part_1',
    name: 'Oil Filter',
    price: 8.99,
    quantity: 150,
    description: 'Standard oil filter for most vehicles',
    vendorId: 'ven_1',
    vendorName: 'Auto Parts Supplier',
    partNumber: 'OF123'
  },
  {
    id: 'part_2',
    name: 'Brake Pads (Set)',
    price: 24.50,
    quantity: 75,
    description: 'Set of front brake pads',
    vendorId: 'ven_5',
    vendorName: 'Brakes & More Corp.',
    partNumber: 'BP456'
  },
  {
    id: 'part_3',
    name: 'All-Season Tires',
    price: 79.99,
    quantity: 50,
    description: '205/55R16 All-Season Tires',
    vendorId: 'ven_2',
    vendorName: 'Tire Wholesalers Inc.',
    partNumber: 'AS789'
  },
  {
    id: 'part_4',
    name: 'Motor Oil (5W-30)',
    price: 35.00,
    quantity: 120,
    description: '5W-30 Synthetic Blend Motor Oil (5 qt)',
    vendorId: 'ven_3',
    vendorName: 'Oils & Lubes Co.',
    partNumber: 'MO234'
  },
  {
    id: 'part_5',
    name: 'Car Battery',
    price: 99.00,
    quantity: 40,
    description: '12V Car Battery - 600 CCA',
    vendorId: 'ven_4',
    vendorName: 'Battery Solutions Ltd.',
    partNumber: 'CB567'
  }
];

let tasks: Task[] = [
  {
    id: 'task_1',
    title: 'Oil Change',
    description: 'Replace engine oil and filter',
    mechanicId: 'mech_1',
    status: 'completed',
    hoursEstimated: 1,
    hoursSpent: 1,
    invoiceId: 'inv_1'
  },
  {
    id: 'task_2',
    title: 'Brake Pad Replacement',
    description: 'Replace front brake pads',
    mechanicId: 'mech_2',
    status: 'in-progress',
    hoursEstimated: 2,
    hoursSpent: 1.5,
    invoiceId: 'inv_2'
  },
  {
    id: 'task_3',
    title: 'Tire Rotation',
    description: 'Rotate tires and check pressure',
    mechanicId: 'mech_5',
    status: 'pending',
    hoursEstimated: 0.5,
    invoiceId: 'inv_3'
  },
  {
    id: 'task_4',
    title: 'Battery Replacement',
    description: 'Replace car battery',
    mechanicId: 'mech_1',
    status: 'completed',
    hoursEstimated: 0.75,
    hoursSpent: 0.75,
    invoiceId: 'inv_4'
  },
  {
    id: 'task_5',
    title: 'Fluid Top-Off',
    description: 'Top off all vehicle fluids',
    mechanicId: 'mech_5',
    status: 'in-progress',
    hoursEstimated: 0.5,
    hoursSpent: 0.25,
    invoiceId: 'inv_5'
  }
];

let invoices: Invoice[] = [
  {
    id: 'inv_1',
    customerId: 'cust_1',
    vehicleId: 'veh_1',
    vehicleInfo: {
      make: 'Toyota',
      model: 'Camry',
      year: '2018',
      licensePlate: 'ABC-123'
    },
    status: 'paid',
    date: '2023-04-01',
    items: [
      {
        id: 'item_1',
        type: 'labor',
        description: 'Oil Change',
        quantity: 1,
        price: 75.00
      },
      {
        id: 'item_2',
        type: 'part',
        description: 'Oil Filter',
        quantity: 1,
        price: 8.99
      }
    ],
    notes: 'Regular oil change service',
    taxRate: 7.5,
    payments: [
      {
        id: 'pay_1',
        invoiceId: 'inv_1',
        amount: 83.99,
        method: 'card',
        date: '2023-04-01',
        notes: 'Paid in full'
      }
    ]
  },
  {
    id: 'inv_2',
    customerId: 'cust_2',
    vehicleId: 'veh_3',
    vehicleInfo: {
      make: 'Ford',
      model: 'F-150',
      year: '2019',
      licensePlate: 'GHI-789'
    },
    status: 'in-progress',
    date: '2023-04-15',
    items: [
      {
        id: 'item_3',
        type: 'labor',
        description: 'Brake Pad Replacement',
        quantity: 2,
        price: 150.00
      },
      {
        id: 'item_4',
        type: 'part',
        description: 'Brake Pads (Set)',
        quantity: 1,
        price: 24.50
      }
    ],
    notes: 'Front brake pad replacement',
    taxRate: 7.5,
    payments: []
  },
  {
    id: 'inv_3',
    customerId: 'cust_3',
    vehicleId: 'veh_2',
    vehicleInfo: {
      make: 'Honda',
      model: 'Civic',
      year: '2020',
      licensePlate: 'DEF-456'
    },
    status: 'open',
    date: '2023-03-20',
    items: [
      {
        id: 'item_5',
        type: 'labor',
        description: 'Tire Rotation',
        quantity: 0.5,
        price: 37.50
      }
    ],
    notes: 'Tire rotation and pressure check',
    taxRate: 7.5,
    payments: []
  },
  {
    id: 'inv_4',
    customerId: 'cust_4',
    vehicleId: 'veh_4',
    vehicleInfo: {
      make: 'Chevrolet',
      model: 'Malibu',
      year: '2021',
      licensePlate: 'JKL-012'
    },
    status: 'completed',
    date: '2023-04-10',
    items: [
      {
        id: 'item_6',
        type: 'labor',
        description: 'Battery Replacement',
        quantity: 0.75,
        price: 56.25
      },
      {
        id: 'item_7',
        type: 'part',
        description: 'Car Battery',
        quantity: 1,
        price: 99.00
      }
    ],
    notes: 'Car battery replacement',
    taxRate: 7.5,
    payments: [
      {
        id: 'pay_2',
        invoiceId: 'inv_4',
        amount: 155.25,
        method: 'cash',
        date: '2023-04-10',
        notes: 'Paid in full'
      }
    ]
  },
  {
    id: 'inv_5',
    customerId: 'cust_5',
    vehicleId: 'veh_5',
    vehicleInfo: {
      make: 'Nissan',
      model: 'Altima',
      year: '2022',
      licensePlate: 'MNO-345'
    },
    status: 'partial',
    date: '2023-03-28',
    items: [
      {
        id: 'item_8',
        type: 'labor',
        description: 'Fluid Top-Off',
        quantity: 0.5,
        price: 37.50
      }
    ],
    notes: 'Topped off all fluids',
    taxRate: 7.5,
    payments: [
      {
        id: 'pay_3',
        invoiceId: 'inv_5',
        amount: 20.00,
        method: 'card',
        date: '2023-03-28',
        notes: 'Partial payment'
      }
    ]
  }
];

let expenses: Expense[] = [
  {
    id: 'exp_1',
    date: '2023-04-01',
    category: 'Rent',
    amount: 2500.00,
    description: 'Monthly rent for workshop space',
    paymentMethod: 'bank-transfer',
    paymentStatus: 'paid',
    vendorId: 'ven_1',
    vendorName: 'Landlord LLC'
  },
  {
    id: 'exp_2',
    date: '2023-04-05',
    category: 'Utilities',
    amount: 350.50,
    description: 'Electricity and water bill',
    paymentMethod: 'card',
    paymentStatus: 'paid',
    vendorId: 'ven_2',
    vendorName: 'Utility Company'
  },
  {
    id: 'exp_3',
    date: '2023-04-10',
    category: 'Supplies',
    amount: 120.75,
    description: 'Cleaning and maintenance supplies',
    paymentMethod: 'cash',
    paymentStatus: 'paid',
    vendorId: 'ven_3',
    vendorName: 'Local Hardware Store'
  },
  {
    id: 'exp_4',
    date: '2023-04-15',
    category: 'Insurance',
    amount: 500.00,
    description: 'Monthly insurance premium',
    paymentMethod: 'bank-transfer',
    paymentStatus: 'paid',
    vendorId: 'ven_4',
    vendorName: 'Insurance Provider'
  },
  {
    id: 'exp_5',
    date: '2023-04-20',
    category: 'Marketing',
    amount: 200.00,
    description: 'Online advertising campaign',
    paymentMethod: 'card',
    paymentStatus: 'paid',
    vendorId: 'ven_5',
    vendorName: 'Advertising Agency'
  }
];

let attendanceRecords: Attendance[] = [
  {
    id: 'att_1',
    mechanicId: 'mech_1',
    date: '2023-04-01',
    checkIn: '08:00',
    checkOut: '17:00',
    status: 'approved',
    approvedBy: 'user_1',
    notes: 'Regular shift'
  },
  {
    id: 'att_2',
    mechanicId: 'mech_2',
    date: '2023-04-01',
    checkIn: '09:00',
    checkOut: '18:00',
    status: 'approved',
    approvedBy: 'user_1',
    notes: 'Late start'
  },
  {
    id: 'att_3',
    mechanicId: 'mech_3',
    date: '2023-04-01',
    checkIn: '08:00',
    checkOut: '12:00',
    status: 'approved',
    approvedBy: 'user_1',
    notes: 'Half day'
  },
  {
    id: 'att_4',
    mechanicId: 'mech_4',
    date: '2023-04-01',
    checkIn: '10:00',
    checkOut: '19:00',
    status: 'pending',
    notes: 'Requesting approval'
  },
  {
    id: 'att_5',
    mechanicId: 'mech_5',
    date: '2023-04-01',
    checkIn: '08:00',
    checkOut: '17:00',
    status: 'approved',
    approvedBy: 'user_1',
    notes: 'Regular shift'
  }
];

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
  if (!user || !user.role) return false;

  const permissions = rolePermissions[user.role];
  if (!permissions) return false;

  // Handle dashboard which is a simple boolean
  if (resource === 'dashboard' && action === 'view') {
    return !!permissions.dashboard;
  }

  const resourcePermissions = permissions[resource as keyof typeof permissions];
  if (!resourcePermissions) return false;

  // Check if the resource permissions has the action
  const permission = (resourcePermissions as any)[action];

  // Simple boolean permission
  if (typeof permission === 'boolean') {
    return permission;
  }

  // 'own' permission
  if (permission === 'own') {
    // This would need more context to determine if the resource belongs to the user
    // For now just return true
    return true;
  }

  return false;
}

// ======================
// Customer functions
// ======================
export const getCustomers = async (): Promise<Customer[]> => {
  try {
    return await fetchCustomers();
  } catch (error) {
    console.error("Error fetching customers:", error);
    return customers;  // Fallback to mock data
  }
};

// Modified to not return a Promise for direct use in components
export const getCustomerById = (id: string): Customer | null => {
  return customers.find(customer => customer.id === id) || null;
};

// Keep the async version as a separate function
export const fetchCustomerByIdAsync = async (id: string): Promise<Customer | null> => {
  try {
    const foundCustomer = await fetchCustomerById(id);
    return foundCustomer;
  } catch (error) {
    console.error(`Error fetching customer with ID ${id}:`, error);
    return customers.find(customer => customer.id === id) || null;
  }
};

export const addCustomer = async (customerData: Omit<Customer, 'id' | 'vehicles' | 'totalVisits' | 'lifetimeValue' | 'lastVisit'>): Promise<Customer> => {
  try {
    return await addCustomerToDb(customerData);
  } catch (error) {
    console.error("Error adding customer:", error);
    // Fallback to local logic
    const newCustomer: Customer = {
      id: generateId('cust'),
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
  return vehicles.filter(v => v.customerId === customerId);
};

// Keep the async version as a separate function
export const fetchVehiclesByCustomerIdAsync = async (customerId: string): Promise<Vehicle[]> => {
  try {
    return await fetchVehiclesByCustomerId(customerId);
  } catch (error) {
    console.error(`Error fetching vehicles for customer ${customerId}:`, error);
    return vehicles.filter(v => v.customerId === customerId);
  }
};

export const getVehicleById = (id: string): Vehicle | null => {
  return vehicles.find(vehicle => vehicle.id === id) || null;
};

export const addVehicle = async (customerId: string, vehicleData: Omit<Vehicle, 'id' | 'customerId'>): Promise<Vehicle> => {
  try {
    return await addVehicleToDb({
      ...vehicleData,
      customerId: customerId
    });
  } catch (error) {
    console.error("Error adding vehicle:", error);
    // Fallback to local logic
    const newVehicle: Vehicle = {
      id: generateId('veh'),
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
    return await fetchInvoices();
  } catch (error) {
    console.error("Error fetching invoices:", error);
    return invoices; // Fallback to mock data
  }
};

export const getInvoiceById = (id: string): Invoice | null => {
  return invoices.find(invoice => invoice.id === id) || null;
};

export const calculateInvoiceTotal = (invoice: Invoice): { 
  subtotal: number; 
  tax: number; 
  total: number; 
  paidAmount: number;
  balanceDue: number;
} => {
  const subtotal = invoice.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const tax = subtotal * (invoice.taxRate / 100);
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
    return await fetchMechanics();
  } catch (error) {
    console.error("Error fetching mechanics:", error);
    return mechanics; // Fallback to mock data
  }
};

export const getMechanicById = (id: string): Mechanic | null => {
  return mechanics.find(mechanic => mechanic.id === id) || null;
};

// ======================
// Dashboard functions
// ======================
export const getDashboardMetrics = async (): Promise<DashboardMetrics> => {
  // In a real app, this would call a database or API function
  // For now, we're using mock data
  return {
    totalRevenue: 15420.75,
    pendingInvoices: 12,
    activeJobs: 8,
    completedJobs: 145,
    mechanicEfficiency: 87.5
  };
};

// Add the missing calculateDashboardMetrics function
export const calculateDashboardMetrics = (): DashboardMetrics => {
  // This is a synchronous version of getDashboardMetrics for components
  // that can't handle async functions
  return {
    totalRevenue: 15420.75,
    pendingInvoices: 12,
    activeJobs: 8,
    completedJobs: 145,
    mechanicEfficiency: 87.5
  };
};

// Add the missing getExpensesByDateRange function
export const getExpensesByDateRange = (startDate: string, endDate: string): Expense[] => {
  // Filter expenses by date range
  return expenses.filter(expense => {
    const expenseDate = new Date(expense.date);
    const start = new Date(startDate);
    const end = new Date(endDate);
    return expenseDate >= start && expenseDate <= end;
  });
};

// Async version
export const getExpensesByDateRangeAsync = async (startDate: string, endDate: string): Promise<Expense[]> => {
  try {
    // In a real app, this would filter expenses by date from the database
    // For now, we'll just return all expenses
    const allExpenses = await getExpenses();
    
    // Filter expenses by date range
    return allExpenses.filter(expense => {
      const expenseDate = new Date(expense.date);
      const start = new Date(startDate);
      const end = new Date(endDate);
      return expenseDate >= start && expenseDate <= end;
    });
  } catch (error) {
    console.error("Error fetching expenses by date range:", error);
    return [];
  }
};

// ======================
// Customer analytics
// ======================
export const getCustomerAnalytics = (customerId: string): CustomerAnalytics => {
  try {
    // Find the customer in our mock data
    const customer = customers.find(c => c.id === customerId);
    if (!customer) throw new Error("Customer not found");
    
    // Get customer vehicles
    const customerVehicles = vehicles.filter(v => v.customerId === customerId);
    
    // Get all invoices for this customer
    const customerInvoices = invoices.filter(inv => inv.customerId === customerId);
    
    // Calculate totals
    let lifetimeValue = 0;
    customerInvoices.forEach(invoice => {
      const { total } = calculateInvoiceTotal(invoice);
      lifetimeValue += total;
    });
    
    const totalInvoices = customerInvoices.length;
    const averageInvoiceValue = totalInvoices > 0 ? lifetimeValue / totalInvoices : 0;
    
    // Sort invoices by date and get the most recent (if any)
    const sortedInvoices = [...customerInvoices].sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    
    const lastVisit = sortedInvoices.length > 0 ? sortedInvoices[0].date : 'Never';
    const firstVisitDate = sortedInvoices.length > 0 ? 
      sortedInvoices[sortedInvoices.length - 1].date : 'Never';
    
    return {
      totalInvoices,
      lifetimeValue,
      averageInvoiceValue,
      firstVisitDate,
      lastVisitDate: lastVisit,
      vehicles: customerVehicles,
      invoiceHistory: customerInvoices
    };
  } catch (error) {
    console.error(`Error getting analytics for customer ${customerId}:`, error);
    // Return empty/default values
    return {
      totalInvoices: 0,
      lifetimeValue: 0,
      averageInvoiceValue: 0,
      firstVisitDate: 'Never',
      lastVisitDate: 'Never',
      vehicles: [],
      invoiceHistory: []
    };
  }
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
    return await fetchExpenses();
  } catch (error) {
    console.error("Error fetching expenses:", error);
    return expenses; // Fallback to mock data
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
    return parts; // Fallback to mock data
  }
};

// ======================
// Task functions
// ======================
export const getTasks = async (): Promise<Task[]> => {
  try {
    return await fetchTasks();
  } catch (error) {
    console.error("Error fetching tasks:", error);
    return tasks; // Fallback to mock data
  }
};

// ======================
// Attendance functions
// ======================
export const getAttendance = async (): Promise<Attendance[]> => {
  try {
    return await fetchAttendance();
  } catch (error) {
    console.error("Error fetching attendance:", error);
    return attendanceRecords; // Fallback to mock data
  }
};

// Missing function implementations
export const addVendor = (vendorData: Omit<Vendor, 'id'>): Vendor => {
  const newVendor = {
    id: generateId('ven'),
    ...vendorData
  };
  vendors.push(newVendor);
  return newVendor;
};

export const recordAttendance = (attendanceData: Omit<Attendance, 'id'>, userId?: string): Attendance => {
  const newAttendance = {
    id: generateId('att'),
    ...attendanceData
  };
  attendanceRecords.push(newAttendance);
  return newAttendance;
};

export const approveAttendance = (attendanceId: string, approverId: string): Attendance | null => {
  const attendance = attendanceRecords.find(a => a.id === attendanceId);
  if (!attendance) return null;
  
  attendance.status = 'approved';
  attendance.approvedBy = approverId;
  return attendance;
};

// Missing Finance-related functions
export const getPartExpenses = async (): Promise<any[]> => {
  // Implement a simple stub for now
  return [];
};

export const getPayables = async (): Promise<any[]> => {
