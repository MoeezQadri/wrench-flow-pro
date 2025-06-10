import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import type { Mechanic, Customer, Vehicle, Vendor, Invoice, Expense, Task, Part, Payment } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { calculateInvoiceTotal } from '@/services/data-service';
import { fetchCustomerById } from '@/services/supabase-service';
import { toast } from 'sonner';

interface DataContextType {
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

    vehicles: Vehicle[];
    addVehicle: (vehicle: Vehicle) => Promise<void>;
    removeVehicle: (id: string) => Promise<void>;
    updateVehicle: (id: string, updates: Partial<Vehicle>) => Promise<void>;
    getVehiclesByCustomerId: (id: string) => Vehicle[];
    getVehicleById: (id: string) => Vehicle;

    invoices: Invoice[];
    addInvoice: (invoiceData: any) => Promise<Invoice>;
    removeInvoice: (id: string) => Promise<void>;
    updateInvoice: (id: string, updates: Partial<Invoice>) => Promise<void>;
    getInvoiceById: (id: string) => Invoice;

    expenses: Expense[];
    addExpense: (expense: Expense) => Promise<void>;
    removeExpense: (id: string) => Promise<void>;
    updateExpense: (id: string, updates: Partial<Expense>) => Promise<void>;

    tasks: Task[];
    addTask: (task: Task) => Promise<void>;
    removeTask: (id: string) => Promise<void>;
    updateTask: (id: string, updates: Partial<Task>) => Promise<void>;

    parts: Part[];
    addPart: (part: Part) => Promise<void>;
    removePart: (id: string) => Promise<void>;
    updatePart: (id: string, updates: Partial<Part>) => Promise<void>;

    payments: Payment[];
    addPayment: (payment: Payment) => Promise<void>;
    removePayment: (id: string) => Promise<void>;
    updatePayment: (id: string, updates: Partial<Payment>) => Promise<void>;

