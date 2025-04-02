import {
  Invoice,
  Customer,
  Vehicle,
  Mechanic,
  Part,
  Task,
  InvoiceItem,
  Payment,
  Expense,
  DashboardMetrics,
  CustomerAnalytics,
  InvoiceStatus,
  Vendor
} from '@/types';

// Mock Data
export const customers: Customer[] = [
  {
    id: 'customer-1',
    name: 'John Doe',
    email: 'john.doe@example.com',
    phone: '555-123-4567',
    address: '123 Main St, Anytown',
    vehicles: ['vehicle-1', 'vehicle-2'],
    totalVisits: 5,
    lifetimeValue: 500,
    lastVisit: '2024-01-20',
  },
  {
    id: 'customer-2',
    name: 'Jane Smith',
    email: 'jane.smith@example.com',
    phone: '555-987-6543',
    address: '456 Oak Ave, Anytown',
    vehicles: ['vehicle-3'],
    totalVisits: 3,
    lifetimeValue: 300,
    lastVisit: '2024-02-10',
  },
  {
    id: 'customer-3',
    name: 'Alice Johnson',
    email: 'alice.johnson@example.com',
    phone: '555-555-5555',
    address: '789 Pine Ln, Anytown',
    vehicles: [],
    totalVisits: 8,
    lifetimeValue: 800,
    lastVisit: '2023-12-01',
  },
  {
    id: 'customer-4',
    name: 'Bob Williams',
    email: 'bob.williams@example.com',
    phone: '555-111-2222',
    address: '101 Elm Rd, Anytown',
    vehicles: ['vehicle-4', 'vehicle-5'],
    totalVisits: 2,
    lifetimeValue: 200,
    lastVisit: '2024-03-05',
  },
  {
    id: 'customer-5',
    name: 'Charlie Brown',
    email: 'charlie.brown@example.com',
    phone: '555-333-4444',
    address: '222 Maple Dr, Anytown',
    vehicles: [],
    totalVisits: 10,
    lifetimeValue: 1000,
    lastVisit: '2024-01-15',
  },
];

export const vehicles: Vehicle[] = [
  {
    id: 'vehicle-1',
    customerId: 'customer-1',
    make: 'Toyota',
    model: 'Camry',
    year: '2018',
    licensePlate: 'ABC-123',
    vin: '1234567890',
    color: 'Silver',
  },
  {
    id: 'vehicle-2',
    customerId: 'customer-1',
    make: 'Honda',
    model: 'Civic',
    year: '2020',
    licensePlate: 'DEF-456',
    vin: '0987654321',
    color: 'Blue',
  },
  {
    id: 'vehicle-3',
    customerId: 'customer-2',
    make: 'Ford',
    model: 'F-150',
    year: '2022',
    licensePlate: 'GHI-789',
    vin: '1122334455',
    color: 'Red',
  },
  {
    id: 'vehicle-4',
    customerId: 'customer-4',
    make: 'Chevrolet',
    model: 'Malibu',
    year: '2019',
    licensePlate: 'JKL-012',
    vin: '6677889900',
    color: 'Black',
  },
  {
    id: 'vehicle-5',
    customerId: 'customer-4',
    make: 'Nissan',
    model: 'Altima',
    year: '2021',
    licensePlate: 'MNO-345',
    vin: '9900887766',
    color: 'White',
  },
];

export const mechanics: Mechanic[] = [
  {
    id: 'mechanic-1',
    name: 'Mike Johnson',
    specialization: 'Engine Repair',
    hourlyRate: 50,
    isActive: true,
  },
  {
    id: 'mechanic-2',
    name: 'Sarah Lee',
    specialization: 'Brakes & Suspension',
    hourlyRate: 45,
    isActive: true,
  },
  {
    id: 'mechanic-3',
    name: 'David Kim',
    specialization: 'Electrical Systems',
    hourlyRate: 55,
    isActive: false,
  },
];

