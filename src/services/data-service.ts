
import { nanoid } from 'nanoid';
import { Customer, CustomerAnalytics, Expense, Invoice, Mechanic, Part, RolePermissionMap, Task, User, Vehicle, Attendance, Vendor } from "@/types";

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

export { rolePermissions } from './supabase-service';

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

export const vendors: Vendor[] = [
  {
    id: "vendor_001",
    name: "NAPA Auto Parts",
    contact_name: "John Smith",
    phone: "555-123-4567",
    address: "123 Main St, Anytown",
    email: "john.smith@napa.com",
    created_at: new Date().toISOString()
  },
  {
    id: "vendor_002",
    name: "AutoZone",
    contact_name: "Jane Doe",
    phone: "555-987-6543",
    address: "456 Elm St, Anytown",
    email: "jane.doe@autozone.com",
    created_at: new Date().toISOString()
  }
];

export const generateId = (prefix: string): string => {
  return `${prefix}_${nanoid()}`;
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

// Export functions that delegate to supabase service
export {
  fetchCustomers as getCustomers,
  fetchCustomerById as getCustomerById,
  addCustomer,
  updateCustomer,
  fetchVehiclesByCustomerId as getVehiclesByCustomerId,
  fetchVehicleById as getVehicleById,
  addVehicle,
  fetchInvoices as getInvoices,
  fetchInvoiceById as getInvoiceById,
  addInvoice,
  fetchMechanics as getMechanics,
  fetchMechanicById as getMechanicById,
  fetchParts as getParts,
  addPart,
  updatePartQuantity,
  fetchExpenses as getExpenses,
  addExpense,
  fetchTasks as getTasks,
  addTask,
  updateTask,
  deleteTask,
  fetchAttendance as getAttendanceRecords,
  recordAttendanceInDb as recordAttendance,
  fetchDashboardMetrics as calculateDashboardMetrics,
  fetchCustomerAnalytics as getCustomerAnalytics,
  calculateInvoiceTotal
} from './supabase-service';

// Add vendor functions
export const getVendors = async (): Promise<Vendor[]> => {
  return vendors;
};

export const getVendorById = async (id: string): Promise<Vendor | null> => {
  return vendors.find(vendor => vendor.id === id) || null;
};

export const addVendor = async (vendorData: Omit<Vendor, "id">): Promise<Vendor> => {
  const newVendor: Vendor = {
    ...vendorData,
    id: generateId("vendor"),
    created_at: new Date().toISOString()
  };
  vendors.push(newVendor);
  return newVendor;
};

// Mock function to approve attendance
export const approveAttendance = async (attendanceId: string, approvedBy: string): Promise<void> => {
  console.log(`Attendance ${attendanceId} approved by ${approvedBy}`);
};

// Mock function to get all organizations
export const getOrganizations = async (): Promise<any[]> => {
  return [];
};

// Mock function to update organization
export const updateOrganization = async (organizationId: string, updates: Partial<any>): Promise<any> => {
  console.log(`Updating organization ${organizationId}`, updates);
  return null;
};

// Mock function to get organization by ID
export const getOrganizationById = async (organizationId: string): Promise<any> => {
  return null;
};
