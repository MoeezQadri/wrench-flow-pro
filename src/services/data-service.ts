import { Customer, CustomerAnalytics, Expense, Invoice, Mechanic, Part, RolePermissionMap, Task, User, Vehicle, Attendance } from "@/types";
import { v4 as uuidv4 } from 'uuid';

// Mock data for demonstration purposes
export const availableCountries = ["United States", "Canada", "United Kingdom", "Germany", "France", "Japan", "Australia", "Brazil", "India", "China"];

export const availableCurrencies = [
  { code: "USD", name: "US Dollar", symbol: "$" },
  { code: "EUR", name: "Euro", symbol: "€" },
  { code: "GBP", name: "British Pound", symbol: "£" },
  { code: "CAD", name: "Canadian Dollar", symbol: "$" },
  { code: "AUD", name: "Australian Dollar", symbol: "$" },
  { code: "JPY", name: "Japanese Yen", symbol: "¥" },
  { code: "CNY", name: "Chinese Yuan", symbol: "¥" },
  { code: "INR", name: "Indian Rupee", symbol: "₹" },
  { code: "BRL", name: "Brazilian Real", symbol: "R$" },
  { code: "ZAR", name: "South African Rand", symbol: "R" }
];

export const rolePermissions: { [key: string]: RolePermissionMap } = {
  owner: {
    dashboard: { view: true, manage: true },
    customers: { view: true, manage: true },
    vehicles: { view: true, manage: true },
    invoices: { view: true, manage: true },
    tasks: { view: true, manage: true },
    mechanics: { view: true, manage: true },
    parts: { view: true, manage: true },
    expenses: { view: true, manage: true },
    reports: { view: true, manage: true },
    settings: { view: true, manage: true },
    users: { view: true, manage: true },
	attendance: { view: true, manage: true, approve: true }
  },
  manager: {
    dashboard: { view: true, manage: false },
    customers: { view: true, manage: true },
    vehicles: { view: true, manage: true },
    invoices: { view: true, manage: true },
    tasks: { view: true, manage: true },
    mechanics: { view: true, manage: false },
    parts: { view: true, manage: true },
    expenses: { view: true, manage: true },
    reports: { view: true, manage: false },
    settings: { view: true, manage: false },
    users: { view: true, manage: false },
	attendance: { view: true, manage: true, approve: true }
  },
  mechanic: {
    dashboard: { view: true, manage: false },
    customers: { view: true, manage: false },
    vehicles: { view: true, manage: false },
    invoices: { view: true, manage: false },
    tasks: { view: true, manage: true },
    mechanics: { view: true, manage: false },
    parts: { view: true, manage: false },
    expenses: { view: false, manage: false },
    reports: { view: false, manage: false },
    settings: { view: false, manage: false },
    users: { view: false, manage: false },
	attendance: { view: true, manage: true, approve: false }
  },
  accountant: {
    dashboard: { view: true, manage: false },
    customers: { view: true, manage: false },
    vehicles: { view: true, manage: false },
    invoices: { view: true, manage: true },
    tasks: { view: false, manage: false },
    mechanics: { view: false, manage: false },
    parts: { view: false, manage: false },
    expenses: { view: true, manage: true },
    reports: { view: true, manage: true },
    settings: { view: false, manage: false },
    users: { view: false, manage: false },
	attendance: { view: false, manage: false, approve: false }
  }
};

export const users: User[] = [
  {
    id: "user_001",
    name: "John Doe",
    email: "john.doe@example.com",
    role: "owner",
    organization_id: "org_001",
	mechanicId: "mech_001"
  },
  {
    id: "user_002",
    name: "Jane Smith",
    email: "jane.smith@example.com",
    role: "manager",
    organization_id: "org_001",
	mechanicId: "mech_002"
  },
  {
    id: "user_003",
    name: "Mike Johnson",
    email: "mike.johnson@example.com",
    role: "mechanic",
    organization_id: "org_001",
	mechanicId: "mech_003"
  },
  {
    id: "user_004",
    name: "Emily White",
    email: "emily.white@example.com",
    role: "accountant",
    organization_id: "org_001",
	mechanicId: "mech_004"
  }
];

