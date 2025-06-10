
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

    useEffect(() => {
        const fetchAllData = async () => {
            try {
                // Fetch mechanics
                const { data: mechanicsData, error: mechanicsError } = await supabase.from('mechanics').select('*');
                if (mechanicsError) {
                    console.error('Error fetching mechanics:', mechanicsError);
                    toast.error('Failed to load mechanics');
                } else {
                    setMechanics(mechanicsData || []);
                }

                // Fetch vendors
                const { data: vendorsData, error: vendorsError } = await supabase.from('vendors').select('*');
                if (vendorsError) {
                    console.error('Error fetching vendors:', vendorsError);
                    toast.error('Failed to load vendors');
                } else {
                    setVendors(vendorsData || []);
                }

                // Fetch customers
                const { data: customersData, error: customersError } = await supabase.from('customers').select('*');
                if (customersError) {
                    console.error('Error fetching customers:', customersError);
                    toast.error('Failed to load customers');
                } else {
                    setCustomers(customersData || []);
                }

                // Fetch vehicles
                const { data: vehiclesData, error: vehiclesError } = await supabase.from('vehicles').select('*');
                if (vehiclesError) {
                    console.error('Error fetching vehicles:', vehiclesError);
                    toast.error('Failed to load vehicles');
                } else {
                    setVehicles(vehiclesData || []);
                }

                // Fetch invoices
                const { data: invoicesData, error: invoicesError } = await supabase.from('invoices').select('*');
                if (invoicesError) {
                    console.error('Error fetching invoices:', invoicesError);
                    toast.error('Failed to load invoices');
                } else {
                    setInvoices(invoicesData || []);
                }

                // Fetch expenses
                const { data: expensesData, error: expensesError } = await supabase.from('expenses').select('*');
                if (expensesError) {
                    console.error('Error fetching expenses:', expensesError);
                    toast.error('Failed to load expenses');
                } else {
                    setExpenses(expensesData || []);
                }

                // Fetch tasks
                const { data: tasksData, error: tasksError } = await supabase.from('tasks').select('*');
                if (tasksError) {
                    console.error('Error fetching tasks:', tasksError);
                    toast.error('Failed to load tasks');
                } else {
                    setTasks(tasksData || []);
                }

                // Fetch parts
                const { data: partsData, error: partsError } = await supabase.from('parts').select('*');
                if (partsError) {
                    console.error('Error fetching parts:', partsError);
                    toast.error('Failed to load parts');
                } else {
                    setParts(partsData || []);
                }
            } catch (error) {
                console.error('Error fetching data:', error);
                toast.error('Failed to load data');
            }
        };

        fetchAllData();
    }, []);

    // Mechanic operations with UUID support
    const addMechanic = async (mechanicData: Omit<Mechanic, 'id'>) => {
        const newMechanic: Mechanic = {
            id: generateUUID(),
            ...mechanicData,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };

        console.log('Adding mechanic:', newMechanic);
        try {
            const { data, error } = await supabase.from('mechanics').insert(newMechanic).select();
            if (error) {
                console.error('Error adding mechanic:', error);
                toast.error('Failed to add mechanic');
                throw error;
            }
            if (data && data.length > 0) {
                const result = data[0] as Mechanic;
                setMechanics((prev) => [...prev, result]);
                toast.success('Mechanic added successfully');
                return result;
            }
            throw new Error('Failed to add mechanic');
        } catch (error) {
            console.error('Error adding mechanic:', error);
            toast.error('Failed to add mechanic');
            throw error;
        }
    };

    const removeMechanic = async (id: string) => {
        try {
            const { error } = await supabase.from('mechanics').delete().eq('id', id);
            if (error) {
                console.error('Error removing mechanic:', error);
                toast.error('Failed to delete mechanic');
                throw error;
            }
            setMechanics((prev) => prev.filter((item) => item.id !== id));
            toast.success('Mechanic deleted successfully');
        } catch (error) {
            console.error('Error removing mechanic:', error);
            toast.error('Failed to delete mechanic');
            throw error;
        }
    };

    const updateMechanic = async (id: string, mechanicData: Omit<Mechanic, 'id'>) => {
        const updatedData = {
            ...mechanicData,
            updated_at: new Date().toISOString()
        };

        console.log('Updating mechanic:', updatedData);
        try {
            const { data, error } = await supabase
                .from('mechanics')
                .update(updatedData)
                .eq('id', id)
                .select();

            if (error) {
                console.error('Error updating mechanic:', error);
                toast.error('Failed to update mechanic');
                throw error;
            }

            if (data && data.length > 0) {
                const result = data[0] as Mechanic;
                setMechanics((prev) => prev.map((item) => item.id === id ? result : item));
                toast.success('Mechanic updated successfully');
                return result;
            }
            throw new Error('Failed to update mechanic');
        } catch (error) {
            console.error('Error updating mechanic:', error);
            toast.error('Failed to update mechanic');
            throw error;
        }
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
        
        try {
            const { data, error } = await supabase.from('vendors').insert(newVendor).select();
            if (error) {
                console.error('Error adding vendor:', error);
                toast.error('Failed to add vendor');
                throw error;
            }
            if (data && data.length > 0) {
                const result = data[0];
                setVendors((prev) => [...prev, result]);
                toast.success('Vendor added successfully');
                return result;
            }
            return null;
        } catch (error) {
            console.error('Error adding vendor:', error);
            toast.error('Failed to add vendor');
            throw error;
        }
    };

    const removeVendor = async (id: string) => {
        try {
            const { error } = await supabase.from('vendors').delete().eq('id', id);
            if (error) {
                console.error('Error removing vendor:', error);
                toast.error('Failed to delete vendor');
                throw error;
            }
            setVendors((prev) => prev.filter((item) => item.id !== id));
            toast.success('Vendor deleted successfully');
        } catch (error) {
            console.error('Error removing vendor:', error);
            toast.error('Failed to delete vendor');
            throw error;
        }
    };

    const updateVendor = async (id: string, updates: Partial<Vendor>) => {
        try {
            const { data, error } = await supabase
                .from('vendors')
                .update(updates)
                .eq('id', id)
                .select();

            if (error) {
                console.error('Error updating vendor:', error);
                toast.error('Failed to update vendor');
                throw error;
            }

            if (data && data.length > 0) {
                const result = data[0] as Vendor;
                setVendors((prev) => prev.map((item) => item.id === id ? result : item));
                toast.success('Vendor updated successfully');
            }
        } catch (error) {
            console.error('Error updating vendor:', error);
            toast.error('Failed to update vendor');
            throw error;
        }
    };

    // Customer operations
    const addCustomer = async (customer: Customer) => {
        try {
            const { data, error } = await supabase.from('customers').insert(customer).select();
            if (error) {
                console.error('Error adding customer:', error);
                toast.error('Failed to add customer');
                throw error;
            }
            if (data && data.length > 0) {
                const result = data[0] as Customer;
                setCustomers((prev) => [...prev, result]);
                toast.success('Customer added successfully');
                return result;
            }
            return customer;
        } catch (error) {
            console.error('Error adding customer:', error);
            toast.error('Failed to add customer');
            throw error;
        }
    };

    const removeCustomer = async (id: string) => {
        try {
            const { error } = await supabase.from('customers').delete().eq('id', id);
            if (error) {
                console.error('Error removing customer:', error);
                toast.error('Failed to delete customer');
                throw error;
            }
            setCustomers((prev) => prev.filter((item) => item.id !== id));
            toast.success('Customer deleted successfully');
        } catch (error) {
            console.error('Error removing customer:', error);
            toast.error('Failed to delete customer');
            throw error;
        }
    };

    const updateCustomer = async (id: string, updates: Partial<Customer>) => {
        try {
            const { data, error } = await supabase
                .from('customers')
                .update(updates)
                .eq('id', id)
                .select();

            if (error) {
                console.error('Error updating customer:', error);
                toast.error('Failed to update customer');
                throw error;
            }

            if (data && data.length > 0) {
                const result = data[0] as Customer;
                setCustomers((prev) => prev.map((item) => item.id === id ? result : item));
                toast.success('Customer updated successfully');
            }
        } catch (error) {
            console.error('Error updating customer:', error);
            toast.error('Failed to update customer');
            throw error;
        }
    };

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
        try {
            const { data, error } = await supabase.from('vehicles').insert(vehicle).select();
            if (error) {
                console.error('Error adding vehicle:', error);
                toast.error('Failed to add vehicle');
                throw error;
            }
            if (data && data.length > 0) {
                const result = data[0] as Vehicle;
                setVehicles((prev) => [...prev, result]);
                toast.success('Vehicle added successfully');
            }
        } catch (error) {
            console.error('Error adding vehicle:', error);
            toast.error('Failed to add vehicle');
            throw error;
        }
    };

    const removeVehicle = async (id: string) => {
        try {
            const { error } = await supabase.from('vehicles').delete().eq('id', id);
            if (error) {
                console.error('Error removing vehicle:', error);
                toast.error('Failed to delete vehicle');
                throw error;
            }
            setVehicles((prev) => prev.filter((item) => item.id !== id));
            toast.success('Vehicle deleted successfully');
        } catch (error) {
            console.error('Error removing vehicle:', error);
            toast.error('Failed to delete vehicle');
            throw error;
        }
    };

    const updateVehicle = async (id: string, updates: Partial<Vehicle>) => {
        try {
            const { data, error } = await supabase
                .from('vehicles')
                .update(updates)
                .eq('id', id)
                .select();

            if (error) {
                console.error('Error updating vehicle:', error);
                toast.error('Failed to update vehicle');
                throw error;
            }

            if (data && data.length > 0) {
                const result = data[0] as Vehicle;
                setVehicles((prev) => prev.map((item) => item.id === id ? result : item));
                toast.success('Vehicle updated successfully');
            }
        } catch (error) {
            console.error('Error updating vehicle:', error);
            toast.error('Failed to update vehicle');
            throw error;
        }
    };

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
        
        try {
            const { data, error } = await supabase.from('invoices').insert(newInvoice).select();
            if (error) {
                console.error('Error adding invoice:', error);
                toast.error('Failed to create invoice');
                throw error;
            }
            if (data && data.length > 0) {
                const result = data[0] as Invoice;
                setInvoices((prev) => [...prev, result]);
                toast.success('Invoice created successfully');
                return result;
            }
            return newInvoice;
        } catch (error) {
            console.error('Error adding invoice:', error);
            toast.error('Failed to create invoice');
            throw error;
        }
    };

    const removeInvoice = async (id: string) => {
        try {
            const { error } = await supabase.from('invoices').delete().eq('id', id);
            if (error) {
                console.error('Error removing invoice:', error);
                toast.error('Failed to delete invoice');
                throw error;
            }
            setInvoices((prev) => prev.filter((item) => item.id !== id));
            toast.success('Invoice deleted successfully');
        } catch (error) {
            console.error('Error removing invoice:', error);
            toast.error('Failed to delete invoice');
            throw error;
        }
    };

    const updateInvoice = async (id: string, updates: Partial<Invoice>) => {
        try {
            const { data, error } = await supabase
                .from('invoices')
                .update(updates)
                .eq('id', id)
                .select();

            if (error) {
                console.error('Error updating invoice:', error);
                toast.error('Failed to update invoice');
                throw error;
            }

            if (data && data.length > 0) {
                const result = data[0] as Invoice;
                setInvoices((prev) => prev.map((item) => item.id === id ? result : item));
                toast.success('Invoice updated successfully');
            }
        } catch (error) {
            console.error('Error updating invoice:', error);
            toast.error('Failed to update invoice');
            throw error;
        }
    };

    const getInvoiceById = (id: string) => invoices.find(invoice => invoice.id === id) || null;

    // Other operations with similar pattern
    const addExpense = async (expense: Expense) => {
        try {
            const { data, error } = await supabase.from('expenses').insert(expense).select();
            if (error) {
                console.error('Error adding expense:', error);
                toast.error('Failed to add expense');
                throw error;
            }
            if (data && data.length > 0) {
                const result = data[0] as Expense;
                setExpenses((prev) => [...prev, result]);
                toast.success('Expense added successfully');
            }
        } catch (error) {
            console.error('Error adding expense:', error);
            toast.error('Failed to add expense');
            throw error;
        }
    };

    const removeExpense = async (id: string) => {
        try {
            const { error } = await supabase.from('expenses').delete().eq('id', id);
            if (error) {
                console.error('Error removing expense:', error);
                toast.error('Failed to delete expense');
                throw error;
            }
            setExpenses((prev) => prev.filter((item) => item.id !== id));
            toast.success('Expense deleted successfully');
        } catch (error) {
            console.error('Error removing expense:', error);
            toast.error('Failed to delete expense');
            throw error;
        }
    };

    const updateExpense = async (id: string, updates: Partial<Expense>) => {
        try {
            const { data, error } = await supabase
                .from('expenses')
                .update(updates)
                .eq('id', id)
                .select();

            if (error) {
                console.error('Error updating expense:', error);
                toast.error('Failed to update expense');
                throw error;
            }

            if (data && data.length > 0) {
                const result = data[0] as Expense;
                setExpenses((prev) => prev.map((item) => item.id === id ? result : item));
                toast.success('Expense updated successfully');
            }
        } catch (error) {
            console.error('Error updating expense:', error);
            toast.error('Failed to update expense');
            throw error;
        }
    };

    const addTask = async (task: Task) => {
        try {
            const { data, error } = await supabase.from('tasks').insert(task).select();
            if (error) {
                console.error('Error adding task:', error);
                toast.error('Failed to add task');
                throw error;
            }
            if (data && data.length > 0) {
                const result = data[0] as Task;
                setTasks((prev) => [...prev, result]);
                toast.success('Task added successfully');
            }
        } catch (error) {
            console.error('Error adding task:', error);
            toast.error('Failed to add task');
            throw error;
        }
    };

    const removeTask = async (id: string) => {
        try {
            const { error } = await supabase.from('tasks').delete().eq('id', id);
            if (error) {
                console.error('Error removing task:', error);
                toast.error('Failed to delete task');
                throw error;
            }
            setTasks((prev) => prev.filter((item) => item.id !== id));
            toast.success('Task deleted successfully');
        } catch (error) {
            console.error('Error removing task:', error);
            toast.error('Failed to delete task');
            throw error;
        }
    };

    const updateTask = async (id: string, updates: Partial<Task>) => {
        try {
            const { data, error } = await supabase
                .from('tasks')
                .update(updates)
                .eq('id', id)
                .select();

            if (error) {
                console.error('Error updating task:', error);
                toast.error('Failed to update task');
                throw error;
            }

            if (data && data.length > 0) {
                const result = data[0] as Task;
                setTasks((prev) => prev.map((item) => item.id === id ? result : item));
                toast.success('Task updated successfully');
            }
        } catch (error) {
            console.error('Error updating task:', error);
            toast.error('Failed to update task');
            throw error;
        }
    };

    const addPart = async (part: Part) => {
        try {
            const { data, error } = await supabase.from('parts').insert(part).select();
            if (error) {
                console.error('Error adding part:', error);
                toast.error('Failed to add part');
                throw error;
            }
            if (data && data.length > 0) {
                const result = data[0] as Part;
                setParts((prev) => [...prev, result]);
                toast.success('Part added successfully');
            }
        } catch (error) {
            console.error('Error adding part:', error);
            toast.error('Failed to add part');
            throw error;
        }
    };

    const removePart = async (id: string) => {
        try {
            const { error } = await supabase.from('parts').delete().eq('id', id);
            if (error) {
                console.error('Error removing part:', error);
                toast.error('Failed to delete part');
                throw error;
            }
            setParts((prev) => prev.filter((item) => item.id !== id));
            toast.success('Part deleted successfully');
        } catch (error) {
            console.error('Error removing part:', error);
            toast.error('Failed to delete part');
            throw error;
        }
    };

    const updatePart = async (id: string, updates: Partial<Part>) => {
        try {
            const { data, error } = await supabase
                .from('parts')
                .update(updates)
                .eq('id', id)
                .select();

            if (error) {
                console.error('Error updating part:', error);
                toast.error('Failed to update part');
                throw error;
            }

            if (data && data.length > 0) {
                const result = data[0] as Part;
                setParts((prev) => prev.map((item) => item.id === id ? result : item));
                toast.success('Part updated successfully');
            }
        } catch (error) {
            console.error('Error updating part:', error);
            toast.error('Failed to update part');
            throw error;
        }
    };

    const addPayment = async (payment: Payment) => {
        try {
            const { data, error } = await supabase.from('payments').insert(payment).select();
            if (error) {
                console.error('Error adding payment:', error);
                toast.error('Failed to add payment');
                throw error;
            }
            if (data && data.length > 0) {
                const result = data[0] as Payment;
                setPayments((prev) => [...prev, result]);
                toast.success('Payment added successfully');
            }
        } catch (error) {
            console.error('Error adding payment:', error);
            toast.error('Failed to add payment');
            throw error;
        }
    };

    const removePayment = async (id: string) => {
        try {
            const { error } = await supabase.from('payments').delete().eq('id', id);
            if (error) {
                console.error('Error removing payment:', error);
                toast.error('Failed to delete payment');
                throw error;
            }
            setPayments((prev) => prev.filter((item) => item.id !== id));
            toast.success('Payment deleted successfully');
        } catch (error) {
            console.error('Error removing payment:', error);
            toast.error('Failed to delete payment');
            throw error;
        }
    };

    const updatePayment = async (id: string, updates: Partial<Payment>) => {
        try {
            const { data, error } = await supabase
                .from('payments')
                .update(updates)
                .eq('id', id)
                .select();

            if (error) {
                console.error('Error updating payment:', error);
                toast.error('Failed to update payment');
                throw error;
            }

            if (data && data.length > 0) {
                const result = data[0] as Payment;
                setPayments((prev) => prev.map((item) => item.id === id ? result : item));
                toast.success('Payment updated successfully');
            }
        } catch (error) {
            console.error('Error updating payment:', error);
            toast.error('Failed to update payment');
            throw error;
        }
    };

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