// Add vendors data
export const vendors: Vendor[] = [
  {
    id: 'vendor-1',
    name: 'AutoParts Plus',
    email: 'sales@autopartsplus.com',
    phone: '555-222-3333',
    address: '789 Supply St, Anytown',
    contactPerson: 'Mike Wilson',
    paymentTerms: 'Net 30'
  },
  {
    id: 'vendor-2',
    name: 'Quality Parts Co.',
    email: 'orders@qualityparts.com',
    phone: '555-444-5555',
    address: '456 Vendor Ave, Anytown',
    contactPerson: 'Sarah Johnson',
    paymentTerms: 'Net 15'
  },
  {
    id: 'vendor-3',
    name: 'Mechanic Supply',
    email: 'info@mechanicsupply.com',
    phone: '555-666-7777',
    address: '123 Tool Road, Anytown',
    contactPerson: 'Tom Smith',
    paymentTerms: 'Net 45'
  },
];

export const parts: Part[] = [
  {
    id: 'part-1',
    name: 'Brake Pads',
    price: 25,
    quantity: 100,
    description: 'High-quality brake pads for all vehicle types.',
    vendorId: 'vendor-1',
    vendorName: 'AutoParts Plus',
    partNumber: 'BP-100',
    reorderLevel: 20
  },
  {
    id: 'part-2',
    name: 'Oil Filter',
    price: 8,
    quantity: 500,
    description: 'Standard oil filter for most car models.',
    vendorId: 'vendor-2',
    vendorName: 'Quality Parts Co.',
    partNumber: 'OF-200',
    reorderLevel: 50
  },
  {
    id: 'part-3',
    name: 'Spark Plug',
    price: 5,
    quantity: 300,
    description: 'Long-lasting spark plug for improved engine performance.',
    vendorId: 'vendor-1',
    vendorName: 'AutoParts Plus',
    partNumber: 'SP-300',
    reorderLevel: 40
  },
];

export const tasks: Task[] = [
  {
    id: 'task-1',
    title: 'Replace Brake Pads',
    description: 'Replace worn brake pads on front wheels.',
    mechanicId: 'mechanic-2',
    status: 'completed',
    hoursEstimated: 2,
    hoursSpent: 2,
    invoiceId: 'invoice-1',
  },
  {
    id: 'task-2',
    title: 'Oil Change',
    description: 'Perform standard oil change service.',
    mechanicId: 'mechanic-1',
    status: 'completed',
    hoursEstimated: 1,
    hoursSpent: 1,
    invoiceId: 'invoice-1',
  },
  {
    id: 'task-3',
    title: 'Diagnose Electrical Issue',
    description: 'Diagnose and repair electrical issue causing battery drain.',
    mechanicId: 'mechanic-3',
    status: 'in-progress',
    hoursEstimated: 3,
    hoursSpent: 1,
    invoiceId: 'invoice-2',
  },
];

export const invoiceItems: InvoiceItem[] = [
  {
    id: 'item-1',
    type: 'labor',
    description: 'Brake Pad Replacement',
    quantity: 2,
    price: 50,
  },
  {
    id: 'item-2',
    type: 'part',
    description: 'Brake Pads (Set of 2)',
    quantity: 1,
    price: 25,
  },
  {
    id: 'item-3',
    type: 'labor',
    description: 'Oil Change Service',
    quantity: 1,
    price: 40,
  },
  {
    id: 'item-4',
    type: 'part',
    description: 'Oil Filter',
    quantity: 1,
    price: 8,
  },
];

export const invoices: Invoice[] = [
  {
    id: 'invoice-1',
    customerId: 'customer-1',
    vehicleId: 'vehicle-1',
    vehicleInfo: {
      make: 'Toyota',
      model: 'Camry',
      year: '2018',
      licensePlate: 'ABC-123',
    },
    status: 'completed',
    date: '2024-03-10',
    items: ['item-1', 'item-2', 'item-3', 'item-4'].map(id => invoiceItems.find(item => item.id === id)!),
    notes: 'Standard service completed. Customer approved additional brake check.',
    taxRate: 0.075,
    payments: [],
  },
  {
    id: 'invoice-2',
    customerId: 'customer-4',
    vehicleId: 'vehicle-4',
    vehicleInfo: {
      make: 'Chevrolet',
      model: 'Malibu',
      year: '2019',
      licensePlate: 'JKL-012',
    },
    status: 'in-progress',
    date: '2024-03-15',
    items: [],
    notes: 'Diagnosing electrical issue. Will update customer with findings.',
    taxRate: 0.075,
    payments: [],
  },
  {
    id: 'invoice-3',
    customerId: 'customer-2',
    vehicleId: 'vehicle-3',
    vehicleInfo: {
      make: 'Ford',
      model: 'F-150',
      year: '2022',
      licensePlate: 'GHI-789',
    },
    status: 'open',
    date: '2024-03-20',
    items: [],
    notes: 'Scheduled for oil change and tire rotation.',
    taxRate: 0.075,
    payments: [],
  },
];