export const organizations = [
  {
    id: "org_001",
    name: "Acme Auto Repair",
    subscription_level: "premium",
    subscription_status: "active",
    address: "123 Main St, Anytown",
    phone: "555-123-4567",
    email: "info@acmeauto.com",
    country: "United States",
    currency: "USD",
    created_at: new Date().toISOString()
  }
];

export const mechanics: Mechanic[] = [
  {
    id: "mech_001",
    name: "Bob Villa",
    email: "bob.villa@example.com",
    phone: "555-987-6543",
    address: "456 Elm St, Anytown",
    specialty: "Engine Repair",
    years_of_experience: 10,
    certifications: ["ASE Certified"],
    created_at: new Date().toISOString()
  },
  {
    id: "mech_002",
    name: "Alice Johnson",
    email: "alice.johnson@example.com",
    phone: "555-246-8013",
    address: "789 Oak St, Anytown",
    specialty: "Brakes and Suspension",
    years_of_experience: 5,
    certifications: [],
    created_at: new Date().toISOString()
  },
  {
    id: "mech_003",
    name: "Tom Hanson",
    email: "tom.hanson@example.com",
    phone: "555-135-7924",
    address: "321 Pine St, Anytown",
    specialty: "Electrical Systems",
    years_of_experience: 7,
    certifications: ["Master Technician"],
    created_at: new Date().toISOString()
  },
  {
    id: "mech_004",
    name: "Sara Lee",
    email: "sara.lee@example.com",
    phone: "555-864-2097",
    address: "654 Maple St, Anytown",
    specialty: "Diagnostics",
    years_of_experience: 3,
    certifications: [],
    created_at: new Date().toISOString()
  }
];

export const customers: Customer[] = [
  {
    id: "cust_001",
    name: "Charlie Brown",
    email: "charlie.brown@example.com",
    phone: "555-111-2222",
    address: "100 Cartoon Ave, Anytown",
    totalVisits: 3,
    lifetimeValue: 500.00,
    lastVisit: new Date().toISOString(),
    created_at: new Date().toISOString()
  },
  {
    id: "cust_002",
    name: "Lucy Van Pelt",
    email: "lucy.vanpelt@example.com",
    phone: "555-333-4444",
    address: "200 Psychiatry Rd, Anytown",
    totalVisits: 5,
    lifetimeValue: 1200.00,
    lastVisit: new Date().toISOString(),
    created_at: new Date().toISOString()
  },
  {
    id: "cust_003",
    name: "Linus Van Pelt",
    email: "linus.vanpelt@example.com",
    phone: "555-555-6666",
    address: "300 Security Ln, Anytown",
    totalVisits: 2,
    lifetimeValue: 300.00,
    lastVisit: new Date().toISOString(),
    created_at: new Date().toISOString()
  },
  {
    id: "cust_004",
    name: "Peppermint Patty",
    email: "peppermint.patty@example.com",
    phone: "555-777-8888",
    address: "400 Baseball Dr, Anytown",
    totalVisits: 7,
    lifetimeValue: 1800.00,
    lastVisit: new Date().toISOString(),
    created_at: new Date().toISOString()
  }
];

export const vehicles: Vehicle[] = [
  {
    id: "vehicle_001",
    customer_id: "cust_001",
    make: "Toyota",
    model: "Camry",
    year: "2018",
    license_plate: "ABC-123",
    vin: "1234567890",
    color: "Silver",
    created_at: new Date().toISOString()
  },
  {
    id: "vehicle_002",
    customer_id: "cust_002",
    make: "Honda",
    model: "Civic",
    year: "2020",
    license_plate: "DEF-456",
    vin: "0987654321",
    color: "Blue",
    created_at: new Date().toISOString()
  },
  {
    id: "vehicle_003",
    customer_id: "cust_003",
    make: "Ford",
    model: "F-150",
    year: "2022",
    license_plate: "GHI-789",
    vin: "1122334455",
    color: "Red",
    created_at: new Date().toISOString()
  },
  {
    id: "vehicle_004",
    customer_id: "cust_004",
    make: "Chevrolet",
    model: "Malibu",
    year: "2019",
    license_plate: "JKL-012",
    vin: "6677889900",
    color: "Black",
    created_at: new Date().toISOString()
  }
];

