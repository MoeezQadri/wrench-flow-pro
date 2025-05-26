import { supabase } from '@/lib/supabase';
import { Attendance, Customer, DashboardMetrics, Expense, Invoice, Mechanic, Task, Vehicle } from '@/types';

// Mock data for mechanics
export const mockMechanics: Mechanic[] = [
  {
    id: '1',
    name: 'John Doe',
    specialization: 'Engine Repair',
    phone: '123-456-7890',
    address: '123 Main St',
    is_active: true,
    employment_type: 'fulltime',
    user_id: 'user1'
  },
  {
    id: '2',
    name: 'Jane Smith',
    specialization: 'Electrical Systems',
    phone: '987-654-3210',
    address: '456 Elm St',
    is_active: false,
    employment_type: 'contractor',
    user_id: 'user2'
  },
  {
    id: '3',
    name: 'David Lee',
    specialization: 'Transmission',
    phone: '555-123-4567',
    address: '789 Oak St',
    is_active: true,
    employment_type: 'fulltime',
    user_id: 'user3'
  },
  {
    id: '4',
    name: 'Emily White',
    specialization: 'Brakes & Suspension',
    phone: '111-222-3333',
    address: '321 Pine St',
    is_active: true,
    employment_type: 'contractor',
    user_id: 'user4'
  }
];

// Mock function to simulate fetching customers
export const getCustomers = async (): Promise<Customer[]> => {
  // Replace this with actual data fetching logic from your database
  return [
    {
      id: '1',
      name: 'John Smith',
      email: 'john.smith@example.com',
      phone: '555-123-4567',
      address: '123 Main St',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z'
    },
    {
      id: '2',
      name: 'Alice Johnson',
      email: 'alice.johnson@example.com',
      phone: '555-987-6543',
      address: '456 Oak Ave',
      created_at: '2024-01-02T00:00:00Z',
      updated_at: '2024-01-02T00:00:00Z'
    },
    {
      id: '3',
      name: 'Bob Williams',
      email: 'bob.williams@example.com',
      phone: '555-555-5555',
      address: '789 Pine Ln',
      created_at: '2024-01-03T00:00:00Z',
      updated_at: '2024-01-03T00:00:00Z'
    }
  ];
};

// Mock function to simulate fetching vehicles by customer ID
export const getVehiclesByCustomerId = async (customerId: string): Promise<Vehicle[]> => {
  // Replace this with actual data fetching logic from your database
  return [
    {
      id: '1',
      customer_id: customerId,
      make: 'Honda',
      model: 'Civic',
      year: '2015',
      licensePlate: 'ABC-123',
      color: 'Silver',
      vin: '1234567890',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z'
    },
    {
      id: '2',
      customer_id: customerId,
      make: 'Toyota',
      model: 'Camry',
      year: '2018',
      licensePlate: 'DEF-456',
      color: 'White',
      vin: '0987654321',
      created_at: '2024-01-02T00:00:00Z',
      updated_at: '2024-01-02T00:00:00Z'
    }
  ];
};

// Mock function to simulate fetching a vehicle by ID
export const getVehicleById = async (id: string): Promise<Vehicle | null> => {
  // Replace this with actual data fetching logic from your database
  const vehicles: Vehicle[] = [
    {
      id: '1',
      customer_id: '1',
      make: 'Honda',
      model: 'Civic',
      year: '2015',
      licensePlate: 'ABC-123',
      color: 'Silver',
      vin: '1234567890',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z'
    },
    {
      id: '2',
      customer_id: '1',
      make: 'Toyota',
      model: 'Camry',
      year: '2018',
      licensePlate: 'DEF-456',
      color: 'White',
      vin: '0987654321',
      created_at: '2024-01-02T00:00:00Z',
      updated_at: '2024-01-02T00:00:00Z'
    }
  ];

  return vehicles.find(vehicle => vehicle.id === id) || null;
};

// Mock function to simulate adding a new invoice
export const addInvoice = async (invoiceData: any): Promise<Invoice> => {
  // Replace this with actual data saving logic to your database
  console.log('Invoice data to be saved:', invoiceData);

  // Mock implementation: return a new invoice object
  const newInvoice: Invoice = {
    id: `invoice-${Date.now()}`, // Generate a unique ID
    customer_id: invoiceData.customerId,
    vehicle_id: invoiceData.vehicleId,
    date: invoiceData.date,
    tax_rate: invoiceData.taxRate,
    status: 'open', // Default status
    notes: invoiceData.notes,
    items: invoiceData.items,
    payments: [], // Initially no payments
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    vehicleInfo: {
      make: 'Honda',
      model: 'Civic',
      year: '2015',
      licensePlate: 'ABC-123'
    }
  };

  return newInvoice;
};

