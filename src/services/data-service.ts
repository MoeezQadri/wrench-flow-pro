
import { User, Customer, Vehicle, Invoice, Part, Mechanic, Vendor, Expense, Attendance, Task, CustomerAnalytics, DashboardMetrics, InvoiceItem, Payment, InvoiceStatus, UserRole } from "@/types";

// Mock user data with permissions
const users: User[] = [
  {
    id: "1",
    name: "Admin User",
    email: "admin@example.com",
    role: "owner" as UserRole, // Changed from "admin" to "owner" to match UserRole type
    isActive: true,
    permissions: {
      dashboard: ["view", "manage"],
      invoices: ["view", "create", "edit", "delete"],
      customers: ["view", "create", "edit", "delete"],
      mechanics: ["view", "create", "edit", "delete", "manage"],
      tasks: ["view", "create", "edit", "delete", "assign"],
      parts: ["view", "create", "edit", "delete"],
      finance: ["view", "manage"],
      attendance: ["view", "create", "edit", "approve"],
      users: ["view", "create", "edit", "delete", "manage"],
      reports: ["view", "create", "export"],
      settings: ["view", "edit"]
    }
  },
  {
    id: "2",
    name: "Manager User",
    email: "manager@example.com",
    role: "manager" as UserRole,
    isActive: true,
    permissions: {
      dashboard: ["view"],
      invoices: ["view", "create", "edit"],
      customers: ["view", "create", "edit"],
      mechanics: ["view", "create", "edit"],
      tasks: ["view", "create", "edit", "assign"],
      parts: ["view", "create", "edit"],
      finance: ["view"],
      attendance: ["view", "create", "approve"],
      users: ["view"],
      reports: ["view", "create"],
      settings: ["view"]
    }
  },
  {
    id: "3",
    name: "Mechanic User",
    email: "mechanic@example.com",
    role: "mechanic" as UserRole,
    isActive: true,
    permissions: {
      dashboard: ["view"],
      invoices: ["view"],
      customers: ["view"],
      mechanics: [],
      tasks: ["view"],
      parts: ["view"],
      finance: [],
      attendance: ["view"],
      users: [],
      reports: [],
      settings: []
    }
  },
  {
    id: "4",
    name: "Front Desk",
    email: "reception@example.com",
    role: "foreman" as UserRole, // Changed from "receptionist" to "foreman" to match UserRole type
    isActive: true,
    permissions: {
      dashboard: ["view"],
      invoices: ["view", "create"],
      customers: ["view", "create"],
      mechanics: ["view"],
      tasks: ["view"],
      parts: ["view"],
      finance: [],
      attendance: ["view", "create"],
      users: [],
      reports: [],
      settings: []
    }
  }
];

// Mock customers data
export const customers: Customer[] = [
  { 
    id: "cust1", 
    name: "John Smith", 
    email: "john@example.com", 
    phone: "555-1234", 
    address: "123 Main St" 
  },
  { 
    id: "cust2", 
    name: "Jane Doe", 
    email: "jane@example.com", 
    phone: "555-5678", 
    address: "456 Oak Ave" 
  },
  { 
    id: "cust3", 
    name: "Bob Johnson", 
    email: "bob@example.com", 
    phone: "555-9012", 
    address: "789 Pine Rd" 
  }
];

// Mock vehicles data
export const vehicles: Vehicle[] = [
  { 
    id: "veh1", 
    make: "Toyota", 
    model: "Camry", 
    year: "2020", 
    licensePlate: "ABC123", 
    vin: "1HGBH41JXMN109186", 
    customerId: "cust1",
    color: "Silver"
  },
  { 
    id: "veh2", 
    make: "Honda", 
    model: "Civic", 
    year: "2019", 
    licensePlate: "XYZ789", 
    vin: "2FMZA5349XBA69755", 
    customerId: "cust1",
    color: "Blue"
  },
  { 
    id: "veh3", 
    make: "Ford", 
    model: "F-150", 
    year: "2021", 
    licensePlate: "DEF456", 
    vin: "1FTEW1E53MFA52708", 
    customerId: "cust2",
    color: "Red"
  }
];

