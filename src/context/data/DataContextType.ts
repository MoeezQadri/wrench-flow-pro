
import type { Mechanic, Customer, Vehicle, Vendor, Invoice, Expense, Task, Part, Payment } from '@/types';

export interface DataContextType {
    mechanics: Mechanic[];
    addMechanic: (mechanic: Omit<Mechanic, 'id'>) => Promise<Mechanic>;
    removeMechanic: (id: string) => Promise<void>;
    updateMechanic: (id: string, mechanicData: Omit<Mechanic, 'id'>) => Promise<Mechanic>;
    getMechanicById: (id: string) => Mechanic;

    vendors: Vendor[];
    addVendor: (vendorData: any) => Promise<any>;
    removeVendor: (id: string) => Promise<void>;
    updateVendor: (id: string, updates: Partial<Vendor>) => Promise<void>;

    customers: Customer[];
    addCustomer: (customer: Customer) => Promise<Customer>;
    removeCustomer: (id: string) => Promise<void>;
    updateCustomer: (id: string, updates: Partial<Customer>) => Promise<void>;
    getCustomerById: (id: string) => Promise<Customer | null>;
    loadCustomers: () => Promise<void>;

    vehicles: Vehicle[];
    addVehicle: (vehicle: Vehicle) => Promise<void>;
    removeVehicle: (id: string) => Promise<void>;
    updateVehicle: (id: string, updates: Partial<Vehicle>) => Promise<void>;
    getVehiclesByCustomerId: (id: string) => Promise<Vehicle[]>;
    getVehicleById: (id: string) => Vehicle;

    invoices: Invoice[];
    addInvoice: (invoiceData: any) => Promise<Invoice>;
    removeInvoice: (id: string) => Promise<void>;
    updateInvoice: (id: string, updates: Partial<Invoice>) => Promise<Invoice>;
    getInvoiceById: (id: string) => Invoice | null;
    loadInvoices: () => Promise<void>;

    expenses: Expense[];
    addExpense: (expense: Expense) => Promise<void>;
    removeExpense: (id: string) => Promise<void>;
    updateExpense: (id: string, updates: Partial<Expense>) => Promise<void>;

    tasks: Task[];
    addTask: (task: Task) => Promise<void>;
    removeTask: (id: string) => Promise<void>;
    updateTask: (id: string, updates: Partial<Task>) => Promise<void>;

    parts: Part[];
    addPart: (part: Part) => Promise<Part>;
    removePart: (id: string) => Promise<void>;
    updatePart: (id: string, updates: Partial<Part>) => Promise<Part>;

    payments: Payment[];
    addPayment: (payment: Payment) => Promise<void>;
    removePayment: (id: string) => Promise<void>;
    updatePayment: (id: string, updates: Partial<Payment>) => Promise<void>;

    getCustomerAnalytics: (customerId: string) => Promise<{ lifetimeValue: number; totalInvoices: number; averageInvoiceValue: number; vehicles: Vehicle[]; invoiceHistory: Invoice[] }>;
}
