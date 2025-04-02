
import { faker } from '@faker-js/faker';

// Function to generate a unique ID
export const generateId = (prefix: string): string => {
  try {
    return `${prefix}-${faker.string.uuid()}`;
  } catch (error) {
    // Fallback to simple random ID if faker fails
    return `${prefix}-${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`;
  }
};

export type UserRole = 'owner' | 'manager' | 'foreman' | 'mechanic';
export type InvoiceStatus = 'open' | 'in-progress' | 'completed' | 'partial' | 'paid';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  mechanicId?: string;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
}

export interface Vehicle {
  id: string;
  customerId: string;
  make: string;
  model: string;
  year: string;
  licensePlate: string;
}

export interface Invoice {
  id: string;
  customerId: string;
  vehicleId: string;
  date: string;
  status: InvoiceStatus;
  items: InvoiceItem[];
  payments: Payment[];
  notes?: string;
  taxRate: number;
  discount?: {
    type: 'percentage' | 'fixed';
    value: number;
  };
  vehicleInfo: {
    make: string;
    model: string;
    year: string;
    licensePlate: string;
  };
}

export interface InvoiceItem {
  id: string;
  type: 'labor' | 'part';
  description: string;
  quantity: number;
  price: number;
}

export interface Payment {
  id: string;
  invoiceId: string;
  date: string;
  amount: number;
  method: 'cash' | 'card' | 'bank-transfer';
  notes?: string;
}

export interface Mechanic {
  id: string;
  name: string;
  specialization: string;
  address: string;
  phone: string;
  idCardImage?: string;
  employmentType: 'contractor' | 'fulltime';
  isActive: boolean;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  mechanicId: string;
  status: 'pending' | 'in-progress' | 'completed';
  hoursEstimated: number;
  hoursSpent?: number;
  invoiceId?: string;
}

export interface Part {
  id: string;
  name: string;
  price: number;
  quantity: number;
  description: string;
  vendorId?: string;
  partNumber?: string;
  reorderLevel?: number;
}

export interface Vendor {
  id: string;
  name: string;
  contactName: string;
  email: string;
  phone: string;
  address: string;
}

export interface Expense {
  id: string;
  date: string;
  category: string;
  amount: number;
  description: string;
  paymentMethod: 'cash' | 'card' | 'bank-transfer';
  vendorId?: string;
  vendorName?: string;
}

export interface Attendance {
  id: string;
  mechanicId: string;
  date: string;
  clockIn: string;
  clockOut: string;
  notes?: string;
}

export interface RolePermissionMap {
  dashboard: boolean;
  customers: { view: boolean; manage: boolean };
  invoices: { view: boolean; manage: boolean };
  mechanics: { view: boolean; manage: boolean };
  tasks: { view: boolean; manage: boolean };
  parts: { view: boolean; manage: boolean };
  expenses: { view: boolean; manage: boolean };
	vehicles: { view: boolean; manage: boolean };
  reports: { view: boolean; manage: boolean };
  users: { view: boolean; manage: boolean };
  settings: { view: boolean; manage: boolean };
  attendance: {view: boolean; manage: boolean};
  subscription: {view: boolean; manage: boolean};
}

// Mock data
export const users: User[] = [
  { id: 'user-1', name: 'John Doe', email: 'john.doe@example.com', role: 'owner' },
  { id: 'user-2', name: 'Jane Smith', email: 'jane.smith@example.com', role: 'manager' },
  { id: 'user-3', name: 'Mike Johnson', email: 'mike.johnson@example.com', role: 'foreman' },
  { id: 'user-4', name: 'Emily White', email: 'emily.white@example.com', role: 'mechanic', mechanicId: 'mechanic-1' },
  { id: 'user-5', name: 'David Brown', email: 'david.brown@example.com', role: 'mechanic', mechanicId: 'mechanic-2' },
];

export const customers: Customer[] = [
  { id: 'customer-1', name: 'Alice Johnson', email: 'alice.johnson@example.com', phone: '555-123-4567', address: '123 Main St' },
  { id: 'customer-2', name: 'Bob Williams', email: 'bob.williams@example.com', phone: '555-987-6543', address: '456 Oak Ave' },
  { id: 'customer-3', name: 'Charlie Brown', email: 'charlie.brown@example.com', phone: '555-222-3333', address: '789 Pine Ln' },
];

export const vehicles: Vehicle[] = [
  { id: 'vehicle-1', customerId: 'customer-1', make: 'Toyota', model: 'Camry', year: '2018', licensePlate: 'ABC-123' },
  { id: 'vehicle-2', customerId: 'customer-1', make: 'Honda', model: 'Civic', year: '2020', licensePlate: 'DEF-456' },
  { id: 'vehicle-3', customerId: 'customer-2', make: 'Ford', model: 'F-150', year: '2019', licensePlate: 'GHI-789' },
];