export const parts: Part[] = [
  {
    id: "part_001",
    name: "Oil Filter",
    description: "Standard oil filter",
    price: 10.00,
    quantity: 100,
    vendor_id: "vendor_001",
    vendor_name: "NAPA Auto Parts",
    part_number: "12345",
    invoice_ids: ["invoice_001"],
    created_at: new Date().toISOString()
  },
  {
    id: "part_002",
    name: "Brake Pads",
    description: "Front brake pads",
    price: 40.00,
    quantity: 50,
    vendor_id: "vendor_002",
    vendor_name: "AutoZone",
    part_number: "67890",
    invoice_ids: ["invoice_002"],
    created_at: new Date().toISOString()
  },
  {
    id: "part_003",
    name: "Spark Plug",
    description: "Iridium spark plug",
    price: 7.50,
    quantity: 200,
    vendor_id: "vendor_001",
    vendor_name: "NAPA Auto Parts",
    part_number: "13579",
    invoice_ids: ["invoice_003"],
    created_at: new Date().toISOString()
  },
  {
    id: "part_004",
    name: "Air Filter",
    description: "Cabin air filter",
    price: 12.00,
    quantity: 75,
    vendor_id: "vendor_002",
    vendor_name: "AutoZone",
    part_number: "24680",
    invoice_ids: ["invoice_004"],
    created_at: new Date().toISOString()
  }
];

export const invoices: Invoice[] = [
  {
    id: "invoice_001",
    customer_id: "cust_001",
    vehicle_id: "vehicle_001",
    date: "2024-01-05",
    status: "open",
    tax_rate: 0.07,
    notes: "Oil change and filter replacement",
    items: [
      {
        id: "item_001",
        type: "labor",
        description: "Oil change service",
        price: 40.00,
        quantity: 1
      },
      {
        id: "item_002",
        type: "part",
        description: "Oil filter",
        price: 10.00,
        quantity: 1
      }
    ],
    payments: [],
    created_at: new Date().toISOString()
  },
  {
    id: "invoice_002",
    customer_id: "cust_002",
    vehicle_id: "vehicle_002",
    date: "2024-01-10",
    status: "in-progress",
    tax_rate: 0.07,
    notes: "Brake pad replacement",
    items: [
      {
        id: "item_003",
        type: "labor",
        description: "Brake pad replacement service",
        price: 120.00,
        quantity: 1
      },
      {
        id: "item_004",
        type: "part",
        description: "Brake pads",
        price: 40.00,
        quantity: 2
      }
    ],
    payments: [],
    created_at: new Date().toISOString()
  },
  {
    id: "invoice_003",
    customer_id: "cust_003",
    vehicle_id: "vehicle_003",
    date: "2024-01-15",
    status: "completed",
    tax_rate: 0.07,
    notes: "Spark plug replacement",
    items: [
      {
        id: "item_005",
        type: "labor",
        description: "Spark plug replacement service",
        price: 80.00,
        quantity: 1
      },
      {
        id: "item_006",
        type: "part",
        description: "Spark plugs",
        price: 7.50,
        quantity: 6
      }
    ],
    payments: [{
      id: "payment_001",
      date: "2024-01-15",
      amount: 133.35,
      method: "cash",
      notes: "Paid in full"
    }],
    created_at: new Date().toISOString()
  },
  {
    id: "invoice_004",
    customer_id: "cust_004",
    vehicle_id: "vehicle_004",
    date: "2024-01-20",
    status: "partial",
    tax_rate: 0.07,
    notes: "Air filter replacement",
    items: [
      {
        id: "item_007",
        type: "labor",
        description: "Air filter replacement service",
        price: 30.00,
        quantity: 1
      },
      {
        id: "item_008",
        type: "part",
        description: "Air filter",
        price: 12.00,
        quantity: 1
      }
    ],
    payments: [{
      id: "payment_002",
      date: "2024-01-20",
      amount: 30.00,
      method: "card",
      notes: "Partial payment"
    }],
    created_at: new Date().toISOString()
  }
];

