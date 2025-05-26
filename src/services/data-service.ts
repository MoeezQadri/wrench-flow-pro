import { faker } from "@faker-js/faker";
import { User, UserRole, Customer, Vehicle, Mechanic, Task, Invoice, InvoiceItem, Payment, Expense, Vendor, Part, Attendance, Organization, RolePermissionMap } from "@/types";

// Function to generate a unique ID
export const generateId = (prefix: string): string => {
  return `${prefix}_${faker.string.uuid()}`;
};

// Mock function to simulate user authentication
export const authenticateUser = (email: string, password?: string): Promise<User | null> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const user = mockUsers.find((u) => u.email === email);
      if (user && (!password || password === "password")) {
        resolve(user);
      } else {
        resolve(null);
      }
    }, 500);
  });
};

// Mock function to simulate fetching the current user
export const getCurrentUser = (): User => {
  // Replace this with your actual authentication logic
  return mockUsers[0];
};

// Mock function to simulate checking user permissions
export const hasPermission = (user: User | undefined, resource: keyof RolePermissionMap, action: string): boolean => {
  if (!user) return false;

  const rolePermissions = mockRolePermissions[user.role];

  if (!rolePermissions) return false;

  const resourcePermissions = rolePermissions[resource];

  if (typeof resourcePermissions === 'boolean') {
    return resourcePermissions;
  }

  if (typeof resourcePermissions === 'object' && resourcePermissions !== null) {
    return !!resourcePermissions[action];
  }

  return false;
};

// Mock data for users
export const mockUsers: User[] = [
  {
    id: generateId("user"),
    name: "John Doe",
    email: "john.doe@example.com",
    role: "superuser",
    is_active: true,
    lastLogin: new Date().toISOString(),
    organization_id: "org_1",
    isSuperAdmin: true,
    user_metadata: {
      role: 'owner',
      organizationId: 'org_1'
    }
  },
  {
    id: generateId("user"),
    name: "Jane Smith",
    email: "jane.smith@example.com",
    role: "owner",
    is_active: true,
    lastLogin: new Date().toISOString(),
    organization_id: "org_1",
    user_metadata: {
      role: 'owner',
      organizationId: 'org_1'
    }
  },
  {
    id: generateId("user"),
    name: "Alice Johnson",
    email: "alice.johnson@example.com",
    role: "manager",
    is_active: true,
    lastLogin: new Date().toISOString(),
    organization_id: "org_1",
    user_metadata: {
      role: 'manager',
      organizationId: 'org_1'
    }
  },
  {
    id: generateId("user"),
    name: "Bob Williams",
    email: "bob.williams@example.com",
    role: "foreman",
    is_active: true,
    lastLogin: new Date().toISOString(),
    organization_id: "org_1",
    user_metadata: {
      role: 'foreman',
      organizationId: 'org_1'
    }
  },
  {
    id: generateId("user"),
    name: "Charlie Brown",
    email: "charlie.brown@example.com",
    role: "mechanic",
    is_active: true,
    lastLogin: new Date().toISOString(),
    organization_id: "org_1",
    mechanicId: "mechanic_1",
    user_metadata: {
      role: 'mechanic',
      organizationId: 'org_1'
    }
  },
];

