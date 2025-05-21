
import { Database } from "@/integrations/supabase/types";

// Utility type to get tables from the Database type
export type Tables = Database['public']['Tables'];

// Type for user roles
export type UserRole = 'superuser' | 'owner' | 'manager' | 'foreman' | 'mechanic';

// Type for a user in the application
export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  isActive?: boolean;
  lastLogin?: string;
  organizationId?: string;
  isSuperAdmin?: boolean;
  user_metadata?: any;
}

// Organization type
export interface Organization {
  id: string;
  name: string;
  subscriptionLevel: string;
  subscriptionStatus: string;
  country?: string;
  currency?: string;
  trialEndsAt?: string;
  // Extended properties
  logo?: string;
  email?: string;
  phone?: string;
  address?: string;
}

// Vehicle type
export interface Vehicle {
  id: string;
  make: string;
  model: string;
  year: string;
  licensePlate: string;
  vin?: string;
  color?: string;
  customerId: string;
  created_at?: string;
  updated_at?: string;
}

// Customer type
export interface Customer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  total_visits?: number;
  lifetime_value?: number;
  last_visit?: string;
  created_at?: string;
  updated_at?: string;
}

// Customer analytics data
export interface CustomerAnalytics {
  totalVisits: number;
  lifetimeValue: number;
  averageInvoiceValue: number;
  lastVisit: string | null;
  vehicleCount: number;
}

// Mechanic type
export interface Mechanic {
  id: string;
  name: string;
  specialization?: string;
  phone?: string;
  address?: string;
  isActive?: boolean;
  id_card_image?: string;
  employment_type?: string;
  user_id?: string;
  created_at?: string;
  updated_at?: string;
}

// Task type
export interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'pending' | 'in-progress' | 'completed' | 'cancelled';
  vehicle_id?: string;
  mechanic_id?: string;
  hours_estimated: number;
  hours_spent?: number;
  price?: number;
  invoice_id?: string;
  location?: string;
  start_time?: string;
  end_time?: string;
  completed_by?: string;
  completed_at?: string;
  created_at?: string;
  updated_at?: string;
  // Joined data
  vehicleInfo?: {
    make: string;
    model: string;
    licensePlate: string;
  };
  mechanicInfo?: {
    name: string;
  };
}

// Invoice type
export interface Invoice {
  id: string;
  customer_id: string;
  vehicle_id: string;
  customerId: string;
  vehicleId: string;
  date: string;
  due_date?: string;
  status: 'draft' | 'pending' | 'paid' | 'partial' | 'overdue' | 'cancelled';
  tax_rate?: number;
  taxRate?: number;
  notes?: string;
  created_at?: string;
  updated_at?: string;
  // Joined data
  items?: InvoiceItem[];
  payments?: Payment[];
  customerInfo?: {
    name: string;
  };
  vehicleInfo?: {
    make: string;
    model: string;
    licensePlate: string;
  };
  discount?: {
    type: 'percentage' | 'fixed';
    value: number;
  };
}

// Invoice item type
export interface InvoiceItem {
  id: string;
  invoice_id: string;
  type: 'part' | 'labor' | 'service';
  description: string;
  quantity: number;
  price: number;
  created_at?: string;
}

// Payment type
export interface Payment {
  id: string;
  invoice_id: string;
  amount: number;
  date: string;
  method: 'cash' | 'card' | 'bank-transfer' | 'check' | 'other';
  notes?: string;
  created_at?: string;
}

// Expense type
export interface Expense {
  id: string;
  date: string;
  category: string;
  amount: number;
  description?: string;
  payment_method?: string;
  payment_status?: string;
  vendor_id?: string;
  vendor_name?: string;
  created_at?: string;
  updated_at?: string;
}

// Vendor type
export interface Vendor {
  id: string;
  name: string;
  contact_name?: string;
  email?: string;
  phone?: string;
  address?: string;
  category?: string;
  created_at?: string;
  updated_at?: string;
}

// Part type
export interface Part {
  id: string;
  name: string;
  description?: string;
  part_number?: string;
  price: number;
  quantity: number;
  reorder_level?: number;
  vendor_id?: string;
  vendor_name?: string;
  created_at?: string;
  updated_at?: string;
}

// Attendance record type
export interface AttendanceRecord {
  id: string;
  mechanic_id: string;
  date: string;
  check_in: string;
  check_out?: string;
  status: 'present' | 'late' | 'absent' | 'half-day' | 'pending';
  approved_by?: string;
  notes?: string;
  created_at?: string;
  mechanicInfo?: {
    name: string;
  };
}

// Dashboard metrics type
export interface DashboardMetrics {
  totalRevenue: number;
  pendingInvoices: number;
  activeJobs: number;
  mechanicEfficiency: number;
  completedJobs: number;
  monthlyRevenue: number[];
  monthlyExpenses: number[];
  monthlyProfit: number[];
  activeCustomers: number;
  vehicleCount: number;
  averageJobValue: number;
  inventoryValue: number;
  pendingTasks: number;
  activeVehicles: number;
  lowStockItems: number;
}

// Permission types
export type BasePermission = boolean | 'own';
export type TasksPermission = BasePermission | { assign?: boolean; create?: boolean; update?: boolean; complete?: boolean; };
export type AttendancePermission = BasePermission | { create?: boolean; update?: boolean; approve?: boolean; };

// Role permission map
export interface RolePermissionMap {
  dashboard: boolean;
  customers: { view: boolean; manage: boolean; };
  invoices: { view: boolean; manage: boolean; };
  mechanics: { view: boolean; manage: boolean; };
  tasks: TasksPermission | { view: boolean; manage: TasksPermission; };
  parts: { view: boolean; manage: boolean; };
  finance: { view: boolean; manage: boolean; };
  expenses: { view: boolean; manage: boolean; };
  reports: BasePermission | { view: BasePermission; manage: boolean; };
  attendance: AttendancePermission | { view: BasePermission; manage: AttendancePermission; approve?: boolean; };
  settings: { view: boolean; manage: boolean; };
  organization: { view: boolean; manage: boolean; };
  users: { view: boolean; manage: boolean; };
  subscription: { view: boolean; manage: boolean; };
  vehicles: { view: boolean; manage: boolean; };
  roles: { view: boolean; manage: boolean; };
}
