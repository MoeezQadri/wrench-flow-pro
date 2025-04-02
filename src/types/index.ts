
export type InvoiceStatus = 'open' | 'in-progress' | 'completed' | 'paid' | 'partial';

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
  hourlyRate: number;
  isActive: boolean;
}

export interface Part {
  id: string;
  name: string;
  price: number;
  quantity: number;
  description: string;
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