// Mock mechanics data
export const mechanics: Mechanic[] = [
  { 
    id: "mech1", 
    name: "Mike Ross", 
    specialization: "Engine Repair", 
    phone: "555-1111", 
    address: "101 Shop St",
    idCardImage: "/lovable-uploads/adb79866-2bf5-4349-83d4-0212f37959ca.png",
    employmentType: "fulltime", // Changed from "full-time" to "fulltime"
    isActive: true
  },
  { 
    id: "mech2", 
    name: "Sarah Johnson", 
    specialization: "Electrical Systems", 
    phone: "555-2222", 
    address: "202 Garage Ave",
    idCardImage: "/lovable-uploads/b52e749c-5ab7-46f8-9727-4269e4dd0240.png",
    employmentType: "contractor", // Changed from "part-time" to "contractor"
    isActive: true
  },
  { 
    id: "mech3", 
    name: "Dave Wilson", 
    specialization: "Brakes and Suspension", 
    phone: "555-3333", 
    address: "303 Repair Rd",
    idCardImage: "/lovable-uploads/539c718d-1e53-4312-a00b-bf2e1c4cd757.png",
    employmentType: "contractor",
    isActive: false
  }
];

// Mock vendors data
export const vendors: Vendor[] = [
  { 
    id: "vendor1", 
    name: "Parts Plus", 
    contactName: "Alice Brown", 
    phone: "555-4444", 
    email: "alice@partsplus.com", 
    address: "404 Supply St" 
  },
  { 
    id: "vendor2", 
    name: "Auto Parts World", 
    contactName: "Charlie Green", 
    phone: "555-5555", 
    email: "charlie@autoparts.com", 
    address: "505 Component Ave" 
  }
];

// Mock parts data
export const parts: Part[] = [
  { 
    id: "part1", 
    name: "Oil Filter", 
    partNumber: "OF-123", 
    description: "High quality oil filter", 
    price: 12.99, 
    quantity: 25, 
    reorderLevel: 5,
    vendorId: "vendor1",
    vendorName: "Parts Plus"
  },
  { 
    id: "part2", 
    name: "Air Filter", 
    partNumber: "AF-456", 
    description: "Performance air filter", 
    price: 24.99, 
    quantity: 18, 
    reorderLevel: 4,
    vendorId: "vendor1",
    vendorName: "Parts Plus"
  },
  { 
    id: "part3", 
    name: "Brake Pads", 
    partNumber: "BP-789", 
    description: "Ceramic brake pads", 
    price: 45.99, 
    quantity: 12, 
    reorderLevel: 3,
    vendorId: "vendor2",
    vendorName: "Auto Parts World"
  }
];

// Mock invoices data
export const invoices: Invoice[] = [
  {
    id: "inv1",
    customerId: "cust1",
    vehicleId: "veh1",
    vehicleInfo: {
      make: "Toyota",
      model: "Camry",
      year: "2020",
      licensePlate: "ABC123"
    },
    items: [
      {
        id: "item1", // Added missing id
        type: "labor", // Changed from "service" to "labor"
        description: "Oil Change",
        price: 49.99,
        quantity: 1
      },
      {
        id: "item2", // Added missing id
        type: "part",
        description: "Oil Filter",
        price: 12.99,
        quantity: 1
      }
    ],
    status: "paid" as InvoiceStatus,
    taxRate: 0.07,
    date: "2023-05-15",
    dueDate: "2023-05-30",
    notes: "Regular maintenance service",
    payments: [
      {
        id: "pmt1",
        invoiceId: "inv1", // Added missing invoiceId
        amount: 67.36,
        date: "2023-05-15",
        method: "card", // Changed from "credit_card" to "card"
        notes: "" // Added missing notes
      }
    ]
  },
  {
    id: "inv2",
    customerId: "cust2",
    vehicleId: "veh3",
    vehicleInfo: {
      make: "Ford",
      model: "F-150",
      year: "2021",
      licensePlate: "DEF456"
    },
    items: [
      {
        id: "item3", // Added missing id
        type: "labor", // Changed from "service" to "labor"
        description: "Brake Replacement",
        price: 299.99,
        quantity: 1
      },
      {
        id: "item4", // Added missing id
        type: "part",
        description: "Brake Pads",
        price: 45.99,
        quantity: 4
      }
    ],
    status: "open" as InvoiceStatus, // Changed from "pending" to "open"
    taxRate: 0.07,
    date: "2023-06-01",
    dueDate: "2023-06-15",
    notes: "Front and rear brake service",
    payments: []
  },
  {
    id: "inv3",
    customerId: "cust1",
    vehicleId: "veh2",
    vehicleInfo: {
      make: "Honda",
      model: "Civic",
      year: "2019",
      licensePlate: "XYZ789"
    },
    items: [
      {
        id: "item5", // Added missing id
        type: "labor", // Changed from "service" to "labor"
        description: "A/C Repair",
        price: 199.99,
        quantity: 1
      },
      {
        id: "item6", // Added missing id
        type: "part",
        description: "A/C Refrigerant",
        price: 29.99,
        quantity: 1
      }
    ],
    status: "partial" as InvoiceStatus,
    taxRate: 0.07,
    date: "2023-06-10",
    dueDate: "2023-06-25",
    notes: "A/C not cooling properly",
    payments: [
      {
        id: "pmt2",
        invoiceId: "inv3", // Added missing invoiceId
        amount: 100.00,
        date: "2023-06-10",
        method: "cash",
        notes: "" // Added missing notes
      }
    ]
  }
];

