import { User, Customer, Vehicle, Invoice, Part, Mechanic, Vendor, Expense, Attendance, Task, CustomerAnalytics, DashboardMetrics, InvoiceItem, Payment, InvoiceStatus, UserRole, RolePermissionMap } from "@/types";
import * as supabaseService from "./supabase-service";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// Use environment variable to determine if we should use mock data or real data
const USE_MOCK_DATA = false; // Change this to false to use Supabase

// Mock user data with permissions
const users: User[] = [
  {
    id: "1",
    name: "Admin User",
    email: "admin@example.com",
    role: "owner" as UserRole,
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
    role: "foreman" as UserRole,
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
    employmentType: "fulltime",
    isActive: true
  },
  { 
    id: "mech2", 
    name: "Sarah Johnson", 
    specialization: "Electrical Systems", 
    phone: "555-2222", 
    address: "202 Garage Ave",
    idCardImage: "/lovable-uploads/b52e749c-5ab7-46f8-9727-4269e4dd0240.png",
    employmentType: "contractor",
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
        id: "item1",
        type: "labor",
        description: "Oil Change",
        price: 49.99,
        quantity: 1
      },
      {
        id: "item2",
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
        invoiceId: "inv1",
        amount: 67.36,
        date: "2023-05-15",
        method: "card",
        notes: ""
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
        id: "item3",
        type: "labor",
        description: "Brake Replacement",
        price: 299.99,
        quantity: 1
      },
      {
        id: "item4",
        type: "part",
        description: "Brake Pads",
        price: 45.99,
        quantity: 4
      }
    ],
    status: "open" as InvoiceStatus,
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
        id: "item5",
        type: "labor",
        description: "A/C Repair",
        price: 199.99,
        quantity: 1
      },
      {
        id: "item6",
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
        invoiceId: "inv3",
        amount: 100.00,
        date: "2023-06-10",
        method: "cash",
        notes: ""
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
    paymentMethod: "bank-transfer",
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
    paymentMethod: "card",
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
    paymentMethod: "cash",
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
    status: "in-progress",
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
export const rolePermissions: Record<UserRole, RolePermissionMap> = {
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
    tasks: { view: true, manage: 'own' },
    parts: { view: true, manage: false },
    finance: { view: false, manage: false },
    expenses: { view: false, manage: false },
    reports: { view: 'own', manage: false },
    attendance: { view: 'own', manage: 'own', approve: false },
    settings: { view: false, manage: false },
    organization: { view: false, manage: false },
    users: { view: false, manage: false },
    subscription: { view: false, manage: false },
    vehicles: { view: true, manage: false },
    roles: { view: false, manage: false }
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
  try {
    if (!user) return false;

    if (user.role === 'superuser') return true;

    // Check if the user has role-based permissions
    if (user.role && rolePermissions[user.role]) {
      const resourcePermissions = rolePermissions[user.role][resource];
      
      // If resource permissions don't exist, deny access
      if (!resourcePermissions) return false;
      
      // Check if the resource permissions is a simple boolean
      if (typeof resourcePermissions === 'boolean') {
        return resourcePermissions;
      }
      
      // Check if the action exists directly in the resource permissions
      if (action in resourcePermissions) {
        const permValue = resourcePermissions[action];
        return permValue === true || permValue === 'own';
      }
      
      // If we have BasePermission with view/manage, handle those cases
      if ('view' in resourcePermissions && action === 'view') {
        return resourcePermissions.view === true || resourcePermissions.view === 'own';
      }
      
      if ('manage' in resourcePermissions && 
         (action === 'create' || action === 'edit' || action === 'delete' || action === 'manage')) {
        return resourcePermissions.manage === true || resourcePermissions.manage === 'own';
      }
    }
    
    // If user has explicit permissions, check those
    if (user.permissions) {
      const userPermissions = user.permissions[resource];
      if (!userPermissions) {
        return false;
      }
      
      return userPermissions.includes(action);
    }
    
    return false;
  } catch (error) {
    console.error('Error checking permissions:', error);
    return false;
  }
};

// Utility functions
export const generateId = (prefix: string): string => {
  const timestamp = Date.now().toString(36);
  const randomChars = Math.random().toString(36).substring(2, 8);
  return `${prefix}_${timestamp}${randomChars}`;
};

// Customer functions
export const getCustomers = async () => {
  if (USE_MOCK_DATA) {
    return customers;
  }
  
  try {
    const data = await supabaseService.fetchCustomers();
    return data;
  } catch (error) {
    console.error('Error fetching customers:', error);
    toast.error('Failed to load customers. Using mock data instead.');
    return customers;
  }
};

export const getCustomerById = async (id: string) => {
  if (USE_MOCK_DATA) {
    return customers.find(customer => customer.id === id);
  }
  
  try {
    const data = await supabaseService.fetchCustomerById(id);
    return data;
  } catch (error) {
    console.error('Error fetching customer by ID:', error);
    toast.error('Failed to load customer. Using mock data instead.');
    return customers.find(customer => customer.id === id);
  }
};

export const addCustomer = async (customerData: Omit<Customer, "id">) => {
  if (USE_MOCK_DATA) {
    const newCustomer = {
      id: generateId("cust"),
      ...customerData
    };
    customers.push(newCustomer);
    return newCustomer;
  }
  
  try {
    const data = await supabaseService.addCustomer(customerData);
    toast.success('Customer added successfully');
    return data;
  } catch (error) {
    console.error('Error adding customer:', error);
    toast.error('Failed to add customer');
    throw error;
  }
};

// Function to return customer analytics with the correct type
export const getCustomerAnalytics = async (customerId: string): Promise<CustomerAnalytics> => {
  if (USE_MOCK_DATA) {
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
  }
  
  try {
    // Get customer invoices from Supabase
    const { data: customerInvoices, error: invoicesError } = await supabase
      .from('invoices')
      .select(`
        *,
        invoice_items(*),
        payments(*),
        vehicles(make, model, year, license_plate)
      `)
      .eq('customer_id', customerId);
      
    if (invoicesError) throw invoicesError;
    
    // Get customer vehicles
    const customerVehicles = await supabaseService.fetchVehiclesByCustomerId(customerId);
    
    // Transform to fit our analytics type
    const transformedInvoices = customerInvoices.map(invoice => ({
      id: invoice.id,
      customerId: invoice.customer_id,
      vehicleId: invoice.vehicle_id,
      vehicleInfo: {
        make: invoice.vehicles?.make || '',
        model: invoice.vehicles?.model || '',
        year: invoice.vehicles?.year || '',
        licensePlate: invoice.vehicles?.license_plate || ''
      },
      status: invoice.status as InvoiceStatus,
      date: invoice.date,
      dueDate: invoice.due_date || invoice.date,
      items: invoice.invoice_items.map((item: any) => ({
        id: item.id,
        type: item.type as 'labor' | 'part',
        description: item.description,
        quantity: item.quantity,
        price: item.price
      })),
      notes: invoice.notes || '',
      taxRate: invoice.tax_rate,
      payments: invoice.payments.map((payment: any) => ({
        id: payment.id,
        invoiceId: payment.invoice_id,
        amount: payment.amount,
        method: payment.method as 'cash' | 'card' | 'bank-transfer',
        date: payment.date,
        notes: payment.notes || ''
      }))
    }));
    
    // Calculate total spent
    const totalSpent = transformedInvoices.reduce((sum, invoice) => {
      const { total } = calculateInvoiceTotal(invoice);
      return sum + total;
    }, 0);
    
    // Find first and last visit dates
    let firstVisitDate = "";
    let lastVisitDate = "";
    
    if (transformedInvoices.length > 0) {
      const sortedInvoices = [...transformedInvoices].sort((a, b) => 
        new Date(a.date).getTime() - new Date(b.date).getTime()
      );
      
      firstVisitDate = sortedInvoices[0].date;
      lastVisitDate = sortedInvoices[sortedInvoices.length - 1].date;
    }
    
    return {
      totalInvoices: transformedInvoices.length,
      lifetimeValue: totalSpent,
      averageInvoiceValue: transformedInvoices.length > 0 ? totalSpent / transformedInvoices.length : 0,
      firstVisitDate,
      lastVisitDate,
      vehicles: customerVehicles,
      invoiceHistory: transformedInvoices
    };
  } catch (error) {
    console.error('Error fetching customer analytics:', error);
    toast.error('Failed to load customer analytics. Using mock data instead.');
    
    // Fallback to mock data
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
  }
};

// Vehicle functions
export const getVehicleById = async (id: string) => {
  if (USE_MOCK_DATA) {
    return vehicles.find(vehicle => vehicle.id === id);
  }
  
  try {
    const { data, error } = await supabase
      .from('vehicles')
      .select('*')
      .eq('id', id)
      .single();
      
    if (error) throw error;
    
    return {
      id: data.id,
      customerId: data.customer_id,
      make: data.make,
      model: data.model,
      year: data.year,
      licensePlate: data.license_plate,
      vin: data.vin,
      color: data.color
    };
  } catch (error) {
    console.error('Error fetching vehicle by ID:', error);
    toast.error('Failed to load vehicle. Using mock data instead.');
    return vehicles.find(vehicle => vehicle.id === id);
  }
};

export const getVehiclesByCustomerId = async (customerId: string) => {
  if (USE_MOCK_DATA) {
    return vehicles.filter(vehicle => vehicle.customerId === customerId);
  }
  
  try {
    const data = await supabaseService.fetchVehiclesByCustomerId(customerId);
    return data;
  } catch (error) {
    console.error('Error fetching vehicles by customer ID:', error);
    toast.error('Failed to load vehicles. Using mock data instead.');
    return vehicles.filter(vehicle => vehicle.customerId === customerId);
  }
};

export const addVehicle = async (customerId: string, vehicleData: Omit<Vehicle, "id" | "customerId">) => {
  if (USE_MOCK_DATA) {
    const newVehicle = {
      id: generateId("veh"),
      customerId,
      ...vehicleData
    };
    vehicles.push(newVehicle);
    return newVehicle;
  }
  
  try {
    const newVehicleData = {
      customerId,
      ...vehicleData
    };
    
    const data = await supabaseService.addVehicle(newVehicleData);
    toast.success('Vehicle added successfully');
    return data;
  } catch (error) {
    console.error('Error adding vehicle:', error);
    toast.error('Failed to add vehicle');
    throw error;
  }
};

// Invoice functions
export const getInvoiceById = async (id: string) => {
  if (USE_MOCK_DATA) {
    return invoices.find(invoice => invoice.id === id);
  }
  
  try {
    const data = await supabaseService.fetchInvoiceById(id);
    return data;
  } catch (error) {
    console.error('Error fetching invoice by ID:', error);
    toast.error('Failed to load invoice. Using mock data instead.');
    return invoices.find(invoice => invoice.id === id);
  }
};

export const getInvoices = async () => {
  if (USE_MOCK_DATA) {
    return invoices;
  }
  
  try {
    const data = await supabaseService.fetchInvoices();
    return data;
  } catch (error) {
    console.error('Error fetching invoices:', error);
    toast.error('Failed to load invoices. Using mock data instead.');
    return invoices;
  }
};

// Mechanic functions
export const getMechanics = async () => {
  if (USE_MOCK_DATA) {
    return mechanics.filter(mechanic => mechanic.isActive);
  }
  
  try {
    const data = await supabaseService.fetchMechanics();
    return data.filter(mechanic => mechanic.isActive);
  } catch (error) {
    console.error('Error fetching mechanics:', error);
    toast.error('Failed to load mechanics. Using mock data instead.');
    return mechanics.filter(mechanic => mechanic.isActive);
  }
};

export const getMechanicById = async (id: string) => {
  if (USE_MOCK_DATA) {
    return mechanics.find(mechanic => mechanic.id === id);
  }
  
  try {
    const data = await supabaseService.fetchMechanicById(id);
    return data;
  } catch (error) {
    console.error('Error fetching mechanic by ID:', error);
    toast.error('Failed to load mechanic. Using mock data instead.');
    return mechanics.find(mechanic => mechanic.id === id);
  }
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
export const recordAttendance = async (attendanceData: Omit<Attendance, "id">) => {
  if (USE_MOCK_DATA) {
    const newAttendance = {
      id: generateId("att"),
      ...attendanceData
    };
    attendanceRecords.push(newAttendance);
    return newAttendance;
  }
  
  try {
    const data = await supabaseService.recordAttendanceInDb(attendanceData);
    toast.success('Attendance recorded successfully');
    return data;
  } catch (error) {
    console.error('Error recording attendance:', error);
    toast.error('Failed to record attendance');
    throw error;
  }
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
export const getAttendance = async () => {
  if (USE_MOCK_DATA) {
    return attendanceRecords;
  }
  
  try {
    const data = await supabaseService.fetchAttendance();
    return data;
  } catch (error) {
    console.error('Error fetching attendance:', error);
    toast.error('Failed to load attendance records. Using mock data instead.');
    return attendanceRecords;
  }
};

// Task functions
export const getTasks = async () => {
  if (USE_MOCK_DATA) {
    return tasks;
  }
  
  try {
    const data = await supabaseService.fetchTasks();
    return data;
  } catch (error) {
    console.error('Error fetching tasks:', error);
    toast.error('Failed to load tasks. Using mock data instead.');
    return tasks;
  }
};

// Finance functions
export const getExpensesByDateRange = async (startDate: string, endDate: string) => {
  if (USE_MOCK_DATA) {
    return expenses.filter(expense => {
      const expenseDate = new Date(expense.date);
      return expenseDate >= new Date(startDate) && expenseDate <= new Date(endDate);
    });
  }
  
  try {
    const { data, error } = await supabase
      .from('expenses')
      .select('*')
      .gte('date', startDate)
      .lte('date', endDate);
      
    if (error) throw error;
    
    return data.map(e => ({
      id: e.id,
      date: e.date,
      category: e.category,
      amount: e.amount,
      description: e.description || '',
      paymentMethod: e.payment_method,
      paymentStatus: e.payment_status,
      vendorId: e.vendor_id,
      vendorName: e.vendor_name
    }));
  } catch (error) {
    console.error('Error fetching expenses by date range:', error);
    toast.error('Failed to load expenses. Using mock data instead.');
    return expenses.filter(expense => {
      const expenseDate = new Date(expense.date);
      return expenseDate >= new Date(startDate) && expenseDate <= new Date(endDate);
    });
  }
};

export const getPaymentsByDateRange = async (startDate: string, endDate: string) => {
  if (USE_MOCK_DATA) {
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
  }
  
  try {
    const { data, error } = await supabase
      .from('payments')
      .select('*, invoices!inner(customer_id)')
      .gte('date', startDate)
      .lte('date', endDate);
      
    if (error) throw error;
    
    return data.map(p => ({
      id: p.id,
      invoiceId: p.invoice_id,
      customerId: p.invoices.customer_id,
      amount: p.amount,
      method: p.method,
      date: p.date,
      notes: p.notes || ''
    }));
  } catch (error) {
    console.error('Error fetching payments by date range:', error);
    toast.error('Failed to load payments. Using mock data instead.');
    
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
  }
};

// Dashboard metrics
export const calculateDashboardMetrics = async (): Promise<DashboardMetrics> => {
  if (USE_MOCK_DATA) {
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
  }
  
  try {
    const now = new Date();
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const currentMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString();
    
    // Get current month invoices
    const { data: currentMonthInvoices, error: invoicesError } = await supabase
      .from('invoices')
      .select('*, invoice_items(*), payments(*)')
      .gte('date', currentMonthStart)
      .lte('date', currentMonthEnd);
      
    if (invoicesError) throw invoicesError;
    
    // Transform invoices to match our Invoice type
    const transformedInvoices = currentMonthInvoices.map(invoice => ({
      id: invoice.id,
      customerId: invoice.customer_id,
      vehicleId: invoice.vehicle_id,
      vehicleInfo: {
        make: '',  // We'll leave this blank for now
        model: '',
        year: '',
        licensePlate: ''
      },
      status: invoice.status as InvoiceStatus,
      date: invoice.date,
      dueDate: invoice.due_date || invoice.date,
      items: invoice.invoice_items.map((item: any) => ({
        id: item.id,
        type: item.type as 'labor' | 'part',
        description: item.description,
        quantity: item.quantity,
        price: item.price
      })),
      notes: invoice.notes || '',
      taxRate: invoice.tax_rate,
      payments: invoice.payments.map((payment: any) => ({
        id: payment.id,
        invoiceId: payment.invoice_id,
        amount: payment.amount,
        method: payment.method as 'cash' | 'card' | 'bank-transfer',
        date: payment.date,
        notes: payment.notes || ''
      }))
    }));
    
    // Calculate revenue
    const monthlyRevenue = transformedInvoices.reduce((sum, invoice) => {
      const { total } = calculateInvoiceTotal(invoice);
      return sum + total;
    }, 0);
    
    // Get current month expenses
    const { data: currentMonthExpenses, error: expensesError } = await supabase
      .from('expenses')
      .select('*')
      .gte('date', currentMonthStart)
      .lte('date', currentMonthEnd);
      
    if (expensesError) throw expensesError;
    
    // Calculate expenses
    const monthlyExpenses = currentMonthExpenses.reduce((sum, expense) => {
      return sum + expense.amount;
    }, 0);
    
    // Get pending tasks
    const { data: pendingTasksData, error: pendingTasksError } = await supabase
      .from('tasks')
      .select('count')
      .in('status', ['pending', 'in-progress']);
      
    if (pendingTasksError) throw pendingTasksError;
    
    // Get in-progress tasks
    const { data: inProgressTasks, error: inProgressError } = await supabase
      .from('tasks')
      .select('count')
      .eq('status', 'in-progress');
      
    if (inProgressError) throw inProgressError;
    
    // Get completed tasks
    const { data: completedTasks, error: completedError } = await supabase
      .from('tasks')
      .select('count')
      .eq('status', 'completed');
      
    if (completedError) throw completedError;
    
    // Get customers with invoices in the last 3 months
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
    
    const { data: activeCustomersData, error: activeCustomersError } = await supabase
      .from('invoices')
      .select('customer_id')
      .gte('date', threeMonthsAgo.toISOString());
      
    if (activeCustomersError) throw activeCustomersError;
    
    // Count unique customer IDs
    const activeCustomerIds = new Set(activeCustomersData.map(invoice => invoice.customer_id));
    
    // Get vehicle count
    const { count: vehicleCount, error: vehicleError } = await supabase
      .from('vehicles')
      .select('*', { count: 'exact', head: true });
      
    if (vehicleError) throw vehicleError;
    
    // Get parts data
    const { data: partsData, error: partsError } = await supabase
      .from('parts')
      .select('*');
      
    if (partsError) throw partsError;
    
    // Calculate inventory value
    const inventoryValue = partsData.reduce((sum, part) => sum + (part.price * part.quantity), 0);
    
    // Count low stock items
    const lowStockItems = partsData.filter(part => part.quantity <= part.reorder_level).length;
    
    return {
      totalRevenue: monthlyRevenue,
      pendingInvoices: transformedInvoices.filter(invoice => invoice.status === "open").length,
      activeJobs: inProgressTasks ? parseInt(inProgressTasks[0]?.count) : 0,
      completedJobs: completedTasks ? parseInt(completedTasks[0]?.count) : 0,
      mechanicEfficiency: 85, // We'll keep this as a placeholder for now
      monthlyRevenue,
      monthlyExpenses,
      monthlyProfit: monthlyRevenue - monthlyExpenses,
      pendingTasks: pendingTasksData ? parseInt(pendingTasksData[0]?.count) : 0,
      activeCustomers: activeCustomerIds.size,
      activeVehicles: vehicleCount || 0,
      inventoryValue,
      lowStockItems
    };
  } catch (error) {
    console.error('Error calculating dashboard metrics:', error);
    toast.error('Failed to calculate metrics. Using mock data instead.');
    
    // Fallback to mock implementation
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    const currentMonthInvoices = invoices.filter(invoice => {
      const invoiceDate = new Date(invoice.date);
      return invoiceDate.getMonth() === currentMonth && invoiceDate.getFullYear() === currentYear;
    });
    
    const monthlyRevenue = currentMonthInvoices.reduce((sum, invoice) => {
      const { total } = calculateInvoiceTotal(invoice);
      return sum + total;
    }, 0);
    
    const currentMonthExpenses = expenses.filter(expense => {
      const expenseDate = new Date(expense.date);
      return expenseDate.getMonth() === currentMonth && expenseDate.getFullYear() === currentYear;
    });
    
    const monthlyExpenses = currentMonthExpenses.reduce((sum, expense) => {
      return sum + expense.amount;
    }, 0);
    
    const pendingTasksCount = tasks.filter(task => task.status === "pending" || task.status === "in-progress").length;
    
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
      mechanicEfficiency: 85,
      monthlyRevenue,
      monthlyExpenses,
      monthlyProfit: monthlyRevenue - monthlyExpenses,
      pendingTasks: pendingTasksCount,
      activeCustomers,
      activeVehicles: vehicles.length,
      inventoryValue: parts.reduce((sum, part) => sum + (part.price * part.quantity), 0),
      lowStockItems: parts.filter(part => part.quantity <= part.reorderLevel).length
    };
  }
};