// Mock function to simulate fetching an invoice by ID
export const getInvoiceById = async (id: string): Promise<Invoice | null> => {
  // Replace this with actual data fetching logic from your database
  const invoices: Invoice[] = [
    {
      id: '1',
      customer_id: '1',
      vehicle_id: '1',
      date: '2024-01-15',
      tax_rate: 7.5,
      status: 'open',
      notes: 'Oil change and tire rotation',
      items: [
        {
          id: '1',
          description: 'Oil change',
          type: 'labor',
          quantity: 1,
          price: 45.00
        },
        {
          id: '2',
          description: 'Tire rotation',
          type: 'labor',
          quantity: 1,
          price: 25.00
        }
      ],
      payments: [],
      created_at: '2024-01-15T00:00:00Z',
      updated_at: '2024-01-15T00:00:00Z',
      vehicleInfo: {
        make: 'Honda',
        model: 'Civic',
        year: '2015',
        licensePlate: 'ABC-123'
      }
    },
    {
      id: '2',
      customer_id: '2',
      vehicle_id: '2',
      date: '2024-01-14',
      tax_rate: 7.5,
      status: 'paid',
      notes: 'Brake replacement',
      items: [
        {
          id: '3',
          description: 'Brake pads replacement',
          type: 'labor',
          quantity: 2,
          price: 60.00
        },
        {
          id: '4',
          description: 'Brake pads',
          type: 'parts',
          quantity: 2,
          price: 40.00
        }
      ],
      payments: [],
      created_at: '2024-01-14T00:00:00Z',
      updated_at: '2024-01-14T00:00:00Z',
      vehicleInfo: {
        make: 'Toyota',
        model: 'Camry',
        year: '2018',
        licensePlate: 'DEF-456'
      }
    }
  ];

  return invoices.find(invoice => invoice.id === id) || null;
};

// Mock function to simulate calculating invoice total
export const calculateInvoiceTotal = (invoice: Invoice): { subtotal: number; tax: number; total: number; paidAmount: number; balanceDue: number } => {
  const subtotal = invoice.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const tax = subtotal * (invoice.tax_rate / 100);
  const total = subtotal + tax;
  const paidAmount = 0; // Replace with actual paid amount from payments
  const balanceDue = total - paidAmount;

  return { subtotal, tax, total, paidAmount, balanceDue };
};

// Mock function to simulate fetching customer analytics
export const getCustomerAnalytics = async (customerId: string): Promise<{ lifetimeValue: number; totalInvoices: number; averageInvoiceValue: number; vehicles: Vehicle[]; invoiceHistory: Invoice[] }> => {
  // Replace this with actual data fetching logic from your database
  const vehicles: Vehicle[] = await getVehiclesByCustomerId(customerId);
  const invoiceHistory: Invoice[] = [
    {
      id: '1',
      customer_id: customerId,
      vehicle_id: '1',
      date: '2024-01-15',
      tax_rate: 7.5,
      status: 'open',
      notes: 'Oil change and tire rotation',
      items: [
        {
          id: '1',
          description: 'Oil change',
          type: 'labor',
          quantity: 1,
          price: 45.00
        },
        {
          id: '2',
          description: 'Tire rotation',
          type: 'labor',
          quantity: 1,
          price: 25.00
        }
      ],
      payments: [],
      created_at: '2024-01-15T00:00:00Z',
      updated_at: '2024-01-15T00:00:00Z',
      vehicleInfo: {
        make: 'Honda',
        model: 'Civic',
        year: '2015',
        licensePlate: 'ABC-123'
      }
    },
    {
      id: '2',
      customer_id: customerId,
      vehicle_id: '2',
      date: '2024-01-14',
      tax_rate: 7.5,
      status: 'paid',
      notes: 'Brake replacement',
      items: [
        {
          id: '3',
          description: 'Brake pads replacement',
          type: 'labor',
          quantity: 2,
          price: 60.00
        },
        {
          id: '4',
          description: 'Brake pads',
          type: 'parts',
          quantity: 2,
          price: 40.00
        }
      ],
      payments: [],
      created_at: '2024-01-14T00:00:00Z',
      updated_at: '2024-01-14T00:00:00Z',
      vehicleInfo: {
        make: 'Toyota',
        model: 'Camry',
        year: '2018',
        licensePlate: 'DEF-456'
      }
    }
  ];

  const lifetimeValue = invoiceHistory.reduce((sum, invoice) => {
    const { total } = calculateInvoiceTotal(invoice);
    return sum + total;
  }, 0);
  const totalInvoices = invoiceHistory.length;
  const averageInvoiceValue = totalInvoices > 0 ? lifetimeValue / totalInvoices : 0;

  return { lifetimeValue, totalInvoices, averageInvoiceValue, vehicles, invoiceHistory };
};

