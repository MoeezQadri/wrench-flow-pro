
import React, { createContext, useContext, ReactNode, useEffect } from 'react';
import type { Vehicle, Invoice } from '@/types';
import { calculateInvoiceTotal } from '@/services/data-service';
import { DataContextType } from './DataContextType';
import { useMechanics } from './hooks/useMechanics';
import { useCustomers } from './hooks/useCustomers';
import { useVehicles } from './hooks/useVehicles';
import { useInvoices } from './hooks/useInvoices';
import { useVendors } from './hooks/useVendors';
import { useExpenses } from './hooks/useExpenses';
import { useTasks } from './hooks/useTasks';
import { useParts } from './hooks/useParts';
import { usePayments } from './hooks/usePayments';

const DataContext = createContext<DataContextType | undefined>(undefined);

interface DataProviderProps {
    children: ReactNode;
}

const DataProvider: React.FC<DataProviderProps> = ({ children }) => {
    const mechanicsHook = useMechanics();
    const customersHook = useCustomers();
    const vehiclesHook = useVehicles();
    const invoicesHook = useInvoices();
    const vendorsHook = useVendors();
    const expensesHook = useExpenses();
    const tasksHook = useTasks();
    const partsHook = useParts();
    const paymentsHook = usePayments();

    useEffect(() => {
        const fetchAllData = async () => {
            console.log("Starting to load all data...");
            await Promise.all([
                mechanicsHook.loadMechanics(),
                vendorsHook.loadVendors(),
                customersHook.loadCustomers(),
                vehiclesHook.loadVehicles(),
                invoicesHook.loadInvoices(),
                expensesHook.loadExpenses(),
                tasksHook.loadTasks(),
                partsHook.loadParts(),
                paymentsHook.loadPayments()
            ]);
            console.log("All data loaded, customers:", customersHook.customers);
        };

        fetchAllData();
    }, []);

    const getCustomerAnalytics = async (customerId: string): Promise<{ lifetimeValue: number; totalInvoices: number; averageInvoiceValue: number; vehicles: Vehicle[]; invoiceHistory: Invoice[] }> => {
        const vehicles: Vehicle[] = vehiclesHook.getVehiclesByCustomerId(customerId);
        const invoiceHistory: Invoice[] = invoicesHook.invoices.filter(inv => inv.customer_id === customerId);

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
            mechanics: mechanicsHook.mechanics,
            addMechanic: mechanicsHook.addMechanic,
            removeMechanic: mechanicsHook.removeMechanic,
            updateMechanic: mechanicsHook.updateMechanic,
            getMechanicById: mechanicsHook.getMechanicById,

            vendors: vendorsHook.vendors,
            addVendor: vendorsHook.addVendor,
            removeVendor: vendorsHook.removeVendor,
            updateVendor: vendorsHook.updateVendor,

            customers: customersHook.customers,
            addCustomer: customersHook.addCustomer,
            removeCustomer: customersHook.removeCustomer,
            updateCustomer: customersHook.updateCustomer,
            getCustomerById: customersHook.getCustomerById,

            vehicles: vehiclesHook.vehicles,
            addVehicle: vehiclesHook.addVehicle,
            removeVehicle: vehiclesHook.removeVehicle,
            updateVehicle: vehiclesHook.updateV/ehicle,
            getVehiclesByCustomerId: vehiclesHook.getVehiclesByCustomerId,
            getVehicleById: vehiclesHook.getVehicleById,

            invoices: invoicesHook.invoices,
            addInvoice: invoicesHook.addInvoice,
            removeInvoice: invoicesHook.removeInvoice,
            updateInvoice: invoicesHook.updateInvoice,
            getInvoiceById: invoicesHook.getInvoiceById,
            loadInvoices: invoicesHook.loadInvoices,

            expenses: expensesHook.expenses,
            addExpense: expensesHook.addExpense,
            removeExpense: expensesHook.removeExpense,
            updateExpense: expensesHook.updateExpense,

            tasks: tasksHook.tasks,
            addTask: tasksHook.addTask,
            removeTask: tasksHook.removeTask,
            updateTask: tasksHook.updateTask,

            parts: partsHook.parts,
            addPart: partsHook.addPart,
            removePart: partsHook.removePart,
            updatePart: partsHook.updatePart,

            payments: paymentsHook.payments,
            addPayment: paymentsHook.addPayment,
            removePayment: paymentsHook.removePayment,
            updatePayment: paymentsHook.updatePayment,

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
