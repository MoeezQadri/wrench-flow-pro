import { supabase } from "@/integrations/supabase/client";
import { 
  fetchTasks, 
  fetchMechanics, 
  fetchMechanicById, 
  fetchInvoices, 
  fetchCustomers, 
  fetchVehiclesByCustomerId,
  fetchExpenses,
  fetchParts,
  fetchAttendance,
  recordAttendanceInDb
} from "./supabase-service";
import { 
  User, 
  UserRole, 
  Customer, 
  Task, 
  TaskLocation, 
  Mechanic, 
  Invoice,
  InvoiceItem,
  Expense,
  Part,
  Attendance
} from "@/types";

// Mock data - replace with database calls in a real application
export const users: User[] = [
  {
    id: "user1",
    name: "John Doe",
    email: "john.doe@example.com",
    role: "owner",
    mechanicId: "1",
    permissions: {
      invoices: {
        view: true,
        manage: true
      },
      mechanics: {
        view: true,
        manage: true
      },
      customers: {
        view: true,
        manage: true
      },
      expenses: {
        view: true,
        manage: true
      },
      parts: {
        view: true,
        manage: true
      },
      tasks: {
        view: true,
        manage: true
      },
      attendance: {
        view: true,
        manage: true,
        approve: true
      }
    }
  },
  {
    id: "user2",
    name: "Jane Smith",
    email: "jane.smith@example.com",
    role: "manager",
    mechanicId: "2",
    permissions: {
      invoices: {
        view: true,
        manage: true
      },
      mechanics: {
        view: true,
        manage: true
      },
      customers: {
        view: true,
        manage: true
      },
      expenses: {
        view: true,
        manage: true
      },
      parts: {
        view: true,
        manage: true
      },
       tasks: {
        view: true,
        manage: true
      },
      attendance: {
        view: true,
        manage: true,
        approve: true
      }
    }
  },
  {
    id: "user3",
    name: "Alice Johnson",
    email: "alice.johnson@example.com",
    role: "foreman",
    mechanicId: "3",
    permissions: {
      invoices: {
        view: true,
        manage: false
      },
      mechanics: {
        view: true,
        manage: false
      },
      customers: {
        view: true,
        manage: true
      },
      expenses: {
        view: false,
        manage: false
      },
      parts: {
        view: true,
        manage: false
      },
       tasks: {
        view: true,
        manage: true
      },
      attendance: {
        view: true,
        manage: false,
        approve: false
      }
    }
  },
  {
    id: "user4",
    name: "Bob Williams",
    email: "bob.williams@example.com",
    role: "mechanic",
    mechanicId: "1",
    permissions: {
      invoices: {
        view: false,
        manage: false
      },
      mechanics: {
        view: false,
        manage: false
      },
      customers: {
        view: false,
        manage: false
      },
      expenses: {
        view: false,
        manage: false
      },
      parts: {
        view: false,
        manage: false
      },
       tasks: {
        view: true,
        manage: false
      },
      attendance: {
        view: true,
        manage: false,
        approve: false
      }
    }
  }
];

export const customers: Customer[] = [
  {
    id: "cust1",
    name: "Acme Corp",
    email: "info@acme.com",
    phone: "555-1234",
    address: "123 Main St",
    vehicles: [
      {
        id: "veh1",
        customerId: "cust1",
        make: "Toyota",
        model: "Camry",
        year: "2018",
        licensePlate: "ABC-123",
        vin: "1234567890",
        color: "Silver"
      },
      {
        id: "veh4",
        customerId: "cust1",
        make: "Honda",
        model: "Civic",
        year: "2020",
        licensePlate: "DEF-456",
        vin: "0987654321",
        color: "Black"
      }
    ]
  },
  {
    id: "cust2",
    name: "Beta Co",
    email: "contact@beta.com",
    phone: "555-5678",
    address: "456 Elm St",
    vehicles: [
      {
        id: "veh2",
        customerId: "cust2",
        make: "Ford",
        model: "F-150",
        year: "2021",
        licensePlate: "GHI-789",
        vin: "1122334455",
        color: "White"
      }
    ]
  },
  {
    id: "cust3",
    name: "Gamma Inc",
    email: "sales@gamma.com",
    phone: "555-9012",
    address: "789 Oak St",
    vehicles: [
      {
        id: "veh3",
        customerId: "cust3",
        make: "Chevrolet",
        model: "Malibu",
        year: "2019",
        licensePlate: "JKL-012",
        vin: "6677889900",
        color: "Red"
      }
    ]
  }
];