// Mock expenses data
export const expenses: Expense[] = [
  {
    id: "exp1",
    date: "2023-05-10",
    category: "utilities",
    amount: 245.78,
    description: "Electricity bill",
    paymentMethod: "bank-transfer", // Changed from "bank_transfer" to "bank-transfer"
    paymentStatus: "paid",
    vendorId: undefined,
    vendorName: undefined
  },
  {
    id: "exp2",
    date: "2023-05-15",
    category: "supplies",
    amount: 125.35,
    description: "Shop supplies",
    paymentMethod: "card", // Changed from "credit_card" to "card"
    paymentStatus: "paid",
    vendorId: "vendor1",
    vendorName: "Parts Plus"
  },
  {
    id: "exp3",
    date: "2023-05-25",
    category: "parts",
    amount: 1250.00,
    description: "Bulk parts order",
    paymentMethod: "cash", // Changed from "check" to "cash"
    paymentStatus: "pending",
    vendorId: "vendor2",
    vendorName: "Auto Parts World"
  }
];

// Mock attendance records
export const attendanceRecords: Attendance[] = [
  {
    id: "att1",
    mechanicId: "mech1",
    date: "2023-05-15",
    checkIn: "08:00",
    checkOut: "17:00",
    status: "approved",
    notes: "",
    approvedBy: "1"
  },
  {
    id: "att2",
    mechanicId: "mech2",
    date: "2023-05-15",
    checkIn: "08:15",
    checkOut: "17:30",
    status: "approved",
    notes: "Stayed late to finish brake job",
    approvedBy: "1"
  },
  {
    id: "att3",
    mechanicId: "mech1",
    date: "2023-05-16",
    checkIn: "08:00",
    checkOut: "16:30",
    status: "pending",
    notes: "",
    approvedBy: null
  }
];

// Mock tasks data
export const tasks: Task[] = [
  {
    id: "task1",
    title: "Oil Change - Honda Civic",
    description: "Regular oil change service",
    status: "completed",
    mechanicId: "mech1",
    vehicleId: "veh2",
    hoursEstimated: 0.5,
    hoursSpent: 0.5,
    invoiceId: "inv3",
    location: "workshop",
    completedBy: "1",
    completedAt: "2023-05-15T10:30:00"
  },
  {
    id: "task2",
    title: "Brake Replacement - Ford F-150",
    description: "Replace front and rear brake pads",
    status: "in-progress", // Changed from "in_progress" to "in-progress"
    mechanicId: "mech2",
    vehicleId: "veh3",
    hoursEstimated: 2,
    invoiceId: "inv2",
    location: "workshop",
    price: 299.99
  },
  {
    id: "task3",
    title: "AC Repair - Honda Civic",
    description: "Diagnose and repair AC not cooling",
    status: "pending",
    mechanicId: "mech1",
    vehicleId: "veh2",
    hoursEstimated: 1.5,
    invoiceId: "inv3",
    location: "workshop",
    price: 199.99
  }
];