    getCustomerAnalytics: (customerId: string) => Promise<{ lifetimeValue: number; totalInvoices: number; averageInvoiceValue: number; vehicles: Vehicle[]; invoiceHistory: Invoice[] }>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

interface DataProviderProps {
    children: ReactNode;
}

const DataProvider: React.FC<DataProviderProps> = ({ children }) => {
    const [mechanics, setMechanics] = useState<Mechanic[]>([]);
    const [vendors, setVendors] = useState<Vendor[]>([]);
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [tasks, setTasks] = useState<Task[]>([]);
    const [parts, setParts] = useState<Part[]>([]);
    const [payments, setPayments] = useState<Payment[]>([]);

    // Helper to generate UUID
    const generateUUID = () => crypto.randomUUID();

    // Fetch helpers with improved error handling
    const fetchData = async <T,>(table: string, setter: React.Dispatch<React.SetStateAction<T[]>>) => {
        try {
            const { data, error } = await supabase.from(table).select('*');
            if (error) {
                console.error(`Error fetching ${table}:`, error);
                toast.error(`Failed to load ${table}`);
                return;
            }
            setter(data as T[]);
        } catch (error) {
            console.error(`Error fetching ${table}:`, error);
            toast.error(`Failed to load ${table}`);
        }
    };

    useEffect(() => {
        fetchData<Mechanic>('mechanics', setMechanics);
        fetchData<Vendor>('vendors', setVendors);
        fetchData<Customer>('customers', setCustomers);
        fetchData<Vehicle>('vehicles', setVehicles);
        fetchData<Invoice>('invoices', setInvoices);
        fetchData<Expense>('expenses', setExpenses);
        fetchData<Task>('tasks', setTasks);
        fetchData<Part>('parts', setParts);
    }, []);

    // CRUD helpers with improved error handling
    const addItem = async <T,>(
        table: string, 
        item: T, 
        setter: React.Dispatch<React.SetStateAction<T[]>>
    ): Promise<T | null> => {
        try {
            const { data, error } = await supabase.from(table).insert(item).select();
            if (error) {
                console.error(`Error adding to ${table}:`, error);
                toast.error(`Failed to add ${table.slice(0, -1)}`);
                throw error;
            }
            if (data && data.length > 0) {
                const newItem = data[0] as T;
                setter((prev) => [...prev, newItem]);
                return newItem;
            }
            return null;
        } catch (error) {
            console.error(`Error adding to ${table}:`, error);
            toast.error(`Failed to add ${table.slice(0, -1)}`);
            throw error;
        }
    };

    const removeItem = async <T,>(
        table: string, 
        id: string, 
        setter: React.Dispatch<React.SetStateAction<T[]>>
    ) => {
        try {
            const { error } = await supabase.from(table).delete().eq('id', id);
            if (error) {
                console.error(`Error removing from ${table}:`, error);
                toast.error(`Failed to delete ${table.slice(0, -1)}`);
                throw error;
            }
            setter((prev) => prev.filter((item: any) => item.id !== id));
            toast.success(`${table.slice(0, -1)} deleted successfully`);
        } catch (error) {
            console.error(`Error removing from ${table}:`, error);
            toast.error(`Failed to delete ${table.slice(0, -1)}`);
            throw error;
        }
    };

    const updateItem = async <T extends { id: string }>(
        table: string,
        id: string,
        updates: Partial<T>,
        setter: React.Dispatch<React.SetStateAction<T[]>>
    ): Promise<T | null> => {
        try {
            const { data, error } = await supabase
                .from(table)
                .update(updates)
                .eq('id', id)
                .select();

            if (error) {
                console.error(`Error updating ${table}:`, error);
                toast.error(`Failed to update ${table.slice(0, -1)}`);
                throw error;
            }

            if (data && data.length > 0) {
                const updatedItem = data[0] as T;
                setter((prev) => prev.map((item) => item.id === id ? updatedItem : item));
                toast.success(`${table.slice(0, -1)} updated successfully`);
                return updatedItem;
            }
            return null;
        } catch (error) {
            console.error(`Error updating ${table}:`, error);
            toast.error(`Failed to update ${table.slice(0, -1)}`);
            throw error;
        }
    };

    // Mechanic operations with UUID support
    const addMechanic = async (mechanicData: Omit<Mechanic, 'id'>) => {
        const newMechanic: Mechanic = {
            id: generateUUID(),
            ...mechanicData,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };

        console.log('Adding mechanic:', newMechanic);
        const result = await addItem('mechanics', newMechanic, setMechanics);
        if (!result) {
            throw new Error('Failed to add mechanic');
        }
        toast.success('Mechanic added successfully');
        return result;
    };

    const removeMechanic = async (id: string) => await removeItem('mechanics', id, setMechanics);

    const updateMechanic = async (id: string, mechanicData: Omit<Mechanic, 'id'>) => {
        const updatedData = {
            ...mechanicData,
            updated_at: new Date().toISOString()
        };

        console.log('Updating mechanic:', updatedData);
        const result = await updateItem('mechanics', id, updatedData, setMechanics);
        if (!result) {
            throw new Error('Failed to update mechanic');
        }
        return result;
    };

    const getMechanicById = (id: string) => mechanics.find(mechanic => mechanic.id === id) || null;

    // Vendor operations
    const addVendor = async (vendorData: any) => {
        console.log('Vendor data to be saved:', vendorData);
        const newVendor = {
            id: generateUUID(),
            ...vendorData,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };
        const result = await addItem('vendors', newVendor, setVendors);
        if (result) {
            toast.success('Vendor added successfully');
        }
        return result;
    };

    const removeVendor = async (id: string) => await removeItem('vendors', id, setVendors);
    const updateVendor = async (id: string, updates: Partial<Vendor>) => await updateItem('vendors', id, updates, setVendors);

    // Customer operations
    const addCustomer = async (customer: Customer) => {
        const result = await addItem('customers', customer, setCustomers);
        if (result) {
            toast.success('Customer added successfully');
        }
        return result || customer;
    };

    const removeCustomer = async (id: string) => await removeItem('customers', id, setCustomers);
    const updateCustomer = async (id: string, updates: Partial<Customer>) => await updateItem('customers', id, updates, setCustomers);

    const getCustomerById = async (id: string): Promise<Customer | null> => {
        try {
            // First try to find in local state
            const localCustomer = customers.find(customer => customer.id === id);
            if (localCustomer) {
                return localCustomer;
            }
            
            // If not found locally, fetch from Supabase
            const customerData = await fetchCustomerById(id);
            return customerData;
        } catch (error) {
            console.error('Error fetching customer:', error);
            return null;
        }
    };

    // Vehicle operations
    const addVehicle = async (vehicle: Vehicle) => {
        const result = await addItem('vehicles', vehicle, setVehicles);
        if (result) {
            toast.success('Vehicle added successfully');
        }
    };

    const removeVehicle = async (id: string) => await removeItem('vehicles', id, setVehicles);
    const updateVehicle = async (id: string, updates: Partial<Vehicle>) => await updateItem('vehicles', id, updates, setVehicles);
    const getVehiclesByCustomerId = (customerId: string) => vehicles.filter(item => item.customer_id === customerId);
    const getVehicleById = (id: string) => vehicles.find(vehicle => vehicle.id === id) || null;

    // Invoice operations
    const addInvoice = async (invoiceData: any) => {
        const newInvoice: Invoice = {
            id: generateUUID(),
            customer_id: invoiceData.customerId,
            vehicle_id: invoiceData.vehicleId,
            date: invoiceData.date,
            tax_rate: invoiceData.taxRate,
            status: 'open',
            notes: invoiceData.notes,
            items: invoiceData.items,
            payments: [],
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            discount_type: invoiceData.discountType || 'none',
            discount_value: invoiceData.discountValue || 0,
            vehicleInfo: {
                make: 'Honda',
                model: 'Civic',
                year: '2015',
                license_plate: 'ABC-123'
            }
        };
        const result = await addItem('invoices', newInvoice, setInvoices);
        if (result) {
            toast.success('Invoice created successfully');
        }
        return result || newInvoice;
    };

    const removeInvoice = async (id: string) => await removeItem('invoices', id, setInvoices);
    const updateInvoice = async (id: string, updates: Partial<Invoice>) => await updateItem('invoices', id, updates, setInvoices);
    const getInvoiceById = (id: string) => invoices.find(invoice => invoice.id === id) || null;

    // Other operations with similar pattern
    const addExpense = async (expense: Expense) => {
        const result = await addItem('expenses', expense, setExpenses);
        if (result) {
            toast.success('Expense added successfully');
        }
    };

    const removeExpense = async (id: string) => await removeItem('expenses', id, setExpenses);
    const updateExpense = async (id: string, updates: Partial<Expense>) => await updateItem('expenses', id, updates, setExpenses);

    const addTask = async (task: Task) => {
        const result = await addItem('tasks', task, setTasks);
        if (result) {
            toast.success('Task added successfully');
        }
    };

    const removeTask = async (id: string) => await removeItem('tasks', id, setTasks);
    const updateTask = async (id: string, updates: Partial<Task>) => await updateItem('tasks', id, updates, setTasks);

    const addPart = async (part: Part) => {
        const result = await addItem('parts', part, setParts);
        if (result) {
            toast.success('Part added successfully');
        }
    };

    const removePart = async (id: string) => await removeItem('parts', id, setParts);
    const updatePart = async (id: string, updates: Partial<Part>) => await updateItem('parts', id, updates, setParts);

    const addPayment = async (payment: Payment) => {
        const result = await addItem('payments', payment, setPayments);
        if (result) {
            toast.success('Payment added successfully');
        }
    };

    const removePayment = async (id: string) => await removeItem('payments', id, setPayments);
    const updatePayment = async (id: string, updates: Partial<Payment>) => await updateItem('payments', id, updates, setPayments);

    const getCustomerAnalytics = async (customerId: string): Promise<{ lifetimeValue: number; totalInvoices: number; averageInvoiceValue: number; vehicles: Vehicle[]; invoiceHistory: Invoice[] }> => {
        const vehicles: Vehicle[] = await getVehiclesByCustomerId(customerId);
        const invoiceHistory: Invoice[] = invoices.filter(inv => inv.customer_id === customerId);

        const lifetimeValue = invoiceHistory.reduce((sum, invoice) => {
            const { total } = calculateInvoiceTotal(invoice);
            return sum + total;
        }, 0);
        const totalInvoices = invoiceHistory.length;
        const averageInvoiceValue = totalInvoices > 0 ? lifetimeValue / totalInvoices : 0;

        return { lifetimeValue, totalInvoices, averageInvoiceValue, vehicles, invoiceHistory };
    };

    return (
        <DataContext.Provider value={{
            mechanics, addMechanic, removeMechanic, updateMechanic, getMechanicById,
            vendors, addVendor, removeVendor, updateVendor,
            customers, addCustomer, removeCustomer, updateCustomer, getCustomerById,
            vehicles, addVehicle, removeVehicle, updateVehicle, getVehiclesByCustomerId, getVehicleById,
            invoices, addInvoice, removeInvoice, updateInvoice, getInvoiceById,
            expenses, addExpense, removeExpense, updateExpense,
            tasks, addTask, removeTask, updateTask,
            parts, addPart, removePart, updatePart,
            payments, addPayment, removePayment, updatePayment,
            getCustomerAnalytics
        }}>
            {children}
        </DataContext.Provider>
    );
};

const useDataContext = () => {
    const context = useContext(DataContext);
    if (context === undefined) {
        throw new Error("useDataContext must be used within an DataProvider");
    }
    return context;
};

export type { DataContextType };
export { DataProvider, useDataContext };
