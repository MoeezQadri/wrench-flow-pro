
import { 
  Customer, 
  Mechanic, 
  Part, 
  Task, 
  Invoice, 
  Payment, 
  Expense,
  DashboardMetrics
} from '@/types';

// Mock data for our application
export const customers: Customer[] = [
  { 
    id: '1', 
    name: 'John Smith', 
    email: 'john@example.com', 
    phone: '555-123-4567', 
    address: '123 Main St, Anytown, CA 94321' 
  },
  { 
    id: '2', 
    name: 'Sarah Johnson', 
    email: 'sarah@example.com', 
    phone: '555-987-6543', 
    address: '456 Oak Ave, Somewhere, CA 94123' 
  },
  { 
    id: '3', 
    name: 'Mike Williams', 
    email: 'mike@example.com', 
    phone: '555-456-7890', 
    address: '789 Pine Rd, Nowhere, CA 94567' 
  }
];

export const mechanics: Mechanic[] = [
  { 
    id: '1', 
    name: 'Dave Roberts', 
    specialization: 'Engine Specialist', 
    hourlyRate: 75, 
    isActive: true 
  },
  { 
    id: '2', 
    name: 'Carlos Mendez', 
    specialization: 'Transmission Expert', 
    hourlyRate: 70, 
    isActive: true 
  },
  { 
    id: '3', 
    name: 'Lisa Chen', 
    specialization: 'Electrical Systems', 
    hourlyRate: 80, 
    isActive: true 
  }
];

export const parts: Part[] = [
  { 
    id: '1', 
    name: 'Oil Filter', 
    price: 15.99, 
    quantity: 45, 
    description: 'Standard oil filter for most vehicles' 
  },
  { 
    id: '2', 
    name: 'Brake Pads (Front)', 
    price: 89.99, 
    quantity: 20, 
    description: 'Premium ceramic brake pads for front wheels' 
  },
  { 
    id: '3', 
    name: 'Air Filter', 
    price: 24.99, 
    quantity: 35, 
    description: 'Engine air filter, standard size' 
  },
  { 
    id: '4', 
    name: 'Spark Plugs (set of 4)', 
    price: 45.99, 
    quantity: 15, 
    description: 'Iridium spark plugs, long-lasting' 
  }
];

export const tasks: Task[] = [
  { 
    id: '1', 
    title: 'Oil Change', 
    description: 'Full oil change with synthetic oil', 
    mechanicId: '1', 
    status: 'completed', 
    hoursEstimated: 1, 
    hoursSpent: 0.75, 
    invoiceId: '1' 
  },
  { 
    id: '2', 
    title: 'Brake Inspection', 
    description: 'Check brake pads and rotors', 
    mechanicId: '2', 
    status: 'in-progress', 
    hoursEstimated: 0.5, 
    invoiceId: '1' 
  },
  { 
    id: '3', 
    title: 'Replace Transmission Fluid', 
    description: 'Drain and replace transmission fluid', 
    mechanicId: '2', 
    status: 'pending', 
    hoursEstimated: 2, 
    invoiceId: '2' 
  },
  { 
    id: '4', 
    title: 'Diagnose Check Engine Light', 
    description: 'Scan OBD codes and diagnose issue', 
    mechanicId: '3', 
    status: 'completed', 
    hoursEstimated: 1, 
    hoursSpent: 1.25, 
    invoiceId: '3' 
  }
];