// Mock data for roles and permissions
export const mockRolePermissions: { [key in UserRole]: RolePermissionMap } = {
  superuser: {
    dashboard: true,
    customers: { view: true, manage: true },
    invoices: { view: true, manage: true },
    mechanics: { view: true, manage: true },
    tasks: { view: true, manage: true },
    parts: { view: true, manage: true },
    finance: { view: true, manage: true },
    expenses: { view: true, manage: true },
    reports: true,
    attendance: { view: true, manage: true, approve: true },
    settings: { view: true, manage: true },
    organization: { view: true, manage: true },
    users: { view: true, manage: true },
    subscription: { view: true, manage: true },
    vehicles: { view: true, manage: true },
    roles: { view: true, manage: true },
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
    reports: true,
    attendance: { view: true, manage: true, approve: true },
    settings: { view: true, manage: true },
    organization: { view: true, manage: true },
    users: { view: true, manage: true },
    subscription: { view: true, manage: true },
    vehicles: { view: true, manage: true },
    roles: { view: true, manage: true },
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
    reports: true,
    attendance: { view: true, manage: true },
    settings: { view: true, manage: false },
    organization: { view: true, manage: false },
    users: { view: true, manage: false },
    subscription: { view: false, manage: false },
    vehicles: { view: true, manage: true },
    roles: { view: false, manage: false },
  },
  foreman: {
    dashboard: true,
    customers: { view: true, manage: false },
    invoices: { view: true, manage: false },
    mechanics: { view: true, manage: false },
    tasks: { view: true, manage: { view: true, assign: true, create: true, update: true, complete: true } },
    parts: { view: true, manage: false },
    finance: { view: true, manage: false },
    expenses: { view: true, manage: false },
    reports: { view: true, manage: false },
    attendance: { view: true, manage: { update: 'own' } },
    settings: { view: false, manage: false },
    organization: { view: false, manage: false },
    users: { view: false, manage: false },
    subscription: { view: false, manage: false },
    vehicles: { view: true, manage: false },
    roles: { view: false, manage: false },
  },
  mechanic: {
    dashboard: true,
    customers: { view: true, manage: false },
    invoices: { view: true, manage: false },
    mechanics: { view: false, manage: false },
    tasks: { view: true, manage: { view: true, assign: 'own', create: 'own', update: 'own', complete: 'own' } },
    parts: { view: true, manage: false },
    finance: { view: false, manage: false },
    expenses: { view: false, manage: false },
    reports: { view: false, manage: false },
    attendance: { view: true, manage: { update: 'own' } },
    settings: { view: false, manage: false },
    organization: { view: false, manage: false },
    users: { view: false, manage: false },
    subscription: { view: false, manage: false },
    vehicles: { view: true, manage: false },
    roles: { view: false, manage: false },
  },
};