export const tasks: Task[] = [
  {
    id: "task1",
    title: "Oil Change",
    description: "Change oil and filter",
    mechanicId: "1",
    status: "completed",
    hoursEstimated: 1,
    hoursSpent: 1.2,
    invoiceId: "inv1",
    location: "workshop",
    price: 80,
    startTime: "08:00",
    endTime: "09:00",
    completedBy: "user1",
    completedAt: "2023-05-15"
  },
  {
    id: "task2",
    title: "Brake Repair",
    description: "Replace front brake pads",
    mechanicId: "2",
    status: "in-progress",
    hoursEstimated: 3,
    hoursSpent: 2.5,
    invoiceId: "inv2",
    location: "workshop",
    price: 250,
    startTime: "09:00",
    endTime: "11:30",
    completedBy: null,
    completedAt: null
  },
  {
    id: "task3",
    title: "Tire Rotation",
    description: "Rotate tires and check pressure",
    mechanicId: "3",
    status: "pending",
    hoursEstimated: 0.5,
    hoursSpent: null,
    invoiceId: "inv3",
    location: "workshop",
    price: 40,
    startTime: null,
    endTime: null,
    completedBy: null,
    completedAt: null
  },
  {
    id: "task4",
    title: "Engine Diagnostic",
    description: "Diagnose engine problem",
    mechanicId: "1",
    status: "completed",
    hoursEstimated: 2,
    hoursSpent: 1.8,
    invoiceId: "inv4",
    location: "workshop",
    price: 150,
    startTime: "13:00",
    endTime: "14:30",
    completedBy: "user1",
    completedAt: "2023-05-16"
  },
  {
    id: "task5",
    title: "AC Recharge",
    description: "Recharge AC system",
    mechanicId: "2",
    status: "pending",
    hoursEstimated: 1,
    hoursSpent: null,
    invoiceId: "inv5",
    location: "workshop",
    price: 100,
    startTime: null,
    endTime: null,
    completedBy: null,
    completedAt: null
  },
  {
    id: "task6",
    title: "Battery Replacement",
    description: "Replace car battery",
    mechanicId: "3",
    status: "completed",
    hoursEstimated: 0.75,
    hoursSpent: 0.8,
    invoiceId: "inv6",
    location: "workshop",
    price: 120,
    startTime: "15:00",
    endTime: "15:45",
    completedBy: "user3",
    completedAt: "2023-05-16"
  }
];

export const mechanics: Mechanic[] = [
  {
    id: "1",
    name: "Bob Williams",
    specialization: "Engine Repair",
    address: "789 Pine St",
    phone: "555-4321",
    idCardImage: "https://example.com/mechanic1.jpg",
    employmentType: "fulltime",
    isActive: true
  },
  {
    id: "2",
    name: "Charlie Brown",
    specialization: "Brakes & Suspension",
    address: "321 Oak St",
    phone: "555-8765",
    idCardImage: "https://example.com/mechanic2.jpg",
    employmentType: "fulltime",
    isActive: true
  },
  {
    id: "3",
    name: "Diana Miller",
    specialization: "Electrical Systems",
    address: "654 Maple St",
    phone: "555-2109",
    idCardImage: "https://example.com/mechanic3.jpg",
    employmentType: "contractor",
    isActive: true
  },
  {
    id: "4",
    name: "Eve Davis",
    specialization: "General Services",
    address: "987 Cherry St",
    phone: "555-5432",
    idCardImage: "https://example.com/mechanic4.jpg",
    employmentType: "fulltime",
    isActive: false
  }
];

