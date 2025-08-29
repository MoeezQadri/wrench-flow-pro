
import type { Mechanic, Customer, Vehicle, Vendor, Invoice, Expense, Task, Part, Payment, Attendance, Payable } from '@/types';

export interface DataContextType {
    mechanics: Mechanic[];
    addMechanic: (mechanic: Omit<Mechanic, 'id'>) => Promise<Mechanic>;
    removeMechanic: (id: string) => Promise<void>;
    updateMechanic: (id: string, mechanicData: Omit<Mechanic, 'id'>) => Promise<Mechanic>;
    getMechanicById: (id: string) => Mechanic;
    loadMechanics: () => Promise<void>;

    vendors: Vendor[];
    addVendor: (vendorData: any) => Promise<any>;
    removeVendor: (id: string) => Promise<void>;
    updateVendor: (id: string, updates: Partial<Vendor>) => Promise<void>;
    loadVendors: () => Promise<void>;

    customers: Customer[];
    customersLoading: boolean;
    customersError: string | null;
    addCustomer: (customer: Customer) => Promise<Customer>;
    removeCustomer: (id: string) => Promise<void>;
    updateCustomer: (id: string, updates: Partial<Customer>) => Promise<void>;
    getCustomerById: (id: string) => Promise<Customer | null>;
    loadCustomers: () => Promise<void>;
    refreshCustomers: () => Promise<void>;

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
    loadExpenses: () => Promise<void>;

    tasks: Task[];
    addTask: (task: Task) => Promise<void>;
    removeTask: (id: string) => Promise<void>;
    updateTask: (id: string, updates: Partial<Task>) => Promise<void>;
    loadTasks: () => Promise<void>;

    parts: Part[];
    addPart: (part: Part) => Promise<Part>;
    removePart: (id: string) => Promise<void>;
    updatePart: (id: string, updates: Partial<Part>) => Promise<Part>;
    loadParts: () => Promise<void>;

    payments: Payment[];
  addPayment: (paymentData: import('@/services/payment-service').CreatePaymentData) => Promise<Payment>;
  removePayment: (id: string) => Promise<void>;
  updatePayment: (updateData: import('@/services/payment-service').UpdatePaymentData) => Promise<Payment>;

    attendanceRecords: Attendance[];
    attendanceLoading: boolean;
    attendanceError: string | null;
    addAttendance: (attendance: Omit<Attendance, 'id'>) => Promise<Attendance>;
    updateAttendance: (id: string, updates: Partial<Attendance>) => Promise<Attendance>;
    removeAttendance: (id: string) => Promise<void>;
    loadAttendance: () => Promise<void>;

    payables: Payable[];
    addPayable: (payable: Omit<Payable, 'id'>) => Promise<Payable>;
    updatePayable: (id: string, updates: Partial<Payable>) => Promise<Payable>;
    markPayableAsPaid: (id: string, paymentData: {
        amount: number;
        payment_method: string;
        payment_date?: string;
        notes?: string;
    }) => Promise<Payable>;
    removePayable: (id: string) => Promise<void>;
    loadPayables: () => Promise<void>;
    getPayablesByVendor: (vendorId: string) => Promise<Payable[]>;

    getCustomerAnalytics: (customerId: string) => Promise<{ lifetimeValue: number; totalInvoices: number; averageInvoiceValue: number; vehicles: Vehicle[]; invoiceHistory: Invoice[] }>;
    refreshAllData: () => Promise<void>;
}