// Mock data for customers
export const mockCustomers: Customer[] = [
  {
    id: generateId("customer"),
    name: "Alice Brown",
    email: "alice.brown@example.com",
    phone: "555-123-4567",
    address: "123 Main St, Anytown, USA",
    total_visits: 3,
    lifetime_value: 350.00,
    last_visit: new Date(2023, 0, 20).toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: generateId("customer"),
    name: "Bob White",
    email: "bob.white@example.com",
    phone: "555-987-6543",
    address: "456 Elm St, Anytown, USA",
    total_visits: 5,
    lifetime_value: 675.50,
    last_visit: new Date(2023, 1, 15).toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: generateId("customer"),
    name: "Charlie Green",
    email: "charlie.green@example.com",
    phone: "555-555-5555",
    address: "789 Oak St, Anytown, USA",
    total_visits: 1,
    lifetime_value: 75.00,
    last_visit: new Date(2023, 2, 10).toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

// Mock data for vehicles
export const mockVehicles: Vehicle[] = [
  {
    id: generateId("vehicle"),
    make: "Toyota",
    model: "Camry",
    year: "2018",
    license_plate: "ABC-123",
    customer_id: mockCustomers[0].id,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: generateId("vehicle"),
    make: "Honda",
    model: "Civic",
    year: "2020",
    license_plate: "DEF-456",
    customer_id: mockCustomers[1].id,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: generateId("vehicle"),
    make: "Ford",
    model: "F-150",
    year: "2022",
    license_plate: "GHI-789",
    customer_id: mockCustomers[2].id,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

// Mock data for mechanics
export const mockMechanics: Mechanic[] = [
  {
    id: generateId("mechanic"),
    name: "Mike Davis",
    specialization: "Engine Repair",
    phone: "555-111-2222",
    address: "111 Mechanic St, Anytown, USA",
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: generateId("mechanic"),
    name: "Sarah Johnson",
    specialization: "Brakes & Suspension",
    phone: "555-333-4444",
    address: "222 Auto Ave, Anytown, USA",
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

// Mock data for tasks
export const mockTasks: Task[] = [
  {
    id: generateId("task"),
    title: "Oil Change",
    description: "Perform oil change service",
    status: "completed",
    vehicle_id: mockVehicles[0].id,
    mechanic_id: mockMechanics[0].id,
    hours_estimated: 1,
    hours_spent: 1,
    price: 75.00,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: generateId("task"),
    title: "Brake Replacement",
    description: "Replace front brake pads",
    status: "in-progress",
    vehicle_id: mockVehicles[1].id,
    mechanic_id: mockMechanics[1].id,
    hours_estimated: 3,
    hours_spent: 2,
    price: 300.00,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

// Mock data for invoices
export const mockInvoices: Invoice[] = [
  {
    id: generateId("invoice"),
    customer_id: mockCustomers[0].id,
    vehicle_id: mockVehicles[0].id,
    date: new Date(2023, 0, 20).toISOString(),
    status: "paid",
    tax_rate: 0.075,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    items: [
      {
        id: generateId("invoice_item"),
        invoice_id: "invoice_1",
        type: "labor",
        description: "Oil change service",
        quantity: 1,
        price: 75.00,
        created_at: new Date().toISOString(),
      },
    ],
    payments: [
      {
        id: generateId("payment"),
        invoice_id: "invoice_1",
        amount: 75.00,
        date: new Date(2023, 0, 20).toISOString(),
        method: "card",
        created_at: new Date().toISOString(),
      },
    ],
    customerInfo: {
      name: mockCustomers[0].name,
    },
    vehicleInfo: {
      make: mockVehicles[0].make,
      model: mockVehicles[0].model,
      licensePlate: mockVehicles[0].license_plate,
    },
  },
  {
    id: generateId("invoice"),
    customer_id: mockCustomers[1].id,
    vehicle_id: mockVehicles[1].id,
    date: new Date(2023, 1, 15).toISOString(),
    status: "pending",
    tax_rate: 0.075,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    items: [
      {
        id: generateId("invoice_item"),
        invoice_id: "invoice_2",
        type: "labor",
        description: "Brake replacement service",
        quantity: 1,
        price: 300.00,
        created_at: new Date().toISOString(),
      },
    ],
    payments: [],
    customerInfo: {
      name: mockCustomers[1].name,
    },
    vehicleInfo: {
      make: mockVehicles[1].make,
      model: mockVehicles[1].model,
      licensePlate: mockVehicles[1].license_plate,
    },
  },
];

// Mock data for expenses
export const mockExpenses: Expense[] = [
  {
    id: generateId("expense"),
    date: new Date(2023, 0, 15).toISOString(),
    category: "Parts",
    amount: 150.00,
    description: "Purchased brake pads",
    payment_method: "card",
    payment_status: "paid",
    vendor_id: "vendor_1",
    vendor_name: "AutoParts Plus",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: generateId("expense"),
    date: new Date(2023, 0, 10).toISOString(),
    category: "Rent",
    amount: 1200.00,
    description: "Monthly rent payment",
    payment_method: "bank-transfer",
    payment_status: "paid",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

// Mock data for parts
export const mockParts: Part[] = [
  {
    id: generateId("part"),
    name: "Brake Pads",
    description: "High-quality brake pads",
    part_number: "BP1234",
    price: 45.00,
    quantity: 50,
    reorder_level: 10,
    vendor_id: "vendor_1",
    vendor_name: "AutoParts Plus",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: generateId("part"),
    name: "Oil Filter",
    description: "Standard oil filter",
    part_number: "OF5678",
    price: 8.50,
    quantity: 100,
    reorder_level: 20,
    vendor_id: "vendor_2",
    vendor_name: "Quality Parts Co",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

// Mock data for attendance
export const mockAttendance: Attendance[] = [
  {
    mechanic_id: mockMechanics[0].id,
    date: new Date().toISOString().slice(0, 10),
    check_in: "08:00",
    check_out: "17:00",
    status: "present",
    approved_by: "manager_1",
    notes: "Arrived on time, full day",
    created_at: new Date().toISOString(),
  },
  {
    mechanic_id: mockMechanics[1].id,
    date: new Date().toISOString().slice(0, 10),
    check_in: "08:30",
    check_out: "12:00",
    status: "half-day",
    approved_by: "manager_1",
    notes: "Late arrival, half day",
    created_at: new Date().toISOString(),
  },
];

// Mock function to simulate fetching customers
export const getCustomers = async (): Promise<Customer[]> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(mockCustomers);
    }, 250);
  });
};

// Mock function to simulate adding a customer
export const addCustomer = async (customerData: Omit<Customer, "id">): Promise<Customer> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const newCustomer: Customer = {
        id: generateId("customer"),
        ...customerData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      mockCustomers.push(newCustomer);
      resolve(newCustomer);
    }, 250);
  });
};

// Mock function to simulate fetching vehicles
export const getVehicles = async (): Promise<Vehicle[]> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(mockVehicles);
    }, 250);
  });
};

// Mock function to simulate adding a vehicle
export const addVehicle = async (vehicleData: Omit<Vehicle, "id">): Promise<Vehicle> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const newVehicle: Vehicle = {
        id: generateId("vehicle"),
        ...vehicleData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      mockVehicles.push(newVehicle);
      resolve(newVehicle);
    }, 250);
  });
};

// Mock function to simulate fetching mechanics
export const getMechanics = async (): Promise<Mechanic[]> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(mockMechanics);
    }, 250);
  });
};

// Mock function to simulate adding a mechanic
export const addMechanic = async (mechanicData: Omit<Mechanic, "id">): Promise<Mechanic> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const newMechanic: Mechanic = {
        id: generateId("mechanic"),
        ...mechanicData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      mockMechanics.push(newMechanic);
      resolve(newMechanic);
    }, 250);
  });
};