export const invoices: Invoice[] = [
  {
    id: "inv1",
    customerId: "cust1",
    vehicleId: "veh1",
    vehicleInfo: {
      make: "Toyota",
      model: "Camry",
      year: "2018",
      licensePlate: "ABC-123"
    },
    status: "paid",
    date: "2023-05-15",
    items: [
      {
        id: "item1",
        type: "labor",
        description: "Oil Change",
        quantity: 1.2,
        price: 80
      },
      {
        id: "item2",
        type: "part",
        description: "Oil Filter",
        quantity: 1,
        price: 10
      }
    ],
    notes: "Oil change and filter replacement",
    taxRate: 0.06,
    payments: [
      {
        id: "pay1",
        invoiceId: "inv1",
        amount: 95.4,
        method: "cash",
        date: "2023-05-15",
        notes: "Paid in full"
      }
    ]
  },
  {
    id: "inv2",
    customerId: "cust2",
    vehicleId: "veh2",
    vehicleInfo: {
      make: "Ford",
      model: "F-150",
      year: "2021",
      licensePlate: "GHI-789"
    },
    status: "in-progress",
    date: "2023-05-16",
    items: [
      {
        id: "item3",
        type: "labor",
        description: "Brake Repair",
        quantity: 2.5,
        price: 250
      },
      {
        id: "item4",
        type: "part",
        description: "Brake Pads",
        quantity: 2,
        price: 60
      }
    ],
    notes: "Front brake pads replacement",
    taxRate: 0.06,
    payments: []
  },
  {
    id: "inv3",
    customerId: "cust3",
    vehicleId: "veh3",
    vehicleInfo: {
      make: "Chevrolet",
      model: "Malibu",
      year: "2019",
      licensePlate: "JKL-012"
    },
    status: "open",
    date: "2023-05-17",
    items: [
      {
        id: "item5",
        type: "labor",
        description: "Tire Rotation",
        quantity: 0.5,
        price: 40
      }
    ],
    notes: "Tire rotation and pressure check",
    taxRate: 0.06,
    payments: []
  },
  {
    id: "inv4",
    customerId: "cust1",
    vehicleId: "veh4",
    vehicleInfo: {
      make: "Honda",
      model: "Civic",
      year: "2020",
      licensePlate: "DEF-456"
    },
    status: "completed",
    date: "2023-05-18",
    items: [
      {
        id: "item6",
        type: "labor",
        description: "Engine Diagnostic",
        quantity: 1.8,
        price: 150
      }
    ],
    notes: "Diagnosed engine problem",
    taxRate: 0.06,
    payments: [
      {
        id: "pay2",
        invoiceId: "inv4",
        amount: 159,
        method: "card",
        date: "2023-05-18",
        notes: "Paid with credit card"
      }
    ]
  },
  {
    id: "inv5",
    customerId: "cust2",
    vehicleId: null,
    vehicleInfo: null,
    status: "partial",
    date: "2023-05-19",
    items: [
      {
        id: "item7",
        type: "labor",
        description: "AC Recharge",
        quantity: 1,
        price: 100
      },
      {
        id: "item8",
        type: "part",
        description: "AC Refrigerant",
        quantity: 1,
        price: 30
      }
    ],
    notes: "Recharged AC system",
    taxRate: 0.06,
    payments: [
      {
        id: "pay3",
        invoiceId: "inv5",
        amount: 100,
        method: "cash",
        date: "2023-05-19",
        notes: "Partial payment"
      }
    ]
  },
  {
    id: "inv6",
    customerId: "cust3",
    vehicleId: "veh3",
    vehicleInfo: {
      make: "Chevrolet",
      model: "Malibu",
      year: "2019",
      licensePlate: "JKL-012"
    },
    status: "paid",
    date: "2023-05-20",
    items: [
      {
        id: "item9",
        type: "labor",
        description: "Battery Replacement",
        quantity: 0.8,
        price: 120
      },
      {
        id: "item10",
        type: "part",
        description: "Car Battery",
        quantity: 1,
        price: 90
      }
    ],
    notes: "Replaced car battery",
    taxRate: 0.06,
    payments: [
      {
        id: "pay4",
        invoiceId: "inv6",
        amount: 222.6,
        method: "card",
        date: "2023-05-20",
        notes: "Paid in full with credit card"
      }
    ]
  }
];

export const expenses: Expense[] = [
  {
    id: "exp1",
    date: "2023-05-15",
    category: "Supplies",
    amount: 50,
    description: "Cleaning supplies",
    paymentMethod: "cash",
    paymentStatus: "paid",
    vendorId: "ven1",
    vendorName: "Office Depot"
  },
  {
    id: "exp2",
    date: "2023-05-16",
    category: "Rent",
    amount: 1500,
    description: "Monthly rent",
    paymentMethod: "bank-transfer",
    paymentStatus: "paid",
    vendorId: "ven2",
    vendorName: "Landlord LLC"
  },
  {
    id: "exp3",
    date: "2023-05-17",
    category: "Utilities",
    amount: 200,
    description: "Electricity bill",
    paymentMethod: "card",
    paymentStatus: "paid",
    vendorId: "ven3",
    vendorName: "Power Co"
  },
  {
    id: "exp4",
    date: "2023-05-18",
    category: "Parts",
    amount: 100,
    description: "Brake pads",
    paymentMethod: "card",
    paymentStatus: "paid",
    vendorId: "ven4",
    vendorName: "Auto Parts Store"
  },
  {
    id: "exp5",
    date: "2023-05-19",
    category: "Marketing",
    amount: 300,
    description: "Online ads",
    paymentMethod: "card",
    paymentStatus: "paid",
    vendorId: "ven5",
    vendorName: "Ad Agency"
  },
  {
    id: "exp6",
    date: "2023-05-20",
    category: "Salaries",
    amount: 5000,
    description: "Mechanic salaries",
    paymentMethod: "bank-transfer",
    paymentStatus: "paid",
    vendorId: null,
    vendorName: null
  }
];