export const payments: Payment[] = [
  {
    id: 'payment-1',
    invoiceId: 'invoice-1',
    amount: 125,
    method: 'card',
    date: '2024-03-10',
    notes: 'Paid in full via credit card.',
  },
  {
    id: 'payment-2',
    invoiceId: 'invoice-2',
    amount: 50,
    method: 'cash',
    date: '2024-03-15',
    notes: 'Partial payment in cash.',
  },
  {
    id: 'payment-3',
    invoiceId: 'invoice-3',
    amount: 200,
    method: 'bank-transfer',
    date: '2024-03-20',
    notes: 'Deposit via bank transfer.',
  },
];

export const expenses: Expense[] = [
  {
    id: 'expense-1',
    date: '2024-03-01',
    category: 'Supplies',
    amount: 50,
    description: 'Purchased cleaning supplies for the workshop.',
    paymentMethod: 'cash',
    vendorId: 'vendor-3',
    vendorName: 'Mechanic Supply'
  },
  {
    id: 'expense-2',
    date: '2024-03-05',
    category: 'Rent',
    amount: 1500,
    description: 'Monthly rent for the workshop space.',
    paymentMethod: 'bank-transfer'
  },
  {
    id: 'expense-3',
    date: '2024-03-10',
    category: 'Parts',
    amount: 750,
    description: 'Bulk order of brake pads and oil filters.',
    paymentMethod: 'card',
    vendorId: 'vendor-1',
    vendorName: 'AutoParts Plus'
  },
  {
    id: 'expense-4',
    date: '2024-03-15',
    category: 'Tools',
    amount: 350,
    description: 'New diagnostic equipment.',
    paymentMethod: 'card',
    vendorId: 'vendor-3',
    vendorName: 'Mechanic Supply'
  },
];

// Helper function to generate unique IDs
export const generateId = (prefix: string) => {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
};

// Data Fetching Functions
export const getCustomerById = (id: string): Customer | undefined => {
  return customers.find((customer) => customer.id === id);
};

export const getVehicleById = (id: string): Vehicle | undefined => {
  return vehicles.find((vehicle) => vehicle.id === id);
};

export const getMechanicById = (id: string): Mechanic | undefined => {
  return mechanics.find((mechanic) => mechanic.id === id);
};

export const getPartById = (id: string): Part | undefined => {
  return parts.find((part) => part.id === id);
};

export const getVendorById = (id: string): Vendor | undefined => {
  return vendors.find((vendor) => vendor.id === id);
};

export const getTaskById = (id: string): Task | undefined => {
  return tasks.find((task) => task.id === id);
};

export const getInvoiceById = (id: string): Invoice | undefined => {
  return invoices.find((invoice) => invoice.id === id);
};

export const getPaymentById = (id: string): Payment | undefined => {
  return payments.find((payment) => payment.id === id);
};

export const getExpenseById = (id: string): Expense | undefined => {
  return expenses.find((expense) => expense.id === id);
};

// Data Creation Functions
export const addCustomer = (customerData: Omit<Customer, 'id' | 'vehicles' | 'totalVisits' | 'lifetimeValue' | 'lastVisit'>): Customer => {
  const newCustomer: Customer = {
    id: generateId('customer'),
    ...customerData,
    vehicles: [],
    totalVisits: 0,
    lifetimeValue: 0,
    lastVisit: new Date().toISOString().split('T')[0],
  };
  
  customers.push(newCustomer);
  return newCustomer;
};