// Mock function to simulate fetching tasks
export const getTasks = async (): Promise<Task[]> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(mockTasks);
    }, 250);
  });
};

// Mock function to simulate adding a task
export const addTask = async (taskData: Omit<Task, "id">): Promise<Task> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const newTask: Task = {
        id: generateId("task"),
        ...taskData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      mockTasks.push(newTask);
      resolve(newTask);
    }, 250);
  });
};

// Mock function to simulate fetching invoices
export const getInvoices = async (): Promise<Invoice[]> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(mockInvoices);
    }, 250);
  });
};

// Mock function to simulate adding an invoice
export const addInvoice = async (invoiceData: Omit<Invoice, "id">): Promise<Invoice> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const newInvoice: Invoice = {
        id: generateId("invoice"),
        ...invoiceData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      mockInvoices.push(newInvoice);
      resolve(newInvoice);
    }, 250);
  });
};

// Mock function to simulate fetching expenses
export const getExpenses = async (): Promise<Expense[]> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(mockExpenses);
    }, 250);
  });
};

// Mock function to simulate adding an expense
export const addExpense = async (expenseData: Omit<Expense, "id">): Promise<Expense> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const newExpense: Expense = {
        id: generateId("expense"),
        ...expenseData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      mockExpenses.push(newExpense);
      resolve(newExpense);
    }, 250);
  });
};

// Mock function to simulate fetching parts
export const getParts = async (): Promise<Part[]> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(mockParts);
    }, 250);
  });
};

// Mock function to simulate adding a part
export const addPart = async (partData: Omit<Part, "id">): Promise<Part> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const newPart: Part = {
        id: generateId("part"),
        ...partData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      mockParts.push(newPart);
      resolve(newPart);
    }, 250);
  });
};

// Mock function to simulate fetching attendance records
export const getAttendanceRecords = async (): Promise<Attendance[]> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(mockAttendance);
    }, 250);
  });
};

// Mock function to simulate adding an attendance record
export const addAttendanceRecord = async (attendanceData: Omit<Attendance, "id">): Promise<Attendance> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const newAttendance: Attendance = {
        id: generateId("attendance"),
        ...attendanceData,
        created_at: new Date().toISOString(),
      };
      mockAttendance.push(newAttendance);
      resolve(newAttendance);
    }, 250);
  });
};

// Mock data for organizations
export const mockOrganizations: Organization[] = [
  {
    id: "org_1",
    name: "Acme Corp",
    subscription_level: "premium",
    subscription_status: "active",
    country: "USA",
    currency: "USD",
    trial_ends_at: new Date(2024, 0, 1).toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

// Mock function to simulate fetching organizations
export const getOrganizations = async (): Promise<Organization[]> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(mockOrganizations);
    }, 250);
  });
};

// Mock function to simulate fetching an organization by ID
export const getOrganizationById = async (id: string): Promise<Organization | undefined> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const organization = mockOrganizations.find((org) => org.id === id);
      resolve(organization);
    }, 250);
  });
};

// Mock function to simulate updating an organization
export const updateOrganization = async (id: string, updates: Partial<Organization>): Promise<Organization | null> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const index = mockOrganizations.findIndex((org) => org.id === id);
      if (index !== -1) {
        mockOrganizations[index] = { ...mockOrganizations[index], ...updates, updated_at: new Date().toISOString() };
        resolve(mockOrganizations[index]);
      } else {
        resolve(null);
      }
    }, 250);
  });
};

// Add missing exports for vendors functionality
export const vendors: Vendor[] = [
  {
    id: "vendor_1",
    name: "AutoParts Plus",
    contact_name: "John Smith",
    email: "john@autoparts.com",
    phone: "555-123-4567",
    address: "123 Parts Ave, City, State 12345",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "vendor_2", 
    name: "Quality Parts Co",
    contact_name: "Jane Doe",
    email: "jane@qualityparts.com",
    phone: "555-987-6543",
    address: "456 Supply St, City, State 12345",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }
];

export const getVendorById = async (vendorId: string): Promise<Vendor | null> => {
  return vendors.find(vendor => vendor.id === vendorId) || null;
};

export const addVendor = async (vendorData: Omit<Vendor, "id">): Promise<Vendor> => {
  const newVendor: Vendor = {
    id: generateId("vendor"),
    ...vendorData,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  vendors.push(newVendor);
  return newVendor;
};

// Export RolePermissionMap type
export type { RolePermissionMap } from '@/types';