export const parts: Part[] = [
  {
    id: "part1",
    name: "Oil Filter",
    price: 10,
    quantity: 100,
    description: "Standard oil filter",
    vendorId: "ven1",
    vendorName: "Office Depot",
    partNumber: "OF123",
    invoiceIds: ["inv1"]
  },
  {
    id: "part2",
    name: "Brake Pads",
    price: 60,
    quantity: 50,
    description: "Front brake pads",
    vendorId: "ven4",
    vendorName: "Auto Parts Store",
    partNumber: "BP456",
    invoiceIds: ["inv2"]
  },
  {
    id: "part3",
    name: "AC Refrigerant",
    price: 30,
    quantity: 75,
    description: "AC refrigerant R-134a",
    vendorId: "ven4",
    vendorName: "Auto Parts Store",
    partNumber: "AC789",
    invoiceIds: ["inv5"]
  },
  {
    id: "part4",
    name: "Car Battery",
    price: 90,
    quantity: 30,
    description: "12V car battery",
    vendorId: "ven4",
    vendorName: "Auto Parts Store",
    partNumber: "CB012",
    invoiceIds: ["inv6"]
  },
  {
    id: "part5",
    name: "Spark Plug",
    price: 5,
    quantity: 200,
    description: "Standard spark plug",
    vendorId: "ven4",
    vendorName: "Auto Parts Store",
    partNumber: "SP345",
    invoiceIds: []
  },
  {
    id: "part6",
    name: "Air Filter",
    price: 15,
    quantity: 120,
    description: "Standard air filter",
    vendorId: "ven1",
    vendorName: "Office Depot",
    partNumber: "AF678",
    invoiceIds: []
  }
];

export const vendors = [
  {
    id: "ven1",
    name: "Office Depot",
    contact: "John Smith",
    phone: "555-1111",
    address: "111 Business St"
  },
  {
    id: "ven2",
    name: "Landlord LLC",
    contact: "Jane Doe",
    phone: "555-2222",
    address: "222 Rental Rd"
  },
  {
    id: "ven3",
    name: "Power Co",
    contact: "Alice Johnson",
    phone: "555-3333",
    address: "333 Energy Ln"
  },
  {
    id: "ven4",
    name: "Auto Parts Store",
    contact: "Bob Williams",
    phone: "555-4444",
    address: "444 Parts Pl"
  },
  {
    id: "ven5",
    name: "Ad Agency",
    contact: "Charlie Brown",
    phone: "555-5555",
    address: "555 Media Ave"
  }
];

// Function to get current user (mock)
export const getCurrentUser = (): User => {
  // In a real app, this would fetch the current user from authentication context
  return users[0];
};

// Function to check user permissions
export const hasPermission = (user: User, resource: string, action: string): boolean => {
  if (!user || !user.permissions || !resource || !action) {
    return false;
  }
  
  const permission = user.permissions[resource];
  if (!permission) {
    return false;
  }
  
  return !!permission[action];
};

// Function to calculate invoice total
export const calculateInvoiceTotal = (invoice: Invoice) => {
  const subtotal = invoice.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const tax = subtotal * (invoice.taxRate || 0);
  const total = subtotal + tax;
  
  return { subtotal, tax, total };
};

// Function to get customer by ID
export const getCustomerById = (id: string): Customer | undefined => {
  return customers.find(customer => customer.id === id);
};

// Function to get mechanic by ID
export const getMechanicById = (id: string): Mechanic | undefined => {
  return mechanics.find(mechanic => mechanic.id === id);
};

// Function to get task by ID
export const getTaskById = (id: string): Task | undefined => {
  return tasks.find(task => task.id === id);
};

// Function to get invoice by ID
export const getInvoiceById = (id: string): Invoice | undefined => {
  return invoices.find(invoice => invoice.id === id);
};