// Role Permission Map
export const RolePermissionMap = {
  owner: {
    dashboard: ["view", "manage"],
    invoices: ["view", "create", "edit", "delete"],
    customers: ["view", "create", "edit", "delete"],
    mechanics: ["view", "create", "edit", "delete", "manage"],
    tasks: ["view", "create", "edit", "delete", "assign"],
    parts: ["view", "create", "edit", "delete"],
    finance: ["view", "manage"],
    attendance: ["view", "create", "edit", "approve"],
    users: ["view", "create", "edit", "delete", "manage"],
    reports: ["view", "create", "export"],
    settings: ["view", "edit"]
  },
  manager: {
    dashboard: ["view"],
    invoices: ["view", "create", "edit"],
    customers: ["view", "create", "edit"],
    mechanics: ["view", "create", "edit"],
    tasks: ["view", "create", "edit", "assign"],
    parts: ["view", "create", "edit"],
    finance: ["view"],
    attendance: ["view", "create", "approve"],
    users: ["view"],
    reports: ["view", "create"],
    settings: ["view"]
  },
  mechanic: {
    dashboard: ["view"],
    invoices: ["view"],
    customers: ["view"],
    mechanics: [],
    tasks: ["view"],
    parts: ["view"],
    finance: [],
    attendance: ["view"],
    users: [],
    reports: [],
    settings: []
  },
  foreman: {
    dashboard: ["view"],
    invoices: ["view", "create"],
    customers: ["view", "create"],
    mechanics: ["view"],
    tasks: ["view"],
    parts: ["view"],
    finance: [],
    attendance: ["view", "create"],
    users: [],
    reports: [],
    settings: []
  }
};

// Function to calculate invoice total
export const calculateInvoiceTotal = (invoice: Invoice) => {
  const subtotal = invoice.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const tax = subtotal * (invoice.taxRate || 0);
  const total = subtotal + tax;
  
  // Calculate paid amount from payments
  const paidAmount = invoice.payments.reduce((sum, payment) => sum + payment.amount, 0);
  
  // Calculate balance due
  const balanceDue = total - paidAmount;
  
  return { subtotal, tax, total, paidAmount, balanceDue };
};

// User functions
export const getCurrentUser = (): User => {
  // In a real app, this would get the user from auth context
  // For now, return the admin user
  return users[0];
};

export const hasPermission = (user: User, resource: string, action: string): boolean => {
  if (!user || !user.permissions) {
    return false;
  }
  
  const userPermissions = user.permissions[resource];
  if (!userPermissions) {
    return false;
  }
  
  return userPermissions.includes(action);
};

// Utility functions
export const generateId = (prefix: string): string => {
  const timestamp = Date.now().toString(36);
  const randomChars = Math.random().toString(36).substring(2, 8);
  return `${prefix}_${timestamp}${randomChars}`;
};

// Customer functions
export const getCustomers = () => {
  return customers;
};

export const getCustomerById = (id: string) => {
  return customers.find(customer => customer.id === id);
};

export const addCustomer = (customerData: Omit<Customer, "id">) => {
  const newCustomer = {
    id: generateId("cust"),
    ...customerData
  };
  customers.push(newCustomer);
  return newCustomer;
};

// Function to return customer analytics with the correct type
export const getCustomerAnalytics = (customerId: string): CustomerAnalytics => {
  const customerInvoices = invoices.filter(invoice => invoice.customerId === customerId);
  const totalSpent = customerInvoices.reduce((sum, invoice) => {
    const { total } = calculateInvoiceTotal(invoice);
    return sum + total;
  }, 0);
  
  const customerVehicles = vehicles.filter(vehicle => vehicle.customerId === customerId);
  
  return {
    totalInvoices: customerInvoices.length,
    lifetimeValue: totalSpent,
    averageInvoiceValue: customerInvoices.length > 0 ? totalSpent / customerInvoices.length : 0,
    firstVisitDate: customerInvoices.length > 0 ? 
      customerInvoices.reduce((earliest, invoice) => 
        new Date(invoice.date) < new Date(earliest.date) ? invoice : earliest
      ).date : "",
    lastVisitDate: customerInvoices.length > 0 ? 
      customerInvoices.reduce((latest, invoice) => 
        new Date(invoice.date) > new Date(latest.date) ? invoice : latest
      ).date : "",
    vehicles: customerVehicles,
    invoiceHistory: customerInvoices
  };
};

// Vehicle functions
export const getVehicleById = (id: string) => {
  return vehicles.find(vehicle => vehicle.id === id);
};

export const getVehiclesByCustomerId = (customerId: string) => {
  return vehicles.filter(vehicle => vehicle.customerId === customerId);
};

export const addVehicle = (customerId: string, vehicleData: Omit<Vehicle, "id" | "customerId">) => {
  const newVehicle = {
    id: generateId("veh"),
    customerId,
    ...vehicleData
  };
  vehicles.push(newVehicle);
  return newVehicle;
};

// Invoice functions
export const getInvoiceById = (id: string) => {
  return invoices.find(invoice => invoice.id === id);
};

export const getInvoices = () => {
  return invoices;
};

// Mechanic functions
export const getMechanics = () => {
  return mechanics.filter(mechanic => mechanic.isActive);
};