// Mock function to simulate fetching dashboard metrics
export const calculateDashboardMetrics = async (): Promise<DashboardMetrics> => {
  // Replace this with actual data fetching logic from your database
  const totalRevenue = 150000;
  const pendingInvoices = 25;
  const activeJobs = 12;
  const mechanicEfficiency = 85;
  const completedJobs = 200;
  const monthlyRevenue = 12000;
  const monthlyExpenses = 5000;
  const monthlyProfit = monthlyRevenue - monthlyExpenses;
  const activeCustomers = 50;
  const vehicleCount = 75;
  const averageJobValue = 500;
  const inventoryValue = 25000;
  const pendingTasks = 8;
  const activeVehicles = 60;
  const lowStockItems = 15;

  return {
    totalRevenue,
    pendingInvoices,
    activeJobs,
    mechanicEfficiency,
    completedJobs,
    monthlyRevenue,
    monthlyExpenses,
    monthlyProfit,
    activeCustomers,
    vehicleCount,
    averageJobValue,
    inventoryValue,
    pendingTasks,
    activeVehicles,
    lowStockItems
  };
};

// Mock function to simulate adding a new vendor
export const addVendor = async (vendorData: any): Promise<any> => {
  // Replace this with actual data saving logic to your database
  console.log('Vendor data to be saved:', vendorData);

  // Mock implementation: return a new vendor object
  const newVendor = {
    id: `vendor-${Date.now()}`, // Generate a unique ID
    ...vendorData,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  return newVendor;
};

// Mock function to simulate getting a mechanic by ID
export const getMechanicById = async (id: string): Promise<Mechanic | null> => {
  // Replace this with actual data fetching logic from your database
  return mockMechanics.find(mechanic => mechanic.id === id) || null;
};

// Mock function to simulate getting tasks
export const getTasks = async (): Promise<Task[]> => {
  // Replace this with actual data fetching logic from your database
  return tasks;
};

// Mock function to simulate getting current user
export const getCurrentUser = () => {
  // Replace this with actual authentication logic
  return {
    id: 'user1',
    name: 'John Doe',
    email: 'john.doe@example.com',
    role: 'manager',
    organizationId: 'org1',
    mechanicId: '1'
  };
};

// Mock function to simulate checking permissions
export const hasPermission = (user: any, resource: string, permission: string): boolean => {
  // Replace this with actual permission checking logic
  if (user.role === 'owner') return true; // Owner has all permissions

  // Example: Only managers can manage tasks
  if (resource === 'tasks' && permission === 'manage' && user.role === 'manager') {
    return true;
  }

  return false;
};

// Export all the missing functions that are being imported
export const fetchAttendance = async (): Promise<Attendance[]> => {
  const { data, error } = await supabase
    .from('attendance')
    .select('*');
  
  if (error) throw error;
  return data || [];
};

export const fetchCustomers = getCustomers;
export const fetchVehiclesByCustomerId = getVehiclesByCustomerId;
export const fetchVehicleById = getVehicleById;

// Add missing expenses export
export const expenses: Expense[] = [
  {
    id: '1',
    date: '2024-01-15',
    amount: 250.00,
    category: 'Parts',
    description: 'Brake pads for Honda Civic',
    payment_method: 'card' as const,
    vendor_name: 'AutoParts Plus',
    vendor_id: null,
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-01-15T10:00:00Z',
    payment_status: 'paid'
  },
  {
    id: '2',
    date: '2024-01-14',
    amount: 120.00,
    category: 'Tools',
    description: 'Socket wrench set',
    payment_method: 'cash' as const,
    vendor_name: 'Tool Depot',
    vendor_id: null,
    created_at: '2024-01-14T14:30:00Z',
    updated_at: '2024-01-14T14:30:00Z',
    payment_status: 'paid'
  }
];

// Add missing tasks export
export const tasks: Task[] = [
  {
    id: '1',
    title: 'Oil Change',
    description: 'Standard oil change service',
    mechanicId: '1',
    vehicleId: '1',
    status: 'completed' as const,
    location: 'workshop',
    hoursEstimated: 1,
    hoursSpent: 0.8,
    price: 45.00,
    startTime: '2024-01-15T09:00:00Z',
    endTime: '2024-01-15T09:48:00Z',
    completedBy: '1',
    completedAt: '2024-01-15T09:48:00Z',
    invoiceId: null,
    created_at: '2024-01-15T08:00:00Z',
    updated_at: '2024-01-15T09:48:00Z'
  }
];

// Add missing mechanics export for compatibility
export const mechanics = mockMechanics;