export const vendors = [
  {
    id: "vendor_001",
    name: "NAPA Auto Parts",
    contact: "John Smith",
    phone: "555-123-4567",
    address: "123 Main St, Anytown",
    email: "john.smith@napa.com",
    created_at: new Date().toISOString()
  },
  {
    id: "vendor_002",
    name: "AutoZone",
    contact: "Jane Doe",
    phone: "555-987-6543",
    address: "456 Elm St, Anytown",
    email: "jane.doe@autozone.com",
    created_at: new Date().toISOString()
  }
];

export const generateId = (prefix: string): string => {
  return `${prefix}_${uuidv4()}`;
};

export const getCurrentUser = (): User => {
  // For now, return a default user
  return users[0];
};

export const hasPermission = (user: User, resource: keyof RolePermissionMap, action: string): boolean => {
  const role = user?.role || 'mechanic';
  const permissions = rolePermissions[role];

  if (!permissions || !permissions[resource]) {
    console.warn(`No permissions defined for role "${role}" and resource "${resource}"`);
    return false;
  }

  return permissions[resource][action] === true;
};

// Export missing functions and data
export const attendanceRecords: Attendance[] = [
  {
    id: "att_001",
    mechanic_id: "mech_001",
    date: "2024-01-15",
    check_in: "08:00",
    check_out: "17:00",
    status: "approved",
    notes: "Regular shift",
    approved_by: "admin_001",
    created_at: new Date().toISOString()
  }
];

