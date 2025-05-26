export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  is_active: boolean;
  last_login?: string;
  created_at?: string;
  organization_id?: string;
  mechanicId?: string;
}

export type UserRole = 'owner' | 'manager' | 'mechanic' | 'customer';

export interface Organization {
  id: string;
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  country?: string;
  currency?: string;
  created_at: string;
  updated_at?: string;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  lastVisit?: string;
  totalVisits?: number;
  lifetimeValue?: number;
}

export interface Vehicle {
  id: string;
  customer_id: string;
  make: string;
  model: string;
  year: string;
  licensePlate: string;
  vin?: string;
  color?: string;
}

export interface Invoice {
  id: string;
  customer_id: string;
  vehicle_id: string;
  date: string;
  status: InvoiceStatus;
  total_amount: number;
  tax_rate?: number;
  notes?: string;
  items: InvoiceItem[];
  payments: Payment[];
  vehicleInfo: Vehicle;
}

export type InvoiceStatus = 'open' | 'in-progress' | 'completed' | 'paid' | 'partial' | 'overdue' | 'canceled';

export interface InvoiceItem {
  id: string;
  invoice_id: string;
  type: 'labor' | 'part';
  description: string;
  quantity: number;
  price: number;
}

export interface Payment {
  id: string;
  invoice_id: string;
  date: string;
  amount: number;
  method: 'cash' | 'card' | 'bank-transfer';
  notes?: string;
}

export interface Mechanic {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  is_active: boolean;
}

export interface Part {
  id: string;
  name: string;
  description: string;
  price: number;
  quantity: number;
  vendor_id?: string;
  vendor_name?: string;
  part_number?: string;
  invoice_ids?: string[];
}

export interface Expense {
  id: string;
  category: string;
  description: string;
  amount: number;
  date: string;
  payment_method: 'cash' | 'card' | 'bank-transfer';
  vendor_name?: string;
  vendor_id?: string;
  created_at: string;
  updated_at: string;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'pending' | 'in-progress' | 'completed';
  mechanic_id?: string;
  vehicle_id?: string;
  invoice_id?: string;
  hours_estimated: number;
  hours_spent?: number;
  price?: number;
  location: TaskLocation;
  created_at: string;
  updated_at: string;
  start_time?: string;
  end_time?: string;
  completed_by?: string;
  completed_at?: string;
}

export interface Attendance {
  id: string;
  mechanic_id: string;
  date: string;
  check_in: string;
  check_out?: string;
  status: 'pending' | 'approved' | 'rejected';
  notes?: string;
  approved_by?: string;
  created_at: string;
}

export interface RolePermissionMap {
  dashboard: { view: boolean };
  customers: { view: boolean; manage: boolean };
  vehicles: { view: boolean; manage: boolean };
  invoices: { view: boolean; manage: boolean; approve: boolean };
  tasks: { view: boolean; manage: boolean };
  mechanics: { view: boolean; manage: boolean };
  parts: { view: boolean; manage: boolean };
  expenses: { view: boolean; manage: boolean };
  reports: { view: boolean };
  settings: { view: boolean; manage: boolean };
  users: { view: boolean; manage: boolean };
  attendance: { view: boolean; manage: boolean; approve: boolean };
}

export type TaskLocation = 'workshop' | 'onsite' | 'remote';

export interface CustomerAnalytics {
  totalInvoices: number;
  lifetimeValue: number;
  averageInvoiceValue: number;
  vehicles: Vehicle[];
  invoiceHistory: Invoice[];
}
