export type InvoiceStatus = 'open' | 'paid' | 'partial' | 'overdue' | 'in-progress' | 'completed' | 'draft';
export type UserRole = 'owner' | 'manager' | 'mechanic' | 'foreman' | 'superuser';
export type TaskStatus = 'pending' | 'in-progress' | 'completed';
export type TaskLocation = 'workshop' | 'onsite' | 'remote';

export interface Customer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  created_at?: string;
  updated_at?: string;
  totalVisits?: number;
  lifetimeValue?: number;
  lastVisit?: string;

}

export interface Vehicle {
  id: string;
  customer_id: string;
  make: string;
  model: string;
  year: string;
  license_plate: string;
  vin?: string;
  color?: string;
  created_at?: string;
  updated_at?: string;
}

export interface InvoiceItem {
  id: string;
  invoice_id?: string;
  description: string;
  type: 'labor' | 'parts';
  quantity: number;
  price: number;
  part_id?: string; // Reference to parts from inventory
  task_id?: string; // Reference to tasks used as labor
}

export interface Payment {
  id: string;
  invoice_id: string;
  date: string;
  amount: number;
  method: string;
  notes?: string;
  created_at?: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  mechanicId?: string;
  vehicleId?: string;
  status: TaskStatus;
  location?: TaskLocation;
  hoursEstimated: number;
  hoursSpent?: number;
  price?: number;
  startTime?: string;
  endTime?: string;
  completedBy?: string;
  completedAt?: string;
  invoiceId?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Invoice {
  id: string;
  customer_id: string;
  vehicle_id: string;
  date: string;
  tax_rate: number;
  status: InvoiceStatus;
  notes?: string;
  items: InvoiceItem[];
  payments?: Payment[];
  created_at?: string;
  updated_at?: string;
  due_date?: string;
  discount?: {
    type: 'percentage' | 'fixed';
    value: number;
  };
  vehicleInfo?: {
    make: string;
    model: string;
    year: string;
    license_plate: string;
  };
}

export interface Mechanic {
  id: string;
  name: string;
  specialization?: string;
  phone?: string;
  address?: string;
  is_active: boolean;
  employment_type: 'fulltime' | 'contractor';
  user_id?: string;
  created_at?: string;
  updated_at?: string;
  id_card_image?: string;
}

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
  invoice_ids?: string[];
  created_at?: string;
  updated_at?: string;
}

export interface Expense {
  id: string;
  date: string;
  amount: number;
  category: string;
  description?: string;
  payment_method: 'cash' | 'card' | 'bank-transfer';
  vendor_name?: string;
  vendor_id?: string;
  invoice_id?: string; // Added to support invoice assignment
  created_at?: string;
  updated_at?: string;
  payment_status?: string;
}

export interface Attendance {
  id: string;
  mechanic_id: string;
  date: string;
  check_in: string;
  check_out?: string;
  status: "present" | "late" | "absent" | "half-day" | "pending" | "approved" | "rejected";
  notes?: string;
  approved_by?: string;
  created_at?: string;
}

export interface Organization {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  country?: string;
  currency?: string;
  subscription_level: string;
  subscription_status: string;
  trial_ends_at?: string;
  created_at?: string;
  updated_at?: string;
}

export interface User {
  id: string;
  name?: string;
  email?: string;
  role?: UserRole | string;
  organization_id?: string;
  is_active?: boolean;
  lastLogin?: string;
  created_at?: string;
  updated_at?: string;

  //reseting old values
  passwordHash?: string; // For auth system
  resetToken?: string; // For password resetAdd commentMore actions
  resetTokenExpires?: string; // Expiration for reset token
  mustChangePassword?: boolean; // For forcing password change


}

export interface DashboardMetrics {
  totalRevenue: number;
  pendingInvoices: number;
  activeJobs: number;
  mechanicEfficiency: number;
  completedJobs: number;
  monthlyRevenue: number;
  monthlyExpenses: number;
  monthlyProfit: number;
  activeCustomers: number;
  averageJobValue: number;
  inventoryValue: number;
  pendingTasks: number;
  activeVehicles: number;
  lowStockItems: number;
}

export interface CustomerAnalytics {
  customerId: string;
  lifetimeValue: number;
  totalInvoices: number;
  averageInvoiceValue: number;
  vehicles: Vehicle[];
  invoiceHistory: Invoice[];
}

export interface Vendor {
  id: string;
  name: string;
  email?: string;
  phone: string;
  address?: string;
  contact_name: string;
  category?: string;
}
