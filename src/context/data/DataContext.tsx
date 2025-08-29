
import React, { createContext, useContext, ReactNode, useEffect, useState, useCallback } from 'react';
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
import { useAuthContext } from '@/context/AuthContext';
import { useRouteBasedLoading } from '@/hooks/useRouteBasedLoading';
import { useSmartDataLoading } from '@/hooks/useSmartDataLoading';

const DataContext = createContext<DataContextType | undefined>(undefined);

interface DataProviderProps {
    children: ReactNode;
}

const DataProvider: React.FC<DataProviderProps> = ({ children }) => {
    const { currentUser, loading: authLoading, isAuthenticated } = useAuthContext();
    const { shouldLoadData, isDataCritical, currentRoute } = useRouteBasedLoading();
    const { smartLoad, isLoaded, resetLoadedState } = useSmartDataLoading();
    const [loadingProgress, setLoadingProgress] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    
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

    const loadRouteSpecificData = useCallback(async () => {
        // Wait for authentication to be ready and user to be loaded
        if (authLoading || !isAuthenticated || !currentUser?.organization_id) {
            console.log("Skipping data load - auth not ready:", { authLoading, isAuthenticated, hasOrgId: !!currentUser?.organization_id });
            return;
        }

        console.log(`Loading route-specific data for: ${currentRoute}`);
        setIsLoading(true);
        setLoadingProgress(0);

        const dataLoaders = {
            customers: () => smartLoad('customers', customersHook.loadCustomers),
            invoices: () => smartLoad('invoices', invoicesHook.loadInvoices),
            vehicles: () => smartLoad('vehicles', vehiclesHook.loadVehicles),
            parts: () => smartLoad('parts', partsHook.loadParts),
            tasks: () => smartLoad('tasks', tasksHook.loadTasks),
            mechanics: () => smartLoad('mechanics', mechanicsHook.loadMechanics),
            vendors: () => smartLoad('vendors', vendorsHook.loadVendors),
            expenses: () => smartLoad('expenses', expensesHook.loadExpenses),
            attendance: () => smartLoad('attendance', attendanceHook.loadAttendance),
        };

        try {
            // First load critical data
            const criticalLoaders = Object.entries(dataLoaders).filter(([key]) => 
                shouldLoadData(key as any) && isDataCritical(key as any)
            );
            
            if (criticalLoaders.length > 0) {
                console.log("Loading critical data:", criticalLoaders.map(([key]) => key));
                await Promise.all(criticalLoaders.map(([, loader]) => loader()));
                setLoadingProgress(50);
            }

            // Then load non-critical data
            const nonCriticalLoaders = Object.entries(dataLoaders).filter(([key]) => 
                shouldLoadData(key as any) && !isDataCritical(key as any)
            );
            
            if (nonCriticalLoaders.length > 0) {
                console.log("Loading non-critical data:", nonCriticalLoaders.map(([key]) => key));
                // Load non-critical data with a small delay to prioritize UI responsiveness
                setTimeout(async () => {
                    await Promise.allSettled(nonCriticalLoaders.map(([, loader]) => loader()));
                    setLoadingProgress(100);
                }, 50);
            } else {
                setLoadingProgress(100);
            }

            console.log("Route-specific data loading completed");
        } catch (error) {
            console.error("Error loading route-specific data:", error);
        } finally {
            setIsLoading(false);
            setTimeout(() => setLoadingProgress(0), 500); // Reset progress after animation
        }
    }, [authLoading, isAuthenticated, currentUser?.organization_id, currentRoute, shouldLoadData, isDataCritical, smartLoad]);

    useEffect(() => {
        loadRouteSpecificData();
    }, [loadRouteSpecificData]);

    // Reset loaded state when organization changes
    useEffect(() => {
        if (currentUser?.organization_id) {
            resetLoadedState();
        }
    }, [currentUser?.organization_id, resetLoadedState]);

    // Refresh all data manually
    const refreshAllData = async () => {
        console.log("Manual refresh of all data triggered");
        resetLoadedState();
        await loadRouteSpecificData();
    };

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
            refreshAllData,
            
            // Loading states for global use
            isLoadingData: isLoading,
            loadingProgress
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