export const addVehicle = (vehicleData: Omit<Vehicle, 'id'>): Vehicle => {
  const newVehicle: Vehicle = {
    id: generateId('vehicle'),
    ...vehicleData,
  };
  
  vehicles.push(newVehicle);
  
  // Update customer's vehicles array
  const customer = customers.find(c => c.id === vehicleData.customerId);
  if (customer && customer.vehicles) {
    customer.vehicles.push(newVehicle.id);
  }
  
  return newVehicle;
};

export const addVendor = (vendorData: Omit<Vendor, 'id'>): Vendor => {
  const newVendor: Vendor = {
    id: generateId('vendor'),
    ...vendorData,
  };
  
  vendors.push(newVendor);
  return newVendor;
};

export const addPart = (partData: Omit<Part, 'id'>): Part => {
  const newPart: Part = {
    id: generateId('part'),
    ...partData,
  };
  
  parts.push(newPart);
  return newPart;
};

// Analytics Functions
export const calculateDashboardMetrics = (): DashboardMetrics => {
  const totalRevenue = payments.reduce((sum, payment) => sum + payment.amount, 0);
  const pendingInvoices = invoices.filter((invoice) => invoice.status !== 'paid').length;
  const completedJobs = tasks.filter((task) => task.status === 'completed').length;
  const activeJobs = tasks.filter((task) => task.status === 'in-progress').length;
  const mechanicEfficiency = 0.85; // Mock value

  return {
    totalRevenue,
    pendingInvoices,
    completedJobs,
    activeJobs,
    mechanicEfficiency,
  };
};

export const getCustomerAnalytics = (customerId: string): CustomerAnalytics => {
  const customerInvoices = invoices.filter((invoice) => invoice.customerId === customerId);
  const lifetimeValue = customerInvoices.reduce((sum, invoice) => {
    const { total } = calculateInvoiceTotal(invoice);
    return sum + total;
  }, 0);
  const totalInvoices = customerInvoices.length;
  const averageInvoiceValue = totalInvoices > 0 ? lifetimeValue / totalInvoices : 0;
  const firstVisitDate = customerInvoices.length > 0 ? customerInvoices[0].date : 'N/A';
  const lastVisitDate =
    customerInvoices.length > 0 ? customerInvoices[customerInvoices.length - 1].date : 'N/A';
  const customerVehicles = vehicles.filter((vehicle) => vehicle.customerId === customerId);

  return {
    totalInvoices,
    lifetimeValue,
    averageInvoiceValue,
    firstVisitDate,
    lastVisitDate,
    vehicles: customerVehicles,
    invoiceHistory: customerInvoices,
  };
};

export const calculateInvoiceTotal = (invoice: Invoice): { subtotal: number; tax: number; total: number } => {
  const subtotal = invoice.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const tax = subtotal * invoice.taxRate;
  const total = subtotal + tax;
  return { subtotal, tax, total };
};

export function getCustomers() {
  return customers;
}

export function getVendors() {
  return vendors;
}

export function getVehiclesByCustomerId(customerId: string) {
  return vehicles.filter(vehicle => vehicle.customerId === customerId);
}

// Finance report filtering functions
export function getPaymentsByDateRange(startDate: string, endDate: string): Payment[] {
  return payments.filter(payment => {
    return payment.date >= startDate && payment.date <= endDate;
  });
}

export function getExpensesByDateRange(startDate: string, endDate: string): Expense[] {
  return expenses.filter(expense => {
    return expense.date >= startDate && expense.date <= endDate;
  });
}

export function getPartExpenses(): Expense[] {
  return expenses.filter(expense => expense.category === 'Parts');
}

export function getExpensesByVendor(vendorId: string): Expense[] {
  return expenses.filter(expense => expense.vendorId === vendorId);
}

export function getInvoicesByDateRange(startDate: string, endDate: string): Invoice[] {
  return invoices.filter(invoice => {
    return invoice.date >= startDate && invoice.date <= endDate;
  });
}

export function getInvoicesByCustomer(customerId: string): Invoice[] {
  return invoices.filter(invoice => invoice.customerId === customerId);
}

export function getReceivables(): Invoice[] {
  return invoices.filter(invoice => 
    invoice.status !== 'paid' && 
    (invoice.status === 'completed' || invoice.status === 'partial')
  );
}

export function getPayables(): Expense[] {
  // In a real system, you might have unpaid expenses. For this mock, we'll return all expenses
  return expenses;
}
