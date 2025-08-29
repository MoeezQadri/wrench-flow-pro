
import { useState, useEffect } from 'react';
import type { Customer } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useOrganizationFilter } from '@/hooks/useOrganizationFilter';
import { useOrganizationAwareQuery } from '@/hooks/useOrganizationAwareQuery';
import { fetchCustomerById } from '@/services/supabase-service';

// Minimal logging
const logCustomerOperation = (operation: string, data?: any) => {
  if (operation.includes('SUCCESS')) {
    console.log(`Customer ${operation}:`, data?.customerCount || '');
  }
};

export const useCustomers = () => {
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { applyOrganizationFilter } = useOrganizationAwareQuery();
    const { organizationId, isSuperAdmin, canAccessAllOrganizations } = useOrganizationFilter();


    // Simple real-time updates without excessive logging
    useEffect(() => {
        if (!organizationId) return;

        const channel = supabase
            .channel(`customers-${organizationId}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public', 
                    table: 'customers',
                    filter: `organization_id=eq.${organizationId}`
                },
                (payload) => {
                    if (payload.eventType === 'INSERT' && payload.new) {
                        const newCustomer = payload.new as Customer;
                        setCustomers(prev => {
                            // Check if customer already exists to prevent duplicates from optimistic updates
                            const exists = prev.some(c => c.id === newCustomer.id);
                            if (exists) {
                                // Update existing customer with real data from server
                                return prev.map(c => c.id === newCustomer.id ? newCustomer : c);
                            }
                            return [...prev, newCustomer];
                        });
                    } else if (payload.eventType === 'UPDATE' && payload.new) {
                        const updatedCustomer = payload.new as Customer;
                        setCustomers(prev => 
                            prev.map(c => c.id === updatedCustomer.id ? updatedCustomer : c)
                        );
                    } else if (payload.eventType === 'DELETE' && payload.old) {
                        setCustomers(prev => prev.filter(c => c.id !== payload.old.id));
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [organizationId]);

    const addCustomer = async (customer: Customer) => {
        logCustomerOperation('ADD_CUSTOMER_STARTED', { customerName: customer.name });
        
        if (!customer || typeof customer !== 'object') {
            const errorMsg = 'Invalid customer data provided';
            logCustomerOperation('ADD_CUSTOMER_VALIDATION_FAILED', customer);
            console.error(errorMsg, customer);
            toast.error(errorMsg);
            throw new Error(errorMsg);
        }

        // Validate required fields
        if (!customer.name?.trim()) {
            const errorMsg = 'Customer name is required';
            logCustomerOperation('ADD_CUSTOMER_VALIDATION_FAILED', customer);
            toast.error(errorMsg);
            throw new Error(errorMsg);
        }

        const tempId = crypto.randomUUID();
        const customerData = {
            ...customer,
            id: tempId,
            name: customer.name.trim(),
            email: customer.email?.trim() || null,
            phone: customer.phone?.trim() || null,
            address: customer.address?.trim() || null,
            organization_id: organizationId,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };

        // Optimistic update - add to UI immediately
        setCustomers((prev) => [...(prev || []), customerData as Customer]);
        setLoading(true);
        setError(null);

        try {
            console.log("Adding customer:", customerData);
            const { data, error } = await supabase
                .from('customers')
                .insert(customerData)
                .select();
            
            if (error) {
                // Rollback optimistic update
                setCustomers((prev) => (prev || []).filter(c => c.id !== tempId));
                logCustomerOperation('ADD_CUSTOMER_FAILED', customerData);
                console.error('Error adding customer:', error);
                const errorMsg = error.message?.includes('duplicate') ? 'Customer already exists' : 'Failed to add customer';
                setError(errorMsg);
                toast.error(errorMsg);
                throw error;
            }
            
            if (data && data.length > 0) {
                const result = data[0] as Customer;
                // Replace optimistic entry with real data
                setCustomers((prev) => (prev || []).map(c => c.id === tempId ? result : c));
                logCustomerOperation('ADD_CUSTOMER_SUCCESS', result);
                console.log("Customer added successfully:", result);
                return result;
            }
            
            // Keep optimistic update if no data returned but no error
            logCustomerOperation('ADD_CUSTOMER_SUCCESS_OPTIMISTIC', customerData);
            console.log("Customer added (optimistic update kept)");
            return customerData as Customer;
        } catch (error: any) {
            // Rollback optimistic update on error
            setCustomers((prev) => (prev || []).filter(c => c.id !== tempId));
            logCustomerOperation('ADD_CUSTOMER_EXCEPTION', customerData);
            console.error('Error adding customer:', error);
            const errorMsg = error?.message?.includes('organization_id') 
                ? 'Organization access error - please refresh and try again'
                : error?.message || 'Failed to add customer';
            setError(errorMsg);
            toast.error(errorMsg);
            throw error;
        } finally {
            setLoading(false);
        }
    };

    const removeCustomer = async (id: string) => {
        if (!id?.trim()) {
            const errorMsg = 'Customer ID is required for deletion';
            console.error(errorMsg);
            toast.error(errorMsg);
            throw new Error(errorMsg);
        }

        setLoading(true);
        setError(null);

        try {
            console.log("Removing customer:", id);
            const { error } = await supabase.from('customers').delete().eq('id', id);
            
            if (error) {
                console.error('Error removing customer:', error);
                const errorMsg = error.message?.includes('violates foreign key') 
                    ? 'Cannot delete customer - they have associated records (vehicles, invoices, etc.)'
                    : 'Failed to delete customer';
                setError(errorMsg);
                toast.error(errorMsg);
                throw error;
            }
            
            setCustomers((prev) => (prev || []).filter((item) => item.id !== id));
            toast.success('Customer deleted successfully');
            console.log("Customer removed successfully:", id);
        } catch (error: any) {
            console.error('Error removing customer:', error);
            const errorMsg = error?.message?.includes('organization_id') 
                ? 'Organization access error - please refresh and try again'
                : error?.message || 'Failed to delete customer';
            setError(errorMsg);
            toast.error(errorMsg);
            throw error;
        } finally {
            setLoading(false);
        }
    };

    const updateCustomer = async (id: string, updates: Partial<Customer>) => {
        if (!id?.trim()) {
            const errorMsg = 'Customer ID is required for update';
            console.error(errorMsg);
            toast.error(errorMsg);
            throw new Error(errorMsg);
        }

        if (!updates || Object.keys(updates).length === 0) {
            console.log("No updates provided");
            return;
        }

        // Store original customer for rollback
        const originalCustomer = customers.find(c => c.id === id);
        if (!originalCustomer) {
            const errorMsg = 'Customer not found for update';
            toast.error(errorMsg);
            throw new Error(errorMsg);
        }

        // Optimistic update
        const optimisticCustomer = {
            ...originalCustomer,
            ...updates,
            updated_at: new Date().toISOString()
        };
        setCustomers((prev) => (prev || []).map((item) => item.id === id ? optimisticCustomer : item));
        setLoading(true);
        setError(null);

        try {
            console.log("Updating customer:", id, updates);
            const { data, error } = await supabase
                .from('customers')
                .update(updates)
                .eq('id', id)
                .select();

            if (error) {
                // Rollback optimistic update
                setCustomers((prev) => (prev || []).map((item) => item.id === id ? originalCustomer : item));
                console.error('Error updating customer:', error);
                const errorMsg = error.message?.includes('duplicate') 
                    ? 'Customer with this information already exists'
                    : 'Failed to update customer';
                setError(errorMsg);
                toast.error(errorMsg);
                throw error;
            }

            if (data && data.length > 0) {
                const result = data[0] as Customer;
                // Replace optimistic update with real data
                setCustomers((prev) => (prev || []).map((item) => item.id === id ? result : item));
                toast.success('Customer updated successfully');
                console.log("Customer updated successfully:", result);
            } else {
                console.warn("No data returned from customer update, keeping optimistic update");
            }
        } catch (error: any) {
            // Rollback optimistic update
            setCustomers((prev) => (prev || []).map((item) => item.id === id ? originalCustomer : item));
            console.error('Error updating customer:', error);
            const errorMsg = error?.message?.includes('organization_id') 
                ? 'Organization access error - please refresh and try again'
                : error?.message || 'Failed to update customer';
            setError(errorMsg);
            toast.error(errorMsg);
            throw error;
        } finally {
            setLoading(false);
        }
    };

    const getCustomerById = async (id: string): Promise<Customer | null> => {
        try {
            console.log("Getting customer by ID:", id);
            const localCustomer = customers.find(customer => customer.id === id);
            if (localCustomer) {
                console.log("Customer found in local state:", localCustomer);
                return localCustomer;
            }
            
            console.log("Customer not in local state, fetching from database...");
            const customerData = await fetchCustomerById(id);
            if (customerData) {
                console.log("Customer fetched from database:", customerData);
            } else {
                console.log("Customer not found in database");
            }
            return customerData;
        } catch (error: any) {
            console.error('Error fetching customer:', error);
            const errorMsg = error?.message?.includes('organization_id') 
                ? 'Organization access error - customer may not be accessible'
                : 'Error retrieving customer details';
            toast.error(errorMsg);
            return null;
        }
    };

    const loadCustomers = async (retryCount = 0) => {
        if (loading && retryCount === 0) return; // Prevent duplicate calls
        
        setLoading(true);
        setError(null);

        // Set up loading timeout
        const loadingTimeout = setTimeout(() => {
            console.warn('Customer loading timeout detected');
            setError('Loading is taking longer than expected. You can try refreshing the page.');
            toast.error('Loading customers is taking too long. Try refreshing the page.', {
                action: {
                    label: 'Refresh',
                    onClick: () => window.location.reload(),
                },
            });
        }, 15000);

        try {
            if (!organizationId) {
                console.log("No organization ID, skipping customer load");
                setCustomers([]);
                clearTimeout(loadingTimeout);
                setLoading(false);
                return;
            }

            let query = supabase.from('customers').select('*');
            query = applyOrganizationFilter(query);
            
            const { data: customersData, error: customersError } = await query;
            
            if (customersError) {
                console.error('Error fetching customers:', customersError);
                
                let errorMessage = 'Failed to load customers';
                if (customersError.message?.includes('JWT')) {
                    errorMessage = 'Session expired. Please refresh the page and log in again.';
                } else if (customersError.message?.includes('timeout')) {
                    errorMessage = 'Request timed out. Please check your connection and try again.';
                }
                
                setError(errorMessage);
                if (retryCount === 0) toast.error(errorMessage);
                throw customersError;
            } else {
                const safeCustomersData = Array.isArray(customersData) ? customersData : [];
                console.log('Customers loaded:', safeCustomersData.length, 'found');
                setCustomers(safeCustomersData);
                
                if (safeCustomersData.length === 0) {
                    console.log("No customers found for organization:", organizationId);
                }
            }
        } catch (error: any) {
            console.error('Unexpected error fetching customers:', error);
            
            let errorMessage = error?.message || 'Unexpected error loading customers';
            if (error?.name === 'AbortError') {
                errorMessage = 'Request timeout - please check your connection and try again';
            }
            
            // Retry logic for unexpected errors
            if (retryCount < 2 && navigator.onLine) {
                const delay = Math.min(1000 * Math.pow(2, retryCount), 5000);
                console.log(`Retrying customer load after error in ${delay}ms (attempt ${retryCount + 1})`);
                clearTimeout(loadingTimeout);
                setTimeout(() => loadCustomers(retryCount + 1), delay);
                return;
            }
            
            setError(errorMessage);
            toast.error('Failed to load customers - please try refreshing', {
                action: {
                    label: 'Retry',
                    onClick: () => loadCustomers(0),
                },
            });
        } finally {
            clearTimeout(loadingTimeout);
            setLoading(false);
        }
    };

    const refreshCustomers = async () => {
        logCustomerOperation('MANUAL_REFRESH_TRIGGERED');
        console.log("Manual refresh of customers triggered");
        setError(null);
        await loadCustomers();
    };

    // Expose debugging utilities
    const getDebugInfo = () => {
        const logs = JSON.parse(sessionStorage.getItem('customerOperationLogs') || '[]');
        return {
            currentState: {
                customerCount: customers.length,
                loading,
                error,
                organizationId,
                isSuperAdmin,
                canAccessAllOrganizations
            },
            recentLogs: logs.slice(-10),
            allLogs: logs
        };
    };

    return {
        customers: customers || [],
        loading,
        error,
        setCustomers,
        addCustomer,
        removeCustomer,
        updateCustomer,
        getCustomerById,
        loadCustomers,
        refreshCustomers,
        getDebugInfo
    };
};