export const expenses: Expense[] = [
  {
    id: "exp_001",
    category: "Tools",
    description: "Socket wrench set",
    amount: 150.00,
    date: new Date().toISOString(),
    payment_method: "card",
    vendor_name: "Tool Supply Co",
    vendor_id: "vendor_001",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

export const tasks: Task[] = [
  {
    id: "task_001",
    title: "Oil Change",
    description: "Regular oil change service",
    status: "pending",
    mechanic_id: "mech_001",
    vehicle_id: "vehicle_001",
    invoice_id: "invoice_001",
    hours_estimated: 1,
    hours_spent: 0,
    price: 50.00,
    location: "workshop",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

// Function to get a single invoice by ID
export const getInvoiceById = async (id: string): Promise<Invoice | null> => {
  const allInvoices = await getInvoices();
  return allInvoices.find(invoice => invoice.id === id) || null;
};

// Function to get a single customer by ID
export const getCustomerById = async (id: string): Promise<Customer | null> => {
  const allCustomers = await getCustomers();
  return allCustomers.find(customer => customer.id === id) || null;
};

// Function to get a single vehicle by ID
export const getVehicleById = async (id: string): Promise<Vehicle | null> => {
  const allVehicles = await getVehicles();
  return allVehicles.find(vehicle => vehicle.id === id) || null;
};

// Function to get a single mechanic by ID
export const getMechanicById = async (id: string): Promise<Mechanic | null> => {
  const allMechanics = await getMechanics();
  return allMechanics.find(mechanic => mechanic.id === id) || null;
};

// Function to get vehicles by customer ID
export const getVehiclesByCustomerId = async (customerId: string): Promise<Vehicle[]> => {
  const allVehicles = await getVehicles();
  return allVehicles.filter(vehicle => vehicle.customer_id === customerId);
};

// Function to get customer analytics
export const getCustomerAnalytics = async (customerId: string): Promise<CustomerAnalytics> => {
  const customer = await getCustomerById(customerId);
  const vehicles = await getVehiclesByCustomerId(customerId);
  const allInvoices = await getInvoices();
  const customerInvoices = allInvoices.filter(invoice => invoice.customer_id === customerId);
  
  const totalInvoices = customerInvoices.length;
  const lifetimeValue = customerInvoices.reduce((sum, invoice) => {
    const { total } = calculateInvoiceTotal(invoice);
    return sum + total;
  }, 0);
  
  return {
    totalInvoices,
    lifetimeValue,
    averageInvoiceValue: totalInvoices > 0 ? lifetimeValue / totalInvoices : 0,
    vehicles,
    invoiceHistory: customerInvoices
  };
};

// Function to calculate invoice total
export const calculateInvoiceTotal = (invoice: Invoice) => {
  const itemsTotal = invoice.items?.reduce((sum, item) => sum + (item.price * item.quantity), 0) || 0;
  const tax = itemsTotal * (invoice.tax_rate || 0);
  const total = itemsTotal + tax;
  
  return {
    subtotal: itemsTotal,
    tax,
    total
  };
};

// Function to calculate dashboard metrics
export const calculateDashboardMetrics = async () => {
  const customers = await getCustomers();
  const invoices = await getInvoices();
  const vehicles = await getVehicles();
  
  const totalRevenue = invoices.reduce((sum, invoice) => {
    const { total } = calculateInvoiceTotal(invoice);
    return sum + total;
  }, 0);
  
  const activeInvoices = invoices.filter(invoice => 
    ['open', 'in-progress'].includes(invoice.status)
  ).length;
  
  return {
    totalCustomers: customers.length,
    totalRevenue,
    activeInvoices,
    totalVehicles: vehicles.length,
    revenueData: [totalRevenue], // Simplified for now
    invoiceData: [invoices.length],
    customerData: [customers.length]
  };
};

// Function to approve attendance
export const approveAttendance = async (attendanceId: string, approvedBy: string): Promise<void> => {
  // In a real app, this would update the database
  console.log(`Attendance ${attendanceId} approved by ${approvedBy}`);
};

// Function to record attendance
export const recordAttendance = async (attendanceData: Omit<Attendance, "id">): Promise<Attendance> => {
  const newAttendance: Attendance = {
    ...attendanceData,
    id: generateId("attendance"),
    created_at: new Date().toISOString()
  };
  
  attendanceRecords.push(newAttendance);
  return newAttendance;
};

// Function to get attendance records
export const getAttendanceRecords = async (): Promise<Attendance[]> => {
  return attendanceRecords;
};

// Mock function to get all users
export const getUsers = async (): Promise<User[]> => {
    return users;
};

// Mock function to get all organizations
export const getOrganizations = async (): Promise<any[]> => {
    return organizations;
};

// Mock function to get all mechanics
export const getMechanics = async (): Promise<Mechanic[]> => {
    return mechanics;
};

// Mock function to get all customers
export const getCustomers = async (): Promise<Customer[]> => {
    return customers;
};

// Mock function to get all vehicles
export const getVehicles = async (): Promise<Vehicle[]> => {
    return vehicles;
};

// Mock function to get all parts
export const getParts = async (): Promise<Part[]> => {
    return parts;
};

// Mock function to get all invoices
export const getInvoices = async (): Promise<Invoice[]> => {
    return invoices;
};

// Mock function to add a new customer
export const addCustomer = async (customerData: Omit<Customer, "id">): Promise<Customer> => {
    const newCustomer: Customer = {
        ...customerData,
        id: generateId("cust"),
        totalVisits: 0,
        lifetimeValue: 0,
        lastVisit: null,
        created_at: new Date().toISOString()
    };
    customers.push(newCustomer);
    return newCustomer;
};

// Mock function to add a new vehicle
export const addVehicle = async (customerId: string, vehicleData: Omit<Vehicle, "id">): Promise<Vehicle> => {
    const newVehicle: Vehicle = {
        ...vehicleData,
        id: generateId("vehicle"),
        customer_id: customerId,
        created_at: new Date().toISOString()
    };
    vehicles.push(newVehicle);
    return newVehicle;
};

// Mock function to update organization
export const updateOrganization = async (organizationId: string, updates: Partial<any>): Promise<any> => {
  const orgIndex = organizations.findIndex(org => org.id === organizationId);
  if (orgIndex === -1) {
    console.error(`Organization with ID ${organizationId} not found`);
    return null;
  }

  // Update the organization with the provided updates
  organizations[orgIndex] = { ...organizations[orgIndex], ...updates };
  return organizations[orgIndex];
};

// Mock function to get organization by ID
export const getOrganizationById = async (organizationId: string): Promise<any> => {
  return organizations.find(org => org.id === organizationId);
};
