import React, { createContext, useContext, ReactNode, useMemo, useRef } from 'react';
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

/**
 * Keeps function identities stable across renders while always calling the
 * latest implementation. Without this, every provider render handed consumers
 * brand-new callbacks, which re-fired their effects and refetched data.
 */
function useStableFunctions<T extends Record<string, (...args: any[]) => any>>(fns: T): T {
    const latest = useRef(fns);
    latest.current = fns;

    const stable = useRef<T | null>(null);
    if (!stable.current) {
        const wrapped: Record<string, (...args: any[]) => any> = {};
        Object.keys(fns).forEach((key) => {
            wrapped[key] = (...args: any[]) => (latest.current as any)[key](...args);
        });
        stable.current = wrapped as T;
    }
    return stable.current;
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

    const refreshAllData = async () => {
        await Promise.allSettled([
            mechanicsHook.loadMechanics(),
            customersHook.loadCustomers(),
            invoicesHook.loadInvoices(),
            tasksHook.loadTasks(),
        ]);
    };

    const getCustomerAnalytics = async (customerId: string) => {
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

    const functions = useStableFunctions({
        addMechanic: mechanicsHook.addMechanic,
        removeMechanic: mechanicsHook.removeMechanic,
        updateMechanic: mechanicsHook.updateMechanic,
        getMechanicById: mechanicsHook.getMechanicById,
        loadMechanics: mechanicsHook.loadMechanics,

        addVendor: vendorsHook.addVendor,
        removeVendor: vendorsHook.removeVendor,
        updateVendor: vendorsHook.updateVendor,
        loadVendors: vendorsHook.loadVendors,

        addCustomer: customersHook.addCustomer,
        removeCustomer: customersHook.removeCustomer,
        updateCustomer: customersHook.updateCustomer,
        getCustomerById: customersHook.getCustomerById,
        loadCustomers: customersHook.loadCustomers,
        refreshCustomers: customersHook.refreshCustomers,
        searchCustomers: customersHook.searchCustomers,

        addVehicle: vehiclesHook.addVehicle,
        removeVehicle: vehiclesHook.removeVehicle,
        updateVehicle: vehiclesHook.updateVehicle,
        getVehicleDependencies: vehiclesHook.getVehicleDependencies,
        getVehiclesByCustomerId: vehiclesHook.getVehiclesByCustomerId,
        getVehiclesByCustomerIds: vehiclesHook.getVehiclesByCustomerIds,
        searchVehicles: vehiclesHook.searchVehicles,
        getVehicleById: vehiclesHook.getVehicleById,
        loadVehicles: vehiclesHook.loadVehicles,

        addInvoice: invoicesHook.addInvoice,
        removeInvoice: invoicesHook.removeInvoice,
        updateInvoice: invoicesHook.updateInvoice,
        getInvoiceById: invoicesHook.getInvoiceById,
        fetchInvoiceById: invoicesHook.fetchInvoiceById,
        loadInvoices: invoicesHook.loadInvoices,

        addExpense: expensesHook.addExpense,
        removeExpense: expensesHook.removeExpense,
        updateExpense: expensesHook.updateExpense,
        loadExpenses: expensesHook.loadExpenses,

        addTask: tasksHook.addTask,
        removeTask: tasksHook.removeTask,
        updateTask: tasksHook.updateTask,
        loadTasks: tasksHook.loadTasks,

        addPart: partsHook.addPart,
        removePart: partsHook.removePart,
        updatePart: partsHook.updatePart,
        getPartDependencies: partsHook.getPartDependencies,
        loadParts: partsHook.loadParts,

        addPayment: paymentsHook.addPayment,
        removePayment: paymentsHook.removePayment,
        updatePayment: paymentsHook.updatePayment,

        addAttendance: attendanceHook.addAttendance,
        updateAttendance: attendanceHook.updateAttendance,
        removeAttendance: attendanceHook.removeAttendance,
        loadAttendance: attendanceHook.loadAttendance,

        addPayable: payablesHook.addPayable,
        updatePayable: payablesHook.updatePayable,
        markPayableAsPaid: payablesHook.markAsPaid,
        removePayable: payablesHook.removePayable,
        loadPayables: payablesHook.loadPayables,
        getPayablesByVendor: payablesHook.getPayablesByVendor,

        getCustomerAnalytics,
        refreshAllData,
    });

    const value = useMemo<DataContextType>(() => ({
        mechanics: mechanicsHook.mechanics,
        vendors: vendorsHook.vendors,

        customers: customersHook.customers,
        customersLoading: customersHook.loading,
        customersError: customersHook.error,

        vehicles: vehiclesHook.vehicles,
        invoices: invoicesHook.invoices,
        expenses: expensesHook.expenses,
        tasks: tasksHook.tasks,
        parts: partsHook.parts,
        payments: paymentsHook.payments,

        attendanceRecords: attendanceHook.attendanceRecords,
        attendanceLoading: attendanceHook.loading,
        attendanceError: attendanceHook.error,

        payables: payablesHook.payables,

        ...functions,
    }), [
        mechanicsHook.mechanics,
        vendorsHook.vendors,
        customersHook.customers,
        customersHook.loading,
        customersHook.error,
        vehiclesHook.vehicles,
        invoicesHook.invoices,
        expensesHook.expenses,
        tasksHook.tasks,
        partsHook.parts,
        paymentsHook.payments,
        attendanceHook.attendanceRecords,
        attendanceHook.loading,
        attendanceHook.error,
        payablesHook.payables,
        functions,
    ]);

    return (
        <DataContext.Provider value={value}>
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