export const invoices: Invoice[] = [
  {
    id: 'invoice-1',
    customerId: 'customer-1',
    vehicleId: 'vehicle-1',
    date: '2024-01-20',
    status: 'open',
    items: [
      { id: 'item-1', type: 'labor', description: 'Oil Change', quantity: 1, price: 50 },
      { id: 'item-2', type: 'part', description: 'Oil Filter', quantity: 1, price: 10 },
    ],
    payments: [],
    notes: 'Customer requested synthetic oil.',
    taxRate: 7.5,
    vehicleInfo: {
      make: 'Toyota',
      model: 'Camry',
      year: '2018',
      licensePlate: 'ABC-123'
    }
  },
  {
    id: 'invoice-2',
    customerId: 'customer-2',
    vehicleId: 'vehicle-3',
    date: '2024-01-15',
    status: 'in-progress',
    items: [
      { id: 'item-3', type: 'labor', description: 'Tire Rotation', quantity: 1, price: 40 },
      { id: 'item-4', type: 'part', description: 'New Tires', quantity: 4, price: 100 },
    ],
    payments: [],
    notes: 'Replaced with high-performance tires.',
    taxRate: 7.5,
    discount: {
      type: 'percentage',
      value: 10
    },
    vehicleInfo: {
      make: 'Ford',
      model: 'F-150',
      year: '2019',
      licensePlate: 'GHI-789'
    }
  },
  {
    id: 'invoice-3',
    customerId: 'customer-3',
    vehicleId: '',
    date: '2024-02-01',
    status: 'completed',
    items: [
      { id: 'item-5', type: 'labor', description: 'Brake Replacement', quantity: 2, price: 80 },
      { id: 'item-6', type: 'part', description: 'Brake Pads', quantity: 2, price: 60 },
    ],
    payments: [],
    notes: 'Replaced front brake pads and rotors.',
    taxRate: 7.5,
    vehicleInfo: {
      make: 'Nissan',
      model: 'Altima',
      year: '2017',
      licensePlate: 'JKL-012'
    }
  },
  {
    id: 'invoice-4',
    customerId: 'customer-1',
    vehicleId: 'vehicle-2',
    date: '2024-02-05',
    status: 'paid',
    items: [
      { id: 'item-7', type: 'labor', description: 'Oil Change', quantity: 1, price: 60 },
      { id: 'item-8', type: 'part', description: 'Oil Filter', quantity: 1, price: 15 },
    ],
    payments: [{ id: 'payment-1', invoiceId: 'invoice-4', date: '2024-02-05', amount: 75, method: 'card', notes: 'Paid in full' }],
    notes: 'Full synthetic oil used.',
    taxRate: 7.5,
    vehicleInfo: {
      make: 'Honda',
      model: 'Civic',
      year: '2020',
      licensePlate: 'DEF-456'
    }
  },
  {
    id: 'invoice-5',
    customerId: 'customer-3',
    vehicleId: '',
    date: '2024-02-10',
    status: 'partial',
    items: [
      { id: 'item-9', type: 'labor', description: 'Engine Diagnostic', quantity: 1, price: 120 },
    ],
    payments: [{ id: 'payment-2', invoiceId: 'invoice-5', date: '2024-02-10', amount: 50, method: 'cash', notes: 'Partial payment' }],
    notes: 'Diagnosed engine misfire.',
    taxRate: 7.5,
    vehicleInfo: {
      make: 'Nissan',
      model: 'Altima',
      year: '2017',
      licensePlate: 'JKL-012'
    }
  },
];

export const payments: Payment[] = [
  { id: 'payment-1', invoiceId: 'invoice-4', date: '2024-02-05', amount: 75, method: 'card', notes: 'Paid in full' },
  { id: 'payment-2', invoiceId: 'invoice-5', date: '2024-02-10', amount: 50, method: 'cash', notes: 'Partial payment' },
];

export const mechanics: Mechanic[] = [
  {
    id: 'mechanic-1',
    name: 'Alice Johnson',
    specialization: 'Engine Repair',
    address: '789 Oak St',
    phone: '555-567-8901',
    idCardImage: 'https://example.com/mechanic-1-id.jpg',
    employmentType: 'fulltime',
    isActive: true,
  },
  {
    id: 'mechanic-2',
    name: 'Bob Williams',
    specialization: 'Brake Services',
    address: '321 Pine Ave',
    phone: '555-432-1098',
    idCardImage: 'https://example.com/mechanic-2-id.jpg',
    employmentType: 'contractor',
    isActive: false,
  },
];

