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
  year: number;
  license_plate: string;
  vin?: string;
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
    year: number;
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
