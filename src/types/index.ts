
export type InvoiceStatus = 'open' | 'in-progress' | 'completed' | 'paid' | 'partial';

export type UserRole = 'owner' | 'manager' | 'mechanic' | 'foreman';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  mechanicId?: string; // If role is mechanic, this links to their mechanic profile
  isActive: boolean;
  lastLogin?: string;
}

export interface Organization {
  id: string;
  name: string;
  subscriptionLevel: 'basic' | 'professional' | 'enterprise';
  subscriptionStatus: 'active' | 'trial' | 'expired';
  trialEndsAt?: string;
  logo?: string;
  address?: string;
  phone?: string;
  email?: string;
}

export interface Attendance {
  id: string;
  mechanicId: string;
  date: string;
  checkIn: string;
  checkOut?: string;
  status: 'pending' | 'approved' | 'rejected';
  approvedBy?: string; // Manager or Owner ID
  notes?: string;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  vehicles?: string[]; // IDs of vehicles belonging to this customer
  totalVisits?: number; // Total number of times customer has visited
  lifetimeValue?: number; // Total amount spent by customer
  lastVisit?: string; // Date of last visit
}

export interface Vehicle {
  id: string;
  customerId: string;
  make: string;
  model: string;
  year: string;
  licensePlate: string;
  vin?: string;
  color?: string;
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

export interface Vendor {
  id: string;
  name: string;
  contactName: string;
  email: string;
  phone: string;
  address: string;
  paymentTerms?: string;
}

export interface Part {
  id: string;
  name: string;
  price: number;
  quantity: number;
  description: string;
  vendorId?: string;
  vendorName?: string;
  partNumber?: string;
  reorderLevel?: number; // Keep this optional for backward compatibility
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

export interface InvoiceItem {
  id: string;
  type: 'labor' | 'part';
  description: string;
  quantity: number;
  price: number;
}

export interface Invoice {
  id: string;
  customerId: string;
  vehicleId: string;
  vehicleInfo: {
    make: string;
    model: string;
    year: string;
    licensePlate: string;
  };
  status: InvoiceStatus;
  date: string;
  items: InvoiceItem[];
  notes: string;
  taxRate: number;
  payments: Payment[];
  discount?: {
    type: 'percentage' | 'fixed';
    value: number;
  };
}

export interface Payment {
  id: string;
  invoiceId: string;
  amount: number;
  method: 'cash' | 'card' | 'bank-transfer';
  date: string;
  notes: string;
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

export interface DashboardMetrics {
  totalRevenue: number;
  pendingInvoices: number;
  completedJobs: number;
  activeJobs: number;
  mechanicEfficiency: number;
}

export interface CustomerAnalytics {
  totalInvoices: number;
  lifetimeValue: number;
  averageInvoiceValue: number;
  firstVisitDate: string;
  lastVisitDate: string;
  vehicles: Vehicle[];
  invoiceHistory: Invoice[];
}

// Special type for 'own' permission value
export type PermissionValue = boolean | 'own';

// Define the base permission interface that most resources will use
export interface BasePermission {
  view: PermissionValue;
  manage: PermissionValue;
}

// Define specific permission interfaces for resources with additional actions
export interface TasksPermission extends BasePermission {
  assign?: PermissionValue;
  create?: PermissionValue;
  update?: PermissionValue;
}

export interface AttendancePermission extends BasePermission {
  approve?: PermissionValue;
  create?: PermissionValue;
  update?: PermissionValue;
}

// Modified RolePermissionMap to properly handle the different permission types
export interface RolePermissionMap {
  dashboard: PermissionValue;
  customers: BasePermission;
  invoices: BasePermission;
  mechanics: BasePermission;
  tasks: TasksPermission;
  parts: BasePermission;
  expenses: BasePermission;
  vehicles: BasePermission;
  reports: BasePermission;
  users: BasePermission;
  settings: BasePermission;
  attendance: AttendancePermission;
  subscription: BasePermission;
  finance: BasePermission;
  organization: BasePermission;
  [key: string]: PermissionValue | BasePermission | TasksPermission | AttendancePermission;
}

export const rolePermissions: Record<UserRole, RolePermissionMap> = {
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
    vehicles: { view: true, manage: true }
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
    vehicles: { view: true, manage: true }
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
    vehicles: { view: true, manage: false }
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
    vehicles: { view: true, manage: false }
  }
};
