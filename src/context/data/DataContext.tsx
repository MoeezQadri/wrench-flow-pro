
import React, { createContext, useContext, ReactNode, useCallback } from 'react';
import type { Vehicle, Invoice } from '@/types';
import { calculateInvoiceTotalWithBreakdown } from '@/utils/invoice-calculations';
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
import { useAttendance } from './hooks/useAttendance';
import { usePayables } from './hooks/usePayables';

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
    const attendanceHook = useAttendance();
    const payablesHook = usePayables();

    const refreshAllData = useCallback(async () => {
        // Simple refresh - reload key data
        await Promise.allSettled([
            customersHook.loadCustomers(),
            invoicesHook.loadInvoices(),
        ]);
    }, [customersHook.loadCustomers, invoicesHook.loadInvoices]);

    const getCustomerAnalytics = async (customerId: string): Promise<{ lifetimeValue: number; totalInvoices: number; averageInvoiceValue: number; vehicles: Vehicle[]; invoiceHistory: Invoice[] }> => {
        const vehicles: Vehicle[] = await vehiclesHook.getVehiclesByCustomerId(customerId);
        const invoiceHistory: Invoice[] = invoicesHook.invoices.filter(inv => inv.customer_id === customerId);

        const lifetimeValue = invoiceHistory.reduce((sum, invoice) => {
            const { total } = calculateInvoiceTotalWithBreakdown(invoice);
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
            loadMechanics: mechanicsHook.loadMechanics,

            vendors: vendorsHook.vendors,
            addVendor: vendorsHook.addVendor,
            removeVendor: vendorsHook.removeVendor,
            updateVendor: vendorsHook.updateVendor,
            loadVendors: vendorsHook.loadVendors,

            customers: customersHook.customers,
            customersLoading: customersHook.loading,
            customersError: customersHook.error,
            addCustomer: customersHook.addCustomer,
            removeCustomer: customersHook.removeCustomer,
            updateCustomer: customersHook.updateCustomer,
            getCustomerById: customersHook.getCustomerById,
            loadCustomers: customersHook.loadCustomers,
            refreshCustomers: customersHook.refreshCustomers,

            vehicles: vehiclesHook.vehicles,
            addVehicle: vehiclesHook.addVehicle,
            removeVehicle: vehiclesHook.removeVehicle,
            updateVehicle: vehiclesHook.updateVehicle,
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
            loadExpenses: expensesHook.loadExpenses,

            tasks: tasksHook.tasks,
            addTask: tasksHook.addTask,
            removeTask: tasksHook.removeTask,
            updateTask: tasksHook.updateTask,
            loadTasks: tasksHook.loadTasks,

            parts: partsHook.parts,
            addPart: partsHook.addPart,
            removePart: partsHook.removePart,
            updatePart: partsHook.updatePart,
            loadParts: partsHook.loadParts,

            payments: paymentsHook.payments,
            addPayment: paymentsHook.addPayment,
            removePayment: paymentsHook.removePayment,
            updatePayment: paymentsHook.updatePayment,

            attendanceRecords: attendanceHook.attendanceRecords,
            attendanceLoading: attendanceHook.loading,
            attendanceError: attendanceHook.error,
            addAttendance: attendanceHook.addAttendance,
            updateAttendance: attendanceHook.updateAttendance,
            removeAttendance: attendanceHook.removeAttendance,
            loadAttendance: attendanceHook.loadAttendance,

            // Payables
            payables: payablesHook.payables,
            addPayable: payablesHook.addPayable,
            updatePayable: payablesHook.updatePayable,
            markPayableAsPaid: payablesHook.markAsPaid,
            removePayable: payablesHook.removePayable,
            loadPayables: payablesHook.loadPayables,
            getPayablesByVendor: payablesHook.getPayablesByVendor,
            
            getCustomerAnalytics,
            refreshAllData
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