export const invoices: Invoice[] = [
  { 
    id: '1', 
    customerId: '1', 
    vehicleInfo: { 
      make: 'Toyota', 
      model: 'Camry', 
      year: '2018', 
      licensePlate: 'ABC123' 
    }, 
    status: 'in-progress', 
    date: '2023-05-10', 
    dueDate: '2023-05-24', 
    items: [
      { id: '1', type: 'labor', description: 'Oil Change', quantity: 1, price: 75 },
      { id: '2', type: 'part', description: 'Oil Filter', quantity: 1, price: 15.99 },
      { id: '3', type: 'part', description: '5L Synthetic Oil', quantity: 1, price: 45.99 }
    ], 
    notes: 'Customer mentioned noise from front right wheel', 
    taxRate: 8.5,
    payments: []
  },
  { 
    id: '2', 
    customerId: '2', 
    vehicleInfo: { 
      make: 'Honda', 
      model: 'Civic', 
      year: '2020', 
      licensePlate: 'XYZ789' 
    }, 
    status: 'open', 
    date: '2023-05-15', 
    dueDate: '2023-05-29', 
    items: [], 
    notes: 'Routine maintenance', 
    taxRate: 8.5,
    payments: []
  },
  { 
    id: '3', 
    customerId: '3', 
    vehicleInfo: { 
      make: 'Ford', 
      model: 'F-150', 
      year: '2019', 
      licensePlate: 'DEF456' 
    }, 
    status: 'completed', 
    date: '2023-05-08', 
    dueDate: '2023-05-22', 
    items: [
      { id: '4', type: 'labor', description: 'Diagnose Engine Light', quantity: 1.25, price: 80 },
      { id: '5', type: 'part', description: 'Oxygen Sensor', quantity: 1, price: 129.99 }
    ], 
    notes: 'Check engine light was due to faulty O2 sensor', 
    taxRate: 8.5,
    payments: [
      { id: '1', invoiceId: '3', amount: 150, method: 'card', date: '2023-05-08', notes: 'Partial payment' }
    ]
  },
  { 
    id: '4', 
    customerId: '1', 
    vehicleInfo: { 
      make: 'Toyota', 
      model: 'Camry', 
      year: '2018', 
      licensePlate: 'ABC123' 
    }, 
    status: 'paid', 
    date: '2023-04-25', 
    dueDate: '2023-05-09', 
    items: [
      { id: '6', type: 'labor', description: 'Tire Rotation', quantity: 0.5, price: 75 },
      { id: '7', type: 'labor', description: 'Alignment', quantity: 1, price: 90 }
    ], 
    notes: 'Regular maintenance', 
    taxRate: 8.5,
    payments: [
      { id: '2', invoiceId: '4', amount: 179.78, method: 'cash', date: '2023-05-09', notes: 'Paid in full' }
    ]
  }
];

export const expenses: Expense[] = [
  { 
    id: '1', 
    date: '2023-05-01', 
    category: 'Utilities', 
    amount: 450.75, 
    description: 'Electricity bill', 
    paymentMethod: 'bank-transfer' 
  },
  { 
    id: '2', 
    date: '2023-05-05', 
    category: 'Supplies', 
    amount: 235.40, 
    description: 'Shop supplies - cleaning materials', 
    paymentMethod: 'card' 
  },
  { 
    id: '3', 
    date: '2023-05-12', 
    category: 'Parts', 
    amount: 1250.99, 
    description: 'Wholesale parts order', 
    paymentMethod: 'bank-transfer' 
  }
];

// Dashboard Metrics
export const getDashboardMetrics = (): DashboardMetrics => {
  // Calculate total revenue (excluding tax)
  const totalRevenue = invoices
    .filter(inv => inv.status === 'paid')
    .reduce((sum, invoice) => {
      const invoiceTotal = invoice.items.reduce((total, item) => total + (item.price * item.quantity), 0);
      return sum + invoiceTotal;
    }, 0);

  // Count invoices by status
  const pendingInvoices = invoices.filter(inv => inv.status === 'open' || inv.status === 'in-progress').length;
  const completedJobs = invoices.filter(inv => inv.status === 'completed' || inv.status === 'paid').length;
  const activeJobs = invoices.filter(inv => inv.status === 'in-progress').length;

  // Calculate mechanic efficiency (completed vs estimated hours)
  const completedTasks = tasks.filter(task => task.status === 'completed' && task.hoursSpent !== undefined);
  const totalEstimatedHours = completedTasks.reduce((sum, task) => sum + task.hoursEstimated, 0);
  const totalActualHours = completedTasks.reduce((sum, task) => sum + (task.hoursSpent || 0), 0);
  const mechanicEfficiency = totalEstimatedHours > 0 
    ? Math.round((totalEstimatedHours / totalActualHours) * 100) 
    : 100;

  return {
    totalRevenue,
    pendingInvoices,
    completedJobs,
    activeJobs,
    mechanicEfficiency
  };
};

// Helper function to get customer by ID
export const getCustomerById = (id: string): Customer | undefined => {
  return customers.find(customer => customer.id === id);
};

// Helper function to get mechanic by ID
export const getMechanicById = (id: string): Mechanic | undefined => {
  return mechanics.find(mechanic => mechanic.id === id);
};

// Helper function to calculate invoice total
export const calculateInvoiceTotal = (invoice: Invoice): { subtotal: number, tax: number, total: number } => {
  const subtotal = invoice.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const tax = subtotal * (invoice.taxRate / 100);
  const total = subtotal + tax;
  
  return { subtotal, tax, total };
};

// Helper function to get total payments for an invoice
export const getInvoicePaymentsTotal = (invoiceId: string): number => {
  const invoice = invoices.find(inv => inv.id === invoiceId);
  if (!invoice) return 0;
  
  return invoice.payments.reduce((sum, payment) => sum + payment.amount, 0);
};

// Helper function to get the tasks for an invoice
export const getTasksForInvoice = (invoiceId: string): Task[] => {
  return tasks.filter(task => task.invoiceId === invoiceId);
};