export const tasks: Task[] = [
  {
    id: 'task-1',
    title: 'Replace Brake Pads',
    description: 'Replace worn brake pads on front axle',
    mechanicId: 'mechanic-1',
    status: 'in-progress',
    hoursEstimated: 3,
    hoursSpent: 2.5,
    invoiceId: 'invoice-3'
  },
  {
    id: 'task-2',
    title: 'Oil Change Service',
    description: 'Perform oil and filter change using synthetic oil',
    mechanicId: 'mechanic-2',
    status: 'completed',
    hoursEstimated: 1,
    hoursSpent: 1,
    invoiceId: 'invoice-4'
  },
  {
    id: 'task-3',
    title: 'Engine Diagnostic',
    description: 'Diagnose engine misfire and recommend repairs',
    mechanicId: 'mechanic-1',
    status: 'pending',
    hoursEstimated: 2,
    invoiceId: 'invoice-5'
  },
];

export const parts: Part[] = [
  {
    id: 'part-1',
    name: 'Brake Pads',
    price: 45.99,
    quantity: 50,
    description: 'High-performance brake pads for improved stopping power',
    vendorId: 'vendor-1',
    partNumber: 'BP123',
    reorderLevel: 10
  },
  {
    id: 'part-2',
    name: 'Oil Filter',
    price: 8.99,
    quantity: 100,
    description: 'Premium oil filter for extended engine life',
    vendorId: 'vendor-2',
    partNumber: 'OF456',
    reorderLevel: 20
  },
];

export const vendors: Vendor[] = [
  {
    id: 'vendor-1',
    name: 'Auto Parts Supplier',
    contactName: 'John Smith',
    email: 'john.smith@autoparts.com',
    phone: '555-777-8888',
    address: '456 Industrial Blvd'
  },
  {
    id: 'vendor-2',
    name: 'Tire Warehouse',
    contactName: 'Jane Doe',
    email: 'jane.doe@tirewarehouse.com',
    phone: '555-999-0000',
    address: '789 Distribution Rd'
  },
];

export const expenses: Expense[] = [
  {
    id: 'expense-1',
    date: '2024-02-01',
    category: 'Rent',
    amount: 2500,
    description: 'Monthly rent for shop space',
    paymentMethod: 'bank-transfer',
  },
  {
    id: 'expense-2',
    date: '2024-02-03',
    category: 'Utilities',
    amount: 350,
    description: 'Electricity bill for January',
    paymentMethod: 'card',
  },
  {
    id: 'expense-3',
    date: '2024-02-05',
    category: 'Parts',
    amount: 500,
    description: 'Purchase of brake pads from Auto Parts Supplier',
    paymentMethod: 'card',
    vendorId: 'vendor-1',
    vendorName: 'Auto Parts Supplier'
  },
];

export const attendanceRecords: Attendance[] = [
  {
    id: 'attendance-1',
    mechanicId: 'mechanic-1',
    date: '2024-02-15',
    clockIn: '08:00',
    clockOut: '17:00',
    notes: 'Regular shift'
  },
  {
    id: 'attendance-2',
    mechanicId: 'mechanic-2',
    date: '2024-02-15',
    clockIn: '09:00',
    clockOut: '18:00',
    notes: 'Late start due to appointment'
  },
];

// Data access functions
export const getCurrentUser = (): User => users[0];
export const getCustomers = (): Customer[] => customers;
export const getVehiclesByCustomerId = (customerId: string): Vehicle[] =>
  vehicles.filter((vehicle) => vehicle.customerId === customerId);
export const getInvoiceById = (id: string): Invoice | undefined =>
  invoices.find((invoice) => invoice.id === id);
export const getMechanicById = (id: string): Mechanic | undefined =>
  mechanics.find((mechanic) => mechanic.id === id);
export const getVendorById = (id: string): Vendor | undefined =>
  vendors.find((vendor) => vendor.id === id);
export const getVehicleById = (id: string): Vehicle | undefined =>
  vehicles.find((vehicle) => vehicle.id === id);
export const getPaymentsByInvoiceId = (invoiceId: string): Payment[] =>
  payments.filter((payment) => payment.invoiceId === invoiceId);

// Function to calculate the total amount of an invoice
export const calculateInvoiceTotal = (invoice: Invoice): { subtotal: number; tax: number; discount: number; total: number } => {
  const subtotal = invoice.items.reduce((acc, item) => acc + (item.quantity * item.price), 0);
  let discount = 0;

  if (invoice.discount) {
    if (invoice.discount.type === 'percentage') {
      discount = subtotal * (invoice.discount.value / 100);
    } else if (invoice.discount.type === 'fixed') {
      discount = invoice.discount.value;
    }
  }

  const subtotalAfterDiscount = subtotal - discount;
  const tax = subtotalAfterDiscount * (invoice.taxRate / 100);
  const total = subtotalAfterDiscount + tax;

  return { subtotal, tax, discount, total };
};