// Function to get tasks
export const getTasks = async (): Promise<Task[]> => {
  try {
    // In a real app, this would fetch from the database
    // For now, we'll return the mock data
    return fetchTasks();
  } catch (error) {
    console.error("Error fetching tasks:", error);
    return [];
  }
};

// Function to get mechanics
export const getMechanics = async (): Promise<Mechanic[]> => {
  try {
    // In a real app, this would fetch from the database
    // For now, we'll return the mock data
    return fetchMechanics();
  } catch (error) {
    console.error("Error fetching mechanics:", error);
    return [];
  }
};

// Function to get invoices
export const getInvoices = async (): Promise<Invoice[]> => {
  try {
    // In a real app, this would fetch from the database
    // For now, we'll return the mock data
    return fetchInvoices();
  } catch (error) {
    console.error("Error fetching invoices:", error);
    return [];
  }
};

// Function to get customers
export const getCustomers = async (): Promise<Customer[]> => {
  try {
    // In a real app, this would fetch from the database
    // For now, we'll return the mock data
    return fetchCustomers();
  } catch (error) {
    console.error("Error fetching customers:", error);
    return [];
  }
};

// Function to get expenses
export const getExpenses = async (): Promise<Expense[]> => {
  try {
    // In a real app, this would fetch from the database
    // For now, we'll return the mock data
    return fetchExpenses();
  } catch (error) {
    console.error("Error fetching expenses:", error);
    return [];
  }
};

// Function to get parts
export const getParts = async (): Promise<Part[]> => {
  try {
    // In a real app, this would fetch from the database
    // For now, we'll return the mock data
    return fetchParts();
  } catch (error) {
    console.error("Error fetching parts:", error);
    return [];
  }
};

// Attendance
export const attendanceRecords: Attendance[] = [
  {
    id: "att1",
    mechanicId: "1",
    date: "2023-05-15",
    checkIn: "08:00",
    checkOut: "17:00",
    status: "approved",
    approvedBy: "user1",
    notes: "Regular workday"
  },
  {
    id: "att2",
    mechanicId: "2",
    date: "2023-05-15",
    checkIn: "08:30",
    checkOut: "17:00",
    status: "approved",
    approvedBy: "user1",
    notes: "Late arrival"
  },
  {
    id: "att3",
    mechanicId: "3",
    date: "2023-05-15",
    checkIn: "08:00",
    checkOut: "13:00",
    status: "approved",
    approvedBy: "user1",
    notes: "Half-day"
  },
  {
    id: "att4",
    mechanicId: "1",
    date: "2023-05-16",
    checkIn: "08:00",
    checkOut: "17:00",
    status: "pending",
    approvedBy: null,
    notes: ""
  },
  {
    id: "att5",
    mechanicId: "2",
    date: "2023-05-16",
    checkIn: "",
    checkOut: "",
    status: "rejected",
    approvedBy: "user1",
    notes: "Absent without notice"
  }
];

// Function to get attendance records
export const getAttendance = async (): Promise<Attendance[]> => {
  try {
    // In a real app, this would fetch from the database
    // For now, we'll return the mock data
    return fetchAttendance();
  } catch (error) {
    console.error("Error fetching attendance:", error);
    return [];
  }
};

// Function to record attendance
export const recordAttendance = async (attendanceData: Omit<Attendance, "id">): Promise<Attendance> => {
  try {
    // In a real app, this would save to the database
    // For now, we'll simulate adding to the mock data
    const newId = `att${attendanceRecords.length + 1}`;
    const newAttendance: Attendance = {
      id: newId,
      ...attendanceData
    };
    
    attendanceRecords.push(newAttendance);
    
    // In a production environment with Supabase, you'd use:
    // const result = await recordAttendanceInDb(attendanceData);
    // return result;
    
    return newAttendance;
  } catch (error) {
    console.error("Error recording attendance:", error);
    throw new Error("Failed to record attendance");
  }
};

// Function to approve attendance
export const approveAttendance = (attendanceId: string, userId: string) => {
  try {
    // In a real app, this would update the database
    // For now, we'll simulate updating the mock data
    const attendanceIndex = attendanceRecords.findIndex(att => att.id === attendanceId);
    
    if (attendanceIndex >= 0) {
      attendanceRecords[attendanceIndex].status = 'approved';
      attendanceRecords[attendanceIndex].approvedBy = userId;
    }
    
    return true;
  } catch (error) {
    console.error("Error approving attendance:", error);
    return false;
  }
};
