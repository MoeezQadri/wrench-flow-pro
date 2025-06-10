import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import type { Mechanic, Customer, Vehicle, Vendor, Invoice, Expense, Task } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { calculateInvoiceTotal, generateId } from '@/services/data-service';

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
    getCustomerById: (id: string) => Customer;

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

    // Fetch helpers
    const fetchData = async <T,>(table: any, setter: React.Dispatch<React.SetStateAction<T[]>>) => {
        const { data, error } = await supabase.from(table).select('*');
        if (error) console.error(`Error fetching ${table}:`, error);
        else setter(data as T[]);
    };

    useEffect(() => {
        fetchData<Mechanic>('mechanics', setMechanics);
        fetchData<Vendor>('vendors', setVendors);
        fetchData<Customer>('customers', setCustomers);
        fetchData<Vehicle>('vehicles', setVehicles);
        fetchData<Invoice>('invoices', setInvoices);
        fetchData<Expense>('expenses', setExpenses);
        fetchData<Task>('tasks', setTasks);
    }, []);

    // CRUD helpers 
    const addItem = async <T,>(table: any, item: T, setter: React.Dispatch<React.SetStateAction<T[]>>) => {
        const { data, error } = await supabase.from(table).insert(item).select();
        if (error) console.error(`Error adding to ${table}:`, error);
        else if (data) setter((prev) => [...prev, ...data as T[]]);
    };

    const removeItem = async <T,>(table: any, id: string, setter: React.Dispatch<React.SetStateAction<T[]>>) => {
        const { error } = await supabase.from(table).delete().eq('id', id);
        if (error) console.error(`Error removing from ${table}:`, error);
        else setter((prev) => prev.filter((item: any) => item.id !== id));
    };

    const updateItem = async <T extends { id: string }>(
        table: any,
        id: string,
        updates: Partial<T>,
        setter: React.Dispatch<React.SetStateAction<T[]>>
    ) => {
        const { data, error } = await supabase
            .from(table)
            .update(updates)
            .eq('id', id)
            .select();

        if (error) {
            console.error(`Error updating ${table}:`, error);
        } else if (data && data.length > 0) {
            const updatedItem = data[0] as any;
            setter((prev) => prev.map((item) => item.id === id ? updatedItem : item));
        }
    };

    // Exposed handlers
    const addMechanic = async (mechanicData: Omit<Mechanic, 'id'>) => {
        const newMechanic: Mechanic = {
            id: generateId('mechanic'),
            ...mechanicData,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };

        console.log('Adding mechanic:', newMechanic);
        await addItem('mechanics', newMechanic, setMechanics);
        return newMechanic;
    };
    const removeMechanic = async (id: string) => await removeItem('mechanics', id, setMechanics);
    const updateMechanic = async (id: string, mechanicData: Omit<Mechanic, 'id'>) => {
        const updatedMechanic: Mechanic = {
            id,
            ...mechanicData,
            updated_at: new Date().toISOString()
        };


        // In a real app, this would update in database
        console.log('Updating mechanic:', updatedMechanic);
        await updateItem('mechanics', id, updatedMechanic, setMechanics);
        return updatedMechanic;
    };
    const getMechanicById = (id: string) => mechanics.find(mechanic => mechanic.id === id) || null;

    const addVendor = async (vendorData: any) => {
        console.log('Vendor data to be saved:', vendorData);
        const newVendor = {
            id: `vendor-${Date.now()}`,
            ...vendorData,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };
        const resp = await addItem('vendors', newVendor, setVendors)
        return newVendor;
    };
    const removeVendor = async (id: string) => await removeItem('vendors', id, setVendors);
    const updateVendor = async (id: string, updates: Partial<Vendor>) => await updateItem('vendors', id, updates, setVendors);

    const addCustomer = async (customer: Customer) => {
        const resp = await addItem('customers', customer, setCustomers)
        return customer;
    };
    const removeCustomer = async (id: string) => await removeItem('customers', id, setCustomers);
    const updateCustomer = async (id: string, updates: Partial<Customer>) => await updateItem('customers', id, updates, setCustomers);
    const getCustomerById = (id: string) => customers.filter(item => item.id === id)[0];


    const addVehicle = async (vehicle: Vehicle) => await addItem('vehicles', vehicle, setVehicles);
    const removeVehicle = async (id: string) => await removeItem('vehicles', id, setVehicles);
    const updateVehicle = async (id: string, updates: Partial<Vehicle>) => await updateItem('vehicles', id, updates, setVehicles);
    const getVehiclesByCustomerId = (customerId: string) => vehicles.filter(item => item.customer_id === customerId);
    const getVehicleById = (id: string) => vehicles.find(vehicle => vehicle.id === id) || null;

    const addInvoice = async (invoiceData: any) => {
        const newInvoice: Invoice = {
            id: `invoice-${Date.now()}`, // Generate a unique ID
            customer_id: invoiceData.customerId,
            vehicle_id: invoiceData.vehicleId,
            date: invoiceData.date,
            tax_rate: invoiceData.taxRate,
            status: 'open', // Default status
            notes: invoiceData.notes,
            items: invoiceData.items,
            payments: [], // Initially no payments
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            vehicleInfo: {
                make: 'Honda',
                model: 'Civic',
                year: '2015',
                license_plate: 'ABC-123'
            }
        };
        await addItem('invoices', newInvoice, setInvoices)
        return newInvoice;
    };
    const removeInvoice = async (id: string) => await removeItem('invoices', id, setInvoices);
    const updateInvoice = async (id: string, updates: Partial<Invoice>) => await updateItem('invoices', id, updates, setInvoices);
    const getInvoiceById = (id: string) => invoices.find(invoice => invoice.id === id) || null;;

    const addExpense = async (expense: Expense) => await addItem('expenses', expense, setExpenses);
    const removeExpense = async (id: string) => await removeItem('expenses', id, setExpenses);
    const updateExpense = async (id: string, updates: Partial<Expense>) => await updateItem('expenses', id, updates, setExpenses);

    const addTask = async (task: Task) => await addItem('tasks', task, setTasks);
    const removeTask = async (id: string) => await removeItem('tasks', id, setTasks);
    const updateTask = async (id: string, updates: Partial<Task>) => await updateItem('tasks', id, updates, setTasks);

    const getCustomerAnalytics = async (customerId: string): Promise<{ lifetimeValue: number; totalInvoices: number; averageInvoiceValue: number; vehicles: Vehicle[]; invoiceHistory: Invoice[] }> => {
        // Replace this with actual data fetching logic from your database
        const vehicles: Vehicle[] = await getVehiclesByCustomerId(customerId);
        const invoiceHistory: Invoice[] = invoices;

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