// Function to check user permissions
export const hasPermission = (user: User, resource: keyof RolePermissionMap, action: string): boolean => {
  const role = user.role;
  const permissions = rolePermissions[role];

  if (!permissions) {
    console.warn(`No permissions defined for role: ${role}`);
    return false;
  }

  const resourcePermissions = permissions[resource];

  if (typeof resourcePermissions === 'boolean') {
    return resourcePermissions;
  } else if (typeof resourcePermissions === 'object' && resourcePermissions !== null) {
    return resourcePermissions[action as keyof typeof resourcePermissions] || false;
  }

  return false;
};

// Mock function to simulate fetching expenses by date range
export const getExpensesByDateRange = (startDate: string, endDate: string): Expense[] => {
  return expenses.filter(expense => expense.date >= startDate && expense.date <= endDate);
};

// Mock function to simulate fetching payments by date range
export const getPaymentsByDateRange = (startDate: string, endDate: string): Payment[] => {
  return payments.filter(payment => payment.date >= startDate && payment.date <= endDate);
};

// Mock function to simulate fetching expenses for parts
export const getPartExpenses = (): Expense[] => {
  return expenses.filter(expense => expense.category === 'Parts');
};

// Mock function to simulate fetching receivables (invoices with outstanding balance)
export const getReceivables = (): Invoice[] => {
  return invoices.filter(invoice => {
    const { total } = calculateInvoiceTotal(invoice);
    const paid = invoice.payments.reduce((sum, payment) => sum + payment.amount, 0);
    return total > paid;
  });
};

// Mock function to simulate fetching payables (expenses)
export const getPayables = (): Expense[] => {
  return expenses;
};

export const rolePermissions: Record<UserRole, RolePermissionMap> = {
  owner: {
    dashboard: true,
    customers: {
      view: true,
      manage: true
    },
    invoices: {
      view: true,
      manage: true
    },
    mechanics: {
      view: true,
      manage: true
    },
    tasks: {
      view: true,
      manage: true
    },
    parts: {
      view: true,
      manage: true
    },
    expenses: {
      view: true,
      manage: true
    },
		vehicles: {
      view: true,
      manage: true
    },
    reports: {
      view: true,
      manage: true
    },
    users: {
      view: true,
      manage: true
    },
    settings: {
      view: true,
      manage: true
    },
    attendance: {
      view: true,
      manage: true
    },
    subscription: {
      view: true,
      manage: true
    }
  },
  manager: {
    dashboard: true,
    customers: {
      view: true,
      manage: true
    },
    invoices: {
      view: true,
      manage: true
    },
    mechanics: {
      view: true,
      manage: true
    },
    tasks: {
      view: true,
      manage: true
    },
    parts: {
      view: true,
      manage: true
    },
    expenses: {
      view: true,
      manage: true
    },
		vehicles: {
      view: true,
      manage: true
    },
    reports: {
      view: true,
      manage: true
    },
    users: {
      view: true,
      manage: true
    },
    settings: {
      view: true,
      manage: true
    },
    attendance: {
      view: true,
      manage: true
    },
    subscription: {
      view: true,
      manage: true
    }
  },
  foreman: {
    dashboard: true,
    customers: {
      view: true,
      manage: false
    },
    invoices: {
      view: true,
      manage: false
    },
    mechanics: {
      view: true,
      manage: false
    },
    tasks: {
      view: true,
      manage: true
    },
    parts: {
      view: true,
      manage: false
    },
    expenses: {
      view: true,
      manage: false
    },
    vehicles: {
      view: true,
      manage: false
    },
    reports: {
      view: true,
      manage: false
    },
    users: {
      view: false,
      manage: false
    },
    settings: {
      view: false,
      manage: false
    },
    attendance: {
      view: true,
      manage: true
    },
    subscription: {
      view: false,
      manage: false
    }
  },
  mechanic: {
    dashboard: false,
    customers: {
      view: false,
      manage: false
    },
    invoices: {
      view: false,
      manage: false
    },
    mechanics: {
      view: false,
      manage: false
    },
    tasks: {
      view: true,
      manage: false
    },
    parts: {
      view: false,
      manage: false
    },
    expenses: {
      view: false,
      manage: false
    },
		vehicles: {
      view: false,
      manage: false
    },
    reports: {
      view: false,
      manage: false
    },
    users: {
      view: false,
      manage: false
    },
    settings: {
      view: false,
      manage: false
    },
    attendance: {
      view: false,
      manage: false
    },
    subscription: {
      view: false,
      manage: false
    }
  }
};
