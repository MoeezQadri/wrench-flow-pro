export interface Customer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  notes?: string;
  total_visits?: number;
  totalVisits?: number; // Alias for compatibility
  lifetime_value?: number;
  lifetimeValue?: number; // Alias for compatibility
  last_visit?: string;
  lastVisit?: string; // Alias for compatibility
  organization_id: string;
  created_at?: string;
  updated_at?: string;
}

export interface Vehicle {
  id: string;
  customer_id: string;
  make: string;
  model: string;
  year: string; // Always string to match database
  license_plate: string;
  vin?: string;
  color?: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export type TaskStatus = 'open' | 'in-progress' | 'completed' | 'blocked' | 'canceled' | 'pending';
export type TaskLocation = 'workshop' | 'roadside' | 'other' | 'onsite' | 'remote';
export type InvoiceStatus = 'open' | 'paid' | 'partial' | 'overdue' | 'draft' | 'in-progress' | 'completed';
export type AttendanceStatus = 'present' | 'late' | 'absent' | 'half-day' | 'pending' | 'approved' | 'rejected';
export type PaymentMethod = 'cash' | 'card' | 'bank-transfer' | 'check' | 'other';
export type EmploymentType = 'fulltime' | 'contractor';

// Define UserRole to include all needed roles
export type UserRole = 'owner' | 'manager' | 'mechanic' | 'admin' | 'superuser' | 'superadmin' | 'foreman';

export interface Payment {
  id: string;
  invoice_id: string;
  amount: number;
  method: string;
  date: string;
  notes?: string;
}

export interface Invoice {
  id: string;
  customer_id: string;
  vehicle_id: string;
  date: string;
  status: InvoiceStatus;
  tax_rate: number;
  discount_type?: 'none' | 'percentage' | 'fixed';
  discount_value?: number;
  due_date?: string;
  notes?: string;
  items?: InvoiceItem[];
  payments?: Payment[];
  created_at?: string;
  updated_at?: string;
  vehicleInfo?: {
    make: string;
    model: string;
    year: string;
    license_plate: string;
  };
}

export interface InvoiceItem {
  id: string;
  description: string;
  type: 'part' | 'labor' | 'other';
  quantity: number;
  price: number;
  part_id?: string;
  task_id?: string;
  is_auto_added?: boolean;
  unit_of_measure?: string;
  creates_inventory_part?: boolean;
  creates_task?: boolean;
  custom_part_data?: {
    part_number?: string;
    manufacturer?: string;
    category?: string;
    location?: string;
  };
  custom_labor_data?: {
    labor_rate?: number;
    skill_level?: string;
  };
}

export interface Part {
  id: string;
  name: string;
  description?: string;
  price: number;
  quantity: number;
  vendor_id?: string;
  vendor_name?: string; // Alias for compatibility
  reorder_level?: number;
  created_at?: string;
  updated_at?: string;
  part_number?: string;
  invoice_ids?: string[];
  category?: string;
  manufacturer?: string;
  location?: string;
  unit?: string;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  mechanicId?: string;
  mechanic_id?: string;
  vehicleId?: string;
  vehicle_id?: string;
  status: TaskStatus;
  location?: TaskLocation;
  hoursEstimated?: number;
  hours_estimated?: number;
  hoursSpent?: number;
  hours_spent?: number;
  price?: number;
  startTime?: string;
  start_time?: string;
  endTime?: string;
  end_time?: string;
  completedBy?: string;
  completed_by?: string;
  completedAt?: string;
  completed_at?: string;
  invoiceId?: string;
  invoice_id?: string;
  created_at?: string;
  updated_at?: string;
  labor_rate?: number;
  skill_level?: string;
}

export interface User {
  id: string;
  email: string;
  name?: string;
  role?: UserRole;
  organization_id?: string;
  lastLogin?: string;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
  // Additional properties for auth service compatibility
  passwordHash?: string;
  resetToken?: string;
  resetTokenExpires?: string;
  mustChangePassword?: boolean;
}

export interface Mechanic {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  hire_date?: string;
  hourly_rate?: number;
  specialties?: string[];
  specialization?: string;
  status?: 'active' | 'inactive';
  is_active?: boolean;
  employment_type?: EmploymentType;
  user_id?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Vendor {
  id: string;
  name: string;
  contact_person?: string;
  contact_name?: string; // Alias for compatibility
  email?: string;
  phone?: string;
  address?: string;
  category?: string;
  vendor_type?: string;
  payment_terms?: number;
  credit_limit?: number;
  tax_id?: string;
  is_active?: boolean;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Payable {
  id: string;
  vendor_id?: string;
  expense_id?: string;
  reference_number?: string;
  description: string;
  amount: number;
  due_date?: string;
  status: 'pending' | 'paid' | 'overdue' | 'cancelled';
  paid_amount?: number;
  payment_date?: string;
  payment_method?: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export interface FinancialSummary {
  total_payables: number;
  total_receivables: number;
  net_position: number;
}

export interface Expense {
  id: string;
  vendor_id?: string;
  vendor_name?: string;
  category: string;
  description?: string;
  amount: number;
  date: string;
  payment_method?: PaymentMethod;
  payment_status?: string;
  receipt_url?: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Attendance {
  id: string;
  mechanic_id: string;
  date: string;
  check_in?: string;
  check_out?: string;
  break_start?: string;
  break_end?: string;
  total_hours?: number;
  status?: AttendanceStatus;
  approved_by?: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Organization {
  id: string;
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  country?: string;
  currency?: string;
  subscription_level?: string;
  subscription_status?: string;
  logo?: string;
  trial_ends_at?: string;
  created_at?: string;
  updated_at?: string;
}

// Add missing CustomerAnalytics interface
export interface CustomerAnalytics {
  lifetimeValue: number;
  totalInvoices: number;
  averageInvoiceValue: number;
  vehicles: Vehicle[];
  invoiceHistory: Invoice[];
}

// Add missing DashboardMetrics interface
export interface DashboardMetrics {
  totalRevenue: number;
  totalInvoices: number;
  completedTasks: number;
  activeCustomers: number;
  revenueGrowth?: number;
  invoiceGrowth?: number;
  taskGrowth?: number;
  customerGrowth?: number;
  // Add missing properties
  pendingInvoices?: number;
  activeJobs?: number;
  mechanicEfficiency?: number;
  completedJobs?: number;
  monthlyRevenue?: number;
  monthlyExpenses?: number;
  monthlyProfit?: number;
  averageJobValue?: number;
  inventoryValue?: number;
  pendingTasks?: number;
  activeVehicles?: number;
  lowStockItems?: number;
}
