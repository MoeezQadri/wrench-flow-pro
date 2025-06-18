
export interface Customer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Vehicle {
  id: string;
  customer_id: string;
  make: string;
  model: string;
  year: string; // Changed to string to match database
  license_plate: string;
  vin?: string;
  color?: string; // Added color property
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export type TaskStatus = 'open' | 'in-progress' | 'completed' | 'blocked' | 'canceled';
export type TaskLocation = 'workshop' | 'roadside' | 'other';
export type InvoiceStatus = 'open' | 'paid' | 'partial' | 'overdue' | 'draft' | 'in-progress' | 'completed';

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
  notes?: string;
  items?: InvoiceItem[];
  payments?: Payment[];
  created_at?: string;
  updated_at?: string;
  vehicleInfo?: {
    make: string;
    model: string;
    year: string; // Changed to string
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
  vendor_name?: string;
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

// Adding missing type definitions
export interface User {
  id: string;
  email: string;
  name?: string;
  role?: string;
  created_at?: string;
  updated_at?: string;
}

export interface UserRole {
  id: string;
  user_id: string;
  role: string;
  created_at?: string;
  updated_at?: string;
}

export interface Mechanic {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  hire_date?: string;
  hourly_rate?: number;
  specialties?: string[];
  status?: 'active' | 'inactive';
  created_at?: string;
  updated_at?: string;
}

export interface Vendor {
  id: string;
  name: string;
  contact_person?: string;
  email?: string;
  phone?: string;
  address?: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Expense {
  id: string;
  vendor_id?: string;
  category: string;
  description: string;
  amount: number;
  date: string;
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
  created_at?: string;
  updated_at?: string;
}