export const getMechanicById = (id: string) => {
  return mechanics.find(mechanic => mechanic.id === id);
};

// Vendor functions
export const getVendorById = (id: string) => {
  return vendors.find(vendor => vendor.id === id);
};

export const addVendor = (vendorData: Omit<Vendor, "id">) => {
  const newVendor = {
    id: generateId("vendor"),
    ...vendorData
  };
  vendors.push(newVendor);
  return newVendor;
};

// Attendance functions
export const recordAttendance = (attendanceData: Omit<Attendance, "id">) => {
  const newAttendance = {
    id: generateId("att"),
    ...attendanceData
  };
  attendanceRecords.push(newAttendance);
  return newAttendance;
};

export const approveAttendance = (id: string, approvedBy: string) => {
  const attendanceIndex = attendanceRecords.findIndex(record => record.id === id);
  if (attendanceIndex !== -1) {
    attendanceRecords[attendanceIndex] = {
      ...attendanceRecords[attendanceIndex],
      status: "approved",
      approvedBy
    };
    return attendanceRecords[attendanceIndex];
  }
  return null;
};

// Get attendance records for reports
export const getAttendance = () => {
  return attendanceRecords;
};

// Task functions
export const getTasks = () => {
  return tasks;
};

// Finance functions
export const getExpensesByDateRange = (startDate: string, endDate: string) => {
  return expenses.filter(expense => {
    const expenseDate = new Date(expense.date);
    return expenseDate >= new Date(startDate) && expenseDate <= new Date(endDate);
  });
};

export const getPaymentsByDateRange = (startDate: string, endDate: string) => {
  const paymentsInRange: any[] = [];
  
  invoices.forEach(invoice => {
    invoice.payments.forEach(payment => {
      const paymentDate = new Date(payment.date);
      if (paymentDate >= new Date(startDate) && paymentDate <= new Date(endDate)) {
        paymentsInRange.push({
          ...payment,
          invoiceId: invoice.id,
          customerId: invoice.customerId
        });
      }
    });
  });
  
  return paymentsInRange;
};

// Dashboard metrics
export const calculateDashboardMetrics = (): DashboardMetrics => {
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  
  // Filter current month invoices
  const currentMonthInvoices = invoices.filter(invoice => {
    const invoiceDate = new Date(invoice.date);
    return invoiceDate.getMonth() === currentMonth && invoiceDate.getFullYear() === currentYear;
  });
  
  // Calculate revenue
  const monthlyRevenue = currentMonthInvoices.reduce((sum, invoice) => {
    const { total } = calculateInvoiceTotal(invoice);
    return sum + total;
  }, 0);
  
  // Filter current month expenses
  const currentMonthExpenses = expenses.filter(expense => {
    const expenseDate = new Date(expense.date);
    return expenseDate.getMonth() === currentMonth && expenseDate.getFullYear() === currentYear;
  });
  
  // Calculate expenses
  const monthlyExpenses = currentMonthExpenses.reduce((sum, expense) => {
    return sum + expense.amount;
  }, 0);
  
  // Count pending tasks
  const pendingTasksCount = tasks.filter(task => task.status === "pending" || task.status === "in-progress").length;
  
  // Count active customers (those with invoices in last 3 months)
  const threeMonthsAgo = new Date();
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
  
  const recentInvoiceCustomerIds = invoices
    .filter(invoice => new Date(invoice.date) >= threeMonthsAgo)
    .map(invoice => invoice.customerId);
    
  const activeCustomers = new Set(recentInvoiceCustomerIds).size;
  
  return {
    totalRevenue: monthlyRevenue,
    pendingInvoices: currentMonthInvoices.filter(invoice => invoice.status === "open").length,
    activeJobs: tasks.filter(task => task.status === "in-progress").length,
    completedJobs: tasks.filter(task => task.status === "completed").length,
    mechanicEfficiency: 85, // Placeholder value
    monthlyRevenue,
    monthlyExpenses,
    monthlyProfit: monthlyRevenue - monthlyExpenses,
    pendingTasks: pendingTasksCount,
    activeCustomers,
    activeVehicles: vehicles.length,
    inventoryValue: parts.reduce((sum, part) => sum + (part.price * part.quantity), 0),
    lowStockItems: parts.filter(part => part.quantity <= part.reorderLevel).length
  };
};

// Extend User interface to include permissions
declare module '@/types' {
  interface User {
    permissions?: {
      [key: string]: string[];
    };
  }
}
